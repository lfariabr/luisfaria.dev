# v2.6.0 — *CI/CD Pipeline* 🚀

### What's New

- **GitHub Actions CI/CD Pipeline**
  - Automated test → build → deploy on every push to `master`
  - Parallel backend and frontend test jobs (Jest)
  - Build verification gate before deploy
  - Coverage reports uploaded as artifacts

- **Docker Image Registry (GHCR)**
  - Frontend and backend images built in CI and pushed to GitHub Container Registry
  - Tagged with commit SHA + `latest` for traceability
  - GitHub Actions cache for faster Docker builds
  - Automatic cleanup: keeps last 5 tagged versions via `actions/delete-package-versions@v5`

- **Secure Server Access**
  - Dedicated `deploy` user with Docker permissions (no root)
  - ED25519 SSH key pair for GitHub Actions authentication
  - Secrets managed via GitHub Actions: `DEPLOY_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`

- **Minimal-Downtime Deployment**
  - Pre-built GHCR images pulled on server (~15s vs 10+ min for `docker build`)
  - Container swap via `docker compose up -d --force-recreate` (~2s downtime)
  - Health check verification for all services post-deploy
  - Idempotent deploy: `git fetch + reset --hard` ensures clean working tree

- **Automated Rollback**
  - Rollback state persisted to `/var/lib/deploy-rollback/commit.txt`
  - Auto-rollback on health check failure: reverts git and rebuilds containers
  - Rollback verification step confirms services are restored
  - Manual "oh shit" command documented for emergency use

- **Discord Notifications**
  - Deploy success/failure alerts via `sarisia/actions-status-discord@v1`
  - Commit SHA, author, and message included in notification
  - `DISCORD_WEBHOOK_URL` passed to webapp container for login/register notifications
  - Frontend API route (`/api/discord`) forwards events to Discord

- **Frontend Fixes**
  - Cache permission fix: `RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next`
  - Migrated deprecated `images.domains` to `images.remotePatterns` in next.config.ts
  - Fixed legacy `ENV key value` Docker syntax to `ENV key=value`

- **Backend Fixes**
  - Apollo Server v5 migration: `@apollo/server/express4` → `@as-integrations/express4`
  - Node engine requirement added: `>=20`

### Pipeline Architecture

```
Push to master
  → Backend Tests (Jest, parallel)
  → Frontend Tests (Jest, parallel)
    → Build Check
      → Docker Build + Push to GHCR
        → SSH Deploy (pull + force-recreate)
          → Health Checks
            → Discord Notification ✅/❌
            → Auto-Rollback (on failure)
```

### Tests ✅

- **Backend**: Existing Jest suite runs in CI with MongoDB in-memory server
  - All tests pass before deploy gate opens

- **Frontend**: Existing Jest suite runs in CI
  - Build verification confirms Next.js compiles successfully

- **Pipeline**: Health checks verify post-deploy
  - Container running status for all 5 services
  - HTTP 200 on frontend (`/`) and backend (`/graphql`)

### Configuration

```env
# GitHub Actions Secrets
DEPLOY_HOST=<droplet-ip>
DEPLOY_USER=deploy
DEPLOY_KEY=<ed25519-private-key>
GHCR_USER=<github-username>
GHCR_TOKEN=<fine-grained-pat-with-packages:read>
DISCORD_WEBHOOK_URL=<discord-webhook-url>
```

### Highlights

> From 15-minute manual SSH deploys with 10+ minutes of downtime to a fully automated 5-minute pipeline with 2-second container swaps. Push to master, grab a coffee, get a Discord ping. Sleep well on Fridays.
> [Read dev.to Article](https://dev.to/lfariaus/from-git-pull-to-gitops-how-i-built-a-production-cicd-pipeline-on-a-12-digitalocean-droplet-34gn)

---

### TL;DR Changelog

**Added**
- GitHub Actions CI/CD workflow (`.github/workflows/ci.yml`)
- Docker image registry on GHCR (frontend + backend)
- Automated deploy via SSH with `appleboy/ssh-action`
- Automated rollback on health check failure
- Discord notifications for deploy success/failure
- Discord webhook passthrough for login/register events
- Health check verification post-deploy

**Changed**
- `docker-compose.yml`: `build:` → `image:` for webapp and api (GHCR images)
- `docker-compose.yml`: Added `DISCORD_WEBHOOK_URL` env var to webapp
- `frontend/Dockerfile`: Added `.next/cache` directory with proper ownership
- `frontend/Dockerfile`: Fixed legacy ENV format warnings
- `frontend/next.config.ts`: Migrated `images.domains` → `images.remotePatterns`
- `backend/package.json`: Bumped `@apollo/server` to `^5.4.0`, added `engines.node >= 20`
- `backend/src/index.ts`: Updated import to `@as-integrations/express4`
- `backend/src/test-helpers/testApp.ts`: Updated import to `@as-integrations/express4`

**Pipeline Stats**
- Total CI time: ~5 minutes (tests → build → push → deploy)
- Container swap downtime: ~2 seconds
- Image pull: ~15 seconds (vs 10+ min for `docker build` on VPS)
- Reliability: 100% after 11 iterations of hardening

**Issues Closed**
- #107 (Epic), #108, #109, #110, #111, #112, #114, #125, #126

**Deferred to v2.7**
- Environment Management: Staging environment (cost not justified for portfolio)
- Monitoring & Alerting: Sentry integration, uptime monitoring

---

### Bug Fixes During Hardening (Issue X)

| # | Problem | Fix |
|---|---------|-----|
| 1 | SSH authentication failed | Regenerated ED25519 key, full private key in secrets |
| 2 | `dubious ownership in repository` | `git config --global --add safe.directory` |
| 3 | `Permission denied .git/FETCH_HEAD` | `chown -R deploy:deploy /var/www/portfolio` |
| 4 | `local changes would be overwritten` | `git pull` → `git reset --hard origin/master` |
| 5 | Deploy timeout (CPU maxed) | Stopped building on server — pull from GHCR |
| 6 | `502 Bad Gateway` | `--force-recreate` + `nginx -s reload` |
| 7 | Container name conflict | Added `--force-recreate` to `docker compose up` |
| 8 | `Cannot find module @apollo/server/express4` | Installed `@as-integrations/express4` |

---

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v2.4.0...v2.6.0