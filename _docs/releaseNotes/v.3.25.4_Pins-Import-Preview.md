# v3.25.4 — Pins Import Preview

**Release date:** 2026-10-15
**Type:** Feature (backend script). Part of epic #350 (Places).

## What's New

- **`--preview` on the importer.** `seed-pins.ts --preview` geocodes every row that has no `lat,lng`, prints what Google found, and writes nothing. It never connects to MongoDB.
- **One line per row.** Status, row, place name, Google's formatted address, the first result types, and a `partial` marker when Google only matched part of the query.
- **Four statuses.** `ok` (an establishment), `CHECK` (partial match, or a result that is a suburb, colloquial area or street rather than a venue), `FAIL` (geocoding error), `MANUAL` (row carries `lat,lng`, not geocoded).
- **Counts and exit code.** A summary line counts each status. Any `FAIL` exits non-zero, so a preview can gate the real run.
- **Google's error message.** A non-OK status now carries Google's `error_message` (`REQUEST_DENIED: You must enable Billing…`) instead of the bare status, in both preview and the real import.
- **Real import warns on CHECK.** A real run still imports a `CHECK` row but prints why, so a pin dropped on the city centre is visible.
- **Pure classifier.** `classifyGeocodeResponse` in `backend/src/utils/geocodeClassify.ts` decides ok / CHECK / FAIL from a raw response. Tested with fixture JSON; no network.
- **Flag guard.** `--preview` with `--dry-run`, `--replace` or `--allow-fallback` is a usage error.

## Files Changed

| Area | Files |
|------|-------|
| Importer | `backend/scripts/seed-pins.ts` |
| Classifier | `backend/src/utils/geocodeClassify.ts` (new) |
| Tests | `backend/src/__tests__/unit/geocodeClassify.test.ts` (new, 10) |
| Docs | `_docs/featureBreakdown/v3.25-places.md` |

## Tests

- `cd backend && npm test` → ✅ 26 suites, 379 passed
- `npm run lint` (0 errors, 114 warnings, under cap), `npm run typecheck` → ✅
- Manual: `--preview` with no geocoding key and no `MONGODB_URI` prints one `FAIL` and one `MANUAL` row, the summary, and exits 1

## Before / After

| Surface | Before | After |
|---|---|---|
| Check geocoding before writing | Not possible (`--dry-run` skips geocoding) | `--preview` |
| Venue Google cannot find | Silently pinned on the suburb or city centre | `CHECK` with the result types |
| Billing off / key restricted | `REQUEST_DENIED` | `REQUEST_DENIED: <Google's message>` |
| Rows with `lat,lng` in a preview | — | `MANUAL`, not geocoded |
| Any geocoding failure in a preview | — | Exit code 1 |

## Usage

```bash
cd backend
npx ts-node scripts/seed-pins.ts --input ./scripts/pins.csv --preview
#   ok     Row 2 Corner Cafe -> Corner Cafe, 1 Example St, Sydney NSW 2000, Australia [cafe, establishment, food]
#   CHECK  Row 3 Harbour Bistro -> Sydney NSW, Australia [colloquial_area, locality, political]
#   MANUAL Row 4 Park Kiosk -> (-33.88, 151.22)
# Preview: 1 ok, 1 CHECK, 0 FAIL, 1 MANUAL. Nothing written.
```

## TL;DR Changelog

- feat(pins): importer `--preview` geocodes and classifies rows, writes nothing
- feat(pins): surface Google `error_message` on non-OK geocoding status
- refactor(pins): geocoding classification as a pure, tested function
- test(pins): 10 new unit tests
- closes #360
