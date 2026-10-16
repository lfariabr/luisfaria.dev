# v3.26.4 — Places: a pinch off the map no longer zooms the page

**Release date:** 2026-10-16
**Type:** Fix (frontend). Release in epic #368 (Places on mobile).

## What's New

- **Page zoom is off on `/places` only.** On a phone, a pinch that started with a finger off the map zoomed the whole page, which was hard to undo. Now a pinch on the map zooms the map, and a pinch anywhere else on the page does nothing. One finger still scrolls the page.
- **Two mechanisms, one per browser family:**
  - **Android Chrome and most browsers:** `app/places/page.tsx` exports `viewport` with `maximumScale: 1, userScalable: false`. Next renders it only on `/places`; every other page keeps `width=device-width, initial-scale=1`.
  - **iOS Safari** has ignored those viewport values since iOS 10. The new `usePreventPagePinchZoom` hook, mounted by `PlacesPageClient`, cancels Safari's `gesturestart` event while the page is open and stops on leaving. Google Maps handles its own pinch from raw touch events, so the map still zooms.
- **Changed from the issue:** #369 proposed `touch-action: pan-x pan-y` for iOS. WebKit's support for those values is partial, and a wrapper's `touch-action` also applies inside the map, so this release cancels `gesturestart` instead.
- **Trade-off:** readers can't pinch to enlarge text on this page. That's acceptable on a private two-person page, and it is why the change is scoped to `/places`.

## Files Changed

| Area | Files |
|------|-------|
| Viewport | `frontend/src/app/places/page.tsx` |
| Hook | `frontend/src/lib/hooks/usePreventPagePinchZoom.ts`, used in `frontend/src/app/places/PlacesPageClient.tsx` |
| Tests | `frontend/src/__tests__/lib/hooks/usePreventPagePinchZoom.test.ts` |

## Tests

- New tests: `gesturestart` is cancelled while the hook is mounted and not after unmount, and the `/places` viewport caps the scale at 1. They were written first and failed with the module missing.
- Built HTML: `/places` has `maximum-scale=1, user-scalable=no`; `/` keeps `width=device-width, initial-scale=1`.
- Frontend `tsc`, lint, jest (34 suites, 280 passed) and build pass.
- Real-phone check after deploy, on iPhone Safari and Android Chrome:
  - [ ] A pinch off the map does nothing
  - [ ] A two-finger pinch on the map zooms the map
  - [ ] One finger scrolls the page

## Before / After

| Gesture on `/places` (phone) | Before | After |
|---|---|---|
| Pinch starting off the map | Zooms the whole page | Nothing |
| Two-finger pinch on the map | Zooms the map | Zooms the map |
| One finger anywhere | Scrolls the page | Scrolls the page |
| Pinch on any other page | Zooms the page | Zooms the page |

## TL;DR Changelog

- fix(places): page pinch zoom no longer hijacks the map (closes #369)
