# v3.28.9 — Places: steady page load, quieter hint, bigger edit pencil

**Release date:** 2026-10-17
**Type:** Fix (frontend). Issue #395, part of epic #388.

## What's New

- **No jump on load.**
  - The stat pills used to say "Loading..." and then grew, so the row went from one line to two. They now show skeleton bars about as wide as the numbers that replace them.
  - The map placeholder is now exactly the map's size. It was a fixed 520px box.
- **The map appears straight away.** With the Maps key and Map ID set, the map draws while the pins are still loading, and the markers drop in when they arrive. Before, it waited behind a "Loading relationship pins..." box.
- **Hint hides with a popup.** "Tap a pin for details" now goes invisible while a popup is open. It keeps its space, so the map doesn't shift.
- **44px edit pencils.** The pencils in the popup and on each timeline row are now 44×44 tap targets. They were about 22px. The icon size is unchanged, and negative margins keep the rows the same height.

## Files Changed

| Area | Files |
|------|-------|
| Page | `frontend/src/components/relationship/RelationshipMap.tsx` |
| Popup | `frontend/src/components/relationship/PlacePopup.tsx` |
| Tests | `RelationshipMapPage.test.tsx` (+3, 1 rewritten), `PlacePopup.test.tsx` (+1) |

## Tests

- Written first (they failed before the change):
  - the loading state uses skeletons and a map-sized placeholder, with no "Loading..."
  - with keys set, the map renders while pins load
  - the hint goes invisible when a popup opens
  - the timeline and popup pencils are `h-11 w-11`
- Frontend: 347 passed. Typecheck and lint pass.
- **Needs an iPhone check after deploy:**
  - [ ] Reloading `/places`: the stat row and map don't jump
  - [ ] Tapping a pin hides the hint, and the pencils are easy to hit

## Before / After

| | Before | After |
|---|---|---|
| Stat row on load | "Loading..." ×3, then reflows | Skeletons, then the numbers in place |
| Map on load | Empty 520px box | The map itself |
| Hint with a popup open | Still says "Tap a pin" | Hidden, space kept |
| Edit pencil | ~22px | 44×44 |

## TL;DR Changelog

- fix(places): steady page load and bigger edit pencil (closes #395)
