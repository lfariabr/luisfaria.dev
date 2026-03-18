import { Errors } from './errors';

// Check if user is authenticated
export const checkAuth = (context: any) => {
  if (!context.user) {
    throw Errors.unauthenticated('Not authenticated');
  }
  return context.user;
};

// Check if user has the required role
export const checkRole = (context: any, requiredRole: string = 'admin') => {
  const user = checkAuth(context);
  
  if (user.role !== requiredRole && user.role !== 'admin') {
    throw Errors.forbidden('Not authorized');
  }
  
  return user;
};

// Cookie Options
export const AUTH_COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
  (AUTH_COOKIE_BASE_OPTIONS as Record<string, unknown>).domain = process.env.COOKIE_DOMAIN;
}

export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days