# v3.31.0 — Security & infra hardening

**Release date:** 2026-11-08
**Type:** Security / infra / fixes (backend, frontend, nginx, VPS). 13 PRs since v3.30.2 (24 Oct). Issue #468.

Two weeks of closing gaps rather than adding features. They range from patched dependencies and rate-limited logins to a production server whose config now lives in git, gets tested in CI and is checked again before every deploy. Every infra change was verified live on the server after its deploy.

## What's New

### Security
- **Dependency patches (#430).** Next.js 16.4.3 fixes a critical remote code execution vulnerability and a DoS. `@sentry/nextjs` 10.76.2 fixes a bypass of the tunnel route middleware. `follow-redirects` is patched too. `body-parser` 2.4.0 fixes a CVE (#435).
- **Login rate limits (#449).** `loginByIp` allows 20 per hour and `loginByEmail` 10 per hour. Both run before the user lookup, so a blocked attempt costs no database or bcrypt work and reveals nothing about which accounts exist.
- **`/api/discord` locked down (#452).** The route used to forward any text to the Discord webhook. It now accepts 4 allowlisted events and sends a fixed message for each. Notifications that carry an email now come from the backend, after the action succeeds.
- **Backend port closed (#454).** Port 4000 was published to the internet, and Docker ports bypass ufw, so it was being scanned. Only nginx's 80 and 443 are public now.

### Infra
- **Container logs capped (#461).** Each container keeps at most 3 × 10 MB of JSON logs, so the logs can't fill the disk.
- **Resource monitor fixed and tracked (#463).** A pipefail race sent false "Container(s) Down" alerts. The container and readiness checks now alert only after 2 failures in a row, and send a recovery message. The script is in `ops/monitor/` with a stubbed test in CI.
- **nginx config in git (#465).** `nginx/conf/default.conf` used to exist only on the server. It is now tracked and mounted read-only. CI runs `ops/nginx/test-config.sh` (`nginx -t` plus routing checks against stub upstreams), and the deploy runs `nginx -t` with the real certificates before recreating anything. Requests to the bare IP or an unknown host get no reply. Scanner paths return 404 without catching slugs like `foo.github.io`.
- **One CORS owner (#466).** nginx and Express both set CORS, so `/graphql` sent two `Access-Control-Allow-Origin` headers. Express now owns CORS, preflight included, and allows Sentry's tracing headers.
- **HTTP/2 and gzip (#467).** The site negotiates HTTP/2, and nginx gzips JSON, CSS, JS and SVG over 1 KB. It leaves alone responses Next.js has already compressed.

### Fixes
- **Login notifications are back (#445).** Successful logins post to Discord from the backend. Typos and failed logins no longer count.
- **zod 4 on the frontend (#451).** Upgraded together with `@hookform/resolvers` 5.9.2. The Dependabot PR would have silently broken form validation errors.

### Docs
- dev.to article on open-sourcing emom-pullups (#438).

## Files Changed

| Area | Files |
|------|-------|
| nginx | `nginx/conf/default.conf` (new, tracked), `ops/nginx/test-config.sh` (new) |
| Monitor | `ops/monitor/monitor-resources.sh`, `test-monitor.sh`, `monitor-logrotate.conf` (new, tracked) |
| Compose / CI | `docker-compose.yml` (no backend port, log cap, `:ro` nginx mount), `.github/workflows/ci.yml` (monitor and nginx test jobs, `nginx -t` before deploy) |
| Backend | `rateLimiting/rateLimits.ts` (login limits), `resolvers/users/mutations.ts` and `resolvers/screams/mutations.ts` (login limits, Discord notifications), `services/discord.ts`, `package.json` (`body-parser`, `follow-redirects`) |
| Frontend | `app/api/discord/route.ts` and `lib/discord/events.ts` (allowlist), `package.json` (Next.js, Sentry, zod 4, resolvers), `ArticleForm.tsx`, `ProjectForm.tsx`, `GogginsDialog.tsx` |

## Tests

- nginx: 28 checks. They cover routing, scanner 404s, security headers, no CORS from nginx, HTTP/2, gzip applied once and only above 1 KB, redirects, the ACME path, and bare-IP and unknown-host rejection (curl exit codes 52 and 35).
- Monitor: 25 stubbed checks, including first miss, second miss, cooldown, recovery, a failing `docker ps` and corrupt counters.
- Backend: login rate limits, and the login Discord notification (success only, never blocks the login).
- Frontend: the `/api/discord` allowlist, and invalid forms showing field errors under zod 4.
- CI green on every PR. Each infra PR was verified live after its deploy.

## Before / After

| | Before | After |
|---|---|---|
| Backend port 4000 | Open to the internet, scanned | Times out from outside |
| Login attempts | Unlimited | 20/h per IP, 10/h per email |
| `/api/discord` | Forwards any text | 4 allowlisted events |
| Container logs | Unbounded | 3 × 10 MB per container |
| Container alerts | Random false "Down" | 2 failures in a row, then recovery |
| nginx config | Only on the server, hand-edited | In git, tested in CI, `nginx -t` before deploy |
| Bare-IP request | Redirected to the site | No reply |
| `/graphql` `Access-Control-Allow-Origin` | Sent twice | Sent once |
| Protocol | HTTP/1.1 | HTTP/2 |
| `/graphql` articles response | 4,322 bytes | 2,041 bytes (gzip) |
| Lighthouse `/articles` (mobile, median of 3) | 88 | 97 |

## TL;DR Changelog

- fix(deps): patch Next.js RCE, Sentry tunnel bypass and follow-redirects alerts (closes #429) (#430)
- chore(deps): bump body-parser in /backend (#435)
- docs(emom): published dev.to article on open-sourcing emom-pullups (closes #437) (#438)
- fix(discord): notify on successful login from the backend (closes #441) (#445)
- fix(auth): add login Rate limits by IP and by email (closes #446) (#449)
- chore(deps): upgrade frontend to zod 4 (closes #434) (#451)
- fix(security): allowlist /api/discord events and move email notifications to the backend (closes #448) (#452)
- fix(infra): stop publishing backend port 4000 (closes #453) (#454)
- chore(infra): cap Docker container logs at 10 MB x 3 files (closes #460) (#461)
- fix(monitor): stop false "Container(s) Down" alerts and track the monitor in git (closes #462) (#463)
- chore(infra): track the production nginx config in git and clean it up (closes #455) (#465)
- fix(infra): let Express own CORS so /graphql sends one Access-Control-Allow-Origin (closes #456) (#466)
- perf(infra): enable HTTP/2 and gzip in nginx (closes #458) (#467)
