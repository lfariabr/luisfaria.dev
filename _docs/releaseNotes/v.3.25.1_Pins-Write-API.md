# v3.25.1 — Pins Write API

**Release date:** 2026-10-14
**Type:** Feature (backend, GraphQL). Second of five in epic #350 (Places).

## What's New

- **Partners can write.** `createPin` and the new `updatePin` accept ADMIN or PARTNER. Places is a shared map, so both people add to it.
- **`updatePin(id, input)`.** Every field is optional and only the given fields change. An empty input, a bad id or a missing pin is rejected.
- **`deletePin(id)`.** ADMIN only, hard delete. A partner, a user or an anonymous caller gets an error and the pin stays.
- **Positive amounts.** `amount` must be greater than zero, in Zod and in the model. Spend is stored as a positive number from now on.
- **`placeId`.** An optional Google place id on `Pin`, `PinInput` and `PinUpdateInput`, indexed. The importer already passes it through.
- **Duplicates allowed.** The unique index on place, date and amount is replaced by a plain, named one. Two identical coffees on one day can both be pinned.
- **Migration.** `scripts/migrate-pins.ts` flips existing negative amounts and drops the old unique index. It has a dry run and is idempotent. The app can deploy before or after it runs.

## Files Changed

| Area | Files |
|------|-------|
| GraphQL types | `backend/src/schemas/types/pinTypes.ts` |
| Resolvers | `backend/src/resolvers/pins/mutations.ts` |
| Authorization | `backend/src/validation/shield.ts` |
| Validation | `backend/src/validation/schemas/pin.schema.ts` |
| Model | `backend/src/models/Pin.ts` |
| Migration | `backend/src/utils/pinMigration.ts` (new), `backend/scripts/migrate-pins.ts` (new) |
| Tests | `backend/src/__tests__/integration/pinResolvers.test.ts` (35 → 54), `backend/src/__tests__/integration/pinMigration.test.ts` (new, 4) |
| Docs | `_docs/featureBreakdown/v3.25-places.md` |

## Tests

- `cd backend && npm test` → ✅ 25 suites, 369 passed
- `npm run lint` (0 errors, 117 warnings, at cap), `npm run typecheck` → ✅
- Manual: with the old unique index in place, app startup still creates the new named index without error

## Before / After

| Surface | Before | After |
|---|---|---|
| PARTNER `createPin` | Forbidden | Allowed |
| Edit a pin | Not possible | `updatePin`, ADMIN or PARTNER |
| Delete a pin | Not possible | `deletePin`, ADMIN only |
| Anonymous `createPin` error | "Not authorized" | "Not authenticated" |
| `amount: -5` | Stored | Rejected |
| Same place, date and amount twice | Duplicate key error | Two pins |
| `placeId` | Not stored | Stored, indexed |

## Deploy

```bash
cd backend
npx ts-node scripts/migrate-pins.ts --dry-run   # against production MONGODB_URI
npx ts-node scripts/migrate-pins.ts
```

## TL;DR Changelog

- feat(pins): `updatePin`, `deletePin`, `PinUpdateInput`, `placeId`
- feat(pins): ADMIN + PARTNER write, ADMIN delete
- feat(pins): positive amounts, non-unique lookup index
- chore(pins): `migrate-pins.ts` data migration
- test(pins): 23 new tests
- closes #352
