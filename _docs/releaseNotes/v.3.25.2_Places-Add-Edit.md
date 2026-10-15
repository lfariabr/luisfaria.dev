# v3.25.2 — Places: add and edit from the map

**Release date:** 2026-10-15
**Type:** Feature (frontend + backend). Third release in epic #350 (Places).

## What's New

- **Add place.** ADMIN and PARTNER get an "Add place" button on the map. The form is a dialog on desktop and docks to the bottom edge on a phone.
- **Places search.** Typing a name searches Google Maps (Places API (New)), biased to what the map is showing. Picking a result fills the name, coordinates, city, country and Google place id.
- **Pick on map.** When search can't find it, "Pick on map" hides the form, the next tap on the map sets the spot, and the form comes back with everything typed so far. A draft marker shows where the pin will land.
- **Edit.** Every popup and timeline row has an Edit action that opens the same form prefilled. Saving sends only the fields that changed; clearing a field removes it.
- **Delete (ADMIN only).** Inside the edit form, behind a "Delete for good" confirm. PARTNER never sees it.
- **Pins without a spend (#358).** Amount is optional. A beach or a walk can be pinned with a name and notes. No-spend pins show no amount and stay out of the total.
- **Suggestions.** Category and payment suggest values already used, most used first.
- **Backend:** `amount` is optional on `Pin`, `PinInput` and `PinUpdateInput`. `updatePin` treats `null` on an optional field (`amount`, `category`, `payment`, `city`, `countryCode`, `notes`, `placeId`) as "remove it" (`$unset`).

## Files Changed

| Area | Files |
|------|-------|
| Form | `frontend/src/components/relationship/PinFormDialog.tsx` (new), `PlaceSearch.tsx` (new), `pinForm.ts` (new) |
| Map | `frontend/src/components/relationship/RelationshipMap.tsx` |
| GraphQL client | `frontend/src/lib/graphql/mutations/pin.mutations.ts` (new), `queries/pin.queries.ts` (fragment, `placeId`), `types/pin.types.ts` |
| Env | `frontend/.env.example` (browser key needs Places API (New)) |
| Backend | `backend/src/validation/schemas/pin.schema.ts`, `backend/src/resolvers/pins/mutations.ts`, `backend/src/schemas/types/pinTypes.ts`, `backend/src/models/Pin.ts` |
| Tests | `frontend/src/__tests__/app/RelationshipMapPage.test.tsx` (10 → 17), `frontend/src/__tests__/components/pinForm.test.ts` (new, 12), `frontend/src/__tests__/components/PlaceSearch.test.tsx` (new, 3), `backend/src/__tests__/integration/pinResolvers.test.ts` (54 → 61) |
| Docs | `_docs/featureBreakdown/v3.25-places.md` |

## Tests

- `cd frontend && npx jest` → ✅ 32 suites, 256 passed, 5 skipped
- `cd frontend && npm run lint` (0 warnings) and `npm run build` → ✅
- `cd backend && npm test` → ✅ 25 suites, 376 passed; `npm run lint` and `npm run typecheck` → ✅
- The map page test now uses fictional places; the old fixture looked like a real export row

## Before / After

| Surface | Before | After |
|---|---|---|
| Add a pin | Importer script or raw GraphQL | "Add place" on the map |
| Fix a wrong location | Database edit | Edit → search or pick on map |
| Delete a pin | Not possible in the UI | ADMIN, with confirm |
| Place without a spend | Not possible | Name + notes, no amount |
| No-spend pin display | n/a | No "$0.00"; not in the total |
| `updatePin` with `notes: null` | Rejected | Notes removed |

## Setup

The browser key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) needs **Places API (New)** enabled and allowed in its API restrictions, with billing on the project.

## TL;DR Changelog

- feat(places): add/edit form with Places search and map picking
- feat(places): admin delete with inline confirm
- feat(pins): optional amount; `null` clears optional fields on update
- test(places): 22 new frontend tests, 7 new backend tests
- closes #353, closes #358
