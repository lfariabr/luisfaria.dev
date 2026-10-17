# v3.28.8 — Places: the notes box grows as you type

**Release date:** 2026-10-17
**Type:** Feature (frontend). Issue #394, part of epic #388.

## What's New

- **Before:** Notes was a fixed 3-line box that scrolled inside itself after that, so you couldn't see what you had written.
- **Now:**
  - Notes starts at 3 lines and grows with what you type, up to 8 lines, then scrolls.
  - The box is a fixed width, so the resize handle is gone.
  - **Browser support:** CSS `field-sizing: content` does the growing. For browsers without it, a new `useAutoGrow` hook sets the height to fit the text after each change. CSS still enforces the 3- and 8-line limits.

## Files Changed

| Area | Files |
|------|-------|
| Hook | new `frontend/src/lib/hooks/useAutoGrow.ts` |
| Form | `frontend/src/components/relationship/PinFormDialog.tsx` |
| Tests | new `useAutoGrow.test.tsx` (2), `RelationshipMapPage.test.tsx` (+1) |

## Tests

- Written first (they failed before the change):
  - without `field-sizing`, the box takes its content's height
  - with it, the hook leaves sizing to CSS
  - Notes has the field-sizing class and the 3- and 8-line bounds
- Frontend: 338 passed. Typecheck, lint and build pass; the built CSS has `field-sizing:content`, `min-height:calc(3lh + 1rem)` and `max-height:calc(8lh + 1rem)`.
- **Needs an iPhone check after deploy:**
  - [ ] Notes grows line by line and scrolls after about 8 lines

## Before / After

| | Before | After |
|---|---|---|
| A 5-line note | 3 visible, scrolls inside the box | All 5 visible |
| A 12-line note | 3 visible | 8 visible, then scrolls |

## TL;DR Changelog

- feat(places): notes box grows as you type (closes #394)
