# v3.24.0 — EMOM: Sticky Pace

**Release date:** 2026-10-13
**Type:** Feature (frontend only, admin tool)

## What's New

- **Pace sticks.** −/+ on the run screen now changes reps per minute from the current minute until the next change, across blocks, including blocks the preset tapers.
- **Set the next block during the stop.** −/+ is live during the count-in and service stops and applies to the next block's first minute.
- **Floor 1, cap 30.** Same limits as setup.
- **Plan stays the plan.** The done-vs-plan delta still measures against the configured rates; the panel shows pace and plan together.
- **Graded minute grid.** Minutes paced below plan get lighter tints of the signal colour (up to three steps); amber now means skipped only.
- **Honest summary and log line.** Per-block Pace reads `5 → 3/min` when paced down; the War Room line logs `5→3/min`.
- **Resume keeps the pace.** The live snapshot carries pace changes; older snapshots load unchanged.

## Files Changed

| Area | Files |
|------|-------|
| Plan math | `lib/emom/plan.ts` |
| Engine / storage | `lib/emom/useEmomSession.ts`, `lib/emom/storage.ts` |
| UI | `components/emom/EmomRun.tsx`, `EmomSummary.tsx`, `EmomTracker.tsx`, `signal.ts` |
| Tests | `__tests__/lib/emom/plan.test.ts` (+4), `__tests__/components/emom/EmomTracker.test.tsx` (+1, resume updated) |
| Docs | `_docs/featureBreakdown/v3.24.0-emom-sticky-pace.md` |

## Tests

- `cd frontend && npx jest` → ✅ 30 suites, 234 passed, 5 skipped (pre-existing)
- `npx tsc --noEmit`, `npm run lint --max-warnings 0` → ✅

## Before / After

| Surface | Before | After |
|---|---|---|
| −/+ scope | This minute only | From this minute until the next change |
| −/+ during a service stop | Disabled | Sets the next block's pace |
| Lower bound | 0 for a minute | 1/min |
| Minute below plan in the grid | Amber ("short") | Lighter signal tint per rep under; amber only when skipped |
| Summary Pace column | Configured rate | `5 → 3/min` |
| War Room pace string | From configured rates | From paces run |
| Live snapshot | `cfg, phases, vt, adj, startedAt` | + `paces` (optional) |

## TL;DR Changelog

- feat(emom): sticky mid-session pace with `PaceChange` list, `paceAt`, `setPace`
- feat(emom): pace control during count-in and stops
- feat(emom): graded minute tints, `formatPace`, log line from paces run
- test(emom): 5 new tests
- closes #343
