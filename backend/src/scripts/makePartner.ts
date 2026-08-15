import mongoose from 'mongoose';
import { z } from 'zod';
import config from '../config/config';
import User, { UserRole } from '../models/User';

const IDENTIFIER_MAX_LENGTH = 254;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;

  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 3))}@${domain}`;
}

const scriptArgsSchema = z.array(z.string()).superRefine((args, ctx) => {
  const unknownFlags = args.filter((arg) => arg.startsWith('--') && arg !== '--dry-run');
  for (const flag of unknownFlags) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Unknown flag "${flag}"`,
    });
  }

  const dryRunFlags = args.filter((arg) => arg === '--dry-run');
  if (dryRunFlags.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide --dry-run at most once.',
    });
  }

  const identifiers = args.filter((arg) => !arg.startsWith('--'));
  if (identifiers.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide exactly one email or name fragment.',
    });
    return;
  }

  const identifier = identifiers[0].trim();
  if (!identifier) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Identifier cannot be empty.',
    });
  }

  if (identifier.length > IDENTIFIER_MAX_LENGTH) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: IDENTIFIER_MAX_LENGTH,
      inclusive: true,
      type: 'string',
      message: `Identifier must be ${IDENTIFIER_MAX_LENGTH} characters or fewer.`,
    });
  }
});

function parseArgs(argv: string[]) {
  const result = scriptArgsSchema.safeParse(argv);
  if (!result.success) {
    const details = result.error.issues.map((issue) => issue.message).join(' ');
    throw new Error(
      `${details} Usage: ts-node src/scripts/makePartner.ts <email-or-name-fragment> [--dry-run]`
    );
  }

  const dryRun = argv.includes('--dry-run');
  const identifier = argv.find((arg) => !arg.startsWith('--'))!.trim().toLowerCase();

  return { dryRun, identifier };
}

async function makePartner() {
  const { dryRun, identifier } = parseArgs(process.argv.slice(2));
  const escapedIdentifier = escapeRegExp(identifier);
  const query = identifier.includes('@')
    ? { email: identifier }
    : {
        $or: [
          { email: new RegExp(escapedIdentifier, 'i') },
          { name: new RegExp(escapedIdentifier, 'i') },
        ],
      };

  try {
    await mongoose.connect(config.mongodbUri);

    const matches = await User.find(query)
      .select('name email role')
      .sort({ createdAt: -1 })
      .limit(5);

    if (matches.length === 0) {
      console.error(`No user found for "${identifier}"`);
      process.exitCode = 1;
      return;
    }

    if (matches.length > 1) {
      console.error(`Multiple users matched "${identifier}". Re-run with the exact email.`);
      for (const user of matches) {
        console.error(`- ${user.name} <${maskEmail(user.email)}> role=${user.role}`);
      }
      process.exitCode = 2;
      return;
    }

    const user = matches[0];
    const beforeRole = user.role;

    if (dryRun) {
      console.log(`DRY RUN: ${user.name} <${maskEmail(user.email)}> role=${beforeRole} -> ${UserRole.PARTNER}`);
      return;
    }

    user.role = UserRole.PARTNER;
    await user.save();

    console.log(`Updated ${user.name} <${maskEmail(user.email)}> role=${beforeRole} -> ${UserRole.PARTNER}`);
  } finally {
    await mongoose.disconnect();
  }
}

makePartner().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
