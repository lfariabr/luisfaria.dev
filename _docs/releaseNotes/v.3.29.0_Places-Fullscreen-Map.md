# v3.29.0 — Places: full screen map with one-finger pan

**Release date:** 2026-10-19
**Type:** Feature (frontend). Issue #398.

## What's New

- **Full screen button on the map.** A 44px button in the map's top-right corner makes the map cover the whole screen. Tapping it again, or pressing Escape, goes back to the page.
- **One finger pans while full screen.** On the page the map stays `cooperative`: one finger scrolls past it, two fingers move it. Full screen there's no page to scroll, so the map switches to `greedy` and one finger pans it.
- **Works on iPhone.** Google's own full screen button uses the Fullscreen API, which iPhone Safari doesn't support for page elements. It's turned off. The new mode is a fixed layer over the page instead, padded for the notch, and the page behind it can't scroll.
- **Everything else still works full screen.** Pins, popups, editing from a popup, "Pick on map" and flying to a newly saved pin all work in this mode too.

## Files Changed

| Area | Files |
|------|-------|
| Page | `frontend/src/components/relationship/RelationshipMap.tsx` |
| Tests | `RelationshipMapPage.test.tsx` (+3; the map mock now exposes `gestureHandling`) |

## Tests

- Full screen covers the screen, switches to `greedy` and locks the page scroll.
- The button and Escape both return to the page and restore `cooperative`.
- Pins and popups still open while full screen.
- Frontend: 350 passed. Typecheck and lint pass.
- **Needs an iPhone check after deploy:**
  - [ ] Full screen: one finger pans, and a pinch zooms the map rather than the page
  - [ ] Back on the page: one finger scrolls past the map, and the page doesn't pinch-zoom

## Before / After

| | Before | After |
|---|---|---|
| Moving the map on a phone | Two fingers only | One finger in full screen |
| Full screen on iPhone | Not available | Button on the map |

## TL;DR Changelog

- feat(places): full screen map with one-finger pan (closes #398)
