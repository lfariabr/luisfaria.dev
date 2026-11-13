import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import User, { UserRole } from '../../models/User';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import { AUTH_COOKIE_MAX_AGE } from '../../utils/authUtils';
import { connectRedis, disconnectRedis, getRedisClient } from '../../services/redis';

const mockNotifyDiscord = jest.fn().mockResolvedValue(undefined);
jest.mock('../../services/discord', () => ({
  notifyDiscord: (...args: unknown[]) => mockNotifyDiscord(...args),
}));

// Define test queries and mutations
const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        role
      }
    }
  }
`;

describe('Auth Resolvers', () => {
  // Connect to database before tests
  beforeAll(async () => {
    await dbHandler.connect();
    await connectRedis();
  });

  beforeEach(async () => {
    await getRedisClient().flushDb();
  });

  // Clear database between tests
  afterEach(async () => {
    await dbHandler.clearDatabase();
    jest.restoreAllMocks();
  });

  // Disconnect after all tests
  afterAll(async () => {
    await dbHandler.closeDatabase();
    await disconnectRedis();
  });

  describe('Register Mutation', () => {
    it('should register a new user successfully', async () => {
      const variables = {
        input: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test1234!',
          captchaToken: 'test-turnstile-pass',
        }
      };

      const response = await executeOperation(REGISTER_MUTATION, variables);
      
      // Check response structure
      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        expect(data).toHaveProperty('register');
        
        // Use type assertion to help TypeScript understand the structure
        const register = data?.register as any;
        expect(register).toHaveProperty('token');
        expect(register).toHaveProperty('user');
        expect(register.user).toHaveProperty('id');
        expect(register.user.name).toBe(variables.input.name);
        expect(register.user.email).toBe(variables.input.email);
        expect(register.user.role).toBe(UserRole.USER);
        
        // Verify JWT token
        const decodedToken: any = jwt.verify(register.token, config.jwtSecret);
        expect(decodedToken).toHaveProperty('id');
        expect(decodedToken).toHaveProperty('email', variables.input.email);
        
        // Check user was saved to database
        const userInDb = await User.findOne({ email: variables.input.email });
        expect(userInDb).toBeTruthy();
        expect(userInDb?.name).toBe(variables.input.name);
      }
    });
    
    it('should fail with validation error for invalid email', async () => {
      const variables = {
        input: {
          name: 'Test User',
          email: 'invalid-email',
          password: 'Test1234!',
          captchaToken: 'test-turnstile-pass',
        }
      };

      const response = await executeOperation(REGISTER_MUTATION, variables);
      
      // Check error response
      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeTruthy();
        const errorMessage = response.body.singleResult.errors?.[0].message;
        expect(errorMessage).toContain('Permission denied');
      }
    });

    it('should fail when captcha token is invalid', async () => {
      const variables = {
        input: {
          name: 'Test User',
          email: 'captcha-fail@example.com',
          password: 'Test1234!',
          captchaToken: 'invalid-token',
        }
      };

      const response = await executeOperation(REGISTER_MUTATION, variables);
      expect(response.body.kind).toBe('single');

      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeTruthy();
        const errorMessage = response.body.singleResult.errors?.[0].message;
        expect(errorMessage).toContain('Captcha verification failed');
      }
    });

    it('should fail when email rate limit is exceeded', async () => {
      const variables = {
        input: {
          name: 'Test User',
          email: 'throttle@example.com',
          password: 'Test1234!',
          captchaToken: 'test-turnstile-pass',
        },
      };

      for (let i = 0; i < 3; i++) {
        await executeOperation(REGISTER_MUTATION, variables, { clientIp: `203.0.113.${10 + i}` });
      }
      const response = await executeOperation(REGISTER_MUTATION, variables, { clientIp: '203.0.113.20' });
      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const errorMessage = response.body.singleResult.errors?.[0].message;
        expect(errorMessage).toContain('Too many registration attempts');
      }
    });

    it('should fail when ip rate limit is exceeded', async () => {
      const variablesFor = (i: number) => ({
        input: {
          name: 'Test User',
          email: `ip-limit-${i}@example.com`,
          password: 'Test1234!',
          captchaToken: 'test-turnstile-pass',
        },
      });

      for (let i = 0; i < 5; i++) {
        await executeOperation(REGISTER_MUTATION, variablesFor(i), { clientIp: '198.51.100.7' });
      }
      const response = await executeOperation(REGISTER_MUTATION, variablesFor(5), { clientIp: '198.51.100.7' });
      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const errorMessage = response.body.singleResult.errors?.[0].message;
        expect(errorMessage).toContain('Too many registration attempts');
      }
    });
  });

  describe('Login Mutation', () => {
    beforeEach(async () => {
      // Plaintext here: the User pre-save hook hashes it exactly once.
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test1234!',
        role: UserRole.USER
      });
    });

    it('should login successfully with correct credentials', async () => {
      const variables = {
        input: {
          email: 'test@example.com',
          password: 'Test1234!'
        }
      };
      const res = { cookie: jest.fn() };
      const before = Date.now();

      const response = await executeOperation(LOGIN_MUTATION, variables, { res });

      expect(response.body.kind).toBe('single');
      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return; // narrows the type; the line above already failed otherwise
      expect(response.body.singleResult.errors).toBeUndefined();

      const login = response.body.singleResult.data?.login as {
        token: string;
        user: { id: string; email: string; role: string };
      };
      expect(login.user.email).toBe(variables.input.email);
      expect(login.user.role).toBe(UserRole.USER);

      const decodedToken = jwt.verify(login.token, config.jwtSecret) as jwt.JwtPayload;
      expect(decodedToken.id).toBe(login.user.id);
      expect(decodedToken.email).toBe(variables.input.email);

      // The resolver sets the auth cookie that becomes the Set-Cookie header.
      expect(res.cookie).toHaveBeenCalledTimes(1);
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        login.token,
        expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: AUTH_COOKIE_MAX_AGE })
      );

      const stored = await User.findOne({ email: variables.input.email });
      expect(stored?.lastLogin).toBeInstanceOf(Date);
      expect(stored!.lastLogin!.getTime()).toBeGreaterThanOrEqual(before);
    });
    
    it('should fail with incorrect password', async () => {
      const variables = {
        input: {
          email: 'test@example.com',
          password: 'WrongPassword123!'
        }
      };

      const response = await executeOperation(LOGIN_MUTATION, variables);
      
      // Check error response
      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        expect(response.body.singleResult.errors).toBeTruthy();
        const errorMessage = response.body.singleResult.errors?.[0].message;
        expect(errorMessage).toContain('Invalid email or password');
      }
    });
  });

  describe('Login Discord notification', () => {
    beforeEach(async () => {
      mockNotifyDiscord.mockReset().mockResolvedValue(undefined);
      // Plaintext here: the User pre-save hook hashes it exactly once.
      await User.create({
        name: 'Notify User',
        email: 'notify@example.com',
        password: 'Test1234!',
        role: UserRole.USER,
      });
    });

    it('notifies Discord on a successful login', async () => {
      const response = await executeOperation(LOGIN_MUTATION, {
        input: { email: 'Notify@Example.com', password: 'Test1234!' },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(mockNotifyDiscord).toHaveBeenCalledTimes(1);
      expect(mockNotifyDiscord).toHaveBeenCalledWith('🔐 Login: notify@example.com');
    });

    it('does not notify Discord when the password is wrong', async () => {
      const response = await executeOperation(LOGIN_MUTATION, {
        input: { email: 'notify@example.com', password: 'WrongPassword123!' },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(mockNotifyDiscord).not.toHaveBeenCalled();
    });

    it('does not notify Discord for an unknown email', async () => {
      await executeOperation(LOGIN_MUTATION, {
        input: { email: 'nobody@example.com', password: 'Test1234!' },
      });

      expect(mockNotifyDiscord).not.toHaveBeenCalled();
    });

    it('still logs in when the Discord notification rejects', async () => {
      mockNotifyDiscord.mockRejectedValue(new Error('discord down'));

      const response = await executeOperation(LOGIN_MUTATION, {
        input: { email: 'notify@example.com', password: 'Test1234!' },
      });

      expect(response.body.kind).toBe('single');
      if (response.body.kind !== 'single') return;
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data?.login).toBeTruthy();
    });
  });

  describe('Login Rate limits', () => {
    const LOGIN_LIMIT_MESSAGE = 'Too many login attempts';

    const loginErrorMessage = async (email: string, password: string, clientIp: string) => {
      const response = await executeOperation(LOGIN_MUTATION, { input: { email, password } }, { clientIp });
      if (response.body.kind !== 'single') throw new Error('expected a single result');
      return response.body.singleResult.errors?.[0].message;
    };

    beforeEach(async () => {
      // Plaintext here: the User pre-save hook hashes it exactly once.
      await User.create({
        name: 'Limit User',
        email: 'limit@example.com',
        password: 'Test1234!',
        role: UserRole.USER,
      });
    });

    it('blocks an email after 10 attempts, even with the right password and a fresh IP', async () => {
      for (let i = 0; i < 10; i++) {
        await loginErrorMessage('limit@example.com', 'WrongPassword123!', `203.0.113.${10 + i}`);
      }

      const message = await loginErrorMessage('Limit@Example.com', 'Test1234!', '203.0.113.99');
      expect(message).toContain(LOGIN_LIMIT_MESSAGE);
    });

    it('blocks an IP after 20 attempts across different emails', async () => {
      for (let i = 0; i < 20; i++) {
        await loginErrorMessage(`spray-${i}@example.com`, 'WrongPassword123!', '198.51.100.7');
      }

      const message = await loginErrorMessage('limit@example.com', 'Test1234!', '198.51.100.7');
      expect(message).toContain(LOGIN_LIMIT_MESSAGE);
    });

    it('does not block other IPs or emails', async () => {
      for (let i = 0; i < 20; i++) {
        await loginErrorMessage(`spray-${i}@example.com`, 'WrongPassword123!', '198.51.100.7');
      }

      const message = await loginErrorMessage('limit@example.com', 'Test1234!', '198.51.100.8');
      expect(message).toBeUndefined();
    });

    it('blocks unknown emails too, so the limit reveals nothing about which accounts exist', async () => {
      for (let i = 0; i < 10; i++) {
        await loginErrorMessage('nobody@example.com', 'WrongPassword123!', `203.0.113.${10 + i}`);
      }

      const unknownEmail = await loginErrorMessage('nobody@example.com', 'WrongPassword123!', '203.0.113.99');
      expect(unknownEmail).toContain(LOGIN_LIMIT_MESSAGE);
    });
  });
});
