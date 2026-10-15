# v3.25.5 — Places: one route, one name

**Release date:** 2026-10-15
**Type:** Feature (frontend). Release in epic #350 (Places).

## What's New

- **`/places`.** The map lives at one address. `/relationship` (public layout) and `/admin/relationship` (admin shell) used to render the same component twice.
- **Old links keep working.** `/relationship`, `/admin/relationship` and anything under them answer **308** to `/places`, in `proxy.ts`, before any auth check. `/relationships-blog`-style lookalikes are not caught.
- **Same gate.** `/places` is protected like the old route: anonymous → `/login?redirect=/places`, USER → `/`, ADMIN and PARTNER see the map. Still `noindex, nofollow`.
- **Renamed.** "Relationship Map" becomes "Places" in the header (desktop and mobile), the admin nav Personal group, the dashboard tile ("Open map" → `/places`) and the page title.
- **Copy.** Heading "Our Places" (it is no longer only Sydney); subtitle "Places we've been together" (no "read-only", no "this year"). Promoting a user to PARTNER now says they can view, add and edit places.

## Files Changed

| Area | Files |
|------|-------|
| Route | `frontend/src/app/places/page.tsx`, `PlacesPageClient.tsx` (moved from `app/relationship/`); `frontend/src/app/admin/relationship/page.tsx` (deleted) |
| Redirect + gate | `frontend/src/proxy.ts` |
| Nav and copy | `frontend/src/components/layouts/Header.tsx`, `frontend/src/app/admin/AdminLayoutClient.tsx`, `frontend/src/app/admin/page.tsx`, `frontend/src/app/admin/users/page.tsx`, `frontend/src/components/relationship/RelationshipMap.tsx` |
| Tests | `middleware.test.ts` (+4 legacy-path tests, routes renamed), `AdminLayoutClient.test.tsx`, `AdminDashboardPage.test.tsx`, `RelationshipMapPage.test.tsx` |
| Docs | `_docs/featureBreakdown/v3.6-pins.md` (pointer to `/places`) |

Component and folder names (`components/relationship/`, `RelationshipMap`) stay: renaming them is churn with no reader benefit.

## Tests

- `cd frontend && npx jest` → ✅ 33 suites, 269 passed, 5 skipped
- `npm run lint` (0 warnings), `npm run build` → ✅ (`/places` in the route list, no `/relationship`)

## Before / After

| Surface | Before | After |
|---|---|---|
| Map URL | `/relationship` and `/admin/relationship` | `/places` |
| Old bookmark | Map | 308 → `/places` |
| Header link | "Relationship Map" | "Places" |
| Admin nav / tile | "Pins" → `/admin/relationship` | "Places" → `/places` |
| Heading | "Our Sydney Adventures" | "Our Places" |

## TL;DR Changelog

- feat(places): single `/places` route with 308s from both old paths
- feat(places): "Relationship Map" renamed to "Places" across nav, tile and title
- test(places): legacy redirect tests
- closes #354
