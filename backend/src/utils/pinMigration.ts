import Pin, { LEGACY_PIN_UNIQUE_INDEX } from '../models/Pin';

export interface PinMigrationReport {
  dryRun: boolean;
  negativeAmounts: number;
  amountsFlipped: number;
  legacyUniqueIndexFound: boolean;
  legacyUniqueIndexDropped: boolean;
}

const listIndexNames = async (): Promise<Array<{ name?: string; unique?: boolean }>> => {
  try {
    return await Pin.collection.indexes();
  } catch {
    // A database that never had a pin has no collection, so no indexes to inspect.
    return [];
  }
};

/**
 * v3.25 data migration for pins. Idempotent.
 * 1. Amounts become positive spend (the finance export stored them negative).
 * 2. The unique { placeName, date, amount } index is dropped; the model now declares a plain one.
 */
export async function migratePins({ dryRun }: { dryRun: boolean }): Promise<PinMigrationReport> {
  const negativeAmounts = await Pin.countDocuments({ amount: { $lt: 0 } });
  const legacyUniqueIndexFound = (await listIndexNames()).some(
    (index) => index.name === LEGACY_PIN_UNIQUE_INDEX && index.unique === true
  );

  const report: PinMigrationReport = {
    dryRun,
    negativeAmounts,
    amountsFlipped: 0,
    legacyUniqueIndexFound,
    legacyUniqueIndexDropped: false,
  };
  if (dryRun) return report;

  if (legacyUniqueIndexFound) {
    await Pin.collection.dropIndex(LEGACY_PIN_UNIQUE_INDEX);
    report.legacyUniqueIndexDropped = true;
  }

  if (negativeAmounts > 0) {
    const result = await Pin.updateMany({ amount: { $lt: 0 } }, [{ $set: { amount: { $abs: '$amount' } } }]);
    report.amountsFlipped = result.modifiedCount;
  }

  await Pin.createIndexes();
  return report;
}
