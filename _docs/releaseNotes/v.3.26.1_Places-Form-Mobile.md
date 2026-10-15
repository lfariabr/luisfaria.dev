# v3.26.1 — Places: form fields stop overlapping on phones

**Release date:** 2026-10-16
**Type:** Fix (frontend). Release in epic #368 (Places on mobile).

## What's New

- **Date and Spent sit side by side again.** In the add/edit form on iPhone, the Date field spilled into Spent (AUD).
  - Cause: the two sit in a two-column grid, and grid items default to `min-width: auto`. iOS Safari gives `<input type="date">` a wide intrinsic width, so the Date cell grew past its column.
- **Fix:**
  - Every cell in the two field rows (Date / Spent, Category / Payment) gets `min-w-0`, so it shrinks to its column.
  - The date input gets `appearance-none` and left-aligned text, so iOS stops drawing its own fixed-width, centred control.

## Files Changed

| Area | Files |
|------|-------|
| Form | `frontend/src/components/relationship/PinFormDialog.tsx` |

## Tests

- No unit test: jsdom does no layout, so a test could only assert class names.
- Frontend `tsc`, lint, jest (33 suites, 269 passed) and build pass. The built CSS contains `.min-w-0`, `.appearance-none` and the `::-webkit-date-and-time-value { text-align: left }` rule.
- Needs a check on a real iPhone after deploy. Done when Add a place at 360–390px wide shows no overlap.

## Before / After

| | Before | After |
|---|---|---|
| Date / Spent on iPhone | Overlapping | Two equal columns |
| Date text on iOS | Centred, fixed width | Left-aligned, column width |
| Category / Payment | Could overflow on narrow screens | Shrink to their column |
| Desktop | Two columns | Unchanged |

## TL;DR Changelog

- fix(places): form fields no longer overlap on mobile (closes #370)
