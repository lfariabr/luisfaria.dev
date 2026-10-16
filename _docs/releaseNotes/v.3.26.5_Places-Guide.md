# v3.26.5 — Places: run your own

**Release date:** 2026-10-16
**Type:** Docs. Last release in epic #368 (Places on mobile).

## What's New

- **[`_docs/guides/run-your-own-places-map.md`](../guides/run-your-own-places-map.md)**, a step-by-step guide from spreadsheet to map:
  1. Google Cloud: billing, three APIs, two keys and how to restrict each, Map ID, budget and quotas
  2. ADMIN and PARTNER accounts
  3. CSV template
  4. `--dry-run`, then `--preview` (with what ok, CHECK, FAIL and MANUAL mean), then import
  5. Using it from a phone
  6. The CSP hosts, including the `places.googleapis.com` trap and its `xhr error, error code 6` symptom
  7. What to change to move it out of Sydney
  - A "where things live" table
- **README:**
  - The v3.6 "Relationship Pins" setup (admin-only, `/admin/relationship`) is replaced by a short **Places** setup that links to the guide.
  - The Private tools row is now **Places**.
  - The design-decisions line no longer says the partner is read-only.
  - The env table now says what each Google key is for.
  - The Documentation Map lists `_docs/guides/`.
- **All examples use fictional data:** Corner Cafe and Harbour Bistro, `you@example.com`.
- **Not done:** the optional part of #373, moving the map centre, currency and locale into env vars. The guide lists the three places to edit instead.

## Files Changed

| Area | Files |
|------|-------|
| Guide | `_docs/guides/run-your-own-places-map.md` (new) |
| README | `README.md` |
| Docs | `_docs/featureBreakdown/v3.26-places-mobile.md` (criterion ticked) |

## Tests

- Every repo path in the guide resolves.
- Facts checked against the code:
  - roles and the Shield rules: `pins` and `relationshipHomeLocation` are `isAdminOrPartner`, `deletePin` is `isAdmin`
  - the `User` model maps to the `users` collection
  - the importer's upsert key
  - the gitignore patterns
  - the production CSP
- No `/admin/relationship` left in the README or the guide.

## Before / After

| | Before | After |
|---|---|---|
| README Places setup | v3.6, admin-only, old route | v3.26, both roles, links to the guide |
| How to import a sheet | Header comment in `seed-pins.ts` | Guide section with the preview statuses |
| CSP trap | Undocumented | Named, with its symptom |

## TL;DR Changelog

- docs(places): README and run-your-own guide (closes #373, closes #368)
