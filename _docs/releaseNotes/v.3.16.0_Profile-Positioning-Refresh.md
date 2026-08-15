# v3.16.0 — Profile Positioning Refresh

**Release date:** 2026-08-16
**Type:** Content + navigation refresh

## What's New

- **Homepage positioning tightened** around the current work surface: secure education systems, SQL/Power BI data work, applied ML, and agentic AI delivery.
- **Canonical hero H1 aligned with the new positioning** — `HERO_CANONICAL_PHRASE` now uses `POSITIONING.headline` as the single source of truth.
- **Visible hero anchor updated** from `I build systems` to `I build data systems`, keeping the visual headline closer to the SEO/accessibility phrase.
- **Header navigation simplified** from `Home / Work / Projects / Articles / About` to `Home / Work / Writing / About`.
- **Dev.to promoted** through the new `Writing` header link, while `/projects` and `/articles` remain available as secondary/archive routes.
- **Proof metrics refreshed**:
  - ReviewPulse: `171` → `200+` commits.
  - Agentic study pipeline: `1,100+` → `1,400+` commits.
- **Impact section diversified** — `Reliability & security` became `Reliability & delivery`, and CI/CD deployment evidence now links to the automated deploy pipeline write-up instead of repeating the parent-portal article.
- **Profile data synchronized** across homepage content, About page, case study copy, backend profile data, and homepage tests.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/content/profile.ts` | Positioning, hero frames, hero metrics, pillars, stack groups, and Agentic AI proof-card link |
| `frontend/src/components/sections/HeroHeadline.tsx` | Visible hero anchor aligned to `I build data systems` |
| `frontend/src/components/sections/CurrentProofSection.tsx` | Replaced the self-conscious “work I want judged on” phrase |
| `frontend/src/content/metrics.ts` | Impact group renamed to `Reliability & delivery`; CI/CD pipeline evidence added |
| `frontend/src/components/layouts/Header.tsx` | Primary nav now promotes external Dev.to `Writing` link |
| `frontend/src/app/about/page.tsx` | Master’s repo commit count updated to `1,400+` |
| `frontend/src/content/caseStudies.ts` | ReviewPulse public commit count updated to `200+` |
| `backend/src/data/luis-profile.json` | Backend/chat profile context synchronized with new counts |
| `frontend/src/__tests__/app/Home.test.tsx` | Assertions updated for new homepage copy/nav |

## Tests

- `git diff --check` → ✅
- `npm test -- --runInBand src/__tests__/app/Home.test.tsx` → ✅ 9 passed
- `npx tsc --noEmit` → ✅
- `npm run build` → ✅ exited 0
- PR #274 checks → ✅ Backend Tests, Frontend Tests, Build Verification, GitGuardian

## Review Follow-up

PR review found one source-of-truth drift: `POSITIONING.headline` was updated, but the accessible/SEO H1 still used the old `HERO_CANONICAL_PHRASE`.

Fixed in follow-up commit `d34ef17`:

- `HERO_CANONICAL_PHRASE = POSITIONING.headline`
- homepage test updated to assert the new canonical phrase
- visible hero anchor aligned to `I build data systems`

## Before / After

| Surface | Before | After |
|---|---|---|
| Header nav | Home / Work / Projects / Articles / About | Home / Work / Writing / About |
| Writing path | Internal `/articles` was primary | Dev.to profile promoted as primary writing surface |
| Current proof subtitle | “The work I want judged on now…” | Concrete proof across secure education systems, SQL/Power BI, applied ML, and agentic AI |
| Impact links | Multiple reliability items reused the parent-portal article | Parent-portal evidence plus CI/CD deploy-pipeline evidence |
| Hero H1 source | `POSITIONING.headline` and `HERO_CANONICAL_PHRASE` could drift | Canonical phrase reads from `POSITIONING.headline` |

## TL;DR Changelog

Homepage positioning now reflects the current public story: secure school data systems, SQL/Power BI delivery, applied ML with evidence, and public agentic AI workflows. Dev.to is promoted in the primary nav, stale proof counts are updated, CI/CD gets its own Impact receipt, and the hero H1 now has one source of truth.

**Full Changelog:** https://github.com/lfariabr/luisfaria.dev/compare/v3.15.0...v3.16.0
