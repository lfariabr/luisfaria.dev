## Goal

Remove precise private-location exposure from the relationship pins UI, document the Google Maps key boundary, and provide an admin-only env-backed home marker that does not leak coordinates into the client bundle.

## Work

- Remove all hardcoded home addresses or coordinates from frontend source.
- Source the optional home marker from backend-only env vars (`RELATIONSHIP_HOME_LAT`, `RELATIONSHIP_HOME_LNG`, `RELATIONSHIP_HOME_LABEL`).
- Expose those values via an admin-gated `relationshipHomeLocation` GraphQL query so coordinates flow only through an authenticated response.
- Render only the label in the home InfoWindow — never coordinates, never an address.
- Document that the browser Maps key is public by design and must be restricted by HTTP referrer and API scope.
- Document that the server geocoding key and `RELATIONSHIP_HOME_*` must stay backend-only.

## Acceptance Criteria

- No precise street address anywhere in tracked source.
- No home coordinates anywhere in tracked source — neither in frontend nor in committed backend files.
- `git grep -n "RELATIONSHIP_HOME" -- frontend` returns no matches.
- The admin map still renders places and InfoWindows, and additionally renders an amber "Home base" marker only when the admin-only `relationshipHomeLocation` query returns data.
- Unauthenticated and non-admin requests to `relationshipHomeLocation` are rejected.
- `backend/.env.example` documents the new optional env vars and warns against exposing them via `NEXT_PUBLIC_*`.

## Verification

- `cd frontend && npx jest src/__tests__/app/RelationshipMapPage.test.tsx --runInBand`
- `cd frontend && npm run build`
