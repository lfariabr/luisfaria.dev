import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { logger } from '@/lib/logger';
import { NONCE_HEADER, buildCsp, createNonce } from '@/lib/security/csp';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

const normalizeRole = (role?: string) => role?.toUpperCase();
const canViewPlaces = (role?: string) => role === 'ADMIN' || role === 'PARTNER';

// Places lived at two addresses before v3.25; both now point at one page.
const LEGACY_PLACES_PATHS = ['/relationship', '/admin/relationship'];
const isLegacyPlacesPath = (pathname: string) =>
  LEGACY_PLACES_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

// Every page gets a fresh nonce and the CSP that names it (#479). Next.js reads
// the nonce from the request's CSP header and stamps its own scripts with it.
function nextWithCsp(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildCsp(nonce, { isDev: process.env.NODE_ENV === 'development' });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export function proxy(request: NextRequest) {
  if (isLegacyPlacesPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/places', request.url), 308);
  }

  // Get token from httpOnly cookie only (no more Authorization header)
  const token = request.cookies.get('token')?.value;

  // Check if the path is a protected route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isNotesRoute = request.nextUrl.pathname.startsWith('/notes');
  const isPlacesRoute = request.nextUrl.pathname.startsWith('/places');
  const isProtectedRoute = isAdminRoute || isNotesRoute || isPlacesRoute;

  if (isProtectedRoute) {
    // No token - redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Decode and verify the token
      const decoded = jwtDecode<DecodedToken>(token);

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        logger.warn('Token expired', { path: request.nextUrl.pathname });
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      const role = normalizeRole(decoded.role);

      // Admin route requires admin role
      if (isAdminRoute && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      if (isPlacesRoute && !canViewPlaces(role)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      logger.error('Token decoding failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: request.nextUrl.pathname,
      });
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return nextWithCsp(request);
}

// Every page, for the CSP. Skips route handlers (/api), build assets, image
// optimisation and files served from /public or generated (icons, robots, sitemap).
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|txt|xml|webmanifest|js|css|map)$).*)',
  ],
};
