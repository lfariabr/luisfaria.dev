# v2.8.0 — *SEO Overhaul* 🔍

### What's New

- **Server-Side Rendered Content Pages**
  - Article and project detail pages converted from `'use client'` to async Server Components
  - Crawlers now receive fully rendered HTML instead of empty shells with loading spinners
  - Server-side GraphQL fetch utility (`fetchGql`) with `React.cache()` deduplication and ISR (1h revalidate)
  - Plain string queries (no Apollo dependency) for server-side data fetching

- **Dynamic Metadata (Open Graph + Twitter Cards)**
  - Article pages: dynamic `<title>`, description from excerpt, `og:type=article`, `publishedTime`, `modifiedTime`, tags, article image
  - Project pages: dynamic `<title>`, description, project image, canonical URL
  - Listing pages (`/articles`, `/projects`): page-specific metadata via route layouts
  - Fallback OG image (`og-default.png`, 1200×630) for pages without custom images

- **JSON-LD Structured Data**
  - Homepage: `Person` (name, jobTitle, sameAs social links) + `WebSite` schemas
  - Article pages: `Article` + `BreadcrumbList` schemas
  - Project pages: `SoftwareApplication` + `BreadcrumbList` schemas

- **Dynamic Sitemap**
  - Fetches all published articles and projects from GraphQL API
  - Generates individual URLs for every `/articles/{slug}` and `/projects/{slug}`
  - Uses `updatedAt` for `lastModified` with safe date fallback
  - Graceful fallback to static routes if GraphQL is unavailable (e.g., during build)

- **Dynamic robots.txt**
  - Converted from static file to Next.js `robots.ts`
  - Disallows `/admin/`, `/login`, `/register`, `/api/`
  - Points to sitemap

### Architecture

```
Before:
  Browser → Next.js CSR → Apollo Client → GraphQL API
  Crawlers see: <div id="root"><Spinner/></div>

After:
  Browser/Crawler → Next.js SSR → fetchGql() → GraphQL API
  Crawlers see: Full HTML with <title>, <meta>, <script type="application/ld+json">
```

### Tests ✅

- `npm run build` passes with no errors
- Article/project detail pages render as `ƒ (Dynamic)` server-rendered routes
- `/sitemap.xml` returns all content URLs dynamically
- `/robots.txt` disallows admin/auth routes
- Safe date handling prevents `RangeError: Invalid time value` during Docker build

### Highlights

> From invisible to indexable. Content pages went from empty HTML shells that crawlers couldn't read to fully server-rendered pages with article-specific metadata, structured data for rich results, and a dynamic sitemap covering every piece of content.

---

### TL;DR Changelog

**Added**
- `frontend/src/lib/graphql/fetchGql.ts` — Server-side GraphQL fetch with ISR + `React.cache()`
- `frontend/src/lib/graphql/queries/server.queries.ts` — Plain string queries for Server Components
- `frontend/src/components/articles/ArticleContent.tsx` — Client component (extracted from page)
- `frontend/src/components/projects/ProjectContent.tsx` — Client component (extracted from page)
- `frontend/src/app/articles/layout.tsx` — Static metadata for articles listing
- `frontend/src/app/projects/layout.tsx` — Static metadata for projects listing
- `frontend/src/app/robots.ts` — Dynamic robots.txt
- `frontend/public/og-default.png` — 1200×630 fallback OG image
- `Person` + `WebSite` JSON-LD on homepage
- `Article` + `BreadcrumbList` JSON-LD on article pages
- `SoftwareApplication` + `BreadcrumbList` JSON-LD on project pages

**Changed**
- `frontend/src/app/articles/[id]/page.tsx` — `'use client'` → async Server Component with `generateMetadata()`
- `frontend/src/app/projects/[id]/page.tsx` — `'use client'` → async Server Component with `generateMetadata()`
- `frontend/src/app/sitemap.ts` — Static 4-route sitemap → async dynamic sitemap with all content
- `frontend/src/app/page.tsx` — Added `Person` and `WebSite` JSON-LD structured data
- `frontend/src/lib/graphql/types/article.types.ts` — Added `publishedAt`, `categories` fields
- `frontend/src/lib/graphql/types/project.types.ts` — Added `liveUrl`, `featured`, `order` fields

**Removed**
- `frontend/public/sitemap.xml` — Stale static file overriding dynamic `sitemap.ts`
- `frontend/public/robots.txt` — Replaced by dynamic `robots.ts`

**Fixed**
- Safe date handling in sitemap prevents `RangeError: Invalid time value` during Docker build pre-rendering

---

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v2.6.0...v2.8.0
