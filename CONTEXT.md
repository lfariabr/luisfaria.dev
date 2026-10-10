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
