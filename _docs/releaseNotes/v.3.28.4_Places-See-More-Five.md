# v3.28.4 — Places: See more adds 5 visits at a time

**Release date:** 2026-10-17
**Type:** Feature (frontend). Issue #403, follow-up to #372.

## What's New

- **Before:** the Visit timeline showed the latest 3 visits, and "See more (N)" opened every visit at once. With dozens of visits, one tap made a very long page.
- **Now:**
  - Each tap of See more adds up to 5 visits.
  - The label says how many the next tap adds: "See 5 more", and at the end "See 2 more".
  - "Show less" appears once more than 3 are showing and goes back to 3.
  - With 3 visits or fewer there is still no button.

## Files Changed

| Area | Files |
|------|-------|
| Timeline | `frontend/src/components/relationship/RelationshipMap.tsx` |
| Tests | `frontend/src/__tests__/app/RelationshipMapPage.test.tsx` (1 replaced, +1) |

## Tests

- Written first (both failed before the change):
  - 15 visits show 3, then 8, 13 and 15, with labels "See 5 more", "See 5 more", "See 2 more", and no See more at the end
  - Show less goes back to the latest 3
- Frontend: 296 passed. Typecheck and lint pass.

## Before / After

| 15 visits | Before | After |
|---|---|---|
| First view | 3 + "See more (12)" | 3 + "See 5 more" |
| One tap | All 15 | 8 + "See 5 more" + "Show less" |

## TL;DR Changelog

- feat(places): See more adds 5 visits at a time (closes #403)
