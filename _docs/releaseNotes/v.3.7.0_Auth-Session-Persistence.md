# v3.7.0 — Auth Session Persistence

**Release date:** 2026-06-29
**Type:** Fix
**Closes:** [#235](https://github.com/lfariabr/luisfaria.dev/issues/235)

---

## What shipped

- Fixed the intermittent "logged in, refresh, bounced to /login" bug on protected routes (`/admin`, `/notes`).
- Session restore is now resilient: a transient network/server hiccup no longer destroys a valid session.
- Introduced an explicit auth `status` state machine so protected routes redirect only when *definitively* logged out.
- Scoped the auth cookie to a single canonical host (www → apex) so it is always sent back.
- Relaxed the cookie `sameSite` to `lax` so it survives top-level navigation into protected pages.
- Hardened backend boot against a weak/placeholder `JWT_SECRET`.

---

## Root cause

Production is single-origin (nginx serves the app and `/graphql` from one droplet), so this was never a cross-site cookie issue. The client `AuthContext` treated *any* `ME` failure — including transient network blips — the same as a real `401`, set the user to `null`, and protected pages redirected immediately. A secondary www/apex host-only cookie split and `sameSite: 'strict'` made it worse.

---

## Frontend

- Rewrote `AuthContext` to derive auth state from the query result (works across refetches) instead of one-shot callbacks.
- Added `AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated'` to the context.
- Only a real `UNAUTHENTICATED` / `401` clears the session; transient errors preserve the last-known user and log a warning.
- Added an `online` self-heal re-check when connectivity returns.
- `AdminLayoutClient` and the notes page now gate/redirect on `status === 'unauthenticated'` only.
- Added an `AuthContext` test proving a transient network error keeps an authenticated session.

---

## Backend

- Auth cookie `sameSite: 'strict'` → `'lax'` (CSRF-safe; fixes bookmark/external-link bounce into `/admin`).
- Fail-fast at boot if `JWT_SECRET` is shorter than 32 chars (skipped under tests).
- Updated the cookie E2E test to assert `SameSite=Lax`.

---

## Infrastructure (server-local)

- nginx `www.luisfaria.dev` → `luisfaria.dev` 301 redirect (http + https) so one canonical host owns the cookie. `server/nginx/default.conf` is gitignored and applied on the droplet; the snippet is in `_docs/featureBreakdown/v3.7-auth-session-persistence.md`.

---

## Before / After

| Scenario | Before | After |
|----------|--------|-------|
| Refresh `/admin` during a network blip | Bounced to `/login` | Stays logged in |
| Visit on `www.` after login on apex | Cookie not sent → logged out | Redirected to apex, cookie sent |
| Bookmark / external link straight to `/admin` | `sameSite=strict` withheld cookie → `/login` | `lax` sends cookie → stays in |
| Real expired/invalid token | Redirect to `/login` | Redirect to `/login` (unchanged) |
| Backend boot with weak `JWT_SECRET` | Boots (silent mass-logout risk) | Refuses to boot with a clear error |

---

## Validation

- `cd frontend && npx jest` → 147 passed / 5 skipped (23 suites)
- `cd frontend && npx tsc --noEmit` → no errors
- `cd backend && npx jest` (Redis on :6381) → 258 passed (18 suites)

---

## Deployment

- Ensure `JWT_SECRET` on the droplet is **≥ 32 chars** (backend now refuses to boot otherwise; rotating it logs out existing sessions once).
- Apply the nginx www→apex change: `docker compose exec nginx nginx -t && docker compose exec nginx nginx -s reload`.

---

## TL;DR Changelog

- 🔒 Refresh no longer randomly logs you out of `/admin` and `/notes`.
- 🧠 New auth `status` state machine — redirect only when truly unauthenticated.
- 🍪 `sameSite=lax` + single canonical host (www→apex) keep the cookie reliable.
- 🛡️ Backend fails fast on a weak `JWT_SECRET`.

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.6.0...v3.7.0
