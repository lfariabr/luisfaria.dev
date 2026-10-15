# v3.26.2 — Places: compact header

**Release date:** 2026-10-16
**Type:** Feature (frontend). Release in epic #368 (Places on mobile).

## What's New

- **Stat pills.** The three stat cards (places · visits, total spent, latest visit) are now small rounded pills on one line that wraps when needed. On a phone they took three stacked cards; now they take one row.
- **Home in the same row.** The amber home legend sits after the pills.
- **Removed:**
  - The "Places visited" legend: the violet marker is the only marker kind besides home.
  - "Precise home address intentionally not shown": the home popup shows the label only, so the note added a line to say nothing.
- **Shorter hint on phones.** The map card says "Tap a pin for details" below `sm` and keeps "Click a marker or list item to see details" on larger screens.
- **Same layout everywhere.** Title and Add place sit on top, with the pills below at every width. The old wide-screen side-by-side cards are gone.

## Files Changed

| Area | Files |
|------|-------|
| Page | `frontend/src/components/relationship/RelationshipMap.tsx` (`StatPill`, header, hint) |
| Tests | `frontend/src/__tests__/app/RelationshipMapPage.test.tsx` |

## Tests

- New test: the three stats render as pills inside `place-stats`, and both hint variants carry their breakpoint classes.
- The summary test no longer expects the removed note; its sentinel checks that no address renders stay.
- Frontend `tsc`, lint, jest (33 suites, 274 passed) and build pass.

## Before / After

| | Before | After |
|---|---|---|
| Stats on a phone | 3 stacked cards | 1 row of pills |
| Legend | "Places visited", home, privacy note | Home only, in the pill row |
| Map hint on a phone | "Click a marker or list item to see details" | "Tap a pin for details" |

## TL;DR Changelog

- feat(places): compact header with stat pills (closes #371)
