# v3.14.2 — Fix Hero Clause Gap

## What's New

- **Removed the odd vertical gap** in the rotating hero headline (desktop + mobile). The four
  rotating clauses were uneven lengths; the two long ones wrapped to a second line, so the headline
  permanently reserved that height and left dead space below the shorter frames.
- **Fix:** normalized the clause copy so every frame wraps to the same number of lines at each
  breakpoint (1 line desktop, 2 lines mobile). Reserved height now matches the visible frame → gap
  gone, zero layout shift preserved.

## Files Changed

| Action | File |
|--------|------|
| Modified | `frontend/src/content/profile.ts` |

## Tests

- `npx jest src/__tests__/app/Home.test.tsx` → ✅ 9 passed
- `npm run build` → ✅ compiled successfully

## Before / After

| Clause | Before | After |
|--------|--------|-------|
| ML Engineer | with ML that ships to production. | with production-grade ML. |
| Data Engineer | from raw data to real decisions. | from raw data to decisions. |
| Full-Stack | end-to-end, frontend to infra. | _unchanged_ |
| Hybrid | that pay for themselves. | _unchanged_ |

| | Before | After |
|---|--------|-------|
| Hero | Dead gap below clause on short frames | Clause sits flush above subtext |

## TL;DR Changelog

- `fix(home)`: normalize rotating clause lengths to remove the dead vertical gap in the hero headline.
