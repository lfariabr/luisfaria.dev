import { isoDate, toIsoString } from '../../utils/dates';

describe('toIsoString', () => {
  const iso = '2026-11-17T07:13:42.000Z';
  const ms = Date.parse(iso);

  it('serializes a Date as ISO 8601', () => {
    expect(toIsoString(new Date(iso))).toBe(iso);
  });

  it('reads epoch milliseconds as a number or a numeric string', () => {
    expect(toIsoString(ms)).toBe(iso);
    expect(toIsoString(String(ms))).toBe(iso);
  });

  it('normalizes a date string to ISO 8601', () => {
    expect(toIsoString('2026-11-17T18:13:42+11:00')).toBe(iso);
  });

  it('returns null for a missing or unreadable value', () => {
    expect(toIsoString(undefined)).toBeNull();
    expect(toIsoString(null)).toBeNull();
    expect(toIsoString('not a date')).toBeNull();
    expect(toIsoString(new Date('nope'))).toBeNull();
    expect(toIsoString({})).toBeNull();
  });
});

describe('isoDate', () => {
  it('builds a field resolver that reads the named field', () => {
    const resolve = isoDate('createdAt');
    expect(resolve({ createdAt: new Date(0) })).toBe('1970-01-01T00:00:00.000Z');
    expect(resolve({})).toBeNull();
  });
});
