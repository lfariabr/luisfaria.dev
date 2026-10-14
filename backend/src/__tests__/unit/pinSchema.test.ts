import { isCalendarIsoDate, pinInputSchema } from '../../validation/schemas/pin.schema';

describe('isCalendarIsoDate', () => {
  it.each(['2026-04-26', '2024-02-29', '2026-01-16T00:00:00.000Z', '2026-05-03T10:00:00+10:00'])('accepts %s', (value) => {
    expect(isCalendarIsoDate(value)).toBe(true);
  });

  it.each(['2026-02-30', '2025-02-29', '2026-04-31', '2026-13-01', '26/04/2026', 'not-a-date', '2026-02-30T00:00:00.000Z'])(
    'rejects %s',
    (value) => {
      expect(isCalendarIsoDate(value)).toBe(false);
    }
  );
});

describe('pinInputSchema date', () => {
  const base = { placeName: 'Corner Cafe', amount: 10, lat: -33.87, lng: 151.21 };

  it('rejects a calendar-impossible day instead of rolling it into the next month', () => {
    expect(pinInputSchema.safeParse({ ...base, date: '2026-02-30' }).success).toBe(false);
  });

  it('still accepts the full ISO timestamps the GraphQL clients send', () => {
    expect(pinInputSchema.safeParse({ ...base, date: '2026-01-16T00:00:00.000Z' }).success).toBe(true);
  });
});
