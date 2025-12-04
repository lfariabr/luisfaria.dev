### v3.0.0 🔥 | `feature/resend`
> Goal: Integrate Resend to send emails to users when they activate Goggins Mode. Prepare terrain to receive emails according to desired settings (Desired Hour, Daily, Weekly, Monthly, etc)

- [X] Study Resend's API
- [X] Create resend resolver/mutation (`sendGogginsEmail`)
- [X] Point domain to IP (DNS A record) and verify domain in Resend
- [X] Test sending via API apollo playground. Expected: `true` and server logs `Email sent successfully`
- [X] Wire generated Goggins message to `sendGogginsEmail`
- [X] Test sending via frontend post implementation of sendEmail at mutation `activateGogginsMode`
- [X] Revalidate implementation with fresh mind and a hot cup of ☕
- [X] Fine tunes email template and prompts
- [ ] Set up tests
- [ ] Prepare schedules (Desired Hour, Daily, Weekly, Monthly)

---

#### What's good now:
- Clear layering: AI, persistence, email are modular and testable
- Deterministic prompts: Persona centralized, user prompt minimal
- Resilient UX: email failures (knock on wood!) don't break the main mutation
- Sanitized content: Email body is HTML-escaped
- Rate-limited: Prevents abuse with Redis, beautiful stuff 
- SDL-consistent: Schema, resolver, and service signatures match
- Shield-protected: Mutation requires authentication

#### What's next:
- Background job queue
  - use queue (BullMQ,CloudTasks, SQS) for email delivery with retries, dead-lettering and observability
  - avoid fire-and-forget logs getting lost, add structured logs + trace IDs (or check resend's api)
- Idempotency & deduplication
  - ensure a scream isn't emailed multiple times if the resolver is retried
  - store an email delivery record with status and message-id (or check resend's api)
- Templates & Branding
  - move inline HTML to a template system (MJML/React Email) with versioning and tests
- Compliance / Preferences
  - Add opt-in/opt-out preferences, unsubscribe link and footer
  - Respect locale/i18n. Optionally tone preferences
- Input validation
  - Add a zod schema sendGogginsEmail mutation (I think I already have that, double check)
  - consider profanity rules in explicit-mode to ensure product's policy
- Observability
  - Emit structured metrics (email sent, count, success, failure - or maybe check resend's api)
  - add correlation IDs connecting scream ID to email delivery
- Tests
  - Unit Tests
    - mock openAI in goggins mode and assert scream persistence and email call
    - mock resend and assert correct subject/body for explicit and clean mode
  - Integration tests
    - Full resolver path with in-memory db
  - Contract tests for SDL vs resolvers

---

#### Next: Scheduling (Goggins Mode)
- Add schedule preferences to User model (e.g., `emailSchedule: NONE|DAILY|WEEKLY|MONTHLY` + `preferredHour`)
- Create cron/queue worker (BullMQ/Agenda/Cloud scheduler) to dispatch `sendGogginsEmail`

---

#### Setup Steps

1) Create a Resend account and API key
  - Go to https://resend.com
  - Create an API key (project or environment specific)
  - Copy the key

2) Backend environment
  - Add to `backend/.env` (or your environment manager):
  ```
  RESEND_API_KEY=your_resend_api_key_here
  ```
  - Ensure it’s also present in production (Docker/CI/CD secrets). If using Docker Compose, add `RESEND_API_KEY` under `backend` service `environment:`

3) Verify domain and sender
  - In Resend dashboard, add domain. In my case, it was: `luisfaria.dev` via godaddy
  - Add the provided DNS records (TXT, CNAME, MX as required) at DNS provider
  - Wait for verification to complete
  - Use a verified from address. Code currently uses:
  ```
  From: "Goggins" <goggins@luisfaria.dev>
  ```
  - Adjust `backend/src/services/resendMailer.ts` if you want a different sender

4) Code wiring
  - Service: `backend/src/services/resendMailer.ts` (uses `resend` SDK)
  - Schema change: `backend/src/schemas/typeDefs.ts` adds `sendGogginsEmail(to: String!, text: String!, explicitMode: Boolean): Boolean!`
  - Resolver: `backend/src/resolvers/resend/mutations.ts` implements mutation and a basic `hello` query
  - Auth: `backend/src/validation/shield.ts` protects `sendGogginsEmail` with `isAuthenticated`

5) Local test
  - Start backend: `cd backend && npm run dev`
  - Open GraphQL via Apollo Studio at `http://localhost:4000/graphql`
  - With a valid auth context (login or add header), run:
  ```
  mutation TestSend {
    sendGogginsEmail(to: "your@email.com", text: "Your text here", explicitMode: true)
  }
  ```
  - Expected: `true` and server logs `Email sent successfully`

6) Production notes
  - Ensure `RESEND_API_KEY` is configured in your prod environment
  - Domain DNS must be fully verified before sending from `@luisfaria.dev`
  - Monitor bounces/complaints via Resend dashboard