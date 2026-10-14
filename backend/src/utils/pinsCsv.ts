/**
 * CSV parsing for the pins importer (scripts/seed-pins.ts).
 *
 * Fixed headers, any order:
 *   date,placeName,amount,category,payment,city,countryCode,notes,lat,lng,placeId
 * Required: date (YYYY-MM-DD), placeName, amount. Everything else optional.
 * Rows with both lat and lng skip geocoding.
 */

import { isCalendarIsoDate } from '../validation/schemas/pin.schema';

export interface PinSeedInput {
  date: string;
  placeName: string;
  amount: number;
  category?: string;
  payment?: string;
  city?: string;
  countryCode?: string;
  notes?: string;
  source?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

export const REQUIRED_COLUMNS = ['date', 'placeName', 'amount'] as const;
export const OPTIONAL_COLUMNS = [
  'category',
  'payment',
  'city',
  'countryCode',
  'notes',
  'source',
  'lat',
  'lng',
  'placeId',
] as const;

const KNOWN_COLUMNS: ReadonlySet<string> = new Set([...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface CsvRecord {
  /** 1-based line in the file where the record starts. */
  line: number;
  cells: string[];
}

export interface SourcedPinSeedInput {
  /** 1-based line in the CSV file, for error messages. */
  line: number;
  pin: PinSeedInput;
}

/** RFC 4180-style parser: quoted fields, doubled quotes, CRLF or LF line endings. Blank lines are dropped. */
export function parseCsvRecords(text: string): CsvRecord[] {
  const records: CsvRecord[] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;
  const input = text.replace(/^\uFEFF/, '');

  const endRecord = () => {
    row.push(field);
    if (row.some((cell) => cell.trim().length > 0)) records.push({ line: recordLine, cells: row });
    row = [];
    field = '';
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        if (char === '\n') line += 1;
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      endRecord();
      line += 1;
      recordLine = line;
    } else {
      field += char;
    }
  }

  if (inQuotes) throw new Error('CSV ends inside a quoted field');
  if (field.length > 0 || row.length > 0) endRecord();

  return records;
}

export function parseCsv(text: string): string[][] {
  return parseCsvRecords(text).map((record) => record.cells);
}

function parseNumber(value: string, column: string, line: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Row ${line}: ${column} must be a number, got "${value}"`);
  }
  return parsed;
}

/** Turns CSV text into seed inputs. Errors name the 1-based line in the file. */
export function csvToPinSeedInputs(text: string): SourcedPinSeedInput[] {
  const records = parseCsvRecords(text);
  if (records.length === 0) throw new Error('CSV is empty');

  const headers = records[0].cells.map((header) => header.trim());
  const unknown = headers.filter((header) => !KNOWN_COLUMNS.has(header));
  if (unknown.length > 0) {
    throw new Error(`Unknown column(s): ${unknown.join(', ')}. Allowed: ${[...KNOWN_COLUMNS].join(', ')}`);
  }
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length > 0) {
    throw new Error(`Missing required column(s): ${missing.join(', ')}`);
  }

  const index = (column: string) => headers.indexOf(column);
  const cell = (cells: string[], column: string): string | undefined => {
    const i = index(column);
    if (i < 0) return undefined;
    const value = (cells[i] ?? '').trim();
    return value.length > 0 ? value : undefined;
  };

  return records.slice(1).map(({ line, cells }) => {

    if (cells.length > headers.length) {
      throw new Error(`Row ${line}: ${cells.length} fields but ${headers.length} headers`);
    }

    const date = cell(cells, 'date');
    const placeName = cell(cells, 'placeName');
    const amountRaw = cell(cells, 'amount');

    if (!date) throw new Error(`Row ${line}: date is required`);
    if (!ISO_DATE.test(date) || !isCalendarIsoDate(date)) {
      throw new Error(`Row ${line}: date must be YYYY-MM-DD, got "${date}"`);
    }
    if (!placeName) throw new Error(`Row ${line}: placeName is required`);
    if (!amountRaw) throw new Error(`Row ${line}: amount is required`);

    const latRaw = cell(cells, 'lat');
    const lngRaw = cell(cells, 'lng');
    if ((latRaw === undefined) !== (lngRaw === undefined)) {
      throw new Error(`Row ${line}: lat and lng must be given together`);
    }

    const pin: PinSeedInput = {
      date,
      placeName,
      amount: parseNumber(amountRaw, 'amount', line),
      category: cell(cells, 'category'),
      payment: cell(cells, 'payment'),
      city: cell(cells, 'city'),
      countryCode: cell(cells, 'countryCode'),
      notes: cell(cells, 'notes'),
      source: cell(cells, 'source'),
      placeId: cell(cells, 'placeId'),
    };
    if (latRaw !== undefined && lngRaw !== undefined) {
      pin.lat = parseNumber(latRaw, 'lat', line);
      pin.lng = parseNumber(lngRaw, 'lng', line);
    }

    return { line, pin };
  });
}
