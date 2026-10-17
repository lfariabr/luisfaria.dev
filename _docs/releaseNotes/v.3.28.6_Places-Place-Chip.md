# v3.28.6 — Places: the picked place shows its name and address

**Release date:** 2026-10-17
**Type:** Feature (frontend). Issue #392, part of epic #388.

## What's New

- **Before:** after picking a place from search, the box emptied and the form read `Google place (-33.8727, 151.2244)`.
- **Now:** the place shows as a chip with a **Change** button. What the chip shows depends on how the place was chosen:
  - **From search:** the name and Google's short address, e.g. "Harbour Bistro · 12 Harbour St, Potts Point".
  - **Editing a saved pin:** the name with city and country, e.g. "Corner Cafe · Sydney, AU". The address isn't stored.
  - **Tapped on the map:** "Pinned on map" with coordinates to 4 decimal places.
- **Change** clears the location and brings back the search box with the cursor in it. The name you typed stays.
- **No extra cost.** `shortFormattedAddress` is a Place Details Essentials field, and the request already asks for `displayName`, which is Pro. Checked against Google's Places (New) field table on 2026-10-17.
- **No schema change.** The address lives in the form only.

## Files Changed

| Area | Files |
|------|-------|
| Chip | new `frontend/src/components/relationship/PlaceChip.tsx` |
| Form | `PinFormDialog.tsx`, `PlaceSearch.tsx` (asks for `shortFormattedAddress`, `autoFocus`), `pinForm.ts` (`address`, form only) |
| Tests | new `PlaceChip.test.tsx` (4), `PlaceSearch.test.tsx` (+1, 1 updated), `pinForm.test.ts` (+3), `RelationshipMapPage.test.tsx` (+1) |

## Tests

- Written first (they failed before the change):
  - the chip shows name and address with no coordinates, falls back to city and country, shows "Pinned on map" with coordinates for a map tap, and offers Change
  - search asks for `shortFormattedAddress` and passes it on, and the search box can take focus
  - the address comes with a Google place, is dropped by a map tap, and is never in the saved input
  - editing shows the chip, and Change brings back search while keeping the name
- Frontend: 326 passed. Typecheck and lint pass.

## Before / After

| | Before | After |
|---|---|---|
| After picking from search | Empty box + `Google place (-33.8727, 151.2244)` | Name + short address + Change |
| Editing a pin | `Google place (…)` / `Picked on map (…)` | Name + city, country |
| Changing the place | Type into search again | Change → search, with the cursor in it |

## TL;DR Changelog

- feat(places): selected place chip with address (closes #392)
