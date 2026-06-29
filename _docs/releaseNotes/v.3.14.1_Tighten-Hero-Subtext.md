# v3.14.1 — Tighten Hero Subtext

## What's New

- **Tighter hero subtext.** Replaced the long subline (which restated the metric cards below it) with one concise sentence:
  > I turn messy, manual work into automated, KPI-driven systems — data, full-stack, and ML. 10+ years end-to-end; now at St Catherine's, Sydney.
- **Fixes mobile FAB overlap.** The shorter hero lifts the metrics row clear of the floating action buttons (Apod/Goggins/Stripe), which were overlapping a metric card on small screens. No FAB/layout changes — hero-only.

## Files Changed

| Action | File |
|--------|------|
| Modified | `frontend/src/content/profile.ts` |
| Modified | `frontend/src/__tests__/app/Home.test.tsx` |

## Tests

- `npx jest src/__tests__/app/Home.test.tsx` → ✅ 9 passed
- `npm run build` → ✅ compiled successfully

## Before / After

| | Before | After |
|---|--------|-------|
| Subtext | Two long sentences duplicating the metric cards | One concise sentence |
| Mobile | Hero metrics pushed into FAB zone → overlap | Metrics clear the FAB stack |

## TL;DR Changelog

- `fix(home)`: tighten hero subtext to cut mobile vertical bloat and stop the FAB overlapping the metric cards.
