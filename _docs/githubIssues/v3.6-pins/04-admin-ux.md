## Goal

Upgrade the admin map from a marker-only MVP into a usable private inspection surface.

## Work

- Add loading state.
- Add GraphQL error state with retry.
- Add empty state.
- Add missing Google Maps key fallback.
- Add responsive summary cards for place count, total spend, and latest visit date.
- Add a visit timeline next to the map.
- Allow timeline item clicks to open the same selected pin details as marker clicks.
- Show category/payment metadata when present.
- Use cooperative map gestures to avoid scroll hijacking.

## Acceptance Criteria

- Admin can understand the page state before data loads, when data fails, when data is empty, and when the map key is missing.
- Admin can inspect visits from either markers or the timeline.
- UI remains usable on narrower screens.
- No precise home address appears anywhere in the rendered UI or client bundle.
- An optional amber "Home base" marker appears only when the admin-only `relationshipHomeLocation` GraphQL query returns data; clicking it shows only the configured label.

## Verification

- `cd frontend && npx jest src/__tests__/app/RelationshipMapPage.test.tsx --runInBand`
- `cd frontend && npm run build`
