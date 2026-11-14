# v3.33.0 — Homepage redesign, live fixes & dependency cleanup

**Release date:** 2026-11-15
**Type:** Feature / fixes / dependencies. 9 PRs since v3.32.0 (13 Nov). Issue #507.

The homepage now reads as one first-person page instead of a rotating pitch (#442, in three parts). Checking it live turned up four things that had quietly broken:
- Goggins mode never sent an email.
- The chatbot never answered.
- The picture of the day showed NASA's logo.
- A rate limit read "Something went wrong".

All four are fixed. The release also clears 11 of the 13 Dependabot alerts, including the critical one. Each change was checked on the live site after its deploy.

## What's New

### Homepage (#442)
- **A fixed headline (#492).** "Ten years of shipping software that **real people depend on.**" replaces four rotating frames and their timer bar.
  - The pill reads "Senior Software Engineer · Sydney".
  - The subline is first person: the parent portal, the school's data systems, the master's, and agentic tooling written up in public.
  - One metrics row: 10+ years, 2,000 parents, 2,000+ PRs merged to production, 1,400+. The second "Impact" metrics block is gone.
- **What I'm building now, how I ship, what I work with (#493).**
  - *Building now* has three cards:
    - The parent portal. Student Absence has been live since 11 Nov. A morning-rush load test at 1, 10, 100 and 500 parents at once answered every request, with every notice landed and zero errors. The section credits *Scaling Slack and GitHub with Maude Lemaire* (The Pragmatic Engineer). There is no 1,000 figure, because it was never measured.
    - The master's.
    - Open-source work.
  - *How I ship* lists the agent roles and ends with "me / decides what merges". The day-job platform isn't named.
  - *What I work with* replaces the Pillars and Stack sections, so each area appears once. `/about` uses it too.
- **Latest writing and off the clock (#494).**
  - Latest writing: the three newest dev.to articles, newest first.
  - Off the clock: the pull-up timer, Goggins mode and the picture of the day. It's now the only way into those two dialogs.

### Fixes found by checking live
- **Goggins mode sends again; chatbot hidden (#498).**
  - What broke: both features called `gpt-3.5-turbo`, which OpenAI has retired (404), and the account was out of credits. So no Goggins email or chatbot answer had gone out.
  - Goggins now picks from 40 original lines, 20 per tone (filtered and explicit). They're written in a no-excuses style, not quoted, and it never repeats the last one sent to that email. There's no model call and no API cost.
  - The chatbot moved to Claude (Haiku 5.5) through the Anthropic SDK. It is hidden for now: `/chatbot` returns 404, and its links are gone from the home page, footer and sitemap. `ANTHROPIC_API_KEY` is optional until it comes back.
- **Picture of the day shows the picture (#500).**
  - What broke: NASA's APOD API returns 500 (with `DEMO_KEY` too). The HTML fallback's page now redirects to the redesigned `science.nasa.gov/apod/`, where the old scraper picked the header's NASA logo.
  - The fallback now reads only the page's hero block: image or video, title, explanation and the page's own date.
    - If that block is missing, it raises an error instead of showing a wrong image.
    - It covers past dates through `?date=YYMMDD`.
    - "Visit APOD" now opens that day, not today.
- **Rate limits explain themselves (#502).**
  - What broke: the backend sends a rate limit as HTTP 429. Apollo Client 3 turns any non-2xx response into a network error with no GraphQL errors, so the Goggins dialog showed "Something went wrong".
  - A shared `firstGraphQLError` helper also reads the error from the 429 body. Goggins now shows "That's all your Goggins for today. Try again in 12h 38m." The APOD date picker had the same blind spot and uses the same helper.
  - `RATE_LIMITED` is no longer sent to Sentry. Each hit had opened an alert.
- **Steadier nginx test (#496).** The `/graphql` flood check sent its 150 requests one after another. On a slow runner that was too slow to trip the limit, and it failed a deploy. The requests now go out concurrently.

### SEO
- **Senior Software Engineer (#504).** The page title, the Open Graph and Twitter titles, and the Person JSON-LD `jobTitle` all match the hero now. The descriptions, contact page and footer use the same wording.

### Dependencies
- **11 of 13 Dependabot alerts cleared (#504, #506).**
  - Backend:
    - mongoose 8.24.9 (1 critical, 2 high, 2 medium);
    - zod 3 → 4 (high), which renamed `ZodError.errors` to `.issues` in 4 files;
    - follow-redirects 1.16.3 (high) and qs 6.17.1;
    - eslint 10.15.
  - Frontend: @sentry/nextjs 10 → 11, which brings glob 14 and minimatch 11.
  - minimatch 11 everywhere. typescript-eslint still pins `^10`, so both packages override it for `typescript-estree` (dev only).
  - The two low deepmerge alerts stay open: no patched release exists.

## Files Changed

| Area | Files |
|------|-------|
| Homepage | `frontend/src/content/profile.ts`, `app/page.tsx`, `app/about/page.tsx`; new `BuildingNowSection`, `HowIShipSection`, `WorkWithSection`, `LatestWritingSection`, `OffTheClockSection`; removed `MetricsSection`, `CurrentProofSection`, `PillarsSection`, `StackSection`, `useRotatingText`, `content/metrics.ts` |
| Goggins / chatbot | `backend/src/data/gogginsScreams.ts` (new), `services/claude.ts` (was `openai.ts`), `resolvers/screams/mutations.ts`, `resolvers/chatbot/mutations.ts`, `config/config.ts`, `models/ChatMessage.ts`; `frontend/src/app/chatbot/layout.tsx`, `Footer.tsx`, `sitemap.ts`; `docker-compose.yml`, `ci.yml`, `.env.example` |
| APOD | `backend/src/services/apod/apod.fallback.ts`, `apod.urls.ts` (new), `apod.service.ts`, `apod.constants.ts`; `__tests__/fixtures/apod-science-*.html` (new) |
| Rate limits | `frontend/src/lib/apollo/graphqlError.ts` (new), `GogginsDialog.tsx`, `ApodDialog.tsx`; `backend/src/utils/sentryFilter.ts` |
| SEO | `frontend/src/app/metadata.ts`, `app/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`, `Footer.tsx` |
| Deps | `backend/package.json` + lock, `frontend/package.json` + lock; zod 4 changes in `validation/middleware.ts`, `validation/shield.ts`, `services/apod/apod.api.ts`, `scripts/makePartner.ts` |
| nginx test | `ops/nginx/test-config.sh` |

## Tests

- **Home:**
  - one fixed h1 and the four metrics in order;
  - the three cards, with only the measured load-test sizes plus the talk credit;
  - the 7 roles ending with the human;
  - each work area listed once;
  - 3 articles, newest first;
  - the Goggins card opens its dialog;
  - no AI-assistant link.
- **Goggins:**
  - 20 distinct lines per tone, and no profanity in the filtered set;
  - the right pool and sign-off, and no repeat of the last message;
  - the resolver returns `modelUsed: 'static'`.
- **Claude service:**
  - the request shape (Haiku 5.5, low effort, no temperature) and text joining;
  - the refusal reply and error wrapping.
- **APOD:**
  - the parser runs against saved copies of today's page and a dated page;
  - it uses the hero image, not the logo, and the page's own date;
  - it handles video, and both missing-block errors;
  - the fallback also covers past dates.
- **Rate limits:**
  - the Goggins dialog is tested with a 429 shaped exactly as production sends it;
  - `firstGraphQLError` handles 2xx errors, 429 bodies and plain network errors;
  - `RATE_LIMITED` is filtered from Sentry.
- **Totals:** backend 432 passed, frontend 388 passed, and `next build` compiles with Sentry 11.
- **Live:**
  - a Goggins email arrived;
  - `/chatbot` returns 404;
  - APOD showed "Apollo 12 and Surveyor 3" while NASA's API was down;
  - the rate-limited dialog shows the countdown;
  - the title reads "Senior Software Engineer";
  - the Sentry 11 client is active with no console errors;
  - Dependabot lists only deepmerge.

## Before / After

| | Before | After |
|---|---|---|
| Headline | 4 rotating frames + timer | One fixed line |
| Home sections | Current proof, Pillars, Stack, Impact | Building now, How I ship, What I work with, Latest writing, Off the clock |
| Goggins email | Never sent (retired model, no credits) | Sent, from 40 original lines |
| Chatbot | Broken (OpenAI 404) | Moved to Claude; hidden for now (`/chatbot` 404) |
| APOD while NASA's API is down | NASA logo | The day's picture |
| APOD past dates while NASA's API is down | Error | Served from science.nasa.gov |
| "Visit APOD" link | Always today | That day |
| Goggins over the limit | "Something went wrong" | "That's all your Goggins for today. Try again in …" |
| Rate limits in Sentry | An alert per hit | Logged only |
| Page title | Software & Data Engineer | Senior Software Engineer |
| Dependabot alerts | 13 (1 critical, 4 high) | 2 low (deepmerge, no fix yet) |
| zod (backend) / Sentry (frontend) | 3 / 10 | 4 / 11 |

## TL;DR Changelog

- feat(home): fixed headline, first-person subline, one metrics row (closes #489) (#492)
- feat(home): what I'm building now, how I ship, and one work-areas list (closes #490) (#493)
- feat(home): latest writing and off the clock sections (closes #491) (#494)
- test(nginx): send the /graphql flood concurrently so it trips the limit on slow runners (closes #495) (#496)
- fix(goggins): send static Goggins lines and hide the chatbot for now (closes #497) (#498)
- fix(apod): read the redesigned science.nasa.gov page when the NASA API is down (closes #499) (#500)
- fix(rate-limit): show the rate-limit message in the dialogs and keep it out of Sentry (closes #501) (#502)
- chore: Senior Software Engineer in SEO metadata, and clear the Dependabot alerts (closes #503) (#504)
- chore(deps): minimatch 11 for the frontend's typescript-estree (closes #505) (#506)
