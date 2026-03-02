# v2.7.0 — *Observability Stack* 🔍

### What's New

- **Tiered Health Check Endpoints**
  - `GET /health` — liveness probe, always 200 (load balancer / container orchestrator target)
  - `GET /health/ready` — readiness probe, 200 or 503, Pulsetic target (public, no sensitive data)
  - `GET /health/details` — internal diagnostics with full check latencies + system info (IP-whitelisted: loopback, Docker bridge, 10.x only)
  - `isTrusted()` IP guard rejects external requests to `/health/details` with 403 Forbidden
  - Checks: MongoDB ping with 5s timeout, Redis ping with 5s timeout
  - System info: memoryUsage, loadAvg 1m/5m, CPU count, process uptime, Node version

- **Sentry Error Tracking — Backend (`@sentry/node`)**
  - `backend/src/instrument.ts` — must be first import in `index.ts` to instrument Node.js
  - 20% transaction sampling in production (100% in dev)
  - `beforeSend` filter: drops HTTP 401/403 and GraphQL `UNAUTHENTICATED` / `FORBIDDEN` / `BAD_USER_INPUT` errors (auth flow noise, not bugs)
  - Apollo Server plugin: `didEncounterErrors` captures non-auth GraphQL errors
  - `Sentry.setupExpressErrorHandler(app)` for unhandled Express errors
  - Tagged with `service: portfolio-api` for dashboard filtering

- **Sentry Error Tracking — Frontend (`@sentry/nextjs`)**
  - `frontend/src/instrumentation.ts` — **required for Next.js 13+** to initialize Sentry on server/edge runtimes
  - `sentry.client.config.ts` — browser errors + session replay (1% sessions, 100% errored sessions)
  - `sentry.server.config.ts` — SSR error capture
  - `sentry.edge.config.ts` — edge middleware error capture
  - `frontend/next.config.ts` wrapped with `withSentryConfig()`
  - `src/app/global-error.tsx` — React rendering error boundary

- **External Uptime Monitoring (Pulsetic)**
  - Pings `https://luisfaria.dev/health/ready` every 60s from Sydney + US East
  - Confirmation period: 2 consecutive failures before alert (avoids false positives during deploys)
  - Alert channels: Discord webhook + email
  - 503 = "degraded" (dependency down) — not treated as full outage

- **Resource Monitoring Cron Script**
  - `server/monitor-resources.sh` — checks CPU load, memory usage, disk usage (root `/`), Docker container status
  - Thresholds: 85% for CPU, memory, disk
  - Frequency: every 5 minutes via cron
  - Alert channel: Discord webhook
  - Deduplication: 30-minute cooldown per alert type (state stored in `/var/lib/monitor/`)
  - Security: dedicated `monitor` system user (no login shell), `docker` group for read-only socket access
  - Secrets: `/etc/monitor/monitor.env` (chmod 600, owned by `monitor`)
  - Log rotation: `server/monitor-logrotate.conf` — daily, 7 days retention

- **CI/CD Integration**
  - Post-deploy health check uses `/health/details` from inside Docker network (trusted IP)
  - Rollback triggered if health check returns non-200 after deploy

### Alert Coverage

```
Error in code    → Sentry (instant)         → Sentry dashboard + email
Site goes down   → Pulsetic (< 2 min)       → Discord + email
CPU/Mem/Disk     → Cron script (every 5m)   → Discord (deduplicated, 30-min cooldown)
Deploy fails     → GitHub Actions (instant)  → Discord (existing pipeline)
Container crash  → Cron script (every 5m)   → Discord (deduplicated)
```

### Tests ✅

- **Health routes**: 7 Jest test cases covering liveness, readiness, internal diagnostics, trusted/untrusted IP guard, MongoDB/Redis degraded states
- **Sentry backend**: Manual verification via `Sentry.captureException()` + Apollo sandbox
- **Sentry frontend**: Manual verification via browser console + `global-error.tsx` trigger
- **Pulsetic**: Verified 200 on healthy, 503 on degraded (confirmed with test Redis disconnect)
- **Cron script**: `sudo -u monitor /opt/monitor/monitor-resources.sh` dry run on server

