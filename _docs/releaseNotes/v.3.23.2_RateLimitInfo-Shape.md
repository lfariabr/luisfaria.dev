# v3.23.2 — One RateLimitInfo Shape

**Release date:** 2026-10-12
**Type:** Refactor (breaking GraphQL change; backend and frontend deploy together)

## What's New

- **One `RateLimitInfo`**: `{ limit, remaining, resetTime }` everywhere, on success and in the `RATE_LIMITED` error.
- **Goggins counts down from `resetTime`** like chatbot and APOD, and recognises the over-limit state by the error code.
- **Removed:** `allowed` and `resetIn` from the schema and `Errors.rateLimited`, the Goggins-only error wrapper, an unused `RateLimitInfo` object type, and a duplicated test file.

## Files Changed

| Area | Files |
|------|-------|
| Schema / errors | `rateLimitTypes.ts`, `graphqlErrors.ts`, `shared/RateLimitInfo.ts` (deleted) |
| Resolver | `resolvers/screams/mutations.ts` |
| Frontend | `GogginsDialog.tsx`, `scream.mutations.ts` |
| Tests | `GogginsDialog.rate-limit.test.tsx` (rewritten, duplicate deleted), `GogginsDialog.component.test.tsx` ×2, `screamResolvers.test.ts` |
| Decisions | `docs/adr/0001-rate-limiting-domain.md` |

## Tests

- `cd backend && npm test` → ✅ 321 tests
- `cd frontend && npm test` → ✅ 229 passed, 5 skipped (pre-existing)
- New Goggins and scream tests were red before the change

## Before / After

| Surface | Before | After |
|---|---|---|
| `RateLimitInfo` fields | `limit`, `remaining`, `resetTime`, `allowed`†, `resetIn`† | `limit`, `remaining`, `resetTime` |
| Goggins over-limit error | `resetIn` + `resetTime` | `resetTime` |
| Goggins countdown source | `resetIn` (seconds) | `resetTime` (ISO) |
| Goggins `allowed === false` branch | Present, never reached | Removed |
| `RateLimitInfo` definitions in backend | 1 SDL + 1 unused object type | 1 |

† deprecated in v3.23.1

## TL;DR Changelog

```
refactor(rate-limiting): one RateLimitInfo shape; Goggins reads resetTime (closes #340)
```
