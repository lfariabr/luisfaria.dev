# v3.30.1 — EMOM: a live view you can read mid-set

**Release date:** 2026-10-24
**Type:** Feature (frontend). Issue #422.

## What's New

- **A sticky session bar.** Block, minute and session clock (`B1/4 · M12/50 · 0:11:40`) stay pinned under the admin header, with Pause and End as 44px icon buttons. End still asks for a second tap. A green dot means the session is saved in the browser. A grey dot (labelled "Screen stays on" on wider screens) means the wake lock is really held.
- **Fullscreen only where it works.** iPhone Safari can't make page elements fullscreen, so the button is hidden there. A focus mode is tracked in #424.
- **A tighter timer card on phones.** The digits scale with the screen (`min(28vw,9rem)`), the card loses its fixed 360px height, and timer, reps and pace should fit on one iPhone screen. Desktop keeps the big clock.
- **A subtitle that says what's next.** `Next: 5 reps · Block 2 in 31:40`, or `Last minute` at the end. "Ends ~" moves under the reps card.
- **Phase colours you can catch from the corner of your eye.** The progress bar is your signal colour while working, amber in the last 3 seconds and blue during a service stop.
- **A readable minute grid.** Rows of 10 instead of 25, so each cell is about 30px wide on a phone.
- **Screen reader announcements for phase changes only.** Block N, Service stop and Extra time are announced, plus "Done" at the end, instead of a running clock. The pace buttons are now "Decrease pace" / "Increase pace".
- **Sticky works across admin pages.** `<main>` used `overflow-auto`, which quietly broke `position: sticky` inside it. It now uses `overflow-x-clip`.

## Files Changed

| Area | Files |
|------|-------|
| Layout | `frontend/src/app/admin/AdminLayoutClient.tsx` |
| Session | `frontend/src/lib/emom/useEmomSession.ts` (wake lock `held` → `awake`) |
| Views | `EmomRun.tsx`, `EmomTracker.tsx`, `EmomDone.tsx` in `frontend/src/components/emom/` |
| Tests | `EmomTracker.test.tsx` (+4) |

## Tests

- The bar shows `B/M/clock` and the saved dot, Pause toggles to Resume, and Fullscreen is hidden unless `fullscreenEnabled`.
- "Screen stays on" appears once the wake lock resolves.
- The subtitle reads `Next: 5 reps · Service stop in …` mid-block, drops "Next" in a block's last minute, and reads `Last minute` at the end. The announcer goes from empty → Block 1 → Service stop → Block 2. The grid uses 10 columns.
- Frontend: 358 passed. Typecheck and lint pass.
- **Needs an iPhone check after deploy:**
  - [ ] The bar stays pinned under the admin header while scrolling
  - [ ] Timer, reps and pace visible without scrolling during a work block
  - [ ] Screen-on dot shows, and no Fullscreen button

## Before / After

| | Before | After |
|---|---|---|
| Header on scroll | Scrolls away | Pinned 56px bar |
| Timer card on a phone | ~360px, reps and pace below the fold | Sized to its content |
| Subtitle | Block countdown only | What's next, plus the block countdown |
| Minute grid | 25 per row, ~10px cells | 10 per row, ~30px cells |
| Fullscreen on iPhone | Button that did nothing | Hidden |

## TL;DR Changelog

- fix(admin): main clips overflow so sticky children work (refs #422)
- feat(emom): sticky session bar, tighter timer card and phase colours (closes #422)
