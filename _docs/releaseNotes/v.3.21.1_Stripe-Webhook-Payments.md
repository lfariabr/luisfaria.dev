# v3.21.1 — Record Payments via Stripe Webhook 💰

**Release date:** 9 October 2026 (merged in #316, closes #313). Verified in production with a live AUD 5 coffee and a full refund
**Type:** Feature

## What's New

- **The site now remembers every Payment.** A signed Stripe webhook records each Support checkout as a Payment: Supporter email, product, amount, and status (pending, paid, failed, refunded).
- **Thank-you email for coffee.** Supporters who buy a coffee get a short thank-you from `contact@luisfaria.dev`. Replies reach Luis.
- **Discord pings when money lands**, sent by the server once the Payment is paid, e.g. "💰 paid AUD 5 — coffee". The old browser-side "checkout initiated" ping is gone.
- **Refunds stay in sync.** A refund issued from the Stripe dashboard marks the Payment as refunded.
- **`/admin/payments`** — read-only list of Payments, admin only.
- Duplicate Stripe deliveries are ignored: one Payment, one ping, one email.

## Files Changed

| File | Change |
|------|--------|
| `backend/src/routes/stripeWebhook.ts` | New `POST /webhooks/stripe`, signature-verified |
| `backend/src/models/Payment.ts` | New Payment model |
| `backend/src/index.ts` | Mounts the webhook before `express.json()` |
| `backend/src/services/resendMailer.ts` + email layout | Reusable stone/emerald email card, coffee thank-you |
| `backend/src/services/discord.ts` | Server-side Discord ping |
| `backend/src/services/stripe.ts` | Stale TODOs removed |
| `backend/src/validation/shield.ts` | `payments` query ADMIN-only |
| `frontend/src/app/admin/payments/page.tsx` | New admin list |
| `frontend/src/components/stripe/StripeDialog.tsx` | Client-side "checkout initiated" ping removed |
| `server/nginx/default.conf` | Proxies `/webhooks/` to the backend |

## Tests

- Backend: 287/287 passing (signature rejection, each event, idempotency, side-effect logging, admin auth)
- Frontend: 202 passed, 5 skipped (admin payments list, no client "checkout initiated" ping)

## Before / After

| Event/State | Before | After |
|---|---|---|
| Supporter pays | Only visible in the Stripe dashboard | Payment recorded on the site |
| Discord | "checkout initiated" from the browser, before paying | "💰 paid AUD 5 — coffee" from the server, after paying |
| Coffee Supporter | No follow-up | Thank-you email from `contact@luisfaria.dev` |
| Refund | Stripe only | Payment marked refunded |
| Admin view | None | `/admin/payments` |
| Mail to `contact@` | Bounced (no MX) | Forwarded to Luis |

## TL;DR Changelog

Support checkout now has a memory. Stripe's own events, verified by signature, create and update Payments on the site; Luis gets a Discord ping only when money actually arrives; coffee Supporters get a thank-you email; and admins can see every Payment at `/admin/payments`.

```
feat(support): record Payments via Stripe webhook (closes #313)
```

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.21.0...v3.21.1
