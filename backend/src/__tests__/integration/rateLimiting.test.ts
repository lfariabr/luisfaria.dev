// npm test -- --testPathPattern="integration/rateLimiting" --verbose

import { connectRedis, disconnectRedis, getRedisClient } from '../../services/redis';
import {
  consume,
  rateLimits,
  RateLimitExceeded,
  RateLimitUnavailable,
  Subject,
  toGraphQLError,
} from '../../rateLimiting';

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
const { logger } = require('../../utils/logger');

const redis = () => getRedisClient();

const exhaust = async (times: number, run: () => Promise<unknown>) => {
  for (let i = 0; i < times; i++) await run();
};

const caught = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error('expected a throw');
};

beforeAll(async () => {
  await connectRedis();
});

beforeEach(async () => {
  jest.clearAllMocks();
  await redis().flushDb();
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await disconnectRedis();
});

describe('consume', () => {
  it('counts down remaining and allows exactly the limit', async () => {
    const subject = Subject.user('u1');
    const first = await consume('chatbot', subject);
    expect(first).toEqual(expect.objectContaining({ limit: 5, remaining: 4 }));

    await exhaust(3, () => consume('chatbot', subject));
    const last = await consume('chatbot', subject);
    expect(last.remaining).toBe(0);

    const error = await caught(() => consume('chatbot', subject));
    expect(error).toBeInstanceOf(RateLimitExceeded);
    expect((error as RateLimitExceeded).info).toEqual(expect.objectContaining({ limit: 5, remaining: 0 }));
    expect(logger.warn).toHaveBeenCalledWith('Rate limit exceeded', { rateLimit: 'chatbot', subjectKind: 'user' });
  });

  it('resets when the Window ends', async () => {
    const subject = Subject.email('Reset@Example.com ');
    await exhaust(2, () => consume('goggins', subject));
    await expect(consume('goggins', subject)).rejects.toBeInstanceOf(RateLimitExceeded);

    await redis().expire('rl:goggins:email:reset@example.com', 1);
    await new Promise((resolve) => setTimeout(resolve, 1100));

    await expect(consume('goggins', subject)).resolves.toEqual(expect.objectContaining({ remaining: 1 }));
  });

  it('reports resetTime from the Window, not from the latest request', async () => {
    const before = Date.now();
    const info = await consume('goggins', Subject.email('window@example.com'));
    const secondsLeft = (info.resetTime.getTime() - before) / 1000;
    expect(secondsLeft).toBeGreaterThan(rateLimits.goggins.windowSeconds - 5);
    expect(secondsLeft).toBeLessThanOrEqual(rateLimits.goggins.windowSeconds + 1);
  });

  it('uses the limit for the Subject kind', async () => {
    await exhaust(5, () => consume('apod', Subject.ip('203.0.113.9')));
    await expect(consume('apod', Subject.ip('203.0.113.9'))).rejects.toBeInstanceOf(RateLimitExceeded);

    await exhaust(10, () => consume('apod', Subject.user('u2')));
    await expect(consume('apod', Subject.user('u2'))).rejects.toBeInstanceOf(RateLimitExceeded);
  });

  it('keeps Subjects of different kinds apart', async () => {
    await exhaust(5, () => consume('apod', Subject.ip('same')));
    await expect(consume('apod', Subject.user('same'))).resolves.toBeDefined();
  });

  it('counts every missing Subject together under unknown, and warns', async () => {
    await exhaust(5, () => consume('registerByIp', Subject.ip(undefined)));
    await expect(consume('registerByIp', Subject.ip(''))).rejects.toBeInstanceOf(RateLimitExceeded);
    expect(await redis().get('rl:registerByIp:ip:unknown')).toBe('5');
    expect(logger.warn).toHaveBeenCalledWith('Rate limit subject missing; counting as unknown', {
      rateLimit: 'registerByIp',
      subjectKind: 'ip',
    });
  });

  it('fails open: lets the request through and logs', async () => {
    jest.spyOn(redis(), 'eval').mockRejectedValueOnce(new Error('redis down'));
    const info = await consume('apod', Subject.ip('203.0.113.10'));
    expect(info).toEqual(expect.objectContaining({ limit: 5, remaining: 5 }));
    expect(logger.error).toHaveBeenCalledWith('Rate limit check failed; failing open', expect.objectContaining({ rateLimit: 'apod' }));
  });

  it('fails closed: throws RateLimitUnavailable and logs', async () => {
    jest.spyOn(redis(), 'eval').mockRejectedValueOnce(new Error('redis down'));
    await expect(consume('chatbot', Subject.user('u3'))).rejects.toBeInstanceOf(RateLimitUnavailable);
    expect(logger.error).toHaveBeenCalledWith('Rate limit check failed; failing closed', expect.objectContaining({ rateLimit: 'chatbot' }));
  });
});

describe('toGraphQLError', () => {
  const info = { limit: 5, remaining: 0, resetTime: new Date('2026-10-11T10:00:00Z') };

  it('Visible rate limit: RATE_LIMITED with limit, remaining and resetTime', () => {
    const error = toGraphQLError(new RateLimitExceeded('chatbot', info));
    expect(error.message).toBe('Rate limit exceeded');
    expect(error.extensions).toEqual(expect.objectContaining({
      code: 'RATE_LIMITED',
      limit: 5,
      remaining: 0,
      resetTime: '2026-10-11T10:00:00.000Z',
    }));
  });

  it('Silent rate limit: its message and no numbers', () => {
    const error = toGraphQLError(new RateLimitExceeded('registerByEmail', info));
    expect(error.message).toBe(rateLimits.registerByEmail.message);
    expect(error.extensions.code).toBe('RATE_LIMITED');
    expect(error.extensions).not.toHaveProperty('limit');
    expect(error.extensions).not.toHaveProperty('remaining');
    expect(error.extensions).not.toHaveProperty('resetTime');
  });

  it('Fail closed: SERVICE_UNAVAILABLE with no resetTime', () => {
    const error = toGraphQLError(new RateLimitUnavailable('chatbot', new Error('down')));
    expect(error.extensions.code).toBe('SERVICE_UNAVAILABLE');
    expect(error.extensions).not.toHaveProperty('resetTime');
  });
});
