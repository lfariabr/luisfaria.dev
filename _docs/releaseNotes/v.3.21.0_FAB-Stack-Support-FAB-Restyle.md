# v3.21.0 — FAB Stack and Support FAB Restyle

**Release date:** TBD (draft, ships with #312)
**Type:** Feature (UI)

## What's New

- **Support FAB sits in the corner again.** It no longer floats 120px up over empty space.
- **FAB stack.** Floating buttons now live in one bottom-right column. If APOD or Goggins come back, they stack above the Support FAB with no layout tweaks.
- **Matches the site.** The Support FAB is now a calm stone button with an emerald ring and a warm coffee icon, ~56px instead of 80px, with no constant pulse.
- **Support checkout dialog restyled** with the same stone/emerald look, including the selected product.
- Still hidden on `/notes`, and opening it is still tracked.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/layouts/FabStack.tsx` | New FAB stack container |
| `frontend/src/app/layout.tsx` | Renders the Support FAB inside the FAB stack |
| `frontend/src/components/stripe/StripeFab.tsx` | No fixed offset, stone/emerald restyle, no ping, ~56px |
| `frontend/src/components/stripe/StripeDialog.tsx` | Stone/emerald tokens replace amber |
| `frontend/src/components/apod/ApodFab.tsx` | Drops its own fixed position |
| `frontend/src/components/goggins/GogginsFab.tsx` | Drops its own fixed position |
| `frontend/src/__tests__/components/Stripe.test.tsx` | Updated for new markup |

## Tests

- Frontend: TBD/TBD passing (updated Support FAB tests + new FAB stack test)
- `npm run lint` → 0 warnings
- Backend: no change

## Before / After

| Surface | Before | After |
|---|---|---|
| Support FAB position | `bottom-[7.5rem]`, floating over nothing | Bottom-right corner, inside the FAB stack |
| Adding another FAB | Hand-tune fixed offsets | Drop it into the FAB stack |
| Support FAB look | 80px amber, constant ping | ~56px stone, emerald ring, amber coffee icon, no ping |
| Dialog | Amber gradient line, amber selection | Stone/emerald, emerald selection |

## TL;DR Changelog

The Support FAB moves into a new FAB stack at the bottom-right and drops its leftover offset from when the APOD FAB sat under it. It and the Support checkout dialog now use the site's stone/emerald look instead of loud amber, and the constant pulse is gone.

```
feat(support): FAB stack and Support FAB restyle (closes #312)
```

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.20.0...v3.21.0
