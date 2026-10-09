# v3.21.2 — Meeting Booking After Payment 📅

**Release date:** 10 October 2026 (merged in #317, closes #314)
**Type:** Feature

## What's New

- **Pay, then book.** After paying for a meeting, Supporters see a "Book your session" button on the success page that opens Luis's Cal.com booking page.
- **Booking email.** Meeting Supporters also get an email from `contact@luisfaria.dev` with a thank-you and the booking link, so they can book later.
- **Always a next step.** If the booking link isn't configured, a paid meeting Supporter sees "I'll email you to arrange a time" with a `contact@luisfaria.dev` link instead of a dead end.
- **The link only goes to paying Supporters.** The Cal.com URL lives in one backend env var (`CAL_MEETING_URL`). The API hands it out only for a paid meeting session, and it never ships in the frontend bundle.
- Coffee Supporters see the same success page as before, with no booking button.

## Files Changed

| File | Change |
|------|--------|
| `backend/src/schemas/types/stripeTypes.ts` | `checkoutSessionStatus` returns `productKey` |
| `backend/src/services/stripe.ts` | Reads `productKey` from session metadata; `meetingBookingUrl()` owns the "paid meeting + configured URL" rule |
| `backend/src/resolvers/stripe/queries.ts` | Returns `productKey` and `bookingUrl` |
| `backend/src/config/config.ts`, `backend/.env.example`, `docker-compose.yml` | `CAL_MEETING_URL` |
| `backend/src/services/resendMailer.ts` | Meeting booking email; both Support emails share one `sendSupportEmail` sender |
| `backend/src/services/payments.ts` | Picks the Supporter email per product from a map; sends the booking email when a meeting is paid |
| `frontend/src/app/payment/success/page.tsx` | "Book your session" button for paid meetings, contact fallback without a link |
| `frontend/src/lib/graphql/queries/server.queries.ts` | Queries `productKey` and `bookingUrl` |

## Tests

- Backend: 298/298 passing (`productKey`/`bookingUrl` in status, `meetingBookingUrl` rule, booking email once for meeting only, async success, replay, missing `CAL_MEETING_URL`)
- Frontend: 206 passed, 5 skipped (button for paid meeting, contact fallback, nothing for coffee or unpaid)

## Before / After

| Event/State | Before | After |
|---|---|---|
| Meeting paid, success page | Generic thank-you | "Book your session" button |
| Meeting paid, inbox | Nothing | Booking email with thanks + Cal.com link |
| Coffee paid | Thank-you email (v3.21.1) | Unchanged |
| Booking a time | Email Luis and go back and forth | Pick a slot on Cal.com |

## TL;DR Changelog

Paying for a meeting now leads straight to booking it: the success page and a follow-up email both link to a Cal.com event type. This completes the v3.21 Support checkout series (FAB stack, recorded Payments, meeting booking).

```
feat(support): meeting booking after payment (closes #314)
```

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.21.1...v3.21.2
