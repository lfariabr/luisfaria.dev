# v3.21.2 — Meeting Booking After Payment 📅

**Release date:** TBD (draft, ships with #314)
**Type:** Feature

## What's New

- **Pay, then book.** After paying for a meeting, Supporters see a "Book your session" button on the success page that opens Luis's Cal.com booking page.
- **Booking email.** Meeting Supporters also get an email from `contact@luisfaria.dev` with a thank-you and the booking link, so they can book later.
- Coffee Supporters see the same success page as before, with no booking button.

## Files Changed

| File | Change |
|------|--------|
| `backend/src/schemas/types/stripeTypes.ts` | `checkoutSessionStatus` returns `productKey` |
| `backend/src/services/stripe.ts` | Reads `productKey` from session metadata |
| `backend/src/config/config.ts` | `CAL_MEETING_URL` |
| `backend/src/services/resendMailer.ts` | Meeting booking email (shared layout) |
| `backend/src/routes/stripeWebhook.ts` | Sends the booking email when a meeting is paid |
| `frontend/src/app/payment/success/page.tsx` | "Book your session" button for paid meetings |

## Tests

- Backend: TBD/TBD passing (`productKey` in status, booking email once for meeting only)
- Frontend: TBD/TBD passing (success page button logic)

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
