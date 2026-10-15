# v3.26.0 — Places: no Support FAB on the map

**Release date:** 2026-10-16
**Type:** Fix (frontend). First release in epic #368 (Places on mobile).

## What's New

- **No coffee button on `/places`.** The Support FAB covered the map's zoom controls and the last timeline item on a phone. It is now hidden on `/places` and anything under it, as it already was on `/notes`.
- **One list of hidden paths.** `StripeFab.tsx` keeps `HIDDEN_ON = ['/notes', '/places']` instead of an inline condition per route. Matching is exact or by path segment, so `/placesforever` would still show the button.

## Files Changed

| Area | Files |
|------|-------|
| FAB | `frontend/src/components/stripe/StripeFab.tsx` |
| Tests | `frontend/src/__tests__/components/Stripe.test.tsx` |
| Glossary | `CONTEXT.md` (Support FAB is hidden on the private pages) |
| Docs | `_docs/featureBreakdown/v3.26-places-mobile.md` (epic breakdown) |

## Tests

- `Stripe.test.tsx`: hidden on `/notes`, `/notes/…`, `/places`, `/places/…`; shown on a lookalike path. The `/places` cases failed before the change.

## Before / After

| Route | Before | After |
|---|---|---|
| `/places` (phone) | Coffee button over the map controls | No button |
| `/notes` | Hidden | Hidden |
| Public pages | Shown | Shown |

## TL;DR Changelog

- fix(places): hide Support FAB on /places (closes #374)
