# v3.14.3 — Hero Rotation Progress Bar

## What's New

- **Rotation-timer cue on the hero.** A slim emerald bar under the lens pill now fills left→right
  over each ~2.95s rotation interval and resets on every clause swap — so the rotating headline reads
  as intentional and signals when the next change is coming.
- **Respects reduced motion.** The bar only appears while the timer is actually running; under
  `prefers-reduced-motion` (and during SSR) it's absent and nothing animates.

## Files Changed

| Action | File |
|--------|------|
| Modified | `frontend/src/lib/hooks/useRotatingText.ts` |
| Modified | `frontend/src/components/sections/HeroHeadline.tsx` |
| Modified | `frontend/src/app/globals.css` |

## Tests

- `npx jest src/__tests__/app/Home.test.tsx` → ✅ 9 passed
- `npm run build` → ✅ compiled successfully (33/33 pages)

## Before / After

| | Before | After |
|---|--------|-------|
| Hero rotation | Clause swaps with no timing cue | Progress bar fills to the next swap |
| Reduced motion | (no rotation) | (no rotation, no bar) |

## TL;DR Changelog

- `feat(home)`: add a rotation-timer progress bar under the hero lens pill (GPU-cheap CSS keyframe,
  reduced-motion safe, zero layout shift).
