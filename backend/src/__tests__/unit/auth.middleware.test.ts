// npm test -- --testPathPattern="auth.middleware" --verbose

import { Request } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import { getUser } from '../../middleware/auth';

describe('Auth Middleware - getUser', () => {
  // Use the actual JWT secret from config (loaded from env)
  const jwtSecret = config.jwtSecret;

  const mockPayload = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'USER',
  };

  const createMockRequest = (options: {
    cookies?: Record<string, string>;
    authorization?: string;
  }): Request => ({
    cookies: options.cookies || {},
    headers: {
      authorization: options.authorization,
    },
  } as unknown as Request);

  describe('Cookie Authentication', () => {
    it('should extract user from cookie token', () => {
      const token = jwt.sign(mockPayload, jwtSecret);
      const req = createMockRequest({ cookies: { token } });

      const user = getUser(req);

      expect(user).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('should return null if no cookie token', () => {
      const req = createMockRequest({});

      const user = getUser(req);

      expect(user).toBeNull();
    });
  });

  describe('Authorization Header Authentication', () => {
    it('should extract user from Authorization Bearer header', () => {
      const token = jwt.sign(mockPayload, jwtSecret);
      const req = createMockRequest({
        authorization: `Bearer ${token}`,
      });

      const user = getUser(req);

      expect(user).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('should return null for invalid Bearer format', () => {
      const token = jwt.sign(mockPayload, jwtSecret);
      const req = createMockRequest({
        authorization: `Basic ${token}`, // Wrong scheme
      });

      const user = getUser(req);

      expect(user).toBeNull();
    });

    it('should return null for missing Bearer prefix', () => {
      const token = jwt.sign(mockPayload, jwtSecret);
      const req = createMockRequest({
        authorization: token, // No "Bearer " prefix
      });

      const user = getUser(req);

      expect(user).toBeNull();
    });
  });

  describe('Priority: Cookie over Header', () => {
    it('should prefer cookie token over Authorization header', () => {
      const cookiePayload = { ...mockPayload, id: 'cookie-user' };
      const headerPayload = { ...mockPayload, id: 'header-user' };

      const cookieToken = jwt.sign(cookiePayload, jwtSecret);
      const headerToken = jwt.sign(headerPayload, jwtSecret);

      const req = createMockRequest({
        cookies: { token: cookieToken },
        authorization: `Bearer ${headerToken}`,
      });

      const user = getUser(req);

      expect(user?.id).toBe('cookie-user');
    });

    it('should fallback to header when cookie is absent', () => {
      const headerPayload = { ...mockPayload, id: 'header-user' };
      const headerToken = jwt.sign(headerPayload, jwtSecret);

      const req = createMockRequest({
        authorization: `Bearer ${headerToken}`,
      });

      const user = getUser(req);

      expect(user?.id).toBe('header-user');
    });
  });

  describe('Invalid Tokens', () => {
    it('should return null for expired token in cookie', () => {
      const expiredToken = jwt.sign(mockPayload, jwtSecret, { expiresIn: '-1s' });
      const req = createMockRequest({ cookies: { token: expiredToken } });

      const user = getUser(req);

      expect(user).toBeNull();
    });

    it('should return null for expired token in header', () => {
      const expiredToken = jwt.sign(mockPayload, jwtSecret, { expiresIn: '-1s' });
      const req = createMockRequest({
        authorization: `Bearer ${expiredToken}`,
      });

      const user = getUser(req);

      expect(user).toBeNull();
    });

    it('should return null for token signed with wrong secret', () => {
      const badToken = jwt.sign(mockPayload, 'wrong-secret');
      const req = createMockRequest({
        authorization: `Bearer ${badToken}`,
      });

      const user = getUser(req);

      expect(user).toBeNull();
    });

    it('should return null for malformed token', () => {
      const req = createMockRequest({
        authorization: 'Bearer not-a-valid-jwt',
      });

      const user = getUser(req);

      expect(user).toBeNull();
    });
  });

  describe('Role Normalization', () => {
    it('should normalize lowercase admin role to ADMIN', () => {
      const token = jwt.sign({ ...mockPayload, role: 'admin' }, jwtSecret);
      const req = createMockRequest({ authorization: `Bearer ${token}` });

      const user = getUser(req);

      expect(user?.role).toBe('ADMIN');
    });

    it('should normalize lowercase editor role to EDITOR', () => {
      const token = jwt.sign({ ...mockPayload, role: 'editor' }, jwtSecret);
      const req = createMockRequest({ authorization: `Bearer ${token}` });

      const user = getUser(req);

      expect(user?.role).toBe('EDITOR');
    });

    it('should normalize lowercase user role to USER', () => {
      const token = jwt.sign({ ...mockPayload, role: 'user' }, jwtSecret);
      const req = createMockRequest({ authorization: `Bearer ${token}` });

      const user = getUser(req);

      expect(user?.role).toBe('USER');
    });
  });
});
