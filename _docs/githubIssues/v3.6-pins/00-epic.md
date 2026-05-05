## Goal

Harden the private admin-only relationship pins map so it is safe, maintainable, tested, and ready for later analytics or public-sharing work.

## Scope

- Keep the feature admin-only.
- Remove precise private-location exposure from the client.
- Validate pin input server-side.
- Improve admin map UX states and navigation.
- Add backend and frontend regression coverage.
- Provide an env-backed admin-only home marker that does not leak coordinates into tracked source.

## Out of scope for this PR

- Sanitized public seed/import script. The local seeder remains gitignored; safe import behavior is tracked separately.

## Non-goals

- No public `/map` route in this epic.
- No unauthenticated pins GraphQL query.
- No public sharing until redaction/rate-limit policy is defined.

## Tracking Issues

- Privacy/security hardening: #207
- Seed/import safety: #208
- Backend validation/model hardening: #209
- Admin map UX: #210
- Test coverage: #211
- Feature documentation: #212

## Acceptance Criteria

- No precise home street address is present in the client bundle, UI, or any tracked file.
- No home coordinates are committed to the repo. The optional home marker is sourced from backend-only env vars and exposed via an admin-only GraphQL query.
- `createPin` rejects invalid dates, empty places, impossible coordinates, and malformed country codes.
- Admin UI has loading, error, empty, missing-key, marker, and timeline flows. The optional home marker renders only when the admin-only query returns data.
- Focused backend and frontend tests pass, including coverage of the home-location parser and resolver auth.
- `_docs/featureBreakdown/v3.6-pins.md` reflects the final implementation and verification.
