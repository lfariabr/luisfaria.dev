# 🚀 CI/CD Epic: 
## Production-Grade Pipeline for DigitalOcean

Based on my setup, I have a solid Docker Compose deployment but a **manual workflow** (SSH → git pull → docker compose rebuild). This Epic transforms it into a proper CI/CD pipeline.

### Current State
- Manual deployment: SSH into server, git pull, docker compose down/build/up
- No automated testing before deploy
- No rollback strategy if something breaks
- Downtime during rebuilds

### Target State
- Push to `master` → Automated tests → Build → Deploy → Zero-downtime
- Rollback with one click/command
- Environment protection (staging vs production)
- Deployment notifications (Discord/Slack/Email-Resend)

## Current Status

### ✅ Issue 1: GitHub Actions Foundation — COMPLETE

**What was implemented:**
- Created `.github/workflows/ci.yml` with automated test pipeline
- Runs on every push to `master` and on all PRs
- Parallel jobs for backend and frontend testing
- Build verification after tests pass
- Coverage reports uploaded as artifacts 
*#TODO: Check **Artifacts** in detail, if I'm not mistaken, it was empty on github actions / artifacts tab*

**Pipeline Structure:**
```text
Push/PR → Backend Tests (parallel) → Build Verification → ✅
        → Frontend Tests (parallel) ↗
```

**To activate:**
```bash
git add .github/workflows/ci.yml
git commit -m "feat: add CI pipeline with automated testing"
git push origin master
```

---

## 📋 Remaining Issues

### ✅ Issue 2: Docker Image Registry — COMPLETE

**What was implemented:**
- Added `docker-build` job to CI workflow
- Builds and pushes both backend and frontend images to GHCR
- Tags images with commit SHA + `latest`
- Uses GitHub Actions cache for faster builds
- Only runs on pushes to main/master (not PRs)

**Image locations:**
- `ghcr.io/lfariabr/luisfaria.dev/backend:latest`
- `ghcr.io/lfariabr/luisfaria.dev/frontend:latest`

---

### ✅ Issue 3: Secure Server Access — COMPLETE

**What was implemented:**
- Created `deploy` user on droplet with Docker access
- Generated ED25519 SSH key pair for GitHub Actions
- Added secrets to GitHub: `DEPLOY_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`

#### Step 1: Create a deploy user on droplet
SSH into server and run:
```bash
# Create deploy user (password-disabled, for SSH key auth only)
sudo adduser --disabled-password --gecos "" deploy

# Add to docker group (so it can run docker commands)
sudo usermod -aG docker deploy

# Create .ssh directory
sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chown deploy:deploy /home/deploy/.ssh
```

#### Step 2: Generate SSH Key Pair (on your local machine)
```bash
# Generate a dedicated deploy key (no passphrase for CI)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_key -N ""

# View the private key (you'll add this to GitHub Secrets)
cat ~/.ssh/deploy_key

# View the public key (you'll add this to the server)
cat ~/.ssh/deploy_key.pub
```


### ✅ Issue 4: Minimal-Downtime Deployment — COMPLETE

**What was implemented:**
- Added `deploy` job to CI workflow (runs after docker-build)
- SSH into server using `appleboy/ssh-action`
- Idempotent git fetch + reset to ensure clean working tree
- Pulls GHCR images via dedicated read-only token (`GHCR_USER`/`GHCR_TOKEN`)
- Restarts containers with `docker compose up -d`
- Health check verification for all services after deployment
- Automatic cleanup of old images

**Note:** This is a single-instance redeploy with ~10s expected downtime during container restart. For true zero-downtime, implement multi-replica services with rolling updates.

### ✅ Issue 5: Automated Rollback — COMPLETE

**What was implemented:**
- Keep last 5 tagged image versions via `actions/delete-package-versions@v5` (deletes both tagged + untagged)
- Persistent rollback state saved to `/var/lib/deploy-rollback/commit.txt` (survives reboots)
- Auto-rollback on health check failure: reverts git and rebuilds containers from previous Dockerfiles
- Rollback verification step confirms services are restored

**Note:** Since `docker-compose.yml` uses `build:` directives (not `image:` refs), rollback = git reset + rebuild. No image digest pulling needed.

