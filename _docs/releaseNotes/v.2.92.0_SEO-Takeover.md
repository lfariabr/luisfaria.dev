# v2.92.0 — *SEO Takeover v1*

### What's New

- **Full-Site Metadata Coverage**
  - Every public route now has `<title>`, `<meta description>`, `og:title`, `og:image`, canonical URL, and Twitter card
  - New route layouts for `/work`, `/projects`, `/articles`, `/chatbot` with dedicated OG/Twitter metadata
  - Root canonical moved from `defaultMetadata` to each route individually — no more shared canonical risk
  - Auth and admin routes (`/login`, `/register`, `/admin`) explicitly emit `robots: noindex, nofollow`

- **SSR Migration for Listing Pages**
  - `/work`, `/projects`, `/articles` migrated from Apollo CSR to server-side `fetchGql`
  - Crawlers now receive fully populated HTML for listing pages (previously empty shells)
  - ISR with 1-hour revalidation (`revalidate: 3600`) — stable crawlable content without always-fresh overhead

- **Enriched Structured Data (JSON-LD)**
  - Homepage: `Person` + `WebSite` + `Organization` schemas
  - `/work` and `/projects`: `CollectionPage` + `ItemList` schemas with per-item URLs
  - `/articles`: `CollectionPage` + `ItemList` schemas
  - All JSON-LD safely serialized via `sanitizeJsonLd()` — escapes `<`, `>`, `&` to prevent script injection

- **SEO Helpers Centralized**
  - `sanitizeJsonLd(data)` — safe JSON-LD serialization
  - `buildDescription(primary, fallback, max)` — strips markdown, truncates to 160 chars
  - `resolveOgImage(imageUrl?)` — resolves to `/og-default.png` fallback

- **Image Handling**
  - `ProjectCard` replaced CSS `background-image` with semantic `<Image>` — crawlable, LCP-friendly, alt-text supported

- **Legal Pages**
  - `/privacy` and `/terms` pages added (previously 404 despite footer links)
  - Both included in sitemap with static `lastModified`

- **Sitemap Hardened**
  - Correct `lastModified` dates and static route policy for all routes including new legal pages

- **Admin Layout Refactored**
  - Client-side auth logic extracted to `AdminLayoutClient.tsx`
  - Server layout is now a thin noindex wrapper; client component handles role-based redirect and sidebar
  - Spinner guard (`loading || !isAuthenticated || !isAdmin`) prevents admin content flash for unauthorized users

- **SEO Audit Extended**
  - `seo-audit.ts` now checks: canonical URL match, `noindex`/`nofollow` on restricted routes, internal link reachability
  - Restricted URL audit verifies `/login`, `/register`, `/admin` all emit `noindex, nofollow`
  - Internal link audit verifies key routes (`/`, `/work`, `/projects`, `/articles`, `/chatbot`, `/privacy`, `/terms`) return HTTP 200

- **CI SEO Gate**
  - New `seo-audit` CI job runs after `build-check` on push to master
  - `docker-build` now blocked until SEO audit passes (`needs: seo-audit`)

- **Test Suite Hardened**
  - Fixed APOD rate-limit test isolation: Redis cleanup pattern corrected from `apod:*` to `rate-limit:apod:*`
  - Added `maxWorkers: 1` to Jest config — integration suites sharing the singleton Redis client now run serially, eliminating mid-test disconnection race

### Architecture

```
Before:
  Listing pages: CSR → Apollo Client → GraphQL API
  Crawlers see: empty HTML, no metadata, no JSON-LD

After:
  Listing pages: SSR (ISR 1h) → fetchGql → GraphQL API
  Crawlers see: full HTML, canonical, OG tags, JSON-LD CollectionPage+ItemList
  Restricted pages: noindex, nofollow
  CI: SEO audit gates Docker build
```

### Tests ✅

- Backend: 192/192 passing
- Frontend: all passing
- Build: `/articles`, `/projects`, `/work` compile as `○ (Static)` with 1h ISR
- SEO audit: ≥ 80% threshold gate active in CI

### Highlights

> From fragmented to hardened. Three listing pages that crawlers saw as empty shells now serve full HTML with canonical, Open Graph, and structured data. Admin and auth routes are explicitly hidden from indexing. A live SEO audit gates every Docker release. And a year of accumulated test flakiness from a parallel Redis race is gone.

---

### TL;DR Changelog

**Added**
- `frontend/src/app/(auth)/layout.tsx` — noindex metadata for auth routes
- `frontend/src/app/admin/AdminLayoutClient.tsx` — client auth/sidebar component
- `frontend/src/app/articles/layout.tsx` — articles listing metadata
- `frontend/src/app/chatbot/layout.tsx` — chatbot page metadata
- `frontend/src/app/privacy/page.tsx` — Privacy Policy page
- `frontend/src/app/projects/layout.tsx` — projects listing metadata
- `frontend/src/app/terms/page.tsx` — Terms of Service page
- `frontend/src/app/work/layout.tsx` — work listing metadata
- `frontend/src/components/work/WorkTabsContent.tsx` — extracted tabs client component
- `frontend/src/lib/seo/metadata.ts` — `sanitizeJsonLd`, `buildDescription`, `resolveOgImage`
- `_docs/featureBreakdown/v2.92-seo-takeover.md`

**Changed**
- `frontend/src/app/admin/layout.tsx` — thinned to noindex server wrapper
- `frontend/src/app/articles/page.tsx` — CSR → SSR with ISR; added JSON-LD
- `frontend/src/app/page.tsx` — added canonical + Person/WebSite/Organization JSON-LD
- `frontend/src/app/projects/page.tsx` — CSR → SSR with ISR; added JSON-LD
- `frontend/src/app/sitemap.ts` — hardened dates and legal routes
- `frontend/src/app/work/page.tsx` — CSR → SSR with ISR; added JSON-LD
- `frontend/src/app/metadata.ts` — removed global canonical (per-route now)
- `frontend/src/components/work/ProjectCard.tsx` — CSS background → `<Image>`
- `frontend/src/lib/apollo/client.ts` — minor logging cleanup
- `frontend/src/lib/graphql/fetchGql.ts` — added `revalidate` option, `resolveGraphqlUrl`, `React.cache()`
- `backend/scripts/seo-audit.ts` — canonical, noindex, internal link checks
- `.github/workflows/ci.yml` — SEO audit gate job + docker dependency
- `backend/jest.config.js` — `maxWorkers: 1` for serial integration test execution
- `backend/src/__tests__/integration/apodResolvers.test.ts` — fixed Redis cleanup pattern

**Fixed**
- Listing pages had `force-dynamic` + `revalidate` conflict — removed `force-dynamic`, ISR now active
- APOD rate-limit test flakiness caused by parallel suite Redis disconnection race

---

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v2.9.0...v2.9.92
