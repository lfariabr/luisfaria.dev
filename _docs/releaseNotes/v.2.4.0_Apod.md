### What's New

- **NASA APOD Integration**
  - Floating action button (FAB) with NASA branding and gradient border
  - Dialog displays today's APOD with image/video, title, explanation, and copyright
  - Direct link to NASA's official APOD page

- **Backend Architecture**
  - GraphQL queries: `getTodaysApod`, `getApodByDate(date: String!)`
  - Modular service layer: `backend/src/services/apod/`
  - Zod schema validation for NASA API responses
  - Retry logic with exponential backoff for slow NASA responses
  - HTML fallback parser when API returns incomplete data

- **Caching & Rate Limiting**
  - Redis cache with 24h TTL (cache-first strategy)
  - Rate limiting: 5 requests/hour per user (authenticated historical browsing only)
  - Rate limit checked only on cache miss (efficient for repeat requests)
  - Audit logging for rate limit events

- **Authenticated Features**
  - Date picker for historical APODs (auth users only, dates from 1995-06-16)
  - Rate limit UI: badge showing remaining/limit, countdown timer
  - Date picker disabled when rate limit exhausted

- **Frontend UX**
  - Loading skeleton while fetching
  - Error states with retry option
  - "Read More" toggle for long explanations (>400 chars)
  - Light/dark mode support
  - Responsive dialog layout

- **Analytics & Observability**
  - Client events: `apod_opened`, `apod_fetch_success`, `apod_fetch_error`, `apod_date_changed`, `apod_rate_limit_exhausted`
  - Google Analytics integration via `trackClientEvent()`

### Tests ✅

- **Backend**: Unit tests for APOD service
  - NASA API fetch, validation, caching, rate limiting
  - HTML fallback parser, error handling
  - Schema validation (including edge case: missing `url` field)

- **Frontend**: Component tests for ApodFab/ApodDialog
  - Renders FAB with accessible name
  - Opens dialog on click, shows NASA branding
  - Tracks analytics events (opened, error, date change, rate limit)
  - Handles error states gracefully

### Configuration

```env
NASA_API_KEY=your_nasa_api_key_here
```

Get your free API key at: https://api.nasa.gov/

### Highlights

> A beautiful, interactive way to explore NASA's Astronomy Picture of the Day. Unauthenticated users see today's APOD; logged-in users can browse 30+ years of space imagery with smart rate limiting and caching.

---

### TL;DR Changelog

**Added**
- APOD FAB with NASA gradient branding
- Dialog with image/video display and metadata
- `getTodaysApod` and `getApodByDate` GraphQL queries
- Date picker for authenticated historical browsing
- Redis caching (24h TTL) and rate limiting (5/hr)
- Rate limit UI: badge, countdown, disabled picker
- Analytics events for APOD interactions
- "Read More" toggle for long explanations

**Architecture**
- Modular service: `apod.service.ts`, `apod.api.ts`, `apod.cache.ts`
- Shared error infrastructure: `src/utils/errors/`
- Zod schemas: `nasaApodRawSchema`, `apodResponseSchema`

**Issues Closed**
- #61, #62, #63, #64, #65, #66, #67, #69
- #78, #79, #80, #93, #96, #97, #102

**Deferred (Low Priority)**
- Database Storage: MongoDB persistence for APODs
- Agentic Routine: Daily cron job for pre-fetching

## What's Changed
* fix(slug): auto-generation (Closes #44) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/52
* feat(chatbot): adds dual-pane workspace by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/59
* feat(chatbot): add RL clarity system (Closes #54) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/60
* feat(Apod): add Apod component (Relates #61) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/70
* refactor(tests): centralize all files to single location (Closes #71) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/72
* feat(apod): complete APOD FAB, dialog, tooltip, tests, and docs (Clos… by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/73
* feat(apod): add NASA API key and config (Closes #65) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/74
* feat(apod): refactor Fab for light theme sync (Closes #75) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/76
* Feature/apod service by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/77
* feat(apod): split service into modular layers and barrel export (Clos… by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/79
* Refactor/shared error handling by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/81
* feat(apod): extend schema for non-image media and add apodUrl field (… by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/83
* feat(apod): support Authorization header auth and harden schema valid… by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/89
* feat(apod): add rate limiting and logging to requests (Relates #67) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/90
* feat(apod): add Redis caching and integration tests (closes #67) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/91
* feat(apod): add dialog queries + types with backend schema (relates #62) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/92
* feat(apod): auth date picker (Closes #93) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/94
* feat(devTo): Add myRoster draft v1 by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/95
* APOD modal: Add scrollable container and Read More toggle for long descriptions by @Copilot in https://github.com/lfariabr/luisfaria.dev/pull/98
* refactor(apod): rate limit only on cache-miss (Closes #97) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/100
* feat(apod): rate limit UI for historical browsing (Fixes #63, #97) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/101
* fix(apod): allow nasa responses without url (Closes  #102) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/103
* feat(apod): event logging (Closes #64) by @lfariabr in https://github.com/lfariabr/luisfaria.dev/pull/104

## New Contributors
* @Copilot made their first contribution in https://github.com/lfariabr/luisfaria.dev/pull/98

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v2.2.0...v2.4.0