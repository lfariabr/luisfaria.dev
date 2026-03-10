# v2.9.94 — Stripe Payments (Sneak Peek)

**Release date:** 2026-03-10
**Type:** Feature (preview) + Production incident fix

---

## What's New

### 💳 Stripe Checkout — Coffee & Meeting (Preview)
The full checkout flow is live under the hood. Visitors can buy a coffee (AUD 5) or book a meeting (AUD 150) directly from the site.

- **Global floating CTA** — `StripeFab` mirrors the APOD button pattern: pulsing ring, tooltip, always accessible
- **Selection dialog** — `StripeDialog` lets users pick coffee or meeting before checkout
- **GraphQL mutation** — `createCheckoutSession(input)` hits the backend Stripe service and returns a hosted Stripe URL
- **Session verification** — `getCheckoutSession(sessionId)` query confirms payment status on return
- **Success & cancel pages** — `/payment/success` and `/payment/cancel` handle Stripe redirects gracefully
- **Graceful degradation** — if `STRIPE_SECRET_KEY` is not set, the service logs a warning and returns a clean 503; no crash

> ⚠️ **Preview only.** The flow is functional but the full v3.1 rollout (webhooks, analytics events, production QA) is tracked in [`_docs/featureBreakdown/v3.1-stripe-payments.md`](../featureBreakdown/v3.1-stripe-payments.md).

---

### 🔧 Production Incident — 502 Bad Gateway (Fixed)
Site went down after the Stripe PR landed. Full postmortem in [`_docs/featureBreakdown/v2.9.94-nginx502.md`](../featureBreakdown/v2.9.94-nginx502.md). Short version:

- Static `import { withSentryConfig }` in `next.config.ts` crashed silently → no `standalone/server.js` → `frontend_app` crash loop → nginx 502
- SEO audit job was blocking the deploy pipeline, preventing auto-recovery while the site was down
- `turbopack.root: path.resolve(__dirname, '..')` resolves to `/` inside Docker — misrouted standalone output

All three fixed. Site restored same evening.

---

## Files Changed

| File | Change |
|------|--------|
| `backend/src/services/stripe.ts` | New — Stripe client, `createCheckoutSession`, `getCheckoutSession` |
| `backend/src/resolvers/stripe/mutations.ts` | New — `createCheckoutSession` resolver |
| `backend/src/resolvers/stripe/queries.ts` | New — `getCheckoutSession` resolver |
| `backend/src/schemas/types/stripeTypes.ts` | New — GraphQL types |
| `frontend/src/components/stripe/StripeFab.tsx` | New — floating action button |
| `frontend/src/components/stripe/StripeDialog.tsx` | New — product selection dialog |
| `frontend/src/lib/hooks/useStripeCheckout.ts` | New — checkout mutation hook |
| `frontend/src/app/payment/success/page.tsx` | New — post-checkout success page |
| `frontend/src/app/payment/cancel/page.tsx` | New — post-checkout cancel page |
| `frontend/next.config.ts` | Fixed — removed static Sentry import, removed `turbopack.root` |
| `frontend/Dockerfile` | Hardened — `server.js` existence guard after build |
| `docker-compose.yml` | Fixed — Stripe env vars forwarded to `api` container |
| `.github/workflows/ci.yml` | Fixed — SEO audit decoupled from deploy pipeline |
| `backend/.env.example` | Updated — added `STRIPE_WEBHOOK_SECRET` |

---

## TL;DR Changelog

```
feat(stripe): add coffee/meeting checkout flow with APOD-style FAB (#155)
fix(config): remove static Sentry import from next.config.ts — restores standalone build
fix(docker): add server.js guard in Dockerfile; bust GHA build cache
fix(ci): decouple seo-audit from deploy pipeline (continue-on-error + removed from needs)
fix(stripe): forward Stripe env vars to backend container in docker-compose.yml
```

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v2.9.92...v2.9.94
