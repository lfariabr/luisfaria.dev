# v3.13.0 — Backend cleanup (slice 3b)

**Release date:** 2026-06-29
**Type:** Refactor (internal)
**Closes:** [#247](https://github.com/lfariabr/luisfaria.dev/issues/247)

---

## What shipped

- `screams/mutations.ts`: the validation error now uses `Errors.badInput` (same `BAD_USER_INPUT` code). The rate-limit error stays a structured raw `GraphQLError` (carries metadata; unified `RATE_LIMITED` code).
- `resend/mutations.ts`: `new Error` → `Errors.internal`, with a guard against double-wrapping and no more stringifying raw service errors to the client.

No user-facing behaviour change — same error codes/messages.

This completes **Phase 3** (backend cleanup): dead code removed, `checkRole` on the `UserRole` enum, rate-limit code unified (3a), error handling standardized (3b).

---

## Validation

- `cd backend && npx jest` (Redis on :6381) → 258 passed (18 suites)
- `cd backend && npx tsc --noEmit` → clean

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.12.0...v3.13.0
