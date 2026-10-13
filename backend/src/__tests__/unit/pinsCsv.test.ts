import { csvToPinSeedInputs, parseCsv } from '../../utils/pinsCsv';

describe('parseCsv', () => {
  it('parses quoted fields, escaped quotes and CRLF', () => {
    const text = 'a,b\r\n"x, y","say ""hi"""\r\nplain,\r\n';
    expect(parseCsv(text)).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
      ['plain', ''],
    ]);
  });

  it('drops blank lines and a BOM', () => {
    expect(parseCsv('\uFEFFa,b\n\n1,2\n   \n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('rejects an unterminated quote', () => {
    expect(() => parseCsv('a,"b')).toThrow('inside a quoted field');
  });
});

describe('csvToPinSeedInputs', () => {
  const header = 'date,placeName,amount,category,payment,city,countryCode,notes';

  it('maps the template columns in any order and drops empty optionals', () => {
    const text = [
      'placeName,amount,date,notes,city',
      'Corner Cafe,42.50,2026-04-26,,Sydney',
      'Harbour Bistro,18.00,2026-05-03,"anniversary, dinner",',
    ].join('\n');

    const pins = csvToPinSeedInputs(text);
    expect(pins).toHaveLength(2);
    expect(pins[0]).toMatchObject({ date: '2026-04-26', placeName: 'Corner Cafe', amount: 42.50, city: 'Sydney' });
    expect(pins[0].notes).toBeUndefined();
    expect(pins[0].lat).toBeUndefined();
    expect(pins[1].notes).toBe('anniversary, dinner');
    expect(pins[1].city).toBeUndefined();
  });

  it('reads lat and lng when both are given', () => {
    const pins = csvToPinSeedInputs('date,placeName,amount,lat,lng\n2026-04-26,X,1,-33.87,151.21');
    expect(pins[0]).toMatchObject({ lat: -33.87, lng: 151.21 });
  });

  it('names the row when a required column is empty', () => {
    expect(() => csvToPinSeedInputs(`${header}\n2026-04-26,Corner Cafe,1,,,,,\n2026-04-27,,1,,,,,`)).toThrow('Row 3: placeName is required');
  });

  it('rejects a non-ISO date with the row number', () => {
    expect(() => csvToPinSeedInputs(`${header}\n26/04/2026,Corner Cafe,1,,,,,`)).toThrow('Row 2: date must be YYYY-MM-DD');
    expect(() => csvToPinSeedInputs(`${header}\n2026-13-40,Corner Cafe,1,,,,,`)).toThrow('Row 2: date must be YYYY-MM-DD');
  });

  it('rejects a non-numeric amount and lat without lng', () => {
    expect(() => csvToPinSeedInputs(`${header}\n2026-04-26,Corner Cafe,abc,,,,,`)).toThrow('Row 2: amount must be a number');
    expect(() => csvToPinSeedInputs('date,placeName,amount,lat\n2026-04-26,X,1,-33.8')).toThrow('Row 2: lat and lng must be given together');
  });

  it('rejects missing required headers and unknown headers', () => {
    expect(() => csvToPinSeedInputs('date,placeName\n2026-04-26,X')).toThrow('Missing required column(s): amount');
    expect(() => csvToPinSeedInputs('date,placeName,amount,price\n2026-04-26,X,1,2')).toThrow('Unknown column(s): price');
  });

  it('rejects an empty file', () => {
    expect(() => csvToPinSeedInputs('')).toThrow('CSV is empty');
  });
});
