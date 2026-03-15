# v3.2.0 — Registration Security Hardening 🛡️

**Release date:** 2026-03-15  
**Type:** Security feature

---

## What shipped

- Added Cloudflare Turnstile verification to account creation (`register`)
- Added dedicated registration throttling:
  - IP-based limiter
  - per-email limiter
- Added fail-fast config validation for `TURNSTILE_SECRET_KEY` (outside tests)
- Aligned register password rule/text to minimum 8 characters

---

## Why it matters

This reduces bot-driven account creation and spam signups while keeping normal registration UX intact.

---

## Setup required

- Backend: `TURNSTILE_SECRET_KEY`
- Frontend: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

See full implementation notes in:  
`_docs/featureBreakdown/v3.2-register-security-turnstile.md`

---

## References

- Issue: [#164](https://github.com/lfariabr/luisfaria.dev/issues/164)
- PR: [#165](https://github.com/lfariabr/luisfaria.dev/pull/165)

