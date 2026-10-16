# v3.27.3 — Places: page pinch zoom blocked on iPhone too

**Release date:** 2026-10-16
**Type:** Fix (frontend). Issue #386, follow-up to #369.

## What's New

- **iPhone pinch fix.** v3.26.4 stopped a pinch off the map from zooming the page in Chrome. On a phone it still zoomed, and on iPhone the hook is the only guard because Safari ignores `user-scalable=no`.
- **Cause:** WebKit treats touch listeners on `document` as passive by default, so the hook's `preventDefault()` on `gesturestart` could be silently ignored.
- **Fix:** `usePreventPagePinchZoom` now registers its listeners with `{ passive: false }` and covers three cases:
  - `gesturestart` and `gesturechange` (Safari's pinch events)
  - any `touchmove` with two or more fingers, the standard iOS pinch block
- **Unchanged:**
  - One-finger scrolling.
  - The map's own pinch: `preventDefault` stops the browser's zoom, not Google Maps' handlers.
  - Other pages: the listeners are removed on leaving `/places`.

## Files Changed

| Area | Files |
|------|-------|
| Hook | `frontend/src/lib/hooks/usePreventPagePinchZoom.ts` |
| Tests | `frontend/src/__tests__/lib/hooks/usePreventPagePinchZoom.test.ts` (+4) |

## Tests

- 4 new tests, written first (3 failed before the change):
  - listeners are non-passive
  - a two-finger move is cancelled and a one-finger move is not
  - `gesturechange` is cancelled
  - every listener is removed on unmount
- Frontend: 293 passed. Lint and build pass.
- Production check before the change: `/places` serves the capped viewport and cancels `gesturestart`, so v3.26.4 was deployed. The bug is iOS-specific.
- **Needs an iPhone check after deploy:**
  - [ ] A pinch off the map does nothing
  - [ ] A pinch on the map zooms the map
  - [ ] One finger scrolls

## TL;DR Changelog

- fix(places): block page pinch zoom on iPhone (closes #386)
