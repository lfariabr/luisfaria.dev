# luisfaria.dev

Personal portfolio site with a small set of interactive features (AI chatbot, APOD, Screams, notes) and a way for visitors to financially support Luis.

## Language

### Support

**Support FAB**:
The floating button, shown site-wide, that opens the Support checkout. Refers to the button only: its placement, visibility and look.
_Lives in_: `frontend/src/components/stripe/StripeFab.tsx`
_Avoid_: Stripe FAB, coffee button

**Support checkout**:
The whole flow a visitor goes through to pay Luis: choosing a product in the dialog, paying on the hosted checkout page, and landing on the success or cancel page.
_Lives in_: `frontend/src/components/stripe/StripeDialog.tsx`, `frontend/src/app/payment/`, `backend/src/services/stripe.ts`, `backend/src/resolvers/stripe/`
_Avoid_: Stripe checkout, Stripe flow, payment flow

**Payment**:
A record of money a Supporter paid through Support checkout, kept by the site itself rather than only in Stripe. A Payment can be pending, paid, failed or refunded.
_Lives in_: `backend/src/models/Payment.ts`, `backend/src/routes/stripeWebhook.ts`, `backend/src/services/payments.ts`, `backend/src/resolvers/payments/`, admin page `frontend/src/app/admin/payments/`
_Avoid_: Order, Donation, Contribution, Transaction

**Supporter**:
The person who pays through Support checkout. Usually an anonymous visitor identified only by the email Stripe collects.
_Avoid_: Customer, Buyer, Donor

**FAB stack**:
The bottom-right column that holds whichever floating buttons are currently active (Support FAB, and APOD or Goggins when enabled). Buttons sit in the stack, not at their own fixed offsets.
_Lives in_: `frontend/src/components/layouts/FabStack.tsx`, rendered from `frontend/src/app/layout.tsx`
_Avoid_: FAB container, floating buttons

### Rate limiting

**Rate limit**:
A named rule that caps how often a Subject may do one thing, such as the Chatbot rate limit. Each one has a limit, a Window, the Subject kinds it counts, a visibility and a failure mode. The full list lives in one place; a resolver names the rate limit, it never sets the numbers.
_Lives in_: `backend/src/rateLimiting/`
_Avoid_: Quota, Throttle, Policy, Bucket

**Subject**:
Who a Rate limit counts: a user (by id), an email (normalised) or an IP. When the caller cannot tell who it is, the Subject is `unknown`, and every such request shares one count.
_Lives in_: `backend/src/rateLimiting/`
_Avoid_: Key, Actor, Identity

**Window**:
The fixed period a Rate limit counts over. The count starts at the first request and resets when the Window ends; it does not slide.
_Lives in_: `backend/src/rateLimiting/`
_Avoid_: Period, TTL, Interval

**Visible rate limit**:
A Rate limit the visitor is meant to see. Every response carries `limit`, `remaining` and `resetTime`, and going over it returns `RATE_LIMITED` with the same three. Chatbot, APOD and Goggins.
_Lives in_: `backend/src/rateLimiting/`

**Silent rate limit**:
A Rate limit that protects against abuse and tells the caller nothing about its numbers. Going over it returns a generic message. Register and the health probe.
_Lives in_: `backend/src/rateLimiting/`
_Avoid_: Hidden limit

**Fail open / Fail closed**:
What a Rate limit does when its counter cannot be read (Redis is down). Fail open lets the request through and logs it. Fail closed refuses with `SERVICE_UNAVAILABLE`, never with `RATE_LIMITED`, because nothing was actually counted. Rate limits guarding something that costs money or attracts abuse fail closed.
_Lives in_: `backend/src/rateLimiting/`

### Places

**Pin**:
One visit to a place on a date, shown on the Places map. A Pin may carry what was spent there, always a positive amount in AUD; a Pin with no amount is a visit where nothing was spent. `placeId` links it to a Google place when it was chosen from search.
_Lives in_: `backend/src/models/Pin.ts`, `backend/src/resolvers/pins/`, `frontend/src/components/relationship/pinForm.ts`
_Avoid_: Expense, Transaction, Marker

**Place**:
Every Pin at one spot, drawn as a single marker with a visit count. Pins join when they share a `placeId` or the same coordinates. A Place is worked out on the page; it is not stored.
_Lives in_: `frontend/src/components/relationship/placeGroups.ts`
_Avoid_: Location, Venue, Stack

**Places map**:
The private map at `/places`, visible to ADMIN and PARTNER, where both can add and edit Pins and only ADMIN can delete them. `/relationship` and `/admin/relationship` redirect here.
_Lives in_: `frontend/src/app/places/`, `frontend/src/components/relationship/`
_Avoid_: Relationship Map, Pins map

**Importer**:
The script that catches the Places map up from a CSV export of the spending sheet. It geocodes rows without coordinates and upserts on place name + date + amount, so re-running it adds no duplicates. `--preview` geocodes and classifies every row without writing.
_Lives in_: `backend/scripts/seed-pins.ts`
_Avoid_: Seeder, Sync
