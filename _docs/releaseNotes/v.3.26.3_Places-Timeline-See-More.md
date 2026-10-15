# v3.26.3 — Places: shorter Visit timeline

**Release date:** 2026-10-16
**Type:** Feature (frontend). Release in epic #368 (Places on mobile).

## What's New

- **Latest 3 visits by default.** The Visit timeline listed every pin (40 and growing), which on a phone made a long list under the map. It now opens on the 3 most recent visits, newest first, as the API returns them.
- **See more (N) / Show less.** A full-width button below the list shows how many visits are hidden and expands them in place. On desktop the expanded list keeps the card's existing 620px scroll limit. The button is absent with 3 visits or fewer.
- **Nothing else changes.** Tapping a row opens its place on the map, and per-visit Edit still works when the list is collapsed or expanded. Markers on the map open their place's popup whether or not that visit is in the first 3.
- **New visits.** A newly added visit appears in the top 3 when its date is the newest, because the list is ordered by visit date.

## Files Changed

| Area | Files |
|------|-------|
| Page | `frontend/src/components/relationship/RelationshipMap.tsx` (`TIMELINE_PREVIEW`, toggle) |
| Tests | `frontend/src/__tests__/app/RelationshipMapPage.test.tsx` |

## Tests

- New `visit timeline` tests cover 5 visits (3 shown, See more (2) expands to 5, Show less collapses to 3), exactly 3 visits (no toggle) and 0 visits (no toggle). The first two failed before the change.
- Frontend `tsc`, lint, jest and build pass.

## Before / After

| | Before | After |
|---|---|---|
| Timeline on load | Every visit | Latest 3 |
| More visits | Scroll the card | See more (N), then Show less |

## TL;DR Changelog

- feat(places): timeline shows latest 3 with See more (closes #372)
