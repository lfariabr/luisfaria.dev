# v3.15.0 — Homepage Proof Points

**Release date:** 2026-07-13
**Type:** Feature (copy-only)

## What's New

- **Hero metrics rewritten** — the 4 stat blocks now read as proof points a stranger can decode:
  - `10+ yrs` — building software, data & AI systems end-to-end
  - `2,000 users` — pentested portal, shipped solo in 8 weeks *(emerald accent moved here)*
  - `30K+` — messages automated every month
  - `1M+` — client records managed in production
- **"What I do" pillars are evidence-first** — portal serving 2,000 parents; reverse-engineering legacy ETL estates; 100-minute batch job cut to ~2s and deploy downtime 10+ min → ~2s; applied ML with honest metrics + a 1,100+ commit open-source agentic pipeline. AI pillar tags trimmed 7 → 5.
- **Core stack trimmed ~30 → 22 pills** — signature tools only (Software: TypeScript, React, Next.js, Node.js, GraphQL, Python · Data: SQL Server, PostgreSQL, Power BI, Apache Superset, pandas, Redis · Automation unchanged · AI/ML: scikit-learn, OpenAI, Claude, RAG, Claude Code / agents).
- **Impact section rebuilt** around three groups, strongest numbers first: **Scale** (2,000 parents / 1M+ records across 20+ clinics / 30K+ WhatsApp msgs/mo), **Reliability & security** (0 cross-account leaks at 100-concurrent load / external OWASP pentest passed / 500+ automated tests behind CI gate), **Efficiency** (100 min → 2 s batch job / ~2 s deploy downtime / 11 → 0 manual query edits per finance cycle).
- **De-identified by design** — no school name, person names, or hostnames in any new string, matching the published dev.to case-study posture.
- Copy-only change: components untouched.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/content/profile.ts` | New `HERO_METRICS`; evidence-first `PILLARS` blurbs (AI tags 7 → 5); `STACK_GROUPS` trimmed ~30 → 22 pills |
| `frontend/src/content/metrics.ts` | `METRIC_GROUPS` rebuilt: Scale / Reliability & security / Efficiency |
| `frontend/src/__tests__/app/Home.test.tsx` | Stack-only pill assertion `'Express'` → `'pandas'` |

## Tests

- Frontend: 154/154 passing (`npx jest`, full suite; 1 test updated for the trimmed stack).
- Dev-server render check: new strings SSR on the homepage, old copy gone.

## Before / After

| Surface | Before | After |
|---|--------|-------|
| Hero metrics | Insider shorthand ("~4h saved / per term rollover · St Cath", "5 models / compared by MAE · CRISP-DM", "$12/mo / infra, production-grade") | Decodable 2026 proof points: 10+ yrs · 2,000 users · 30K+ msgs/mo · 1M+ records |
| Pillar blurbs | Generic capability claims | Concrete evidence per pillar (2,000-parent portal, legacy ETL estates, 100 min → 2 s, 1,100+ commit pipeline) |
| Core stack | ~30 pills, diluted signal | 22 signature tools |
| Impact stats | Led with weak stats | Strongest first: Scale → Reliability & security → Efficiency |

## TL;DR Changelog

Homepage proof surfaces rewritten for 2026: hero metrics, pillar blurbs, core stack, and impact stats now lead with decodable, evidence-first numbers (2,000-user pentested portal, 30K+ automated msgs/mo, 1M+ production records) instead of insider shorthand — copy-only, all components unchanged, de-identified per the case-study posture.

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.14.0...v3.15.0
