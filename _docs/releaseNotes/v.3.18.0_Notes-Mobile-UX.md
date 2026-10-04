# v3.18.0 — My Notes Mobile UX

**Release date:** 2026-10-05
**Type:** UX improvement (private area)

## What's New

- **No more zoom bounce on iOS** — `Textarea` and `Select` now use 16px text on mobile, so focusing a field no longer zooms the page in and back out.
- **Compact "At a glance"** — the tall stats card is now a single 4-up strip on mobile (2×2 on desktop).
- **Press Enter for a new item** — accomplishments and plans are one item per line; commas inside a line are kept. Single-line comma input still works.
- **Pasted bullet lists just work** — leading `- ` / `• ` markers are stripped.
- **Month/year accordion** — the timeline groups notes by month; the latest month is open, older ones collapse. Searching expands everything.
- **Tighter mobile hero** — smaller title, padding and badge; redundant controls hidden below `sm`.
- **Bullet dots fixed** — no longer squash into thin bars on wrapped lines.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/ui/textarea.tsx` | `text-base md:text-sm` |
| `frontend/src/components/ui/select.tsx` | `text-base md:text-sm` on trigger |
| `frontend/src/app/notes/page.tsx` | Compact stat strip, mobile spacing, expand-all on search |
| `frontend/src/components/notes/NoteForm.tsx` | `parseListInput`, line-based prefill |
| `frontend/src/components/notes/NotesTimelineView.tsx` | Month accordion, `groupNotesByMonth` |
| `frontend/src/components/notes/NoteCard.tsx` | Bullet `shrink-0` |
| `frontend/src/__tests__/components/NoteForm.test.tsx` | Parsing + prefill tests |
| `frontend/src/__tests__/components/notes/NotesTimelineView.test.tsx` | New accordion tests |

## Tests

- `npx tsc --noEmit` → ✅
- `npx jest` (frontend) → ✅ 24 suites, 171 passed, 5 skipped

## Review Follow-up

PR review found a data-loss path: editing a note whose single item contained commas split that item into several on save. Fixed by enabling the comma fallback only when creating a note; edit forms always parse one item per line. A round-trip regression test covers it.

## Before / After

| Surface | Before | After |
|---|---|---|
| Focusing a textarea on iOS | Page zooms in, then bounces back | No zoom |
| At a glance (mobile) | Card + four tall tiles, labels overflowing | One compact row of four stats |
| List entry | Comma-separated only; commas in sentences split items | One per line; commas preserved; comma fallback |
| Timeline | Every note expanded in one long grid | Grouped by month, older months collapsed |
| Bullets on wrapped lines | Squashed into thin bars | Round dots aligned to first line |

## TL;DR Changelog

```
feat(notes): mobile UX — iOS zoom fix, compact stats, line-based input, month accordion (closes #293)
```
