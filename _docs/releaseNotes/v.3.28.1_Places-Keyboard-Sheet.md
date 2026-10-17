# v3.28.1 — Places: the add-place sheet stays above the iOS keyboard

**Release date:** 2026-10-17
**Type:** Fix (frontend). Issue #390, part of epic #388.

## What's New

- **Fixed header and footer.** The add/edit form is now three parts:
  - a header with the title and ✕
  - a body where only the fields scroll
  - a footer with Add place / Save changes
  
  Before, the whole dialog scrolled as one block, so typing pushed the header off the top.
- **Full height on phones.** Below `sm` the sheet fills the screen edge to edge, so the page behind no longer shows through under it. Desktop keeps the centred dialog, capped at 90% of the viewport height, with the same fixed header and footer.
- **Inset to the area above the keyboard on iPhone.** iOS keeps the page full height when the keyboard opens, so a fixed sheet's footer sits behind the keyboard. When iOS scrolls to reach a field, the header slides off the top.
  - The new hook `useKeyboardInset` reads `visualViewport` and returns `{ top, bottom }`.
  - The sheet uses them as `--kb-top` and `--kb`, so it always matches what is visible.
  - The brief only padded the footer (`--kb`). The `top` half is added because the recording also shows the header going off-screen.
- **Android.** `/places` now sets `interactive-widget=resizes-content`, so Android Chrome shrinks the page for the keyboard itself, and both insets stay 0.
- **Focused field centred.** 300ms after a field gets focus, once the keyboard has opened, the field scrolls to the middle of the body.

## Files Changed

| Area | Files |
|------|-------|
| Hook | new `frontend/src/lib/hooks/useKeyboardInset.ts` |
| Form | `frontend/src/components/relationship/PinFormDialog.tsx` |
| Viewport | `frontend/src/app/places/page.tsx` |
| Tests | new `frontend/src/__tests__/lib/hooks/useKeyboardInset.test.ts` (7), `RelationshipMapPage.test.tsx` (+3) |

## Tests

- 10 new tests, written first (they failed before the change):
  - hook: zero with no keyboard, keyboard height, follows the iOS scroll, updates on scroll as well as resize, removes listeners, zero with no `visualViewport`
  - viewport: `interactiveWidget` is `resizes-content`
  - page: header and Add place are outside the scrolling body; the sheet gets `--kb-top`/`--kb` from the visual viewport; a focused field is centred after 300ms
- Frontend: 305 passed. Typecheck, lint and build pass; the built CSS contains `top: var(--kb-top)` and `bottom: var(--kb)` under `max-sm`.
- **Needs an iPhone check after deploy:**
  - [ ] With any field focused, ✕ and Add place are both visible and tappable
  - [ ] Nothing from the page shows under the sheet
  - [ ] Focusing Notes brings it into view above the keyboard

## Before / After

| | Before | After |
|---|---|---|
| Keyboard open on iPhone | Header scrolls off, Add place behind the keyboard | Sheet fits the visible area; header and footer stay |
| Page behind | Timeline visible below the sheet | Full-height sheet |
| What scrolls | The whole dialog | Only the fields |
| Android Chrome | Page overlaid by keyboard | Page resizes (`resizes-content`) |

## TL;DR Changelog

- fix(places): add-place sheet stays above the keyboard (closes #390)
