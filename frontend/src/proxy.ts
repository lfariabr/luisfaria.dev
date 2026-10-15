import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { logger } from '@/lib/logger';

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

  return NextResponse.next();
}

// Configure which paths this proxy applies to
export const config = {
  matcher: ['/admin/:path*', '/notes/:path*', '/places/:path*', '/relationship/:path*'],
};
