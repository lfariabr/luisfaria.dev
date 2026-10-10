# v3.22.2 — Backend Guardrails

**Release date:** 2026-10-11
**Type:** Developer tooling (no user-facing change)

## What's New

- **Backend ESLint + typecheck** with `npm run lint` and `npm run typecheck`; CI lints the backend before building. the total `any` warning count is capped at today's 123, so it cannot grow.
- **`npm test` starts Redis for you** when the `REDIS_URL` port is silent, via a throwaway `redis:alpine` container.
- **Pre-commit hook** in `.githooks/` runs typecheck + lint for the package you touched. One-time `git config core.hooksPath .githooks`.
- **Agent pointers refreshed**: `CLAUDE.md` lists every resolver domain, route, service and model; `CONTEXT.md` terms say where they live.
- **First retro** of a Matt Pocock-style epic saved under `_docs/retros/`.

## Files Changed

| Area | Files |
|------|-------|
| Lint | `backend/eslint.config.mjs`, `backend/package.json`, 12 source/test/script files |
| Tests | `backend/scripts/ensure-redis.sh` |
| Hooks / CI | `.githooks/pre-commit`, `.github/workflows/ci.yml` |
| Docs | `CLAUDE.md`, `CONTEXT.md`, `_docs/retros/2026-10-11-support-checkout-epic.md` |

## Tests

- `cd backend && npm run lint` → ✅ 0 errors, 123 warnings (cap 123)
- `cd backend && npm run typecheck` → ✅
- `cd backend && npm test` (no Redis running beforehand) → ✅ 20 suites, 298 passed
- `cd frontend && npx tsc --noEmit` → ✅

## Before / After

| Surface | Before | After |
|---|---|---|
| Backend lint | None | ESLint in CI + pre-commit, total `any` warnings capped at 123 |
| Backend typecheck before tests | None (only `build` in CI) | `npm run typecheck`, pre-commit |
| Redis for tests | Tribal knowledge (port 6381) | `pretest` guard starts it; documented in CLAUDE.md |
| Resolver domains listed in CLAUDE.md | 7 of 11 | 11 of 11, plus routes, services, models |

## TL;DR Changelog

```
chore(guardrails): backend lint + typecheck, Redis pretest guard, pre-commit hook, agent pointers (closes #323)
```
