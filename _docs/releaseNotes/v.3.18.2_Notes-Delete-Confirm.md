# v3.18.2 — Confirm Before Deleting a Note

**Release date:** 2026-10-05
**Type:** UX safety fix (private area)

## What's New

- **Delete asks first** — tapping Delete on a note opens a dialog naming the note, with Cancel and Delete note. One mis-tap on mobile no longer removes a note.
- **Failure stays visible** — if the delete fails, the dialog stays open and an error toast appears, so you can retry.
- **No accidental dismiss mid-delete** — buttons disable and show `Deleting...` while the request is in flight.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/app/notes/page.tsx` | Confirmation dialog, `pendingDelete` state, `confirmDelete` |
| `frontend/src/__tests__/app/NotesPage.test.tsx` | Confirm, cancel and failure tests |

## Tests

- `npx tsc --noEmit` → ✅
- `npx jest` (frontend) → ✅ 24 suites, 177 passed, 5 skipped

## Before / After

| Surface | Before | After |
|---|---|---|
| Tap Delete | Note deleted immediately | Confirmation dialog naming the note |
| Delete fails | Silent (warning in logs) | Dialog stays open + error toast |

## TL;DR Changelog

```
feat(notes): confirm before deleting a note (closes #297)
```
