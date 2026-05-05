## Goal

Update the v3.6 feature breakdown so it reflects the hardened implementation rather than the original marker-only MVP.

## Work

- Note that the local seed helper is gitignored and not part of this PR; reference the deferred seed/import issue.
- Document privacy decisions around the precise home address and the env-backed home marker boundary.
- Document backend validation/model hardening.
- Document frontend states, timeline behavior, and the optional admin-only home marker.
- Document Google Maps browser-key and server geocoding-key restrictions, plus the `RELATIONSHIP_HOME_*` backend-only requirement.
- Add final verification commands and known unrelated frontend `tsc --noEmit` issues.
- Link the GitHub epic and sub-issues after creation.

## Acceptance Criteria

- `_docs/featureBreakdown/v3.6-pins.md` matches current code.
- The doc identifies v3.6 as admin-only and explicitly excludes public sharing.
- Issue links are added after GitHub issue creation.

## Verification

- Read `_docs/featureBreakdown/v3.6-pins.md`.
