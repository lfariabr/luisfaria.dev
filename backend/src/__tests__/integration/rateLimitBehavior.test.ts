// npm test -- --testPathPattern="rateLimitBehavior" --verbose
// Behavior changes from #339, exercised through the GraphQL schema.

import mongoose from 'mongoose';
import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import { connectRedis, disconnectRedis, getRedisClient } from '../../services/redis';

jest.mock('../../services/openai', () => ({
  chatWithAI: jest.fn().mockResolvedValue('mock answer'),
  chatWithGogginsMode: jest.fn().mockResolvedValue('mock scream'),
}));

jest.mock('../../services/apod/', () => {
  const actual = jest.requireActual('../../services/apod/');
  return { ...actual, fetchApod: jest.fn() };
});

jest.mock('../../services/cache/apodCache', () => ({
  apodCache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    buildTodayKey: jest.fn().mockReturnValue('date:2024-01-15'),
    buildDateKey: jest.fn((date: string) => `date:${date}`),
  },
}));

const { fetchApod } = require('../../services/apod/');

const ASK = `mutation Ask($q: String!) { askQuestion(question: $q) { message { id } } }`;
const GOGGINS = `mutation G($input: ScreamInput!) { activateGogginsMode(input: $input) { id } }`;
const REGISTER = `mutation R($input: RegisterInput!) { register(input: $input) { user { id } } }`;
const APOD_TODAY = `query { getTodaysApod { date } }`;
const APOD_DATE = `query D($date: String!) { getApodByDate(date: $date) { date } }`;

type Result = Awaited<ReturnType<typeof executeOperation>>;
const firstError = (r: Result) => (r.body.kind === 'single' ? r.body.singleResult.errors?.[0] : undefined);

const registerInput = (email: string) => ({
  input: { name: 'Rate Test', email, password: 'Test1234!', captchaToken: 'test-turnstile-pass' },
});

const failRedis = () => jest.spyOn(getRedisClient(), 'eval').mockRejectedValue(new Error('redis down'));

beforeAll(async () => {
  await dbHandler.connect();
  await connectRedis();
});

beforeEach(async () => {
  await getRedisClient().flushDb();
  fetchApod.mockResolvedValue({ date: '2024-01-15', title: 't', explanation: 'e', url: 'u', media_type: 'image' });
});

afterEach(async () => {
  jest.restoreAllMocks();
  await dbHandler.clearDatabase();
});

afterAll(async () => {
  await dbHandler.closeDatabase();
  await disconnectRedis();
});

describe('Fail closed when Redis is down', () => {
  it('chatbot returns SERVICE_UNAVAILABLE, not an answer', async () => {
    failRedis();
    const user = { id: new mongoose.Types.ObjectId().toString(), role: 'USER' };
    const response = await executeOperation(ASK, { q: 'hello there' }, { user });
    expect(firstError(response)?.extensions?.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('goggins returns SERVICE_UNAVAILABLE', async () => {
    failRedis();
    const response = await executeOperation(GOGGINS, { input: { userEmail: 'down@example.com', explicitMode: false } }, {});
    expect(firstError(response)?.extensions?.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('register returns SERVICE_UNAVAILABLE', async () => {
    failRedis();
    const response = await executeOperation(REGISTER, registerInput('down@example.com'), { clientIp: '203.0.113.1' });
    expect(firstError(response)?.extensions?.code).toBe('SERVICE_UNAVAILABLE');
  });
});

describe('Fail open when Redis is down', () => {
  it('APOD still answers', async () => {
    failRedis();
    const response = await executeOperation(APOD_TODAY, {}, { clientIp: '203.0.113.2' });
    expect(firstError(response)).toBeUndefined();
  });
});

describe('Register is a Silent rate limit', () => {
  it('over the email limit returns RATE_LIMITED with no numbers', async () => {
    let response!: Result;
    for (let i = 0; i < 4; i++) {
      response = await executeOperation(REGISTER, registerInput('silent@example.com'), { clientIp: `198.51.100.${i}` });
    }
    const error = firstError(response);
    expect(error?.message).toContain('Too many registration attempts');
    expect(error?.extensions?.code).toBe('RATE_LIMITED');
    expect(error?.extensions?.limit).toBeUndefined();
    expect(error?.extensions?.remaining).toBeUndefined();
  });

  it('a missing IP is counted under unknown instead of skipped', async () => {
    let response!: Result;
    for (let i = 0; i < 6; i++) {
      response = await executeOperation(REGISTER, registerInput(`noip${i}@example.com`), {});
    }
    expect(firstError(response)?.message).toContain('Too many registration attempts');
  });
});

describe('APOD is one Rate limit across today and by date', () => {
  it('a user gets 10 NASA fetches per hour in total, whichever query they use', async () => {
    const user = { id: new mongoose.Types.ObjectId().toString(), role: 'USER' };
    for (let i = 0; i < 6; i++) {
      const today = await executeOperation(APOD_TODAY, {}, { user, clientIp: '203.0.113.3' });
      expect(firstError(today)).toBeUndefined();
    }
    for (let i = 0; i < 4; i++) {
      const byDate = await executeOperation(APOD_DATE, { date: `2024-01-0${i + 1}` }, { user });
      expect(firstError(byDate)).toBeUndefined();
    }
    const eleventh = await executeOperation(APOD_DATE, { date: '2024-01-09' }, { user });
    expect(firstError(eleventh)?.extensions?.code).toBe('RATE_LIMITED');
    expect(firstError(eleventh)?.extensions?.limit).toBe(10);
  });
});
