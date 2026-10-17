# v3.28.7 — Places: tap-to-pick category and payment

**Release date:** 2026-10-17
**Type:** Feature (frontend). Issue #393, part of epic #388.

## What's New

- **Before:** Category and Payment were text fields with a suggestions list. In the test recording "Eat out" was typed by hand and Payment was skipped.
- **Now:** both are rows of chips you tap, built from your own visits.
  - **Order:** the 6 values you've used most often, in a row that scrolls sideways.
  - **One tap selects**, and tapping the selected chip again clears it (both fields are optional).
  - **"+ New"** opens a text box with the keyboard up, for a value you haven't used before.
  - **Editing a pin** keeps its saved value selected, even if it isn't in the top 6.
  - **Payment for a new visit** starts on the method from your most recent visit. Edits keep the saved value.
  - **Category starter chips** `Eat out`, `Coffee`, `Drinks`, `Groceries`, `Activity` appear only when there's no history yet.
- **Accessibility:** each row is a `radiogroup` of `radio`s with a focus ring, and every chip is at least 44px tall.
- **Autofill:** the "+ New" box for Payment keeps `name="paidWith"`, Done on the keyboard, and the autofill opt-outs from v3.28.0.

## Files Changed

| Area | Files |
|------|-------|
| Chips | new `frontend/src/components/relationship/ChipPicker.tsx` |
| Form | `PinFormDialog.tsx` (chips replace the two inputs and datalists), `RelationshipMap.tsx` (payment preselect) |
| Tests | new `ChipPicker.test.tsx` (6), `RelationshipMapPage.test.tsx` (+3, 2 updated) |

## Tests

- Written first (they failed before the change):
  - top 6 in the order given
  - select and clear
  - a saved value outside the top 6 is shown and selected
  - seeds with no history
  - "+ New" takes a typed value
  - 44px chips
  - a new place preselects the last payment, and category starts empty
  - an edit keeps the saved payment
  - a tapped chip is saved
- Frontend: 335 passed. Typecheck and lint pass.
- **Needs an iPhone check after deploy:**
  - [ ] A repeat category and payment take one tap each
  - [ ] "+ New" opens the keyboard

## Before / After

| | Before | After |
|---|---|---|
| Category "Eat out" | Typed by hand | One tap |
| Payment | Often skipped | Preselected from the last visit |
| New value | Type it | "+ New", then type it |

## TL;DR Changelog

- feat(places): tap-to-pick category and payment chips (closes #393)
