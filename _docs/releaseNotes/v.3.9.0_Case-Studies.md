# v3.9.0 — Case Studies

**Release date:** 2026-06-29
**Type:** Feature
**Closes:** [#239](https://github.com/lfariabr/luisfaria.dev/issues/239)

---

## What shipped

- Repurposed `/work` from a tabbed projects+articles list into a curated **Case Studies** section.
- Added detail pages (`/work/<slug>`) in a `problem → approach → stack → outcome` format.
- Three case studies: **St Catherine's data systems**, **AWS cloud architecture** (Master's), **Apache Superset BI** (Master's).
- Master's case studies link to the open-source `masters-swe-ai` repo (1,100+ commits).

---

## Frontend

- New curated content file `frontend/src/content/caseStudies.ts` (single source of truth).
- `/work` index renders static case-study cards; footer links to `/projects` and `/articles`.
- `/work/[slug]` detail pages are statically prerendered (`generateStaticParams`) with per-slug metadata and `Article` JSON-LD.
- `/work` metadata → "Case Studies"; case-study URLs added to the sitemap.
- Removed the orphaned `WorkTabsContent` and `ArticleCard` components.

---

## Before / After

| | Before | After |
|---|--------|-------|
| `/work` | Tabbed list of projects + articles (GraphQL) | Curated case studies (problem → approach → stack → outcome) |
| Detail | none | `/work/<slug>` per case study, statically generated |
| Projects/Writing | only at `/work` tabs | still at `/projects` and `/articles` (linked from `/work`) |

---

## Validation

- `cd frontend && npx jest` → 149 passed / 5 skipped (23 suites)
- `cd frontend && npx tsc --noEmit` → no errors
- `cd frontend && npm run build` → `/work` static; 3 case studies prerendered

---

## Follow-up (slice 2b)

- Timeline as its own first-class page; Contact page/section.
- Drop a concrete St Catherine's metric into the outcomes (placeholder left in `caseStudies.ts`).
- Optionally add more case studies (Konquista, CI/CD, cryptojacking post-mortem).

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.8.0...v3.9.0
