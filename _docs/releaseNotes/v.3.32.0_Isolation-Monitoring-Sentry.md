# v3.32.0 — Isolation, monitoring & Sentry

**Release date:** 2026-11-13
**Type:** Security / infra / observability / tests. 10 PRs since v3.31.0 (8 Nov). Issue #487.

The second half of the server cleanup. v3.31.0 closed the obvious gaps. This release finishes them: the frontend can no longer reach the backend or Redis, nothing the server depends on lives outside git, errors reach Sentry again, and two checks that couldn't fail now can. Each change was verified on the live server after its deploy.

## What's New

### Security
- **Tighter headers and CSP (#470).** The CSP adds `object-src 'none'`, `base-uri 'self'` and `form-action 'self'`, and allows the Sentry ingest host. `Referrer-Policy` is `strict-origin-when-cross-origin`, so Maps keys work. There's a new `Permissions-Policy` that denies camera, microphone, geolocation, payment and USB, and `X-XSS-Protection` is set to `0`. Responses no longer reveal the nginx version or `X-Powered-By`.
- **Edge rate limits (#471).** `/api/discord` allows 5 requests a minute per IP, POST only. `/graphql` gets a flood backstop of 30 per second per IP. Private addresses are exempt, because SSR reaches nginx from one Docker IP. On port 80, requests with no User-Agent are closed and not logged. A bot had sent 2,909 of those in 8 hours.
- **Network isolation (#483, from #40).** There are three networks:
  - `web`: nginx and the frontend;
  - `internal`, with no route out: nginx, the backend and Redis;
  - `egress`: the backend only.

  The frontend can no longer reach `backend_api` or Redis, and it never needed to.

### Infra
- **Unused MongoDB removed (#472).** Production data is on MongoDB Atlas 8.0. The local `mongo:4.4` container held no app data, ran an end-of-life version and used about 112 MB of RAM. CI stays on `mongo:7`, because `mongo:8` refuses to start on kernel 6.19+ (SERVER-121912).
- **The monitor runs from git (#474).** Cron runs `ops/monitor/monitor-resources.sh` from the deploy checkout, so a deploy can't leave it stale. A stale hand-installed copy had sent 28 false alerts after #472.
- **`renew-cert.sh` in git (#483).** It now lives in `ops/certbot/` and runs from the checkout. It reloads nginx only when certbot succeeds, and shellcheck checks it in CI. A dry-run renewal passed on 13 Nov. `health-check.sh`, which nothing ran, is gone from the server.

### Observability
- **Sentry in the browser again (#475).** The client SDK hadn't initialized since March. `withSentryConfig` was the only thing that loaded `sentry.client.config.ts`, and it had been removed. The client setup now lives in `src/instrumentation-client.ts`. `onRequestError` captures server errors, and cookies and auth headers are scrubbed from server and edge events.
- **Less Sentry noise (#478).** Malformed client requests (`BAD_REQUEST`, `GRAPHQL_PARSE_FAILED`, `GRAPHQL_VALIDATION_FAILED`) are no longer reported. One issue had collected 61 of them over 6 months. The skip list is now one shared set instead of two copies.

### Tests and build
- **Type-checked builds (#484).** `ignoreBuildErrors` came from the first Docker build, as a speed shortcut. Removing it means a type error now fails `next build`, which was proven with a deliberate error.
- **The login test logs in (#485).** The fixture double-hashed the password, and the test accepted "Invalid email or password" as a pass. It now asserts no errors, the user, the JWT and the auth cookie. It fails when login is broken. #486 tracks the same double-hash in 6 other fixtures.

### Docs
- dev.to article source on the server cleanup (#482).

## Files Changed

| Area | Files |
|------|-------|
| nginx | `nginx/conf/default.conf` (headers, CSP, rate limits, no-UA rule), `ops/nginx/test-config.sh` (46 checks) |
| Compose / CI | `docker-compose.yml` (no `db` service; `web` / `internal` / `egress` networks), `.github/workflows/ci.yml` (deploy expects 4 containers; shellcheck on `renew-cert.sh`) |
| Ops | `ops/monitor/monitor-resources.sh` (4 containers; setup runs from the checkout), `ops/certbot/renew-cert.sh` (new) |
| Frontend | `src/instrumentation-client.ts` (new), `src/instrumentation.ts`, `src/lib/sentry/scrubRequest.ts` (new), `sentry.server.config.ts`, `sentry.edge.config.ts`, `next.config.ts`; `sentry.client.config.ts` removed |
| Backend | `src/utils/sentryFilter.ts` (new), `src/instrument.ts`, `src/index.ts` |
| Tests | `sentryScrubRequest.test.ts`, `sentryFilter.test.ts` (new), `authResolvers.test.ts`, `ops/monitor/test-monitor.sh` |

## Tests

- nginx: 46 checks, covering:
  - every new header and CSP directive, `X-Powered-By` hidden, and the versionless `Server` header;
  - `/api/discord`: the 6th request gets 429;
  - a `/graphql` flood gets 429s from a public IP, and none from a private one;
  - no-UA requests are dropped and not logged.
- Monitor: 25 stubbed checks, now expecting 4 containers.
- Frontend: the Sentry scrubber (cookie and auth headers filtered, in any case). The build now type-checks. 377 tests pass.
- Backend: the client-error filter (9 tests), and a login test that fails when login is broken. 412 tests pass.
- Live: network isolation checked from inside each container, a cert renewal dry-run, a browser error reaching Sentry, and the site, `/graphql` and `/health/ready` checked after each deploy.

## Before / After

| | Before | After |
|---|---|---|
| Frontend → backend / Redis | Reachable | Blocked (`backend_api` doesn't resolve) |
| Redis → internet | Reachable | No route |
| `/api/discord` | Unlimited | 5/min per IP, POST only |
| No-User-Agent bot on http | 2,909 requests in 8 h, logged | Closed, not logged |
| `Permissions-Policy` | Missing | Unused features denied |
| Local MongoDB | `mongo:4.4` (EOL), empty | Removed; Atlas 8.0 |
| Monitor install | Hand copy in `/opt/monitor` | Runs from git |
| Cert renewal script | Untracked; reloads even on failure | Tracked; reloads only on success |
| Browser errors in Sentry | None since March | Captured |
| Backend Sentry noise | 61 malformed-request events | Filtered |
| Type error in the frontend | Build passes | Build fails |
| "should login successfully" | Passed without logging in | Fails if login breaks |

## TL;DR Changelog

- feat(security): tighten CSP and security headers, and let Sentry through (refs #457) (#470)
- feat(infra): edge rate limits in nginx for /api/discord and /graphql, and drop UA-less bots (closes #459) (#471)
- chore(infra): remove the unused local mongo:4.4 container; production is on Atlas 8.0 (closes #444) (#472)
- chore(monitor): run the monitor from the git checkout so deploys update it (closes #473) (#474)
- fix(sentry): initialize Sentry in the browser via instrumentation-client.ts (closes #431) (#475)
- fix(sentry): stop reporting client-caused GraphQL errors (closes #477) (#478)
- docs(devto): draft article on the VPS cleanup and infra hardening (refs #481) (#482)
- chore(infra): track renew-cert.sh and isolate the frontend from backend and Redis (closes #476) (#483)
- chore(frontend): stop ignoring TypeScript errors in next build (closes #432) (#484)
- test(auth): make 'should login successfully' actually log in (closes #447) (#485)
