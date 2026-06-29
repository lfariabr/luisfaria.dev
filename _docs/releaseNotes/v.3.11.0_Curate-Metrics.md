# v3.11.0 — Curate home Impact metrics

**Release date:** 2026-06-29
**Type:** Refactor / Content
**Closes:** [#243](https://github.com/lfariabr/luisfaria.dev/issues/243)

---

## What shipped

- Curated the home "Impact" section for freshness and credibility (kept the section — quantified impact is a real differentiator).
- Dropped two weak metrics (**"+20% Client engagement (GenAI)"**, **"99.9% Credential theft prevention"**).
- Added a current data-role metric: **~4 hrs saved per term rollover** (St Catherine's reporting).
- Moved the data into `frontend/src/content/metrics.ts`; renamed the heading "Impact at a glance" → **"Impact"**.

---

## Before / After

| | Before | After |
|---|--------|-------|
| Heading | "Impact at a glance" | "Impact" |
| Metrics | 9, all from the clinics/Konquista era; 2 fluffy | 8 concrete + defensible, incl. a current St Catherine's metric |
| Source | hardcoded in the component | curated in `content/metrics.ts` |

---

## Validation

- `cd frontend && npx jest` → 149 passed / 5 skipped (23 suites)
- `cd frontend && npx tsc --noEmit` → no errors
- `cd frontend && npm run build` → compiled successfully

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.10.0...v3.11.0
