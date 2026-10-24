# v3.30.0 — EMOM: summary stats, FINISH label, completion moment

**Release date:** 2026-10-24
**Type:** Fix (frontend). Issue #421.

## What's New

- **The summary stats no longer collide.** Time, rate and VS GOAL sit in three equal cells that can shrink, sized to fit even at 320px. The time drops the zero hour (`50:10`, not `0:50:10`). VS GOAL reads On goal, +N in the signal colour, or −N in amber, always on one line.
- **The last minute says FINISH.** The final 3s of the session used to read NEXT MINUTE. Now they read FINISH and "Last minute · 0:02 left". When a goal will add extra time, the label stays NEXT MINUTE, because there is a next minute.
- **A DONE moment.** At 0:00 the card turns the signal colour, shows `Done ✓` and the reps and time for 1.5s, and plays a rising chime if sound is on. Tap it to skip. Ending early with End goes straight to the summary.
- **The summary opens at the top.** It scrolls up (instantly if reduced motion is set), and the headline takes focus so screen readers announce it.

## Files Changed

| Area | Files |
|------|-------|
| Plan | `frontend/src/lib/emom/plan.ts` (`isFinalMinute`) |
| Session | `frontend/src/lib/emom/useEmomSession.ts` (chime) |
| Views | `EmomRun.tsx`, `EmomTracker.tsx`, `EmomSummary.tsx`, new `EmomDone.tsx` in `frontend/src/components/emom/` |
| Tests | `plan.test.ts` (+1), `EmomTracker.test.tsx` (+3) |

## Tests

- `isFinalMinute`: true in the last minute, false a minute earlier, false before a goal extension, false at the end of a non-final block.
- A 2-minute session shows NEXT MINUTE at the end of minute 1, FINISH at the end of minute 2, then DONE (with no End button), then the summary with the heading focused and the page scrolled to the top.
- Tapping DONE skips to the summary. Ending early skips DONE.
- The stats row is a three-column grid of `min-w-0` cells, and VS GOAL is `whitespace-nowrap`.
- Frontend: 354 passed. Typecheck and lint pass.
- **Needs an iPhone check after deploy:**
  - [ ] Stats row on one line with nothing touching
  - [ ] FINISH in the last 3s, DONE holds, and the summary opens at the top

## Before / After

| | Before | After |
|---|---|---|
| Stats row on a phone | `0:50:10239`, "On goal" wrapped | Three separate values on one line |
| Last 3s of the session | NEXT MINUTE | FINISH · Last minute |
| At 0:00 | Summary at the old scroll position | 1.5s DONE card, then the summary at the top |

## TL;DR Changelog

- fix(emom): prevent summary stats overlap on narrow screens (refs #421)
- fix(emom): show FINISH instead of NEXT MINUTE in final minute (refs #421)
- feat(emom): completion state and scroll-to-top summary (closes #421)
