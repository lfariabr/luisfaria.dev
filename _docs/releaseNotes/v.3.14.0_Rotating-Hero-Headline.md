# v3.14.0 — Rotating Hero Headline

## What's New

- **Rotating hero headline.** A stable white anchor ("I build systems") with a green clause + lens pill that crossfade through four framings and loop:
  - `ML Engineer` → "with ML that ships to production."
  - `Data Engineer` → "from raw data to real decisions."
  - `Full-Stack Engineer` → "end-to-end, frontend to infra."
  - `Hybrid` → "that pay for themselves." *(canonical — first paint)*
- **SEO/a11y preserved.** The `<h1>` is a static, server-rendered canonical phrase ("I build systems that pay for themselves."); the rotating layer is decorative (`aria-hidden`, no `aria-live`).
- **Reduced-motion aware.** With `prefers-reduced-motion: reduce`, the canonical frame renders and never animates.
- **No layout shift.** Frames are grid-stacked in one cell, so the hero never jumps as clause length changes.
- **New subtext** — value-led: data pipelines, internal tools, ML → automated, KPI-driven systems.
- **4-card metrics row** replaces the old proof strip: `~4h saved` (emerald accent), `30K+`, `5 models`, `$12/mo`.
- **CTA emphasis** — "Try my AI assistant" now has visual priority (2px emerald ring + emerald text + subtle tint) as the live ML demo.

## Files Changed

| Action | File |
|--------|------|
| Created | `frontend/src/lib/hooks/useRotatingText.ts` |
| Created | `frontend/src/components/sections/HeroHeadline.tsx` |
| Modified | `frontend/src/content/profile.ts` |
| Modified | `frontend/src/app/page.tsx` |
| Modified | `frontend/src/__tests__/app/Home.test.tsx` |

## Tests

- `npx jest src/__tests__/app/Home.test.tsx` → ✅ 9 passed (canonical h1, lens pill frames, new subline, CTAs, sections, nav).
- `npm run build` → ✅ compiled successfully, type-check clean.

## Before / After

| | Before | After |
|---|--------|-------|
| Headline | Static "I solve real business problems / with software and data." | Anchor + crossfading clause across 4 lenses; canonical "that pay for themselves." |
| Pill | Static "Engineer · Data · Automation · AI" | Rotating lens label, in sync with the clause |
| Proof | Inline text strip | 4 metric cards (one emerald-accented) |
| AI CTA | Ghost button (low contrast) | Emerald ring + tint, pulls the eye |
| Motion | n/a | Crossfade ~350ms / dwell ~2600ms; respects reduced-motion |

## TL;DR Changelog

- `feat(home)`: rotating hero headline (ML / Data / Full-Stack / Hybrid) with static canonical `<h1>`, reduced-motion support, no layout shift.
- `feat(home)`: new value-led subtext + 4-card metrics row; AI-assistant CTA gets visual priority.
- `chore`: tiny `useRotatingText` hook (no new dependency).
