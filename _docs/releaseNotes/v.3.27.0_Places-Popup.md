# v3.27.0 / v3.27.1 — Places: cleaner pin popup, dark mode, hide amounts

**Release date:** 2026-10-16
**Type:** Feature (frontend). Issues #381, #382.

## What's New

- **Popup shows what matters.**
  - The place name sits in the popup's header beside the close button, with the city under it ("Sydney, AU").
  - Each visit is one row: date, amount and an edit pencil. A stack shows "3 visits · $120.00" on top, and a visit saved under another name still shows "as <old name>".
  - Category, payment and notes are gone from the popup; they stay in the edit form.
- **Works in dark mode.** Google's bubble, its tail and its close icon now follow the site theme. The white scrollbar strip Google drew down the side is gone.
- **Hide amounts.** An eye button after the stat pills hides every amount on the page (total, timeline, popup) as `$••••`, like a bank app. It is remembered per device, works when storage is blocked, and the edit form always shows the real amount.

## Files Changed

| Area | Files |
|------|-------|
| Popup | `frontend/src/components/relationship/PlacePopup.tsx` (new) |
| Formatting | `frontend/src/components/relationship/format.ts` (new) |
| Amounts | `frontend/src/components/relationship/amountsVisibility.ts` (new) |
| Page | `frontend/src/components/relationship/RelationshipMap.tsx` |
| Theme | `frontend/src/app/globals.css` |
| Tests | `frontend/src/__tests__/app/RelationshipMapPage.test.tsx` (+5) |
| Docs | `_docs/featureBreakdown/v3.27-places-popup.md` |

## Tests

- 5 new tests, written first and failing before the change. Frontend: 34 suites, 285 passed.
- The theme CSS was previewed on the live page in dark mode before committing.

## Before / After

| | Before | After |
|---|---|---|
| Popup per visit | Date, amount, "Eat out · Amex", notes, Edit link | Date, amount, ✎ |
| Popup title | Inside the body | In the header, beside × |
| Location | Not shown | "Sydney, AU" |
| Dark mode | Light text on a white bubble | Dark bubble, readable text |
| Amounts | Always shown | Eye toggle, remembered |

## TL;DR Changelog

- feat(places): cleaner pin popup that works in dark mode (closes #381)
- feat(places): hide and show amounts like a bank app (closes #382)
