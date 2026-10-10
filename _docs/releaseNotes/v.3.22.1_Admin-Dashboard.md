# v3.22.1 — Admin Dashboard Redesign

**Release date:** 11 October 2026 (merged in #321, closes #319)
**Type:** Feature (UI)

## What's New

- **Needs attention.** A strip at the top lists failed payments (last 30 days), payments pending for over 24h, and draft articles updated in the last 30 days, each linking to its page. When nothing qualifies it shows "All clear".
- **One tile per section.**
  - **Projects:** total and featured.
  - **Articles:** published and drafts.
  - **Payments:** paid this month, summed per currency.
  - **Users:** total and new in the last 7 days.
  - **Pins:** total and latest place.
  - **EMOM:** a "Start session" shortcut.
- **Fails one tile at a time.** Each tile loads on its own, with a skeleton, an inline error and Retry.
- **Gone:** the role card, the "coming soon" placeholder and the big quick-action cards ("New" now lives on the Projects and Articles tiles).

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/lib/admin/dashboard.ts` | New: attention rules, month/7-day windows, per-currency sums |
| `frontend/src/app/admin/page.tsx` | Rewritten: attention strip + launch tiles |
| `frontend/src/lib/graphql/queries/project.queries.ts` | `featured` added to `PROJECT_FRAGMENT` |
| `frontend/src/__tests__/lib/admin/dashboard.test.ts` | New: 8 tests |
| `frontend/src/__tests__/app/AdminDashboardPage.test.tsx` | New: 6 tests |

## Tests

- Frontend: 31 suites, 229 passed, 5 skipped
- `npm run lint` → 0 warnings; `tsc --noEmit` clean
- Backend: no change

## Before / After

| Surface | Before | After |
|---|---|---|
| Top of dashboard | Welcome text | Needs-attention strip / "All clear" |
| Sections covered | Projects, Articles | Projects, Articles, Payments, Users, Pins, EMOM |
| Stats | All-time counts + your own role | Fixed windows: this month, last 7 days |
| A failing query | n/a | That tile shows an error with Retry; the rest keep working |

## TL;DR Changelog

The admin dashboard now answers "what needs me?" first, then gives one tile per section with a real stat and a shortcut, built from existing queries only.

```
feat(admin): dashboard redesign — needs-attention strip + launch tiles (closes #319)
```

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.22.0...v3.22.1
