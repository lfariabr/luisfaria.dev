# v3.27.2 — Places: Google photo, stars and Maps link in the popup

**Release date:** 2026-10-16
**Type:** Feature (frontend). Issue #383.

## What's New

- **Photo.** Google's first photo of the place sits at the top of the pin popup, with the photographer's name linked as Google's terms require.
- **Stars.** ★ 4.6 (1,234): Google's rating and review count.
- **Google Maps link.** It opens the place in Google Maps for directions, hours and reviews.
- **Better address.** Google's short address ("1 Example St, Potts Point") replaces the city line when available.
- **Only for linked places.** This covers places added through search and pins the importer geocoded. Hand-placed pins keep the plain popup.
- **Cheap by design.** Details are fetched when a popup opens, once per place per page load, and nothing from Google is stored in our database.
- **Fails quietly.** The popup falls back to our own data, and the failure is logged with `logger.warn`.

## Files Changed

| Area | Files |
|------|-------|
| Fetch | `frontend/src/components/relationship/placeDetails.ts` (new) |
| Popup | `frontend/src/components/relationship/PlacePopup.tsx` |
| Tests | `frontend/src/__tests__/components/PlacePopup.test.tsx` (new) |
| Docs | `_docs/guides/run-your-own-places-map.md`, `_docs/featureBreakdown/v3.27-places-popup.md` |

## Tests

- 4 new tests, written first:
  - photo, author, rating, address and Maps link
  - one fetch across two opens
  - no Google call without a `placeId`
  - quiet fallback with a log on failure
- Frontend: 35 suites, 289 passed. Lint and build pass.
- **Live check on `/places`, using Sydney Opera House rather than a personal pin:**
  - The fields came back.
  - The photo was rejected because the site's `Referrer-Policy: no-referrer` meets a referrer-restricted key. `referrerPolicy="origin"` on the image fixed it: the photo loaded at 347×260.

## Before / After

| Popup | Before | After |
|---|---|---|
| Photo | None | Google photo + credit |
| Rating | None | ★ rating (count) |
| Location | City, country | Google's short address |
| Directions | None | Google Maps link |

## TL;DR Changelog

- feat(places): Google rating, photo and Maps link in the pin popup (closes #383)
