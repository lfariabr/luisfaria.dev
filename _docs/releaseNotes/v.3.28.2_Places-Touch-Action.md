# v3.28.2 — Places: no page pinch zoom from the timeline either

**Release date:** 2026-10-17
**Type:** Fix (frontend). Issue #402, follow-up to #386.

## What's New

- **Problem:** after v3.27.3, an iPhone test showed that a pinch over the Visit timeline, below the map, still zoomed the whole page.
- **Cause:** v3.27.3 cancels Safari's gesture events and two-finger `touchmove`s. But once a finger has started scrolling, iOS makes that touch's moves uncancelable, so a pinch that began as a scroll got through.
- **Fix:** while `/places` is open, `usePreventPagePinchZoom` sets `touch-action: pan-x pan-y` on `<html>`. Safari then never starts a page pinch, and one finger still scrolls. The previous value comes back on leaving the page. The v3.27.3 listeners stay as a fallback for older iOS.
- **Unchanged:** the map's own pinch. Google Maps handles the touches in its own code, which `touch-action` does not block.

## Files Changed

| Area | Files |
|------|-------|
| Hook | `frontend/src/lib/hooks/usePreventPagePinchZoom.ts` |
| Tests | `frontend/src/__tests__/lib/hooks/usePreventPagePinchZoom.test.ts` (+2) |

## Tests

- 2 new tests, written first (the first failed before the change):
  - `<html>` gets `touch-action: pan-x pan-y` while mounted
  - the previous value is restored on unmount
- Frontend: 297 passed. Typecheck and lint pass.
- **Needs an iPhone check after deploy:**
  - [ ] A pinch over the timeline or header does not zoom the page
  - [ ] A pinch on the map zooms the map
  - [ ] One finger scrolls

## Before / After

| | Before | After |
|---|---|---|
| Pinch over the timeline | Page zooms | Nothing |
| Pinch on the map | Map zooms | Map zooms |
| Leaving `/places` | — | Page zoom works again |

## TL;DR Changelog

- fix(places): no page pinch zoom when the pinch starts on the timeline (closes #402)
