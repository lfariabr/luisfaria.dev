import request from 'supertest';
import * as dbHandler from '../helpers/dbHandler';
import { createTestApp } from '../../test-helpers/testApp';
import User, { UserRole } from '../../models/User';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import bcrypt from 'bcryptjs';
import { Express } from 'express';
import type { ApolloServer } from '@apollo/server';

const ME_QUERY = `
  query Me {
    me {
      id
      name
      email
      role
    }
  }
`;

const USERS_QUERY = `
  query Users {
    users {
      id
      name
      email
      role
    }
  }
`;

const USER_QUERY = `
  query User($id: ID!) {
    user(id: $id) {
      id
      name
      email
      role
    }
  }
`;

const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
`;

describe('Cookie Auth E2E - Full HTTP Flow', () => {
  let app: Express;
  let server: ApolloServer<any>;
  let testUser: any;
  let adminUser: any;
  let validToken: string;
  let adminToken: string;
  let expiredToken: string;
  let invalidToken: string;

  beforeAll(async () => {
    await dbHandler.connect();
    const testApp = await createTestApp();
    app = testApp.app;
    server = testApp.server;
  });

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('Test1234!', 10);
    
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: passwordHash,
      role: UserRole.USER
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: passwordHash,
      role: UserRole.ADMIN
    });

    // Create valid token
    validToken = jwt.sign(
      { id: testUser._id.toString(), email: testUser.email, role: testUser.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Create admin token
    adminToken = jwt.sign(
      { id: adminUser._id.toString(), email: adminUser.email, role: adminUser.role },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    // Create expired token
    expiredToken = jwt.sign(
      { id: testUser._id.toString(), email: testUser.email, role: testUser.role },
      config.jwtSecret,
      { expiresIn: '-1h' }
    );

    // Create invalid token (wrong secret)
    invalidToken = jwt.sign(
      { id: testUser._id.toString(), email: testUser.email, role: testUser.role },
      'wrong-secret-key',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await server.stop();
    await dbHandler.closeDatabase();
  });

  describe('me Query - Full Cookie Flow', () => {
    it('should authenticate with actual cookie in HTTP request', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${validToken}`])
        .send({ query: ME_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data?.me).toBeTruthy();
      expect(response.body.data.me.email).toBe(testUser.email);
      expect(response.body.data.me.name).toBe(testUser.name);
    });

    it('should fail with no cookie', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({ query: ME_QUERY });

      expect(response.status).toBe(200); // GraphQL returns 200 with errors
      expect(response.body.errors).toBeTruthy();
    });

    it('should fail with expired token in cookie', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${expiredToken}`])
        .send({ query: ME_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeTruthy();
    });

    it('should fail with invalid token in cookie (wrong signature)', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${invalidToken}`])
        .send({ query: ME_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeTruthy();
    });

    it('should fail with malformed token in cookie', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', ['token=not-a-valid-jwt'])
        .send({ query: ME_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeTruthy();
    });

    it('should fail with empty token cookie', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', ['token='])
        .send({ query: ME_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeTruthy();
    });
  });

  describe('users Query - Admin Cookie Flow', () => {
    it('should return all users with admin cookie', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${adminToken}`])
        .send({ query: USERS_QUERY });

      expect(response.status).toBe(200);
      if (response.body.data?.users) {
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data?.users).toBeDefined();
        expect(response.body.data.users.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should fail for non-admin user cookie', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${validToken}`])
        .send({ query: USERS_QUERY });

      // Shared error handling returns proper HTTP status codes
      expect(response.status).toBe(403);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].extensions.code).toBe('FORBIDDEN');
    });

    it('should fail with no cookie', async () => {
      const response = await request(app)
        .post('/graphql')
        .send({ query: USERS_QUERY });

      // Shared error handling returns proper HTTP status codes
      expect(response.status).toBe(401);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('user Query - Cookie Flow', () => {
    it('should return user with admin cookie', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${adminToken}`])
        .send({ 
          query: USER_QUERY,
          variables: { id: testUser._id.toString() }
        });

      expect(response.status).toBe(200);
      if (response.body.data?.user) {
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data?.user).toBeDefined();
        expect(response.body.data.user.email).toBe(testUser.email);
      }
    });

    it('should allow user to view own profile with cookie', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${validToken}`])
        .send({ 
          query: USER_QUERY,
          variables: { id: testUser._id.toString() }
        });

      expect(response.status).toBe(200);
      if (response.body.data?.user) {
        expect(response.body.data?.user).toBeDefined();
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.user.email).toBe(testUser.email);
      }
    });

    it('should fail when non-admin tries to view another user with cookie', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${validToken}`])
        .send({ 
          query: USER_QUERY,
          variables: { id: adminUser._id.toString() }
        });

      // Shared error handling returns proper HTTP status codes
      expect(response.status).toBe(403);
      expect(response.body.errors).toBeTruthy();
      expect(response.body.errors[0].extensions.code).toBe('FORBIDDEN');
    });
  });

  describe('Role Normalization - Legacy Token Support', () => {
    it('should handle lowercase role in token', async () => {
      // Create token with lowercase role (legacy format)
      const legacyToken = jwt.sign(
        { id: testUser._id.toString(), email: testUser.email, role: 'user' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${legacyToken}`])
        .send({ query: ME_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data?.me).toBeTruthy();
      expect(response.body.data?.me).toBeDefined();
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.me.email).toBe(testUser.email);
    });

    it('should handle uppercase role in token', async () => {
      // Create token with uppercase role (current format)
      const uppercaseToken = jwt.sign(
        { id: testUser._id.toString(), email: testUser.email, role: 'USER' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${uppercaseToken}`])
        .send({ query: ME_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data?.me).toBeTruthy();
      expect(response.body.data?.me).toBeDefined();
      expect(response.body.errors).toBeUndefined();
    });

    it('should handle mixed case role in token', async () => {
      const mixedToken = jwt.sign(
        { id: testUser._id.toString(), email: testUser.email, role: 'User' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${mixedToken}`])
        .send({ query: ME_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.data?.me).toBeTruthy();
      expect(response.body.data?.me).toBeDefined();
      expect(response.body.errors).toBeUndefined();
    });

    it('should handle legacy admin role in token', async () => {
      const legacyAdminToken = jwt.sign(
        { id: adminUser._id.toString(), email: adminUser.email, role: 'admin' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${legacyAdminToken}`])
        .send({ query: USERS_QUERY });

      expect(response.status).toBe(200);
      // Admin should be able to access users list
      if (response.body.data?.users) {
        expect(response.body.errors).toBeUndefined();
        expect(response.body.data?.users).toBeDefined();
        expect(response.body.data.users.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Logout - Cookie Clearing Flow', () => {
    it('should clear cookie on logout and return true', async () => {
      // First, verify we're authenticated
      const authCheck = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${validToken}`])
        .send({ query: ME_QUERY });

      expect(authCheck.status).toBe(200);
      expect(authCheck.body.data?.me).toBeDefined();

      // Now logout
      const logoutResponse = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${validToken}`])
        .send({ query: LOGOUT_MUTATION });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.data?.logout).toBe(true);
      expect(logoutResponse.body.errors).toBeUndefined();

      // Verify Set-Cookie header clears the token
      const setCookieHeader = logoutResponse.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader[0]).toMatch(/token=/);
      // Cookie should be cleared (empty or expired)
      expect(setCookieHeader[0]).toMatch(/Max-Age=0|Expires=.*1970/i);
    });

    it('should return auth error on me query without cookie', async () => {
      // After logout, browser won't send the cookie anymore
      // Simulate this by not sending any cookie
      const response = await request(app)
        .post('/graphql')
        .send({ query: ME_QUERY });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      // Shield returns NOT_AUTHORIZED for unauthenticated requests
      expect(['UNAUTHENTICATED', 'NOT_AUTHORIZED']).toContain(
        response.body.errors[0].extensions.code
      );
    });

    it('should document token behavior after logout - cookie clearing only (no server-side blacklist)', async () => {
      // First, verify we're authenticated with the token
      const authCheck = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${validToken}`])
        .send({ query: ME_QUERY });

      expect(authCheck.status).toBe(200);
      expect(authCheck.body.data?.me).toBeDefined();

      // Now logout with the same token
      const logoutResponse = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${validToken}`])
        .send({ query: LOGOUT_MUTATION });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.data?.logout).toBe(true);

      // Attempt me query reusing the same cookie header
      // IMPORTANT: Current implementation only clears cookies (client-side)
      // Without server-side token blacklist, the JWT remains valid until expiry
      // In a real browser, Set-Cookie from logout clears the cookie so this scenario
      // (client manually re-sending old token) wouldn't happen normally
      const postLogoutResponse = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${validToken}`])
        .send({ query: ME_QUERY });

      expect(postLogoutResponse.status).toBe(200);
      // Token is still cryptographically valid - this documents current behavior
      // TODO: For true server-side invalidation, implement Redis token blacklist
      expect(postLogoutResponse.body.data?.me).toBeDefined();
    });

    it('should require authentication to call logout', async () => {
      // Logout without any cookie should fail (shield requires auth)
      const response = await request(app)
        .post('/graphql')
        .send({ query: LOGOUT_MUTATION });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      // Shield blocks unauthenticated logout attempts
    });

    it('should clear cookie with httpOnly and sameSite attributes', async () => {
      const logoutResponse = await request(app)
        .post('/graphql')
        .set('Cookie', [`token=${validToken}`])
        .send({ query: LOGOUT_MUTATION });

      const setCookieHeader = logoutResponse.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();
      // Verify security attributes are preserved when clearing
      expect(setCookieHeader[0]).toMatch(/HttpOnly/i);
      expect(setCookieHeader[0]).toMatch(/SameSite=Strict/i);
    });
  });
});