### Real Production Data

First Sentry weekly report after deployment:

| Service | Errors | Transactions |
|---------|--------|-------------|
| Frontend (Next.js) | 6 | 1,451 |
| Backend (Node.js) | 17 | 270 |
| **Total** | **23** | **1,721** |

### Before / After

| Concern | Before v2.7 | After v2.7 |
|---------|-------------|------------|
| Error visibility | None | Sentry: stack traces, breadcrumbs, replays |
| Uptime monitoring | None | Pulsetic: < 2 min detection |
| Resource alerts | None | Discord: CPU, Mem, Disk, Docker (every 5 min) |
| Health endpoint | `/graphql` only | 3-tier: liveness, readiness, internal diagnostics |
| Auth noise in Sentry | N/A | Filtered: 401/403, UNAUTHENTICATED, FORBIDDEN |
| Post-deploy verification | Basic container check | `/health/details` deep check (MongoDB + Redis) |

### Configuration

```env
# Backend
SENTRY_DSN=<backend-sentry-dsn>

# Frontend
NEXT_PUBLIC_SENTRY_DSN=<frontend-sentry-dsn>

# Server (in /etc/monitor/monitor.env, chmod 600)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK
```

### New Files

| File | Purpose |
|------|---------|
| `backend/src/routes/health.ts` | Health check endpoints (public + IP-whitelisted) |
| `backend/src/instrument.ts` | Sentry backend instrumentation |
| `frontend/src/instrumentation.ts` | Next.js 13+ instrumentation hook (registers Sentry configs) |
| `frontend/sentry.client.config.ts` | Sentry client-side config |
| `frontend/sentry.server.config.ts` | Sentry server-side config |
| `frontend/sentry.edge.config.ts` | Sentry edge config |
| `frontend/src/app/global-error.tsx` | Next.js global error boundary |
| `server/monitor-resources.sh` | Resource monitoring cron script (hardened) |
| `server/monitor-logrotate.conf` | Logrotate config |
| `_docs/featureBreakdown/v2.7.Monitoring-alerting.md` | Feature spec |

### Modified Files

| File | Change |
|------|--------|
| `backend/src/index.ts` | Sentry import first, health routes, Apollo error plugin |
| `frontend/next.config.ts` | Wrapped with `withSentryConfig()` |
| `docker-compose.yml` | Added `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |
| `.github/workflows/ci.yml` | Deep health check via `/health/details` in deploy verification |
| `backend/.env.example` | Sentry DSN placeholder |

### Dependencies Added

- `@sentry/node` (backend)
- `@sentry/nextjs` (frontend)

### Highlights

> First Sentry weekly report: 23 errors, 1.7k transactions — on a side project. Before v2.7, I had no idea what was happening after a deploy shipped. Now I know within minutes.
> [Read dev.to Article](https://dev.to/lfariaus)

---

### TL;DR Changelog

**Added**
- Tiered health check endpoints: `/health`, `/health/ready`, `/health/details`
- Sentry error tracking: backend (`@sentry/node`) + frontend (`@sentry/nextjs`)
- `beforeSend` filter for auth noise (401/403, UNAUTHENTICATED, FORBIDDEN)
- Apollo Server `didEncounterErrors` plugin for GraphQL error capture
- `instrumentation.ts` for Next.js 13+ Sentry server/edge initialization
- `global-error.tsx` React error boundary
- Pulsetic external uptime monitoring (60s interval, 2-check confirmation)
- `monitor-resources.sh` cron script (CPU, memory, disk, Docker — every 5 min)
- 30-minute alert deduplication for resource monitoring
- Dedicated `monitor` system user with least-privilege Docker access
- Post-deploy deep health check in CI pipeline

**Changed**
- `.github/workflows/ci.yml`: post-deploy health check upgraded to `/health/details`
- `docker-compose.yml`: Sentry DSN env vars added to both services

**Issues Closed**
- #115 (Monitoring & Alerting Epic), #137 (Observability content/docs)

**Deferred to v2.8**
- SEO Overhaul (already shipped as v2.8 in parallel)

---

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v2.6.0...v2.7.0
