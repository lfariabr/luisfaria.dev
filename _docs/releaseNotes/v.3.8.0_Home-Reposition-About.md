# v3.8.0 — Home Reposition + About

**Release date:** 2026-06-29
**Type:** Feature
**Closes:** [#237](https://github.com/lfariabr/luisfaria.dev/issues/237)

---

## What shipped

- Repositioned the home page around a problem/outcome-led message: **"I solve real business problems with software and data."**
- Reframed the identity from "Senior Software Engineer" into **four equal pillars**: Software · Data · Automation · AI/ML.
- Added a new **/about** page with a narrative bio, a "Currently" card, the pillars, the stack, and social links.
- Fixed the broken `/profile` link in the header dropdown (was a 404).
- Centralized curated content in `frontend/src/content/profile.ts`.

---

## Frontend

- New hero: badge `Engineer · Data · Automation · AI`, the new headline + subline, and a proof strip (Healthcare ERP/CRM · 30K+ msgs automated · 1M+ records · SQL Server pipelines & BI).
- New reusable `PillarsSection` ("What I do") and `StackSection` (core stack grouped by pillar) — replacing the flat 18-item pill list.
- New `/about` page framing the Master's as *applied* (AWS cloud architecture, self-hosted Apache Superset BI, OpenAI tooling) and the St Catherine's data work at a capabilities + tools level.
- Nav updated to `Home · Work · Projects · Articles · About`; Chatbot demoted to a hero CTA + footer link.
- JSON-LD `jobTitle` → `Software & Data Engineer`; `/about` added to the sitemap.
- Removed the orphaned `utils/data.tsx`.

---

## Before / After

| | Before | After |
|---|--------|-------|
| Headline | "I build end-to-end systems that turn manual workflows into scalable products." | "I solve real business problems with software and data." |
| Identity | "Senior Software Engineer · Master's SWE & AI" | "Engineer · Data · Automation · AI" + 4 pillars |
| Stack | Flat list of 18 pills | Grouped by pillar (Software / Data / Automation & DevOps / AI/ML) |
| About | No dedicated page | `/about` with bio, pillars, stack, links |
| `/profile` link | 404 | Removed (dead item) |

---

## Validation

- `cd frontend && npx jest` → 149 passed / 5 skipped (23 suites)
- `cd frontend && npx tsc --noEmit` → no errors
- `cd frontend && npm run build` → clean; `/about` prerendered as static

---

## Follow-up (slice 2)

- Timeline as its own first-class page.
- `/work` repurposed into Case Studies (St Catherine's data systems + Master's projects).
- Contact page/section.
- Copy review pass on the About bio and pillar blurbs.

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.7.0...v3.8.0
