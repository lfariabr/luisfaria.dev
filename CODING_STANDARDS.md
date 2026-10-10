# Coding standards

Judgement calls a reviewer applies to a diff. Anything checkable by a machine lives in ESLint (`backend/eslint.config.mjs`, `frontend/eslint.config.mjs`), CI, or the pre-commit hook, not here. Vocabulary: `CONTEXT.md`. Navigation: `CLAUDE.md`.

## Errors

- A resolver throws through `Errors.*` from `backend/src/utils/errors`, and is wrapped in `createErrorHandler` so unexpected failures map to `INTERNAL_SERVER_ERROR` with the resolver name logged. The lint rule bans raw `new GraphQLError` outside the error infrastructure; the reviewer checks the wrapper.
- Pick the code by what the caller can do about it: `BAD_USER_INPUT` when they can change the input, `UNAUTHENTICATED` / `FORBIDDEN` when they need a session or a role, `RATE_LIMITED` (via `Errors.rateLimited`) with `limit`, `remaining`, `resetTime` when they should wait. Shield rules return errors; resolvers throw them.
- Side effects that are not the mutation's purpose (email, Discord, analytics) are caught and logged; they never fail the mutation.

## Validation and input

- Every user-supplied value crosses a Zod schema in `backend/src/validation/schemas/` before a resolver reads it. Validate at the edge once; trust the typed value after.
- Content that reaches an email passes `escapeHtml` from `backend/src/services/emailLayout.ts`. Content from an AI response is rendered as Markdown, never as raw HTML.

## Rate limiting

- A resolver or route calls `consume(name, subject)` from `backend/src/rateLimiting/`; the Lua script there is the only place that reads and writes the counter. The numbers (limit, Window, failure mode, visibility) live in the module's list of Rate limits, never at the call site. A limit is never checked client-side.
- The Subject is the user id, a normalised email, or an IP; the caller passes `unknown` when it has none, never skips the call. Keys are `rl:<rateLimit>:<subjectKind>:<id>`.
- A Visible rate limit's response carries `limit`, `remaining` and `resetTime`, and the UI shows them. A Silent rate limit (abuse protection) shows nothing; a new one needs a reason in the PR. See `docs/adr/0001-rate-limiting-domain.md`.

## Logging

- `logger` (`backend/src/utils/logger.ts`, `frontend/src/lib/logger.ts`) with a structured payload, never `console.*` in application code. Server pages included.
- Emails and tokens are hashed or omitted in log payloads. Log the Stripe session id, not the customer.

## Frontend

- A page that calls `fetchGql` declares `export const dynamic = 'force-dynamic'`; otherwise the build prerenders stale data.
- Colours come from the theme tokens in `globals.css` (stone neutrals, emerald accent). A raw palette class such as `amber-500` or `zinc-950` in a component is a smell unless it is the feature's own accent, as with the coffee icon.
- Interactive components own their loading, empty and error states, and carry an `aria-label` when the visible text does not say what they do.
- Floating buttons are rendered by `FabStack`, never positioned on their own.

## Tests

- A behaviour change arrives with a test that was red before the change. Backend: integration test through the GraphQL schema for resolvers, unit test for services. Frontend: component test with Apollo mocks.
- Rate-limited features test the limit boundary and the reset. Error paths are tested, not only the happy path.
- External services (OpenAI, Resend, Stripe, NASA) are mocked; Redis and MongoDB are real (memory server, local Redis via `npm test`).

## Change hygiene

- Every change references a GitHub issue; the commit subject closes it (`type(scope): summary (closes #N)`).
- A feature or chore ships with `_docs/featureBreakdown/vX.Y-slug.md` and `_docs/releaseNotes/v.X.Y.Z_Slug.md`, with the verification table filled from real runs.
- New vocabulary goes into `CONTEXT.md` with a `_Lives in_` path; a decision with a rejected alternative goes into `docs/adr/`.
