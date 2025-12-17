# v2.2.0 — *Secure Authentication* ✅

### What's New

- **httpOnly Cookie-Based Auth**
  - JWT tokens now stored in httpOnly cookies (inaccessible to JavaScript)
  - Eliminates XSS token theft vulnerability
  - `sameSite: 'strict'` for CSRF mitigation
  - `secure: true` in production (HTTPS only)

- **Backend Changes**
  - Login/register mutations set httpOnly cookie via `Set-Cookie` header
  - Logout mutation clears cookie server-side
  - `me` query validates session from cookie
  - Shield rules return proper `UNAUTHENTICATED`/`FORBIDDEN` GraphQL errors
  - Removed token from mutation response bodies

- **Frontend Changes**
  - Removed `authLink` from Apollo Client (no more Authorization header)
  - `credentials: 'include'` sends cookies automatically
  - `ME_QUERY` bootstraps auth state on app load
  - `useIsAdmin()` and `useIsEditorOrAdmin()` hooks replace localStorage checks
  - Middleware reads token from cookie only, preserves redirect param on all failures

- **Security Improvements**
  - Token no longer accessible to JavaScript (XSS protection)
  - Server validates session on every app load
  - Consistent error codes for auth failures
  - All admin route redirects preserve original path

### Tests ✅

- **Backend**: Integration tests for full cookie auth flow
  - Login → cookie set → me query → logout → cookie cleared
  - `UNAUTHENTICATED` and `FORBIDDEN` error codes verified

- **Frontend**: Unit tests for auth components
  - `AuthContext.test.tsx`: ME_QUERY bootstrap, login/logout flows
  - `isAdmin.test.tsx`: Role check hooks
  - `client.test.ts`: Apollo config (no Authorization header, credentials: include)
  - `middleware.test.ts`: 13 tests for route protection and redirects

- All suites green (`npm run test`):
  - Backend: cookieAuthE2E passing
  - Frontend: 30+ auth-related tests passing

### Migration Notes

> **All existing users will need to re-login after this update.**

Old tokens in localStorage are no longer read. The new httpOnly cookie is set on login.

### Highlights

> Authentication is now immune to XSS token theft. The JWT lives in an httpOnly cookie that JavaScript cannot access. The server is the single source of truth for session state.

---

### TL;DR Changelog

**Added**
- httpOnly cookie authentication
- `ME_QUERY` for session bootstrap
- `useIsAdmin()` and `useIsEditorOrAdmin()` hooks
- Middleware redirect param preservation
- Comprehensive auth test suites

**Changed**
- Removed `authLink` from Apollo Client
- Removed token from login/register response
- AuthContext now uses server-validated session
- Middleware reads cookie only (no Authorization header)

**Removed**
- localStorage token storage
- js-cookie dependency for auth
- Client-side token reading

**Security**
- XSS protection via httpOnly cookie
- CSRF mitigation via `sameSite: 'strict'`
- Proper GraphQL error codes (`UNAUTHENTICATED`, `FORBIDDEN`)