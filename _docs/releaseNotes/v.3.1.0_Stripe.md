# v3.1.0 — Stripe Payments (Coffee & Meeting) 💳

**Release date:** 2026-03-13
**Type:** Feature

---

## What's New

### 💳 Stripe Checkout — Coffee & Meeting

Visitors can now support the site directly. Two fixed purchase options are available from a global floating CTA:

| Product | Price |
|---------|-------|
| ☕ Buy me a coffee | AUD 5 |
| 📅 Book a meeting | AUD 150 |

#### How it works

1. Visitor clicks the **💳 StripeFab** (floating button, bottom-right — stacks above the APOD button).
2. A transparent **StripeDialog** appears with product options.
3. Selecting a product fires the `createCheckoutSession` GraphQL mutation → backend creates a Stripe-hosted session.
4. User is redirected to the Stripe checkout page.
5. On completion → `/payment/success` (with optional "Return to page" button).
6. On cancel or back-button → `/payment/cancel` (restores the original page).

#### Security & validation

- `STRIPE_SECRET_KEY` is backend-only; never sent to the client.
- `returnUrl` origin is validated server-side against `FRONTEND_URL` — mismatched origins are rejected with `BAD_USER_INPUT` (prevents open-redirect attacks).
- Mutation is intentionally public (no auth required for support flow).
- Graceful degradation: if `STRIPE_SECRET_KEY` is missing, service logs a warning and returns 503 — no crash.

---

## Environment Variables

See `backend/.env.example` for full comments and setup instructions.

| Variable | Required | Notes |
|----------|----------|-------|
| `FRONTEND_URL` | ✅ | Base URL, no trailing slash (e.g. `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | ✅ | `sk_test_...` for dev, `sk_live_...` for prod |
| `STRIPE_COFFEE_PRICE_ID` | ✅ | `price_...` from Stripe Dashboard |
| `STRIPE_MEETING_PRICE_ID` | ✅ | `price_...` from Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | ⏳ Phase 2 | Leave blank locally — not needed for redirect flow |

---

## Upcoming

- **[#152](https://github.com/lfariabr/luisfaria.dev/issues/152) — Stripe analytics events**: `stripe_fab_opened`, `stripe_item_selected`, `stripe_checkout_started`, `stripe_checkout_error` are wired into the hook and need full validation across environments.
- **Phase 2 — Webhook fulfillment**: persist payment results to MongoDB, send confirmation emails via Resend, add `/api/stripe/webhook` endpoint. Requires `STRIPE_WEBHOOK_SECRET` and a publicly accessible URL.
- **Phase 2 — Admin dashboard**: transaction reporting for support payments.

---

## Files Changed

| File | Change |
|------|--------|
| `backend/src/services/stripe.ts` | New — Stripe client, `createCheckoutSession`, `getCheckoutSessionStatus`, origin validation |
| `backend/src/resolvers/stripe/mutations.ts` | New — `createCheckoutSession` resolver with `createErrorHandler` |
| `backend/src/resolvers/stripe/queries.ts` | New — `getCheckoutSession` resolver |
| `backend/src/schemas/types/stripeTypes.ts` | New — GraphQL types (`CheckoutInput`, `CheckoutSession`, `CheckoutSessionStatus`) |
| `backend/src/validation/schemas/checkout.schema.ts` | New — Zod validation for checkout input |
| `backend/src/validation/shield.ts` | Updated — `createCheckoutSession: allow` (public mutation) |
| `backend/src/resolvers/index.ts` | Updated — Stripe resolvers registered |
| `backend/src/schemas/typeDefs.ts` | Updated — Stripe types imported |
| `backend/src/config/config.ts` | Updated — `stripeSecretKey`, `stripeCoffeePriceId`, `stripeMeetingPriceId`, `stripeWebhookSecret`, `frontendUrl` |
| `frontend/src/lib/graphql/mutations/stripe.mutations.ts` | New — `CREATE_CHECKOUT_SESSION` mutation |
| `frontend/src/lib/graphql/queries/stripe.queries.ts` | New — `GET_CHECKOUT_SESSION` query |
| `frontend/src/lib/graphql/types/stripe.types.ts` | New — TypeScript types |
| `frontend/src/lib/hooks/useStripeCheckout.ts` | New — checkout hook; captures `returnUrl`, fires analytics, redirects |
| `frontend/src/components/stripe/StripeFab.tsx` | New — floating action button |
| `frontend/src/components/stripe/StripeDialog.tsx` | New — product selection dialog |
| `frontend/src/app/payment/success/page.tsx` | New — post-checkout success page with optional return button |
| `frontend/src/app/payment/cancel/page.tsx` | New — post-checkout cancel page |
| `frontend/src/app/layout.tsx` | Updated — `StripeFab` mounted globally |
| `backend/.env.example` | Updated — Stripe vars with inline comments and setup instructions |
| `README.md` | Updated — Stripe setup section (test keys, price IDs, phase-2 note) |
| `backend/src/__tests__/unit/stripe.service.test.ts` | New — 14 service tests |
| `backend/src/__tests__/unit/stripe.mutations.test.ts` | Updated — resolver tests incl. returnUrl + INVALID_RETURN_URL |
| `frontend/src/__tests__/lib/hooks/useStripeCheckout.test.tsx` | New — 9 hook tests |
| `frontend/src/__tests__/components/Stripe.test.tsx` | Updated — loading state, error alert, meeting product tests |

---

## TL;DR Changelog

```
feat(stripe): add coffee/meeting checkout flow with APOD-style FAB (#155)
feat(stripe): pass returnUrl from frontend and restore original page on cancel/success (#158)
fix(stripe): validate returnUrl origin server-side to prevent open redirect (#159)
test(stripe): cover checkout service, resolver, hook, and FAB/dialog (#160)
docs(stripe): add local setup guide, env comments, phase-2 webhook plan (#154)
```

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v2.9.94...v3.1.0
