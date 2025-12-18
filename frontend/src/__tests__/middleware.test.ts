// Types for mock responses
interface MockResponse {
  status: number;
  headers: { get: (key: string) => string | null };
}

interface MockNextRequest {
  nextUrl: { pathname: string };
  url: string;
  cookies: { get: (name: string) => { value: string } | undefined };
}

// Mock next/server before importing middleware
const mockRedirect = jest.fn<MockResponse, [URL]>((url: URL) => ({
  status: 307,
  headers: { get: (key: string) => key === 'location' ? url.toString() : null },
}));

const mockNext = jest.fn<MockResponse, []>(() => ({
  status: 200,
  headers: { get: () => null },
}));

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => mockRedirect(url),
    next: () => mockNext(),
  },
}));

import { middleware } from '../middleware';

// Helper to create a typed mock NextRequest
// Uses type assertion since we only mock the properties the middleware actually uses
function createMockRequest(pathname: string, token?: string): Parameters<typeof middleware>[0] {
  const url = new URL(pathname, 'http://localhost:3000');
  
  return {
    nextUrl: {
      pathname,
    },
    url: url.toString(),
    cookies: {
      get: (name: string) => {
        if (name === 'token' && token) {
          return { value: token };
        }
        return undefined;
      },
    },
  } as Parameters<typeof middleware>[0];
}

// Helper to create a valid JWT token (base64 encoded, not cryptographically signed)
function createMockToken(payload: { id: string; email: string; role: string; exp: number }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadWithIat = { ...payload, iat: Math.floor(Date.now() / 1000) };
  const payloadB64 = Buffer.from(JSON.stringify(payloadWithIat)).toString('base64url');
  const signature = 'mock_signature';
  return `${headerB64}.${payloadB64}.${signature}`;
}

describe('Middleware - Admin Route Protection', () => {
  const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

  beforeEach(() => {
    // Clear mock call history between tests
    mockRedirect.mockClear();
    mockNext.mockClear();
  });

  describe('No cookie scenarios', () => {
    it('redirects to /login when no token cookie is present on admin route', () => {
      const request = createMockRequest('/admin');
      const response = middleware(request);

      expect(response.status).toBe(307); // Temporary redirect
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=%2Fadmin');
    });

    it('redirects to /login with redirect param preserving full path', () => {
      const request = createMockRequest('/admin/users');
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('redirect=%2Fadmin%2Fusers');
    });

    it('allows access to non-admin routes without token', () => {
      const request = createMockRequest('/');
      const response = middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Valid admin token scenarios', () => {
    it('allows access to admin route with valid ADMIN token', () => {
      const token = createMockToken({
        id: '1',
        email: 'admin@test.com',
        role: 'ADMIN',
        exp: futureExp,
      });
      const request = createMockRequest('/admin', token);
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows access to nested admin routes with valid ADMIN token', () => {
      const token = createMockToken({
        id: '1',
        email: 'admin@test.com',
        role: 'ADMIN',
        exp: futureExp,
      });
      const request = createMockRequest('/admin/users/edit', token);
      const response = middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Valid non-admin token scenarios', () => {
    it('redirects to / when USER role accesses admin route', () => {
      const token = createMockToken({
        id: '2',
        email: 'user@test.com',
        role: 'USER',
        exp: futureExp,
      });
      const request = createMockRequest('/admin', token);
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('redirects to / when EDITOR role accesses admin route', () => {
      const token = createMockToken({
        id: '3',
        email: 'editor@test.com',
        role: 'EDITOR',
        exp: futureExp,
      });
      const request = createMockRequest('/admin', token);
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/');
    });
  });

  describe('Expired/invalid token scenarios', () => {
    it('redirects to /login with redirect param when token is expired', () => {
      const token = createMockToken({
        id: '1',
        email: 'admin@test.com',
        role: 'ADMIN',
        exp: pastExp,
      });
      const request = createMockRequest('/admin', token);
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=%2Fadmin');
    });

    it('redirects to /login with redirect param when token is malformed', () => {
      const request = createMockRequest('/admin/users', 'invalid.token.here');
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=%2Fadmin%2Fusers');
    });

    it('redirects to /login with redirect param when token is empty string', () => {
      const request = createMockRequest('/admin/settings', '');
      const response = middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
      expect(response.headers.get('location')).toContain('redirect=%2Fadmin%2Fsettings');
    });
  });

  describe('Non-admin routes', () => {
    it('allows access to home page without token', () => {
      const request = createMockRequest('/');
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows access to login page without token', () => {
      const request = createMockRequest('/login');
      const response = middleware(request);

      expect(response.status).toBe(200);
    });

    it('allows access to public routes with any token', () => {
      const token = createMockToken({
        id: '2',
        email: 'user@test.com',
        role: 'USER',
        exp: futureExp,
      });
      const request = createMockRequest('/projects', token);
      const response = middleware(request);

      expect(response.status).toBe(200);
    });
  });
  
  describe('Error handling', () => {
    it('handles token decoding errors gracefully', () => {
      // This test ensures the middleware doesn't crash on invalid tokens
      const request = createMockRequest('/admin', 'not.a.valid.token');
      const response = middleware(request);
      // Should redirect to login due to invalid token
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });
  });
});
