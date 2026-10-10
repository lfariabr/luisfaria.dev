# v3.23.1 — Rate Limiting Module

**Release date:** 2026-10-11
**Type:** Refactor with deliberate behavior changes (backend only)

## What's New

- **One `backend/src/rateLimiting/` module.** Every rate-limited resolver and route names a Rate limit from one list; no call site passes numbers.
- **Fail closed where it costs money.** Chatbot, Goggins and register refuse with `SERVICE_UNAVAILABLE` when Redis is down instead of letting everything through.
- **APOD is one Rate limit.** Today and by-date share one count per visitor.
- **Silent rate limits** for register and the health probe: refused, with no numbers to probe.
- **`Errors.rateLimited`**; the last raw `new GraphQLError` sites are gone and the ESLint allow-list with them.
- **`RATE_LIMIT_*` env vars removed**; `testRateLimit` query removed.

## Files Changed

| Area | Files |
|------|-------|
| Module | `backend/src/rateLimiting/` (new) |
| Errors | `backend/src/utils/errors/graphqlErrors.ts` |
| Call sites | `resolvers/chatbot`, `resolvers/apod`, `resolvers/screams`, `resolvers/users`, `routes/health.ts` |
| Schema | `schemas/types/rateLimitTypes.ts` (new), `screamTypes.ts`, `typeDefs.ts`; rateTest removed |
| Removed | `services/rateLimiter.ts`, `middleware/rateLimiter.ts`, `utils/applyRateLimit.ts`, `resolvers/rateTest/` |
| Config | `config.ts`, `.env.example`, compose files, CI |
| Docs | `CLAUDE.md` |

## Tests

- `cd backend && npm test` → ✅ 22 suites, 320 tests
- New behavior tests were red on the old code (6 failed) and pass now
- `npm run lint` → ✅ 0 errors, 117 warnings (cap lowered from 123)

## Before / After

Production values before: `RATE_LIMIT_WINDOW=3600`, `RATE_LIMIT_MAX_REQUESTS=5`, `RATE_LIMIT_ANONYMOUS_REQUESTS=5`.

| Rate limit | Before | After |
|---|---|---|
| Chatbot | 5/h per user, fail open | 5/h per user, **fail closed** |
| APOD (signed in) | 5/h today + 5/h by date, separate counts | **10/h shared** across both |
| APOD (anonymous) | 5/h per IP | 5/h per IP |
| Goggins | 2/24h per email, fail open | 2/24h per email, **fail closed** |
| Register by IP | 5/h, **skipped when no IP**, `BAD_USER_INPUT`, fail open | 5/h, missing IP counted as `unknown`, `RATE_LIMITED` (no numbers), **fail closed** |
| Register by email | 3/h, `BAD_USER_INPUT`, fail open | 3/h, `RATE_LIMITED` (no numbers), **fail closed** |
| `/health/ready` | 30/min, 429 with `resetTime` | 30/min, 429 with no numbers |
| Counters | `rate-limit:*`, `goggins:*` | `rl:<rateLimit>:<subjectKind>:<id>`; **all reset once on deploy** |
| Code default if env missing | Chatbot/APOD 5 per **minute** | No env; the list is the only source |

## TL;DR Changelog

```
refactor(rate-limiting): one rateLimiting module, migrate every backend call site (closes #339)
```
