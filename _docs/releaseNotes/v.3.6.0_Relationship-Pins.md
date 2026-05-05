# v3.6.0 — Relationship Pins Admin Map

**Release date:** 2026-05-06
**Type:** Feature

---

## What shipped

- Added a private admin-only `/admin/relationship` map for relationship outings.
- Rendered geocoded visit pins with place, date, amount, category, and payment context.
- Added summary cards for total places, total spend, and latest visit.
- Added a visit timeline so admins can inspect trips without relying only on map markers.
- Added an optional env-backed "Home base" marker that is visible only to admins.
- Kept precise home coordinates out of frontend source, tracked docs, and browser env vars.

---

## Privacy and security

- Home marker coordinates are read from backend-only `RELATIONSHIP_HOME_*` env vars.
- `relationshipHomeLocation` is admin-gated through GraphQL Shield.
- The home marker InfoWindow renders only a label, never coordinates or a street address.
- Browser Google Maps values are limited to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.
- Backend geocoding stays behind `GEOCODING_API_KEY` and is optional at boot.

---

## Backend

- Added `Pin` Mongoose model with coordinate bounds, string limits, city/date index, and duplicate guard.
- Added GraphQL `pins`, `createPin`, and `relationshipHomeLocation`.
- Added Zod validation for `PinInput`, including ISO alpha-2 `countryCode`.
- Added focused parser coverage for optional home-marker env vars.

---

## Frontend

- Added `@vis.gl/react-google-maps`.
- Added Google Maps loading/error/empty/missing-key states.
- Added `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` support for Advanced Markers.
- Added admin sidebar navigation for Pins.
- Added component tests for map states, privacy copy, retry behavior, and home-marker rendering.

---

## Documentation

- Updated `_docs/featureBreakdown/v3.6-pins.md`.
- Added `frontend/.env.example` with only browser-safe env vars.
- Updated root `README.md` with the v3.6 feature and Google Maps setup notes.
- Removed the temporary `_docs/githubIssues` planning folder after closing completed sub-issues.
- Documented the required production CSP allowlist for Google Maps/Analytics. The Nginx file remains server-local and is intentionally not committed.

---

## Validation

- `cd backend && npx jest src/__tests__/integration/pinResolvers.test.ts --runInBand`
- `cd frontend && npx jest src/__tests__/app/RelationshipMapPage.test.tsx --runInBand`
- `cd frontend && npx tsc --noEmit`
- CI for PR #217: backend tests, frontend tests, build verification, GitGuardian, and CodeRabbit passed.

---

## Follow-up

- Sanitized seed/import workflow remains deferred in issue #208.
- Public/shareable map remains out of scope until redaction and rate-limiting rules are defined.

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.5.0...v3.6.0
