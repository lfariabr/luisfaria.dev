# v3.28.3 — Places: Spent takes a decimal comma on iPhone

**Release date:** 2026-10-17
**Type:** Fix (frontend). Issue #405, part of epic #388.

## What's New

- **Problem:** on iPhone the Spent field would not take cents.
- **Cause:** Spent was `<input type="number" inputMode="decimal">`. With the phone's region set to use a decimal comma, the keypad's decimal key types `,`. Safari's number input does not accept a comma and empties itself, so `58,74` could not be entered.
- **Fix:**
  - Spent is now `type="text"` and keeps `inputMode="decimal"`, so the keypad is the same and the field keeps what is typed.
  - The form accepts `58.74` or `58,74` (whole dollars or up to 2 decimal places) and stores 58.74.
  - Anything else, such as `1,234.50`, `4.567` or `12.`, shows the existing amount error instead of being guessed at.

## Files Changed

| Area | Files |
|------|-------|
| Parsing | `frontend/src/components/relationship/pinForm.ts` |
| Form | `frontend/src/components/relationship/PinFormDialog.tsx` |
| Tests | `frontend/src/__tests__/components/pinForm.test.ts` (+8), `RelationshipMapPage.test.tsx` (+1 assertion) |

## Tests

- New tests written first (they failed before the change):
  - accepts `58.74`, `58,74`, ` 58,7 ` and `58`
  - rejects `1,234.50`, `4.567`, `12.` and `,5`
  - a decimal comma is stored as 58.74
  - Spent is `type="text"`
- Frontend: 314 passed. Typecheck and lint pass.
- **Needs an iPhone check after deploy:**
  - [ ] Typing cents in Spent works and the pin saves the right amount

## Before / After

| | Before | After |
|---|---|---|
| `58,74` on a comma-decimal iPhone | Field empties | Saved as 58.74 |
| `58.74` | Saved | Saved |
| `4.567` | Saved as 4.567 | "Amount must be more than 0, or leave it blank" |

## TL;DR Changelog

- fix(places): Spent accepts a decimal comma on iPhone (closes #405)
