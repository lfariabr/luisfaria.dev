# v3.23.0 — Rate Limiting Domain

**Release date:** 2026-10-11
**Type:** Documentation (no code change)

## What's New

- **Rate limiting vocabulary in `CONTEXT.md`**: Rate limit, Subject, Window, Visible / Silent rate limit, Fail open / Fail closed.
- **First ADR**, `docs/adr/0001-rate-limiting-domain.md`: one `rateLimiting` module, a named list of rate limits, failure mode and visibility per rate limit.
- **`CODING_STANDARDS.md` updated** to the new design: `consume(name, subject)`, IP as a Subject, Silent rate limits allowed for abuse protection, `RATE_LIMITED` as the over-limit code.

## Files Changed

| Area | Files |
|------|-------|
| Glossary | `CONTEXT.md` |
| Decisions | `docs/adr/0001-rate-limiting-domain.md` (new) |
| Standards | `CODING_STANDARDS.md` |

## Tests

- None; documentation only.

## Before / After

| Surface | Before | After |
|---|---|---|
| Rate-limiting vocabulary | None | 6 terms in `CONTEXT.md` |
| Standard for calling the limiter | `rateLimiter.limit(key, limit, window)` per call site | `consume(name, subject)` against a named list |
| Over-limit error code in the standard | `TOO_MANY_REQUESTS` | `RATE_LIMITED` (matches every client) |
| Silent limits | "A bug" | Allowed for abuse protection, with a reason |
| ADRs | 0 | 1 |

## TL;DR Changelog

```
docs(rate-limiting): rate limiting as a domain: glossary, ADR, standards (closes #338)
```
