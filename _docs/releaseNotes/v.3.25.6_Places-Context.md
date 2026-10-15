# v3.25.6 — Places: glossary terms

**Release date:** 2026-10-16
**Type:** Docs. Last release in epic #350 (Places).

## What's New

- **`### Places` in `CONTEXT.md`.** Four terms, each with `_Lives in_` paths and words to avoid:
  - **Pin**: one visit on a date, with an optional positive spend in AUD and an optional Google `placeId`.
  - **Place**: every Pin at one spot, drawn as one marker. Worked out on the page from `placeId` or coordinates, not stored.
  - **Places map**: the private `/places` page. ADMIN and PARTNER add and edit; only ADMIN deletes.
  - **Importer**: `seed-pins.ts`, CSV in, upsert on place name + date + amount, `--preview` to check geocoding first.
- **Place** was not in the issue. It names the grouping shipped in v3.25.3, which the page shows as "N places · M visits".

## Files Changed

| Area | Files |
|------|-------|
| Glossary | `CONTEXT.md` |
| Docs | `_docs/featureBreakdown/v3.25-places.md` (criterion ticked) |

## Tests

- Every `_Lives in_` path in `CONTEXT.md` resolves to an existing file or folder (checked with a shell loop).
- CLAUDE.md "Domain docs" pointer (single `CONTEXT.md` at the repo root) is unchanged and still accurate.

## Before / After

| | Before | After |
|---|---|---|
| Pins in the glossary | Absent | Pin, Place, Places map, Importer |
| Name for a stacked marker | "stack", "group", "place" used loosely | **Place** |

## TL;DR Changelog

- docs(context): add Pin, Place, Places map and Importer terms (closes #355, closes #350)
