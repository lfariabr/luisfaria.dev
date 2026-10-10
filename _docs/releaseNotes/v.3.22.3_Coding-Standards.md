# v3.22.3 — Coding Standards

**Release date:** 2026-10-11
**Type:** Developer tooling (no user-facing change)

## What's New

- **Raw `new GraphQLError` is now a lint error** in the backend outside the error infrastructure. Resolvers throw through `Errors.*`.
- **`CODING_STANDARDS.md`** at the repo root holds the judgement calls the code review applies: errors, validation, rate limiting, logging, frontend, tests, change hygiene.
- **`copilot-instructions.md` retired.** It dated from v3.0.0 and contradicted the code. `CLAUDE.md` points at the standards file instead.
- **`.DS_Store` untracked and ignored.**

## Files Changed

| Area | Files |
|------|-------|
| Lint | `backend/eslint.config.mjs` |
| Standards | `CODING_STANDARDS.md` (new), `copilot-instructions.md` (deleted), `CLAUDE.md` |
| Housekeeping | `.gitignore`, four `.DS_Store` untracked, `.github/workflows/ci.yml` |

## Tests

- `cd backend && npm run lint` → ✅ 0 errors, 123 warnings (cap 123)
- Probe resolver throwing `new GraphQLError` → ✅ rejected by lint

## Before / After

| Surface | Before | After |
|---|---|---|
| Raw `GraphQLError` in a resolver | Caught by review, sometimes | Lint error |
| Standards source for review | `CLAUDE.md` + stale copilot file | `CODING_STANDARDS.md` |
| Tracked `.DS_Store` | 4 | 0 |

## TL;DR Changelog

```
chore(standards): ban raw GraphQLError via ESLint, add CODING_STANDARDS.md, retire copilot-instructions.md (closes #330)
```
