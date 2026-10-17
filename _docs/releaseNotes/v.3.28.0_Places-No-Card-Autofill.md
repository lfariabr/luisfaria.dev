# v3.28.0 — Places: the pin form no longer looks like a card form

**Release date:** 2026-10-17
**Type:** Fix (frontend). Issue #389, part of epic #388.

## What's New

- **No card AutoFill.** On iPhone Safari the add/edit pin form showed the key, card and location AutoFill icons, and suggested "Amex" in Spent. No input had a `name` or `autocomplete`, so Safari guessed from ids like `pin-payment`.
- **Every input opts out:**
  - The form and every input get `autocomplete="off"`.
  - They also get `data-1p-ignore` and `data-lpignore="true"`, shared from `noAutofill.ts`.
  - Inputs have neutral `name`s.
- **Payment field renamed in the DOM only.** Its id is now `pin-paid-with` and its name `paidWith`. The stored and GraphQL field stays `payment`, and the visible label stays "Payment" unless the device check shows Safari still triggers on it.
- **Spent** shows a `$` prefix inside the input and keeps the decimal keypad. Inputs get `enterKeyHint` set to `next`; Payment, the last single-line field, gets `done`; the place search gets `search`.

## Files Changed

| Area | Files |
|------|-------|
| Form | `frontend/src/components/relationship/PinFormDialog.tsx`, `PlaceSearch.tsx`, new `noAutofill.ts` |
| Tests | `frontend/src/__tests__/app/RelationshipMapPage.test.tsx` (+2) |
| Docs | `_docs/featureBreakdown/v3.28-places-fast-logging.md` |

## Tests

- 2 new tests, written first (both failed before the change):
  - the form and every field opt out of AutoFill, and no id, name or list contains "payment"
  - Spent has the `$` prefix, the decimal keypad and a Next key; Payment has Done
- Frontend: 295 passed. Typecheck and lint pass.
- **Needs an iPhone check after deploy:**
  - [ ] No AutoFill icons above the keyboard on any field
  - [ ] No "Amex" suggestion while typing in Spent
  - [ ] Spent opens the decimal keypad

## Before / After

| | Before | After |
|---|---|---|
| Keyboard bar on iPhone | Key, card and location AutoFill icons | None expected |
| Typing in Spent | QuickType suggests "Amex" | Plain decimal keypad |
| Payment field id | `pin-payment` | `pin-paid-with`, name `paidWith` |
| Stored field | `payment` | `payment` (unchanged) |

## TL;DR Changelog

- fix(places): pin form no longer looks like a card form (closes #389)
