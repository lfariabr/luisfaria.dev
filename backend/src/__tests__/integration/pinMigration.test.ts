import * as dbHandler from '../helpers/dbHandler';
import Pin, { LEGACY_PIN_UNIQUE_INDEX } from '../../models/Pin';
import { migratePins } from '../../utils/pinMigration';

const legacyRow = (placeName: string, amount: number) => ({
  placeName,
  amount,
  date: new Date('2026-04-10T00:00:00.000Z'),
  lat: -33.87,
  lng: 151.21,
});

describe('migratePins', () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    await Pin.collection.dropIndexes().catch(() => undefined);
    // Production shape before v3.25: negative amounts (written raw, past the model's min) and the unique index.
    await Pin.collection.insertMany([legacyRow('Corner Cafe', -42.5), legacyRow('Harbour Bistro', -18), legacyRow('Park Kiosk', 7)]);
    await Pin.collection.createIndex({ placeName: 1, date: 1, amount: 1 }, { unique: true, name: LEGACY_PIN_UNIQUE_INDEX });
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  const indexNames = async () => (await Pin.collection.indexes()).map((index) => index.name);

  it('dry run reports and writes nothing', async () => {
    const report = await migratePins({ dryRun: true });

    expect(report).toMatchObject({ negativeAmounts: 2, amountsFlipped: 0, legacyUniqueIndexFound: true, legacyUniqueIndexDropped: false });
    expect(await Pin.countDocuments({ amount: { $lt: 0 } })).toBe(2);
    expect(await indexNames()).toContain(LEGACY_PIN_UNIQUE_INDEX);
  });

  it('flips negatives, keeps positives, and swaps the unique index for the plain one', async () => {
    const report = await migratePins({ dryRun: false });

    expect(report).toMatchObject({ negativeAmounts: 2, amountsFlipped: 2, legacyUniqueIndexDropped: true });
    const amounts = (await Pin.find().sort({ placeName: 1 }).lean()).map((pin) => [pin.placeName, pin.amount]);
    expect(amounts).toEqual([
      ['Corner Cafe', 42.5],
      ['Harbour Bistro', 18],
      ['Park Kiosk', 7],
    ]);
    const names = await indexNames();
    expect(names).not.toContain(LEGACY_PIN_UNIQUE_INDEX);
    expect(names).toContain('pin_lookup_place_date_amount');
  });

  it('is idempotent: a second run changes nothing', async () => {
    await migratePins({ dryRun: false });
    const second = await migratePins({ dryRun: false });

    expect(second).toMatchObject({ negativeAmounts: 0, amountsFlipped: 0, legacyUniqueIndexFound: false });
  });

  it('allows duplicate place + date + amount after migrating', async () => {
    await migratePins({ dryRun: false });
    await Pin.create([legacyRow('Same Cafe', 5), legacyRow('Same Cafe', 5)]);

    expect(await Pin.countDocuments({ placeName: 'Same Cafe' })).toBe(2);
  });
});
