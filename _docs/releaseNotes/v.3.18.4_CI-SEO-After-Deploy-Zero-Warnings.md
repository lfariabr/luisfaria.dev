# v3.18.4 — SEO Gate After Deploy + Zero Lint Warnings

**Release date:** 2026-10-05
**Type:** CI + code quality (no user-facing change)

## What's New

- **SEO audit runs after the deploy**, so it checks the build that just went live instead of racing the container restart and reporting false `fetch failed` errors.
- **Frontend lint is warning-free and stays that way**: 67 → 0 warnings, and `--max-warnings 0` makes any new warning fail CI.
- **Hook dependencies corrected** in the chatbot, APOD, Goggins and article form without changing behaviour; ArticleForm's auto-slug now uses `useWatch`.
- **Server pages log through `logger`** instead of `console.error`.

## Files Changed

| Area | Files |
|------|-------|
| CI / config | `.github/workflows/ci.yml`, `eslint.config.mjs`, `package.json` |
| Hooks | `chatbot/page.tsx`, `ApodDialog.tsx`, `GogginsDialog.tsx`, `ArticleForm.tsx` |
| Logging | `articles/page.tsx`, `projects/page.tsx` |
| Dead code | 14 files (unused imports, variables, catch bindings) |
| `<img>` | `ProjectContent.tsx`, `MarkdownMessage.tsx` (justified disables) |

## Tests

- `npm run lint` → ✅ 0 errors, 0 warnings
- `npx tsc --noEmit` → ✅
- `npx jest` (frontend) → ✅ 24 suites, 179 passed, 5 skipped
- `npm run build` → ✅

## Before / After

| Surface | Before | After |
|---|---|---|
| SEO gate timing | Parallel with deploy; false red runs | After deploy + health checks |
| Lint warnings | 67, not enforced | 0, enforced (`--max-warnings 0`) |
| Server page errors | `console.error` | `logger.error` |

## TL;DR Changelog

```
chore(ci): run SEO gate after deploy; zero frontend lint warnings (closes #303)
```
