# v3.25.0 — Pins Importer

**Release date:** 2026-10-14
**Type:** Feature (backend script, admin tool). First of five in epic #350 (Places).

## What's New

- **The importer is in the repo.** `backend/scripts/seed-pins.ts` was gitignored because its defaults were a real finance export. The defaults are gone and the script is committed; the data files (`backend/scripts/pins*.csv|json`) are ignored instead.
- **`--input` is mandatory.** Running without it prints usage and exits 1 without touching the database.
- **CSV input.** A fixed-header CSV (`date,placeName,amount,category,payment,city,countryCode,notes`, optional `lat,lng,placeId`) is accepted next to JSON. Headers in any order. Errors name the row.
- **Dry run is offline.** `--dry-run` validates every row with placeholder coordinates, no geocoding, no write.
- **`place_id` captured.** The Geocoding response's `place_id` is passed through for #352; the model ignores it until the field exists.
- **Idempotent.** Upsert on place + date + amount; the same file twice inserts nothing.
- **`source` defaults to `import`** when the row has none.

## Files Changed

| Area | Files |
|------|-------|
| Script | `backend/scripts/seed-pins.ts` (now tracked) |
| CSV parsing | `backend/src/utils/pinsCsv.ts` (new) |
| Tests | `backend/src/__tests__/unit/pinsCsv.test.ts` (new, 10 tests) |
| Repo | `.gitignore` |
| Docs | `_docs/featureBreakdown/v3.25-places.md` |

## Tests

- `cd backend && npx jest src/__tests__/unit/pinsCsv.test.ts` → ✅ 10 passed
- `npm run lint` (0 errors, 117 warnings, at cap), `npm run typecheck` → ✅
- Manual: usage on no input; dry run on a 3-row CSV; `26/04/2026` rejected as `Row 2`; same CSV imported twice into an in-memory MongoDB → 1 inserted, then 0 inserted

## Before / After

| Surface | Before | After |
|---|---|---|
| Script in git | No (gitignored, real data inside) | Yes, data files ignored |
| No `--input` | Seeds hard-coded private records | Usage + exit 1 |
| Input formats | JSON | CSV or JSON |
| Bad row | Zod error without a row | `Row N: <reason>` |
| `place_id` | Dropped | Passed through |
| #208 | Open since 2026-05 | Closed |

## TL;DR Changelog

- feat(pins): commit importer, strip private defaults, `--input` required
- feat(pins): CSV parser with row-numbered errors, `placeId` from geocode
- test(pins): 10 unit tests for the CSV parser
- closes #351, closes #208
