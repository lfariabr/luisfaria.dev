# 0001 — Rate limiting is one module owning a list of named rate limits

**Status:** Accepted, 2026-10-11 ([#338](https://github.com/lfariabr/luisfaria.dev/issues/338))

## Context

Every rate-limited feature talked to the Redis Lua limiter its own way:

- three call styles: `middleware/rateLimiter.ts` (chatbot), `utils/applyRateLimit.ts` (APOD), direct `rateLimiter.limit` (Goggins, register, `/health/ready`)
- limits split between config (`RATE_LIMIT_*`, shared by chatbot and APOD) and literals in resolvers
- over-limit errors built by hand at each site, one of them as `badInput`
- three `RateLimitInfo` shapes, two of them conflicting GraphQL types
- every limiter let requests through when Redis failed

The numbers were also unclear: chatbot was documented as 5 per hour, `.env.example` said 10 per hour, and the code default was 5 per minute.

## Decision

1. **One module, `backend/src/rateLimiting/`,** holds the Lua limiter, the list of Rate limits and `consume(name, subject)`. Nothing else touches the counter.
2. **Each Rate limit is named and fully defined in one list:** limit, Window, Subject kinds (with a limit per kind where they differ), visibility, failure mode. Resolvers name a rate limit; they never pass numbers. No env overrides until one is needed in production.
3. **`consume` throws domain errors, not GraphQL errors.** Over the limit → `RateLimitExceeded`. Fail-closed rate limit with Redis down → an unavailable error. A mapper turns them into `Errors.rateLimited` (`RATE_LIMITED`), a generic message for Silent rate limits, or `SERVICE_UNAVAILABLE`; the health route maps them to a 429. The module does not depend on `graphql`.
4. **Visible vs Silent.** Visitor-facing features show `limit`, `remaining`, `resetTime`. Abuse protection (register, health) shows nothing, so an attacker learns no numbers.
5. **Failure mode per rate limit.** Chatbot (OpenAI), Goggins (OpenAI + Resend) and register (abuse target) fail closed. APOD and the health probe fail open.
6. **The module does not check authentication.** The caller passes a Subject; a missing one is counted under `unknown` and logged.
7. **Keys are `rl:<rateLimit>:<subjectKind>:<id>`.**

## Rejected alternatives

- **Keep per-call-site `rateLimiter.limit(key, limit, window)` with limits written into the code** (what `CODING_STANDARDS.md` described at v3.22.3). It is how seven call sites ended up with three error shapes and two sources for the numbers.
- **Fail open everywhere.** A Redis outage would remove the only cap on OpenAI and Resend spend.
- **Every rate limit visible** ("a silent limit is a bug"). Showing remaining register attempts helps an attacker.
- **`TOO_MANY_REQUESTS` as the over-limit code.** Every client already checks `RATE_LIMITED`; switching buys nothing and breaks three dialogs.
- **Skip the rate limit when the Subject is missing** (what register did for a missing IP). A proxy misconfiguration would silently remove the limit.

## Consequences

- Moving to the new keys resets every counter once, on deploy.
- Chatbot, Goggins and register become unavailable while Redis is down.
- `CODING_STANDARDS.md` "Rate limiting" and "Errors" describe this module and `RATE_LIMITED`.
