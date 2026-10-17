# v3.28.5 — Places: the map flies to the pin you just saved

**Release date:** 2026-10-17
**Type:** Feature (frontend). Issue #391, part of epic #388.

## What's New

- **Before:** saving closed the sheet and left you halfway down the page. Finding the new pin meant scrolling and pinching the map by hand.
- **Now, one tap on Add place:**
  - closes the sheet
  - shows a toast, "Corner Cafe added"
  - scrolls the map into view
  - flies the map to the pin at street level (zoom 17)
  - opens the pin's popup
  - rings its timeline row for 1.5s, if the row is in the visible part of the timeline
- **Edits do the same** with "Corner Cafe updated". When nothing changed there's no toast, but the map still shows the place.
- **Reduced motion:** with "Reduce motion" on, the map jumps instead of panning and the page scrolls without animating.
- **A failed save** keeps the sheet open with the error and nothing moves, as before.

## How it works

- `handleSubmit` keeps the id of the saved pin: the one `createPin` returns, or the edited pin's id.
- When the refetched pins include it, the page opens that pin's place and sets the camera target in the same render. That happens during render rather than in an effect, so lint's `set-state-in-effect` rule stays satisfied.
- A small `<MapFocus>` component inside `<Map>` uses `useMap()` to pan and zoom. An effect scrolls the map card into view.

## Files Changed

| Area | Files |
|------|-------|
| Page | `frontend/src/components/relationship/RelationshipMap.tsx` |
| Tests | `frontend/src/__tests__/app/RelationshipMapPage.test.tsx` (+5) |
| Docs | `_docs/featureBreakdown/v3.28-places-fast-logging.md` (synced with the epic) |

## Tests

- 5 new tests, written first (all failed before the change):
  - adding confirms with a toast, opens the popup, pans and zooms to the pin, and scrolls the map card into view
  - the new timeline row is ringed, then the ring clears
  - with reduced motion the map uses `setCenter` instead of `panTo`, and the scroll is instant
  - an edit does the same with "updated"
  - a failed save shows no toast and doesn't move the map
- Frontend: 322 passed. Typecheck, lint and build pass.
- **Needs an iPhone check after deploy (reload the tab first):**
  - [ ] Add a place: the toast shows, and the map ends on the new pin with its popup open, without scrolling by hand
  - [ ] Edit a place from the timeline: the same, with "updated"

## Before / After

| | Before | After |
|---|---|---|
| After Add place | Sheet closes and you're left mid-page | Toast, map in view, pin centred, popup open |
| Finding the new pin | Scroll and pinch by hand | Nothing to do |
| Timeline | No cue | New row ringed for 1.5s |

## TL;DR Changelog

- feat(places): fly to the new pin after save (closes #391)
