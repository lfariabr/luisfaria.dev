#!/usr/bin/env ts-node
/**
 * v3.25 pins migration (#352): flips negative amounts to positive spend and drops the
 * old unique { placeName, date, amount } index. Idempotent; safe to run before or after deploy.
 *
 * Usage:
 *   cd backend
 *   npx ts-node scripts/migrate-pins.ts --dry-run
 *   npx ts-node scripts/migrate-pins.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { migratePins } from '../src/utils/pinMigration';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter((arg) => arg !== '--dry-run');
  if (unknown.length > 0) throw new Error(`Unknown option(s): ${unknown.join(', ')}. Usage: migrate-pins.ts [--dry-run]`);
  const dryRun = args.includes('--dry-run');

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  await mongoose.connect(uri, { autoIndex: false });
  const report = await migratePins({ dryRun });
  console.log(`${dryRun ? 'DRY RUN — nothing written' : 'Migration complete'}`);
  console.log(`  negative amounts: ${report.negativeAmounts}${dryRun ? '' : `, flipped: ${report.amountsFlipped}`}`);
  console.log(
    `  legacy unique index: ${report.legacyUniqueIndexFound ? (dryRun ? 'present, would drop' : 'dropped') : 'not present'}`
  );
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  process.exit(1);
});
