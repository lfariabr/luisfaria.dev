# v3.18.3 — Frontend ESLint: Native Flat Config + CI Gate

**Release date:** 2026-10-05
**Type:** Tooling + code quality (no user-facing feature)

## What's New

- **Lint works again** — native `eslint-config-next` 16 flat config replaces the crashing `FlatCompat` wrapper; `npm run lint` is now `eslint .`.
- **Lint gates CI** — `|| true` removed; a lint error now fails the Frontend Tests job.
- **44 → 0 errors** — escaped entities, real types instead of `any`, and React hooks refactors.
- **Latent bug fixed** — editing a note no longer loses unsaved input if the notes list refetches while the dialog is open.
- **Reduced-motion is live** — the rotating hero text now responds immediately if the OS motion preference changes.

## Files Changed

| Area | Files |
|------|-------|
| Config / CI | `eslint.config.mjs`, `package.json`, `jest.setup.js`, `.github/workflows/ci.yml` |
| Hooks refactors | `NoteForm.tsx`, `notes/page.tsx`, `useRotatingText.ts`, `useIsClient.ts` (new), `ProjectForm.tsx`, `login/page.tsx`, `ApodDialog.tsx`, `chatbot/page.tsx` |
| Typing | `AuthContext.tsx`, `GogginsDialog.tsx`, `MarkdownMessage.tsx`, `analytics.ts`, `textarea.tsx`, `article.types.ts`, `project.types.ts` |
| Entities | `admin/page.tsx`, `admin/projects/[id]/edit/page.tsx`, `test-sentry/page.tsx`, `InfoRail.tsx` |
| Tests | `Apod.test.tsx`, `analytics.test.ts`, `useStripeCheckout.test.tsx` |

## Tests

- `npm run lint` → ✅ 0 errors, 68 warnings
- `npx tsc --noEmit` → ✅
- `npx jest` (frontend) → ✅ 24 suites, 175 passed, 5 skipped
- `npm run build` → ✅

## Before / After

| Surface | Before | After |
|---|---|---|
| `npm run lint` | Crashes (`Converting circular structure to JSON`) | Runs: 0 errors, 68 warnings |
| CI lint step | Always passes (`\|\| true`) | Fails the job on any error |
| Lint errors | 44 (hidden) | 0 |
| Note edit during refetch | Unsaved input wiped | Input preserved |

## TL;DR Changelog

```
chore(frontend): native ESLint flat config, fix 44 errors, gate CI on lint (closes #299)
```
