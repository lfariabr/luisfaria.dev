# v3.17.0 — Security & Platform Maintenance

**Release date:** 2026-09-25
**Type:** Security + infrastructure maintenance

## What's New

- **11 Dependabot PRs merged as one.** #277–#287 applied on a single branch, tested once, merged as #289, and the originals closed as superseded.
- **All 27 open security alerts resolved** (2 critical, 19 high, 6 moderate). `npm audit` now reports 0 vulnerabilities in both `frontend/` and `backend/`.
- **Critical Next.js fixes.** `next` 16.3.0 → **16.3.6** (GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4).
- **Fixed the five alerts Dependabot couldn't open PRs for:**
  - `qs` → 6.16.0 via a new backend override. `express@4` still requires `~6.15.1`.
  - `immutable` 3.8.3 → 3.8.4 and `tar` 7.5.16 → 7.5.22. Our own stale `overrides` pins were blocking these fixes.
- **Server upgraded from Ubuntu 25.10 (end of support) to 26.04.1 LTS**, kernel 7.0. `do-release-upgrade` failed because the release announcement file was missing on Ubuntu's side, so the upgrader was checked with `gpgv` and run by hand.
- **Docker updates restored.** Docker's apt source had been lost in an earlier upgrade, which left Docker on Ubuntu 24.10 packages. It's back for `resolute`, and Docker Engine went 28.4.0 → **29.8.1**, containerd 1.7.27 → **2.3.5**, Compose 2.39.2 → **5.5.1**.

## Files Changed

| File | Change |
|------|--------|
| `frontend/package.json` | `next` → `^16.3.6`; overrides `immutable` → `3.8.4`, `tar` → `7.5.22` |
| `frontend/package-lock.json` | Frontend Dependabot bumps + override changes |
| `backend/package.json` | New override `qs: ^6.16.0` |
| `backend/package-lock.json` | Backend Dependabot bumps + `qs` 6.16.0 |

The server changes were made on the droplet itself. Nothing in the repo changed for them.

## Tests

- Frontend: `npm test -- --runInBand` → ✅ 23 suites, 164 passed. `npm run build` → ✅
- Backend: `npm test -- --runInBand` → ✅ 18 suites, 262 passed. `npm run build` → ✅
- `npm audit` → ✅ 0 vulnerabilities (frontend + backend)
- PR #289 checks → ✅ Backend Tests, Frontend Tests, GitGuardian
- `master` pipeline → ✅ Build & Push Docker Images, Deploy to Production
- After the upgrades → ✅ 5/5 containers up, site 200, GraphQL returns live data

## Before / After

| Surface | Before | After |
|---|---|---|
| Open Dependabot PRs | 11 | 0 |
| Open security alerts | 27 (2 critical, 19 high) | **0** |
| Next.js | 16.3.0 | 16.3.6 |
| Ubuntu | 25.10 (no longer supported) | **26.04.1 LTS** |
| Kernel | 6.17.0-35 | 7.0.0-34 |
| Docker Engine | 28.4.0 (24.10 package, not updating) | **29.8.1** |
| containerd | 1.7.27 | 2.3.5 |
| Docker Compose | 2.39.2 | 5.5.1 |

## TL;DR Changelog

Cleared the whole dependency backlog in one PR and took security alerts from 27 to 0, including the five Dependabot couldn't reach because version ranges and our own stale pins blocked them. Moved production off an unsupported Ubuntu release onto 26.04 LTS, and found and fixed a Docker install that had silently stopped updating back on Ubuntu 24.10.

**Implementation PR:** https://github.com/lfariabr/luisfaria.dev/pull/289
**Feature breakdown:** `_docs/featureBreakdown/v3.17-security-maintenance.md`
