# v3.5.0 — Discord Notifications Coverage Expansion

## What's New
- Login notifications now include the user's email (`🔐 Login attempt: user@email.com`)
- Register notifications now include the user's email (`📝 New registration: user@email.com`)
- APOD FAB click now fires a Discord notification (`🔭 APOD FAB clicked`)
- Stripe FAB open now fires a Discord notification (`☕ Stripe FAB opened`)
- Stripe option selection now fires a Discord notification with product key (`💳 Stripe option selected: coffee`)
- Stripe checkout initiation now fires a Discord notification, optionally including email (`💰 Stripe checkout initiated: meeting — user@email.com`)
- Goggins mode activation now fires a Discord notification with email and tone (`💪 Goggins mode: user@email.com (tone: explicit)`)
- All notifications switched to fire-and-forget (`void`) — no user-facing latency impact

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/app/(auth)/login/page.tsx` | Enriched message + fire-and-forget |
| `frontend/src/app/(auth)/register/page.tsx` | Enriched message + fire-and-forget |
| `frontend/src/components/apod/ApodFab.tsx` | New notification |
| `frontend/src/components/stripe/StripeFab.tsx` | New notification |
| `frontend/src/components/stripe/StripeDialog.tsx` | New notifications (x2) |
| `frontend/src/components/goggins/GogginsDialog.tsx` | New notification |
| `_docs/featureBreakdown/v3.5-discord-notifications.md` | Feature doc |
| `_docs/releaseNotes/v.3.5.0_Discord-Notifications.md` | This file |

## Tests
- Existing `RegisterPage.test.tsx` passes unchanged (mock only, no message content assertion)
- No new tests added — fire-and-forget pattern has no logic to unit-test

## Before / After

| Event | Before | After |
|-------|--------|-------|
| Login | `"Login button was clicked"` | `"🔐 Login attempt: user@email.com"` |
| Register | `"Register button was clicked"` | `"📝 New registration: user@email.com"` |
| APOD FAB | ❌ None | `"🔭 APOD FAB clicked"` |
| Stripe FAB | ❌ None | `"☕ Stripe FAB opened"` |
| Stripe select | ❌ None | `"💳 Stripe option selected: coffee"` |
| Stripe checkout | ❌ None | `"💰 Stripe checkout initiated: coffee"` |
| Goggins mode | ❌ None | `"💪 Goggins mode: user@email.com (tone: filtered)"` |

## TL;DR Changelog
Expanded Discord webhook coverage from 3 generic events to 7 contextual notifications across all major user touchpoints. All are fire-and-forget and never block the user flow.

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.4.0...v3.5.0
