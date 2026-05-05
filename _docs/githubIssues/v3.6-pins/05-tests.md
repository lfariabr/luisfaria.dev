## Goal

Add focused regression coverage for the privacy, validation, auth, and UI state behavior introduced by v3.6 pins hardening.

## Work

- Extend backend pins resolver integration tests.
- Cover admin success, anonymous rejection, USER rejection, sorted query results, and invalid input rejection.
- Cover the `relationshipHomeLocation` query: admin success when configured, returns null when env is unset, rejects unauthenticated, rejects USER role.
- Cover `parseRelationshipHome` directly with focused unit tests: missing vars, partial vars, non-numeric, out-of-range coords, default vs custom label.
- Add frontend relationship map page tests.
- Cover privacy copy/no precise address, missing key fallback, loading state, empty state, and error retry.
- Cover the optional home marker: renders only when query returns data, omitted on null, omitted silently on error, info window shows label only.

## Acceptance Criteria

- Backend pins integration suite passes.
- Frontend relationship page suite passes.
- Tests fail if the precise home address is reintroduced into the page.
- Tests fail if invalid backend inputs are persisted.
- Tests fail if invalid home env values are accepted by the parser.

## Verification

- `cd backend && npx jest src/__tests__/integration/pinResolvers.test.ts --runInBand`
- `cd frontend && npx jest src/__tests__/app/RelationshipMapPage.test.tsx --runInBand`
