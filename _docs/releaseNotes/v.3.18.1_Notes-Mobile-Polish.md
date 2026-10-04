# v3.18.1 — My Notes Mobile Polish

**Release date:** 2026-10-05
**Type:** Bug fix (private area)

## What's New

- **Readable stats** — "At a glance" labels are now `Notes · Wins · Weekly · Plans`, so nothing truncates on a phone.
- **One-tap dated titles** — the title field suggests `Weekly update 05/10/2026` (from the checkpoint date, today by default). Tap **Autofill** to accept it, or leave the title empty and it's used on save.
- **Week/Month view fixed on mobile** — long items no longer push the page wider than the screen; they end in `…` instead.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/app/notes/page.tsx` | Short stat labels |
| `frontend/src/components/notes/NoteForm.tsx` | `buildSuggestedTitle`, Autofill button, dated default title |
| `frontend/src/components/notes/NotesPeriodView.tsx` | Grid `min-width` fix, truncating badges, mobile padding |
| `frontend/src/__tests__/components/NoteForm.test.tsx` | Autofill + suggestion tests |

## Tests

- `npx tsc --noEmit` → ✅
- `npx jest` (frontend) → ✅ 24 suites, 175 passed, 5 skipped

## Before / After

| Surface | Before | After |
|---|---|---|
| At a glance labels | `CHECKP…`, `NEXT M…` | `NOTES`, `PLANS` — fully visible |
| Title suggestion | Ghost `Weekly update`, no way to accept | `Weekly update 05/10/2026` + Autofill button |
| Empty title on save | `Weekly update` | `Weekly update 05/10/2026` |
| Week/Month on mobile | Long badge widens the whole page | Page fits the screen; badge truncates with `…` |

## TL;DR Changelog

```
fix(notes): mobile polish — stat labels, dated title autofill, Week/Month overflow (closes #295)
```
