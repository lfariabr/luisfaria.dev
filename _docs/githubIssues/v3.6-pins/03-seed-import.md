## Status — Deferred

This issue is **not part of the v3.6 home-marker PR**. The local seeder used to bootstrap pins contains private finance-export data and remains gitignored. A sanitized generic importer will be tracked separately.

## Goal (when revived)

Ship a sanitized, repository-safe pin import path that:

- Replaces unconditional deletion with safe upsert behavior.
- Requires explicit `--replace` before deleting existing pins.
- Adds `--dry-run` to validate records without database writes.
- Accepts external JSON input (e.g. `--input ./pins.json`) instead of embedding place data in source.
- Fails closed on geocoding failures by default; requires explicit opt-in for fallback coordinates.
- Reuses the real Pin model and shared Zod validation rather than a duplicated script schema.

## Acceptance Criteria (when revived)

- The committed importer contains zero hardcoded private place data.
- Running it without `--replace` never drops existing data.
- Dry-run works without a MongoDB write or network call.
- Geocoding failures are visible and do not silently create fallback pins unless explicitly allowed.
