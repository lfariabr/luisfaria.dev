import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import User from '../../models/User';
import { connectRedis, disconnectRedis, getRedisClient } from '../../services/redis';

const mockNotifyDiscord = jest.fn().mockResolvedValue(undefined);
jest.mock('../../services/discord', () => ({
  notifyDiscord: (...args: unknown[]) => mockNotifyDiscord(...args),
}));

jest.mock('../../services/claude', () => ({
}));

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user { id email }
    }
  }
`;

const ACTIVATE_GOGGINS_MODE_MUTATION = `
  mutation ActivateGogginsMode($input: ScreamInput!) {
    activateGogginsMode(input: $input) {
      id
      userEmail
    }
  }
`;

const registerInput = (email: string) => ({
  input: {
    name: 'Notify User',
    email,
    password: 'Test1234!',
    captchaToken: 'test-turnstile-pass',
  },
});

const errorsOf = (response: Awaited<ReturnType<typeof executeOperation>>) =>
  response.body.kind === 'single' ? response.body.singleResult.errors : undefined;

describe('Discord notifications from the backend', () => {
  beforeAll(async () => {
    await dbHandler.connect();
    await connectRedis();
  });

  beforeEach(async () => {
    await getRedisClient().flushDb();
    mockNotifyDiscord.mockReset().mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
    await disconnectRedis();
  });

  describe('register', () => {
    it('notifies Discord once with the normalized email after the user is saved', async () => {
      const response = await executeOperation(REGISTER_MUTATION, registerInput('New.User@Example.com'));

      expect(errorsOf(response)).toBeUndefined();
      expect(await User.findOne({ email: 'new.user@example.com' })).not.toBeNull();
      expect(mockNotifyDiscord).toHaveBeenCalledTimes(1);
      expect(mockNotifyDiscord).toHaveBeenCalledWith('📝 New registration: new.user@example.com');
    });

    it('does not notify when the email is already in use', async () => {
      await User.create({ name: 'Existing', email: 'taken@example.com', password: 'Test1234!' });

      const response = await executeOperation(REGISTER_MUTATION, registerInput('taken@example.com'));

      expect(errorsOf(response)?.[0]?.message).toBe('Email already in use');
      expect(mockNotifyDiscord).not.toHaveBeenCalled();
    });

    it('still registers when the Discord notification rejects', async () => {
      mockNotifyDiscord.mockRejectedValue(new Error('discord down'));

      const response = await executeOperation(REGISTER_MUTATION, registerInput('resilient@example.com'));

      expect(errorsOf(response)).toBeUndefined();
      expect(await User.findOne({ email: 'resilient@example.com' })).not.toBeNull();
    });
  });

  describe('activateGogginsMode', () => {
    it('notifies Discord with the email and tone after the scream is created', async () => {
      const response = await executeOperation(
        ACTIVATE_GOGGINS_MODE_MUTATION,
        { input: { userEmail: 'grinder@example.com', explicitMode: true } },
        {},
      );

      expect(errorsOf(response)).toBeUndefined();
      expect(mockNotifyDiscord).toHaveBeenCalledTimes(1);
      expect(mockNotifyDiscord).toHaveBeenCalledWith('💪 Goggins mode: grinder@example.com (tone: explicit)');
    });

    it('does not notify for an invalid email', async () => {
      const response = await executeOperation(
        ACTIVATE_GOGGINS_MODE_MUTATION,
        { input: { userEmail: 'not-an-email', explicitMode: false } },
        {},
      );

      expect(errorsOf(response)).toBeDefined();
      expect(mockNotifyDiscord).not.toHaveBeenCalled();
    });

    it('still returns the scream when the Discord notification rejects', async () => {
      mockNotifyDiscord.mockRejectedValue(new Error('discord down'));

      const response = await executeOperation(
        ACTIVATE_GOGGINS_MODE_MUTATION,
        { input: { userEmail: 'steady@example.com', explicitMode: false } },
        {},
      );

      expect(errorsOf(response)).toBeUndefined();
      expect(mockNotifyDiscord).toHaveBeenCalledWith('💪 Goggins mode: steady@example.com (tone: filtered)');
    });
  });
});
