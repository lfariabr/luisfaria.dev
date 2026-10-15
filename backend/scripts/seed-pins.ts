#!/usr/bin/env ts-node
/**
 * Imports pins from a CSV or JSON file into MongoDB, geocoding place names
 * that have no coordinates. Upserts on placeName + date + amount, so re-running
 * the same file inserts nothing new.
 *
 * Prerequisites:
 *   - MONGODB_URI in backend/.env (not needed for --dry-run or --preview)
 *   - GEOCODING_API_KEY or GOOGLE_GEOCODING_API_KEY in backend/.env (not needed for --dry-run
 *     or for rows that carry lat and lng)
 *
 * Modes:
 *   --dry-run   checks the file's shape only; no geocoding, no database
 *   --preview   geocodes every row without lat,lng and prints what Google found; no database.
 *               One line per row: ok, CHECK (partial match, or not an establishment such as a
 *               suburb or street), FAIL (geocoding error, with Google's error_message) or MANUAL
 *               (row carries lat,lng). Exits non-zero when any row is FAIL.
 *
 * CSV template (headers in any order; date, placeName and amount required; dates YYYY-MM-DD;
 * amounts positive; lat,lng optional and skip geocoding for that row):
 *
 *   date,placeName,amount,category,payment,city,countryCode,notes
 *   2026-04-26,Corner Cafe,42.50,Eat out,Amex,Sydney,AU,
 *   2026-05-03,Harbour Bistro,18.00,Eat out,Amex,Sydney,AU,anniversary
 *
 * JSON input is an array of objects with the same keys.
 * Keep the data file out of git: backend/scripts/pins*.csv and pins*.json are ignored.
 *
 * Usage:
 *   cd backend
 *   npx ts-node scripts/seed-pins.ts --input ./scripts/pins.csv --dry-run
 *   npx ts-node scripts/seed-pins.ts --input ./scripts/pins.csv --preview        # check geocoding, write nothing
 *   npx ts-node scripts/seed-pins.ts --input ./scripts/pins.csv
 *   npx ts-node scripts/seed-pins.ts --input ./scripts/pins.csv --replace        # delete all pins first
 *   npx ts-node scripts/seed-pins.ts --input ./scripts/pins.csv --allow-fallback # Sydney CBD when geocoding fails
 */

import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';
import path from 'path';
import mongoose from 'mongoose';
import Pin from '../src/models/Pin';
import { pinInputSchema } from '../src/validation/schemas/pin.schema';
import { csvToPinSeedInputs, type PinSeedInput } from '../src/utils/pinsCsv';
import { classifyGeocodeResponse, type GeocodeClassification, type GeocodeResponse } from '../src/utils/geocodeClassify';

/** A row to import plus where it came from, so errors point at the source. */
interface LabelledPin {
  label: string;
  pin: PinSeedInput;
}

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface SeedOptions {
  inputPath: string;
  dryRun: boolean;
  preview: boolean;
  replace: boolean;
  allowFallback: boolean;
}

interface Coords {
  lat: number;
  lng: number;
  placeId?: string;
}

const MONGODB_URI = process.env.MONGODB_URI;
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY ?? process.env.GOOGLE_GEOCODING_API_KEY;
const SYDNEY: Coords = { lat: -33.8688, lng: 151.2093 };
const DEFAULT_SOURCE = 'import';

const USAGE = `Usage: npx ts-node scripts/seed-pins.ts --input <file.csv|file.json> [--dry-run | --preview] [--replace] [--allow-fallback]

  --input <file>     CSV or JSON file to import (required)
  --dry-run          validate rows without geocoding or writing to MongoDB
  --preview          geocode rows without lat,lng and print ok/CHECK/FAIL/MANUAL per row;
                     never connects to MongoDB; exits non-zero on any FAIL
  --replace          delete every existing pin before importing
  --allow-fallback   use Sydney CBD coordinates when geocoding fails instead of aborting`;

class UsageError extends Error {}

function parseOptions(argv: string[]): SeedOptions {
  let inputPath: string | undefined;
  const flags = { dryRun: false, preview: false, replace: false, allowFallback: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--preview') flags.preview = true;
    else if (arg === '--replace') flags.replace = true;
    else if (arg === '--allow-fallback') flags.allowFallback = true;
    else if (arg === '--input') {
      inputPath = argv[i + 1];
      i += 1;
      if (!inputPath || inputPath.startsWith('--')) throw new UsageError('--input requires a file path');
    } else {
      throw new UsageError(`Unknown option: ${arg}`);
    }
  }

  if (!inputPath) throw new UsageError('--input is required');
  if (flags.preview && (flags.dryRun || flags.replace || flags.allowFallback)) {
    throw new UsageError('--preview writes nothing; it cannot be combined with --dry-run, --replace or --allow-fallback');
  }

  return { inputPath, ...flags };
}

function loadPins(inputPath: string): LabelledPin[] {
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolvedPath)) throw new UsageError(`Input file not found: ${resolvedPath}`);
  const text = fs.readFileSync(resolvedPath, 'utf8');
  const extension = path.extname(resolvedPath).toLowerCase();

  if (extension === '.csv') {
    return csvToPinSeedInputs(text).map(({ line, pin }) => ({ label: `Row ${line}`, pin }));
  }

  if (extension === '.json') {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) throw new Error('Input JSON must be an array of pin objects');
    return parsed.map((item: unknown, index) => {
      const label = `Item ${index}`;
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`${label}: must be an object`);
      const pin = item as PinSeedInput;
      if ((pin.lat === undefined) !== (pin.lng === undefined)) {
        throw new Error(`${label}: lat and lng must be given together`);
      }
      return { label, pin };
    });
  }

  throw new UsageError(`Unsupported input type "${extension}": use .csv or .json`);
}

