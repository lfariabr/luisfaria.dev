# v3.3.0 — Authenticated Notes & Flashcards

**Release date:** 2026-03-19
**Type:** Feature

---

## What shipped

- New authenticated route: `/notes`
- Private note CRUD (create/edit/delete) for logged-in users
- Two visual modes: timeline cards + grouped week/month view
- Filtering by period (weekly/monthly) + search text
- Header navigation entry (`My Notes`) in dropdown + mobile nav
- Middleware protection for `/notes` (SSR-level auth gate)

---

## Stability and security hardening

- Mongoose `Date` fields serialized to ISO string via field resolvers (fixes "Unknown date" in UI)
- Date input sent as `${yyyy-MM-dd}T00:00:00.000Z` (eliminates off-by-one from `new Date().toISOString()`)
- Trim-aware Zod validation; `content` min(1) enforced when provided
- `noteFiltersSchema` added — `myNotes` query filters validated at Shield level
- Shield `validateNoteFilters` rule combined with `isAuthenticated` on `myNotes`
- `noteIdSchema` centralized in `notes.schema.ts`
- Uses graphql-shield's own `and()` — removes hand-rolled combinator
- Already-classified `NotesServiceError` no longer re-wrapped in error handler
- Redundant `userId` single-field index removed (compound index covers it)
- Cookie domain: host-only in dev; `COOKIE_DOMAIN` env var validated + applied in production
- Escaped search regex (ReDoS-safe)
- Sanitized logging (no raw private search/tag values)
- User feedback toasts on create/update/delete failures

---

## UI decisions

- Note form: content and tags fields hidden (title, date, period, accomplishments, plans only)
- Note card: content and tags not displayed
- Default title derived from `periodType` at form submit and card render (`Weekly update` / `Monthly update`)
- shadcn `Select` for period filter; sentinel `'ALL'` value avoids Radix empty-string constraint

---

## Type changes

- `Note.title` and `Note.content` typed as `string | null` (matches GraphQL nullable)
- `NoteUpdateInput` unified as a type alias of `NoteInput`
- `content` optional end-to-end: Zod schema, GraphQL SDL (`String` not `String!`), Mongoose model

---

## References

- Epic: [#168](https://github.com/lfariabr/luisfaria.dev/issues/168)
- PR: [#175](https://github.com/lfariabr/luisfaria.dev/pull/175)
- Detailed breakdown: `_docs/featureBreakdown/v3.3-notes-flashcards.md`