#### One-time server setup (run once on droplet):
```bash
sudo mkdir -p /var/lib/deploy-rollback
sudo chown deploy:deploy /var/lib/deploy-rollback
```

#### Manual rollback procedure ("oh shit" command):
```bash
# SSH into server as deploy user
ssh deploy@<your-server>
cd /var/www/luisfaria

# View saved rollback commit
cat /var/lib/deploy-rollback/commit.txt

# Execute manual rollback
PREV_COMMIT=$(cat /var/lib/deploy-rollback/commit.txt)
git reset --hard $PREV_COMMIT

# Rebuild and restart services from rolled-back Dockerfiles
docker compose up -d --build --remove-orphans

# Verify
docker ps
```

#### Verification / Dry-run:
```bash
# Check rollback state exists
ls -la /var/lib/deploy-rollback/

# Validate saved commit
git log --oneline -1 $(cat /var/lib/deploy-rollback/commit.txt)
```

### Issue X: Issues with Deploy Process
#### 05/02/2026
- (trial1) test: trigger deploy `2026/02/05 04:31:42 ssh: handshake failed: ssh: unable to authenticate, attempted methods [none], no supported methods remain`
- (trial2) test: trigger deploy 2: `err: fatal: detected dubious ownership in repository at '/var/www/portfolio'`
- (trial3) fix: add git safe.directory config for deploy user (Relates #107): `err: error: cannot open '.git/FETCH_HEAD': Permission denied`

#### 06/02/2026
- (trial4) fix: add permission to deploy user to write on repo (Relates #107): `ssh root@X.X.X.X "chown -R deploy:deploy /var/www/portfolio && chmod -R 755 /var/www/portfolio"`
```bash
err: error: Your local changes to the following files would be overwritten by merge:
err: 	README.MD
err: 	_docs/.DS_Store
err: 	backend/package-lock.json
err: 	backend/src/resolvers/screams/mutations.ts
err: 	backend/src/services/resendMailer.ts
err: 	frontend/package-lock.json
err: 	frontend/package.json
err: Please commit your changes or stash them before you merge.
```

- (trial5) fix: use git reset --hard for deploy sync (Relates #107)" && git push origin master: from `git pull origin master --ff-only` to `git reset --hard origin/master`
```bash
2026/02/05 17:19:26 Run Command Timeout
```

- Fix for the moment: manually reset droplet due to high CPU usage, then manually run commands back again.
Investigate further...

**UPDATE AT 06/02/2026, 06:43AM:**
- Immediate Fix (Today):
        - Update docker-compose.yml to use image: instead of build:
        - Update deployment script to use docker compose pull
        - Add workflow_dispatch for manual testing
        - Push and test

✅ SOLUTION: Stop Building on the Server!
You're already building images in GitHub Actions and pushing to GHCR. Use those instead!

🚀 THE FIX: Use Pre-Built Images from GHCR
Your CI already builds and pushes images! Just use them

**UPDATE AT 07/02/2026, 06:04AM:**
(trial6) Implementation:
- I updated docker-compose.yml to use `image:` instead of `build:`
- I updated deployment script to use `docker compose pull`
- I pushed and tested
- 06:18AM IT WORKED!!!!!!! HAHAHAHAHAHAHA

(trial7) Commit 2, to test the deployment flow:
- I changed something simple on my timeline section
- The `npm test` failed and it didn't go through because 2026 wasn't covered in TDD, HAHAHAHA, this is awesome
- Fixed, committed again, and the test and CI flow went through...
- The deployment flow went ok, but I'm getting `502 Bad Gateway / nginx/1.29.5` on https://luisfaria.dev
        The 502 error could be caused by:
        - Frontend/backend containers not starting properly (crashed on startup)
        - Environment variables missing in the containers
        - Container names don't match nginx upstream configuration
        - Healthcheck/startup issues

(trial8) We ran `docker compose ps` and found that the frontend_app container was not running:
1. `docker compose pull webapp && docker compose up -d webapp`
Error we've got:
```bash
 ✘ Container frontend_app  Er...                          0.0s 
Error response from daemon: Conflict. The container name "/frontend_app" is already in use by container "0c7d9af28880d020ec5ec3297037e41893ead6b9bef04e6464c73817cf989ac8". You have to remove (or rename) that container to be able to reuse that name.
```

2. `docker rm -f frontend_app && docker compose up -d webapp`
Response was positive, the container was successfully created and started:
```bash
[+] Running 1/1
 ✔ Container frontend_app  St...                          0.2s 
 ```
We ran: `curl -I https://luisfaria.dev` to check and had problems again:
```bash
HTTP/1.1 502 Bad Gateway
Server: nginx/1.29.5
Date: Sat, 07 Feb 2026 00:09:30 GMT
Content-Type: text/html
Content-Length: 157
Connection: keep-alive
X-Frame-Options: DENY
```

(trial9) Assumed nginx had stale DNS after frontend container deployment, so I restarted it:
```bash
docker exec nginx_gateway nginx -s reload
```
Then ran `curl -I https://luisfaria.dev` to check and it went through!!!!

Extra step (could be trial10): added `--force-recreate` to the docker compose command in `ci.yml` to ensure containers are recreated properly and always fresh.
```bash
# from this setup:
docker compose up -d --remove-orphans
# to ensure fresh containers:
docker compose up -d --force-recreate --remove-orphans
```

(trial11): We've had problems with backend after updating package.json on bump @apollo/server to 5.4.0
```bash
Error: src/index.ts(11,35): error TS2307: Cannot find module '@apollo/server/express4' or its corresponding type declarations.
Error: src/test-helpers/testApp.ts(5,67): error TS2307: Cannot find module '@apollo/server/express4' or its corresponding type declarations.
Error: Process completed with exit code 2.
```

I learnt the hard way that @apollo/server has breaking changes. The import path `@apollo/server/express4` no longer exists in v5. In Apollo Server v5, the Express integration moved to a separate package called `@as-integrations/express`. 

Ran `npm install @as-integrations/express4` on /backend and updated imports in `src/index.ts` and `src/test-helpers/testApp.ts` to use the new import path.
```bash
# previous import
import { expressMiddleware } from '@apollo/server/express4';

# to
import { expressMiddleware } from '@as-integrations/express4';
```
Ran `npm build`, and the build was successful.
Comitted changes and finished the battle.

**UPDATE AT 09/02/2026, 06:47AM:**
- CI Pipeline is working as expected: PUSH → TESTS → BUILD → DEPLOY. The process is taking around 5m and the downtime is ridiculously low (a couple of seconds due to docker pull from GHCR)
- Found a problem with frontend logs showing `permission denied, mkdir '/app/.next/cache'` post build
- Still need to upgrade my VPS to newer OS (think about workflow_dispatch for manual testing)

**UPDATE AT 09/02/2026, 08:09AM:**
(...)

### Issue 6: Environment Management
- [ ] Branch-based deployments
- [ ] Staging environment setup
- [ ] Environment-specific secrets

### Issue 7: Deployment Notifications
- [ ] Discord webhook on deploy events
- [ ] Include commit info and author

### Issue 8: Monitoring & Alerting
- [ ] Uptime monitoring setup
- [ ] Error tracking (Sentry)
- [ ] Resource alerts

---

## GitHub Secrets Required (for future issues)

| Secret | Purpose | Status |
|--------|---------|--------|
| `DEPLOY_HOST` | Your Droplet IP | ✅ Added |
| `DEPLOY_USER` | SSH user for deployment (`deploy`) | ✅ Added |
| `DEPLOY_KEY` | SSH private key (ED25519) | ✅ Added |
| `GHCR_USER` | GitHub username for GHCR read-only access | ✅ Added |
| `GHCR_TOKEN` | Fine-grained PAT with `packages:read` scope | ✅ Added |
| `DISCORD_WEBHOOK_URL` | Deploy notifications | ⏳ Issue 7 |

> **Note:** `GHCR_USER` and `GHCR_TOKEN` must be configured in GitHub Secrets before deployment will work. The workflow is ready but these secrets are required for the first deploy.

---

## Learning Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [SSH Deploy Action](https://github.com/appleboy/ssh-action)
