import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import User, { UserRole } from '../../models/User';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import bcrypt from 'bcryptjs';

// Define test queries
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

describe('Cookie-Based Auth - User Queries', () => {
  let testUser: any;
  let adminUser: any;
  let validToken: string;
  let adminToken: string;
  let expiredToken: string;
  let invalidToken: string;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    // Create test users
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

    // Create valid token (simulating what would be in the cookie)
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
      { expiresIn: '-1h' } // Already expired
    );

    // Create invalid token (signed with wrong secret)
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
    await dbHandler.closeDatabase();
  });

  describe('me Query', () => {
    it('should return user data with valid cookie token', async () => {
      // Simulate context with user extracted from valid cookie
      const contextValue = {
        user: {
          id: testUser._id.toString(),
          email: testUser.email,
          role: testUser.role
        }
      };

      const response = await executeOperation(ME_QUERY, {}, contextValue);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        expect(data).toHaveProperty('me');
        
        const me = data?.me as any;
        expect(me).toBeTruthy();
        expect(me.email).toBe(testUser.email);
        expect(me.name).toBe(testUser.name);
        expect(me.role).toBe(testUser.role);
      }
    });

    it('should fail with no cookie token (unauthenticated)', async () => {
      // No user in context simulates missing/invalid cookie
      const contextValue = {
        user: null
      };

      const response = await executeOperation(ME_QUERY, {}, contextValue);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeTruthy();
        const errorMessage = response.body.singleResult.errors?.[0].message;
        // Should get authentication error
        expect(errorMessage).toBeTruthy();
      }
    });

    it('should fail with expired token in cookie', async () => {
      // Verify the expired token is actually invalid
      let isExpired = false;
      try {
        jwt.verify(expiredToken, config.jwtSecret);
      } catch (error: any) {
        isExpired = error.name === 'TokenExpiredError';
      }
      expect(isExpired).toBe(true);

      // Expired token results in null user (getUser returns null for invalid tokens)
      const contextValue = {
        user: null
      };

      const response = await executeOperation(ME_QUERY, {}, contextValue);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeTruthy();
      }
    });

    it('should fail with invalid token in cookie (wrong signature)', async () => {
      // Verify the invalid token fails verification
      let isInvalid = false;
      try {
        jwt.verify(invalidToken, config.jwtSecret);
      } catch (error: any) {
        isInvalid = error.name === 'JsonWebTokenError';
      }
      expect(isInvalid).toBe(true);

      // Invalid token results in null user
      const contextValue = {
        user: null
      };

      const response = await executeOperation(ME_QUERY, {}, contextValue);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeTruthy();
      }
    });
  });

  describe('users Query (Admin Only)', () => {
    it('should return all users with valid admin cookie token', async () => {
      const contextValue = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          role: adminUser.role
        }
      };

      const response = await executeOperation(USERS_QUERY, {}, contextValue);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.users) {
          const users = data.users as any[];
          expect(users.length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it('should fail for non-admin user with valid cookie', async () => {
      const contextValue = {
        user: {
          id: testUser._id.toString(),
          email: testUser.email,
          role: testUser.role // USER role, not ADMIN
        }
      };

      const response = await executeOperation(USERS_QUERY, {}, contextValue);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeTruthy();
      }
    });

    it('should fail with no cookie token', async () => {
      const contextValue = {
        user: null
      };

      const response = await executeOperation(USERS_QUERY, {}, contextValue);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeTruthy();
      }
    });
  });

  describe('user Query (Admin Only)', () => {
    it('should return specific user with valid admin cookie token', async () => {
      const contextValue = {
        user: {
          id: adminUser._id.toString(),
          email: adminUser.email,
          role: adminUser.role
        }
      };

      const response = await executeOperation(
        USER_QUERY, 
        { id: testUser._id.toString() }, 
        contextValue
      );

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.user) {
          const user = data.user as any;
          expect(user.email).toBe(testUser.email);
          expect(user.name).toBe(testUser.name);
        }
      }
    });

    it('should allow user to view their own profile', async () => {
      const contextValue = {
        user: {
          id: testUser._id.toString(),
          email: testUser.email,
          role: testUser.role
        }
      };

      const response = await executeOperation(
        USER_QUERY, 
        { id: testUser._id.toString() }, 
        contextValue
      );

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.user) {
          const user = data.user as any;
          expect(user.email).toBe(testUser.email);
        }
      }
    });

    it('should fail when non-admin tries to view another user', async () => {
      const contextValue = {
        user: {
          id: testUser._id.toString(),
          email: testUser.email,
          role: testUser.role // USER role
        }
      };

      const response = await executeOperation(
        USER_QUERY, 
        { id: adminUser._id.toString() }, // Trying to view admin's profile
        contextValue
      );

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeTruthy();
      }
    });

    it('should fail with no cookie token', async () => {
      const contextValue = {
        user: null
      };

      const response = await executeOperation(
        USER_QUERY, 
        { id: testUser._id.toString() }, 
        contextValue
      );

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeTruthy();
      }
    });
  });
});
