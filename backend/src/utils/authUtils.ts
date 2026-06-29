import { Errors } from './errors';
import { UserRole } from '../models/User';

// Check if user is authenticated
export const checkAuth = (context: any) => {
  if (!context.user) {
    throw Errors.unauthenticated('Not authenticated');
  }
  return context.user;
};

// Check if user has the required role (ADMIN always passes). `context.user.role`
// is normalized to the uppercase UserRole enum upstream in getUser().
export const checkRole = (context: any, requiredRole: string = UserRole.ADMIN) => {
  const user = checkAuth(context);

  if (user.role !== requiredRole && user.role !== UserRole.ADMIN) {
    throw Errors.forbidden('Not authorized');
  }

  return user;
};

// Cookie Options
// `sameSite: 'lax'` (not 'strict') so the auth cookie is still sent on top-level
// navigations into protected routes (e.g. a bookmark or external link to /admin).
// 'strict' withheld the cookie on that first navigation, making middleware bounce an
// already-logged-in user to /login. 'lax' keeps CSRF protection for cross-site POSTs.
export const AUTH_COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

// Optional: scope the cookie to a parent domain (e.g. `.luisfaria.dev`) to cover
// subdomains. Left unset by default — the nginx www→apex redirect already keeps every
// request on a single host, so a host-only cookie is sufficient and avoids leaking the
// cookie to unrelated future subdomains.
if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
  (AUTH_COOKIE_BASE_OPTIONS as Record<string, unknown>).domain = process.env.COOKIE_DOMAIN;
}

export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days