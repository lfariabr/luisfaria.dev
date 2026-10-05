# v3.19.0 — Admin EMOM Tracker

**Release date:** 2026-10-06
**Type:** New feature (admin area)

## What's New

- **`/admin/emom`** — an EMOM timer for long pull-up sessions, admin only, linked from the admin sidebar.
- **Presets from the Beast build** — Beast prep (750), Half-Beast (1,000), The Beast · 8h (2,000), Weekday grease.
- **Reps per minute for each block** — set them all at once, then slow down the late blocks.
- **Finish line** — end with the plan, or keep adding minutes at the last pace until you reach the goal.
- **Go signal you can read from the bar** — the whole screen holds green or red for the first seconds of each minute (or the clock panel blinks), with 3-2-1 beeps.
- **Log short minutes** — −/+ (or ↑/↓) per minute; the minute grid and "vs plan" show the drift.
- **Service stops** — countdown plus a checklist: eat, wash hands, re-chalk, skin and elbows.
- **Never lose a session** — saved to the browser every minute; a reload or closed tab offers to resume, paused.
- **Summary** — totals, per-block table, notes, and a War Room log line to copy.
- **Training log** — month total against 2,000 and recent sessions, stored in this browser.
- Follows the site's light and dark themes.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/lib/emom/plan.ts` | Plan math, presets, log line |
| `frontend/src/lib/emom/storage.ts` | localStorage config, log, live snapshot |
| `frontend/src/lib/emom/useEmomSession.ts` | Session clock, cues, wake lock |
| `frontend/src/components/emom/*` | Setup, run, summary, training log, session map |
| `frontend/src/app/admin/emom/page.tsx` | New route |
| `frontend/src/app/admin/AdminLayoutClient.tsx` | Sidebar link |
| `frontend/src/__tests__/lib/emom/plan.test.ts` | Plan tests |
| `frontend/src/__tests__/components/emom/EmomTracker.test.tsx` | Flow tests |

## Tests

- `npx tsc --noEmit` → ✅
- `npm run lint` → ✅ 0 warnings
- `npx jest` (frontend) → ✅ 26 suites, 192 passed, 5 skipped (13 new)

## Review Follow-up

PR review found that skipping a work block credited every minute left in it, so one skip could add ~240 pull-ups to the summary and the month total, and stop reach-goal mode from adding time. Skipping now counts unstarted minutes as 0 reps (shown amber), and reach-goal mode adds the time back. A regression test covers it.

## Before / After

| Surface | Before | After |
|---|---|---|
| Timing a long-pull | Generic stopwatch next to the bar | Plan-aware EMOM clock with blocks and stops |
| Start of each minute | Read the digits | Full-screen go signal + beeps |
| Slower late blocks | Mental maths | Per-block pace; time added to still reach 2,000 |
| Short minutes | Remembered (or not) | −/+ per minute, "vs plan" and minute grid |
| Closed tab mid-session | Session lost | Resume, paused |
| War Room entry | Written from memory | Copy the generated log line |

## TL;DR Changelog

```
feat(admin): EMOM tracker for long pull-up sessions at /admin/emom (closes #307)
```
