# v3.10.0 — Timeline + Contact

**Release date:** 2026-06-29
**Type:** Feature
**Closes:** [#241](https://github.com/lfariabr/luisfaria.dev/issues/241)

---

## What shipped

- Promoted the career timeline to a dedicated **/timeline** page (data curated in `content/timeline.ts`).
- Added a **/contact** page (email-first + socials + Master's repo + location).
- Added a 4th case study — **Review Pulse**, a multi-domain review-sentiment ML classifier — giving the AI/ML pillar a concrete artifact.
- Refreshed the README highlights for the software & data positioning.

---

## Frontend

- `TimelineSection` now reads from `content/timeline.ts` and supports `limit` / `showHeading` / `showViewAll`. The home page shows the 4 most recent entries + "View full timeline"; `/timeline` shows the full history.
- `/contact` reuses `SOCIALS`; footer nav gains Timeline + Contact.
- `/timeline`, `/contact`, and the Review Pulse case-study URL added to the sitemap.

---

## Before / After

| | Before | After |
|---|--------|-------|
| Timeline | Home section only | Home (condensed) + dedicated `/timeline` page |
| Contact | Footer only | `/contact` page (email-first + socials) |
| Case studies | 3 | 4 (adds Review Pulse — an ML classifier) |

---

## Validation

- `cd frontend && npx jest` → 149 passed / 5 skipped (23 suites)
- `cd frontend && npx tsc --noEmit` → no errors
- `cd frontend && npm run build` → `/timeline` + `/contact` static; 4 case studies prerendered

---

## Follow-up

- Curate the home "Impact at a glance" metrics (freshness + a current data-role metric).
- Optional contact form (backend Resend + Turnstile).
- Phase 3 — backend cleanup.

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.9.0...v3.10.0
