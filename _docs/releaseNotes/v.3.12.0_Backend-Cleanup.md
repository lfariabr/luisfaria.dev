# v3.12.0 — Backend cleanup (slice 3a)

**Release date:** 2026-06-29
**Type:** Refactor (internal)
**Closes:** [#245](https://github.com/lfariabr/luisfaria.dev/issues/245)

---

## What shipped

- Removed three dead `subscription.ts` resolver files.
- `checkRole` now compares against the `UserRole` enum instead of loose lowercase `'admin'` strings.
- Unified the rate-limit error code on **`RATE_LIMITED`** (was split with `RATE_LIMIT_EXCEEDED` for APOD) — backend + the APOD frontend updated together.

No user-facing behaviour change; internal consistency + dead-code removal.

---

## Validation

- `cd backend && npx jest` (Redis on :6381) → 258 passed (18 suites)
- `cd frontend && npx jest` → 149 passed / 5 skipped
- `tsc --noEmit` clean (backend + frontend)

---

## Follow-up (slice 3b)

- Standardize `screams` / `resend` error handling on `Errors.*`.
- Optionally consolidate the two rate-limit utility functions.

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.11.0...v3.12.0