/** Asks Google for a place and returns its raw response, whatever the status. */
function fetchGeocode(placeName: string, city = 'Sydney'): Promise<GeocodeResponse> {
  if (!GEOCODING_API_KEY) {
    return Promise.reject(new Error('GEOCODING_API_KEY or GOOGLE_GEOCODING_API_KEY is not set'));
  }

  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(`${placeName}, ${city}, Australia`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GEOCODING_API_KEY}`;
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as GeocodeResponse);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

/** Geocodes and classifies; a network or key error becomes a FAIL rather than a throw. */
async function geocode(placeName: string, city?: string): Promise<GeocodeClassification> {
  try {
    return classifyGeocodeResponse(await fetchGeocode(placeName, city));
  } catch (error) {
    return { status: 'FAIL', message: error instanceof Error ? error.message : 'Unknown geocoding error' };
  }
}

const pause = () => new Promise((resolve) => setTimeout(resolve, 200));

/** Geocodes every row without coordinates and prints what Google found. Never touches MongoDB. */
async function previewPins(rawPins: LabelledPin[]): Promise<boolean> {
  const counts = { ok: 0, CHECK: 0, FAIL: 0, MANUAL: 0 };

  for (const { label, pin } of rawPins) {
    const name = pin.placeName ?? '?';
    if (pin.lat !== undefined && pin.lng !== undefined) {
      counts.MANUAL += 1;
      console.log(`  ${'MANUAL'.padEnd(6)} ${label} ${name} -> (${pin.lat}, ${pin.lng})`);
      continue;
    }

    const result = await geocode(name, pin.city);
    counts[result.status] += 1;
    if (result.status === 'FAIL') {
      console.log(`  ${'FAIL'.padEnd(6)} ${label} ${name} -> ${result.message}`);
    } else {
      const firstTypes = result.types.slice(0, 3).join(', ') || 'no types';
      const partial = result.partial ? ' partial' : '';
      console.log(`  ${result.status.padEnd(6)} ${label} ${name} -> ${result.formattedAddress} [${firstTypes}]${partial}`);
    }
    await pause();
  }

  console.log(`Preview: ${counts.ok} ok, ${counts.CHECK} CHECK, ${counts.FAIL} FAIL, ${counts.MANUAL} MANUAL. Nothing written.`);
  return counts.FAIL === 0;
}

async function buildValidatedPins(rawPins: LabelledPin[], options: SeedOptions) {
  const docs = [];

  for (const { label, pin } of rawPins) {
    let coords: Coords | undefined =
      pin.lat !== undefined && pin.lng !== undefined ? { lat: pin.lat, lng: pin.lng, placeId: pin.placeId } : undefined;

    if (!coords) {
      if (options.dryRun) {
        coords = { ...SYDNEY, placeId: pin.placeId };
        console.warn(`  DRY ${pin.placeName}: placeholder Sydney CBD coordinates for validation only`);
      } else {
        const result = await geocode(pin.placeName, pin.city);
        if (result.status === 'FAIL') {
          const message = `Geocode failed for "${pin.placeName}": ${result.message}`;
          if (!options.allowFallback) {
            throw new Error(`${message}. Re-run with --allow-fallback to use Sydney CBD fallback coordinates.`);
          }
          coords = { ...SYDNEY };
          console.warn(`  WARN ${pin.placeName}: ${message}; using Sydney CBD fallback`);
        } else {
          coords = { lat: result.lat, lng: result.lng, placeId: result.placeId };
          const check = result.status === 'CHECK' ? ` CHECK: ${result.reason}` : '';
          console.log(`  OK ${pin.placeName} -> (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})${check}`);
        }
        await pause();
      }
    }

    const { placeId, ...latLng } = coords;
    const result = pinInputSchema.safeParse({ ...pin, source: pin.source ?? DEFAULT_SOURCE, ...latLng });
    if (!result.success) {
      const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
      throw new Error(`${label} (${pin.placeName ?? '?'}): ${issues}`);
    }
    docs.push({ ...result.data, ...(placeId ? { placeId } : {}), date: new Date(result.data.date) });
  }

  return docs;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const rawPins = loadPins(options.inputPath);
  console.log(`Read ${rawPins.length} rows from ${options.inputPath}`);

  if (options.preview) {
    if (!(await previewPins(rawPins))) process.exitCode = 1;
    return;
  }

  const docs = await buildValidatedPins(rawPins, options);

  console.log(`Prepared ${docs.length} pins${options.dryRun ? ' (dry run)' : ''}.`);

  if (options.dryRun) {
    docs.forEach((pin) => {
      console.log(`  DRY ${pin.date.toISOString().slice(0, 10)} ${pin.placeName} ${pin.amount}`);
    });
    return;
  }

  if (docs.length === 0) {
    // An empty file with --replace would otherwise wipe every pin and insert nothing.
    if (options.replace) throw new Error('No pins to import; refusing to --replace existing pins with nothing.');
    console.log('Nothing to import.');
    return;
  }

  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  if (options.replace) {
    const existing = await Pin.countDocuments();
    console.log(`--replace set; deleting ${existing} existing pins before import.`);
    await Pin.deleteMany({});
  }

  const result = await Pin.bulkWrite(
    docs.map((pin) => ({
      updateOne: {
        filter: { placeName: pin.placeName, date: pin.date, amount: pin.amount },
        update: { $set: pin },
        upsert: true,
      },
    }))
  );

  console.log(`Import complete: ${result.upsertedCount} inserted, ${result.modifiedCount} updated, ${result.matchedCount} matched.`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  if (error instanceof UsageError) {
    console.error(`${error.message}\n\n${USAGE}`);
  } else {
    console.error(error);
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
