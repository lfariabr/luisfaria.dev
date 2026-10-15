# v3.25.3 — Places: repeat visits stack on one marker

**Release date:** 2026-10-15
**Type:** Feature (frontend). Release in epic #350 (Places).

## What's New

- **One marker per place.** Visits that share a Google place id, or sit on identical coordinates (5 decimals, about 1 m), stack on one marker. The join is transitive, so a geocoded visit and a hand-placed one on the same spot meet.
- **Visit count badge** on any marker with more than one visit.
- **Stack popup.** Place name (from the newest visit), visit count and total spent, then every visit newest first: date, amount, category, payment, notes, and its own Edit. A visit recorded under an older name shows "as <old name>".
- **Timeline** stays one row per visit; clicking a row opens its place's stack.
- **Summary card** reads "N places · M visits" instead of counting visits as places.
- **Place search logs its real error** through the app logger. The October CSP block showed only "Place search is unavailable"; the RPC error now reaches the console.

## Files Changed

| Area | Files |
|------|-------|
| Grouping | `frontend/src/components/relationship/placeGroups.ts` (new) |
| Map | `frontend/src/components/relationship/RelationshipMap.tsx` |
| Search | `frontend/src/components/relationship/PlaceSearch.tsx` |
| Tests | `frontend/src/__tests__/components/placeGroups.test.ts` (new, 7), `frontend/src/__tests__/app/RelationshipMapPage.test.tsx` (17 → 19) |
| Docs | `_docs/featureBreakdown/v3.25-places.md` |

## Tests

- `cd frontend && npx jest` → ✅ 33 suites, 265 passed, 5 skipped
- `npm run lint` (0 warnings), `npm run build` → ✅

## Before / After

| Surface | Before | After |
|---|---|---|
| Place visited 3 times | 3 markers on one spot, top one clickable | 1 marker with a "3" badge |
| Popup | One visit | Every visit, each editable |
| Summary card | "40 places" (visits) | "33 places · 40 visits" |
| Search blocked by CSP | Generic message only | Same message, real error in console |

## Ops note (2026-10-15)

Place search failed in production because nginx's `connect-src` did not allow `https://places.googleapis.com`. Fixed in place on the droplet; local `server/nginx/default.conf` re-synced from the server.

## TL;DR Changelog

- feat(places): stack visits by placeId or identical coordinates
- feat(places): count badge, multi-visit popup with per-visit Edit
- chore(places): log Places search errors
- test(places): 9 new tests
- closes #359
