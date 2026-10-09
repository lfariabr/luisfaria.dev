# v3.22.0 — Admin Shell Rework

**Release date:** TBD (closes #318)
**Type:** Feature (UI)

## What's New

- **Admin works on mobile.** A top bar shows a hamburger and the current page title. The hamburger opens a left drawer with the full nav, which closes when you pick a page.
- **Grouped nav.** Dashboard, then **Content** (Projects, Articles), **Business** (Payments, Users) and **Personal** (Pins, EMOM).
- **Back to the site.** The `luisfaria.dev` brand and a "View site" item both link to `/`.
- **Theme toggle in admin.** Light / Dark / System in the sidebar footer, next to Logout.
- **No more 404 Settings link.** The Settings nav item and the dashboard "User Role" card that pointed at `/admin/settings` are gone.
- Desktop sidebar is sticky, so the nav stays in view on long pages.

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/ui/sheet.tsx` | New shadcn `Sheet` (Radix Dialog) |
| `frontend/src/app/admin/AdminLayoutClient.tsx` | Grouped nav, mobile top bar + drawer, back-to-site, theme toggle, Settings removed |
| `frontend/src/app/admin/page.tsx` | "User Role" card removed |
| `frontend/src/__tests__/app/AdminLayoutClient.test.tsx` | New: 9 tests |

## Tests

- Frontend: 29 suites, 215 passed, 5 skipped (9 new in `AdminLayoutClient.test.tsx`)
- `npm run lint` → 0 warnings; `tsc --noEmit` clean
- Backend: no change

## Before / After

| Surface | Before | After |
|---|---|---|
| Mobile nav | Sidebar stacked full-width above content, pushing pages below the fold | Top bar + hamburger drawer |
| Nav structure | Flat list of 8 | Dashboard + Content / Business / Personal groups |
| Back to site | None | Brand link + "View site" |
| Theme | Not available in admin | Light / Dark / System in the footer |
| Settings | Link to a 404 | Removed |

## TL;DR Changelog

The admin area gets a real shell: a mobile hamburger drawer, nav grouped into Content / Business / Personal, links back to the public site, a theme toggle, and no more dead Settings link. The dashboard redesign follows in v3.22.1 (#319).

```
feat(admin): admin shell rework — mobile drawer, grouped nav, back to site (closes #318)
```

**Full Changelog**: https://github.com/lfariabr/luisfaria.dev/compare/v3.21.2...v3.22.0
