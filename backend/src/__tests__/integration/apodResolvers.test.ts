// npm test -- --testPathPattern="apodResolvers" --verbose 2>&1

import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import { connectRedis, disconnectRedis, getRedisClient } from '../../services/redis';
import config from '../../config/config';

// Mock the APOD service - keep error handling real
jest.mock('../../services/apod/', () => {
  const actual = jest.requireActual('../../services/apod/');
  return {
    ...actual,
    fetchApod: jest.fn(),
  };
});

// Mock the cache module
jest.mock('../../services/cache/apodCache', () => ({
  apodCache: {
    get: jest.fn(),
    set: jest.fn(),
    buildTodayKey: jest.fn().mockReturnValue('date:2024-01-15'),
    buildDateKey: jest.fn((date: string) => `date:${date}`),
  },
}));

// Mock logger to capture log calls
const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();
jest.mock('../../utils/logger', () => ({
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const { fetchApod } = require('../../services/apod/');
const { apodCache } = require('../../services/cache/apodCache');

// GraphQL queries
const GET_TODAYS_APOD = `
  query GetTodaysApod {
    getTodaysApod {
      date
      title
      explanation
      url
      mediaType
    }
  }
`;

const GET_APOD_BY_DATE = `
  query GetApodByDate($date: String!) {
    getApodByDate(date: $date) {
      date
      title
      explanation
      url
      mediaType
    }
  }
`;

// Mock APOD response (snake_case - matches NASA API format, field resolvers handle conversion)
const mockApodResponse = {
  date: '2024-01-15',
  title: 'Cosmic Wonder',
  explanation: 'A beautiful view of the cosmos',
  url: 'https://apod.nasa.gov/apod/image.jpg',
  media_type: 'image',
  service_version: 'v1',
  apod_url: 'https://apod.nasa.gov/apod/ap240115.html',
};

describe('APOD Resolvers Integration Tests', () => {
  beforeAll(async () => {
    await dbHandler.connect();
    await connectRedis();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
    await disconnectRedis();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Clear rate limit keys before each test
    const redisClient = getRedisClient();
    const keys = await redisClient.keys('apod:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  });

  describe('getTodaysApod', () => {
    describe('Cache behavior', () => {
      it('should return cached result on cache hit (fetchApod NOT called)', async () => {
        apodCache.get.mockResolvedValueOnce(mockApodResponse);

        const testIp = `cache-hit-${Date.now()}`;
        const response = await executeOperation(GET_TODAYS_APOD, {}, { clientIp: testIp });

        expect(response.body.kind).toBe('single');
        if (response.body.kind === 'single') {
          const { data, errors } = response.body.singleResult;
          expect(errors).toBeUndefined();
          expect(data?.getTodaysApod).toEqual(expect.objectContaining({
            date: mockApodResponse.date,
            title: mockApodResponse.title,
          }));
        }

        expect(apodCache.get).toHaveBeenCalled();
        expect(fetchApod).not.toHaveBeenCalled();
        expect(mockLoggerInfo).toHaveBeenCalledWith(
          'APOD cache hit',
          expect.objectContaining({ resolver: 'getTodaysApod', source: 'cache' })
        );
      });

      it('should call fetchApod and set cache on cache miss', async () => {
        apodCache.get.mockResolvedValueOnce(null);
        fetchApod.mockResolvedValueOnce(mockApodResponse);

        const testIp = `cache-miss-${Date.now()}`;
        const response = await executeOperation(GET_TODAYS_APOD, {}, { clientIp: testIp });

        expect(response.body.kind).toBe('single');
        if (response.body.kind === 'single') {
          const { data, errors } = response.body.singleResult;
          expect(errors).toBeUndefined();
          expect(data?.getTodaysApod).toEqual(expect.objectContaining({
            date: mockApodResponse.date,
            title: mockApodResponse.title,
          }));
        }

        expect(apodCache.get).toHaveBeenCalled();
        expect(fetchApod).toHaveBeenCalled();
        expect(apodCache.set).toHaveBeenCalledWith(
          expect.any(String),
          mockApodResponse,
          expect.any(Number)
        );
        expect(mockLoggerInfo).toHaveBeenCalledWith(
          'APOD cache miss',
          expect.objectContaining({ resolver: 'getTodaysApod', source: 'nasa' })
        );
      });
    });

    describe('Rate limiting behavior', () => {
      it('should rate limit anonymous requests after exceeding limit', async () => {
        apodCache.get.mockResolvedValue(null);
        fetchApod.mockResolvedValue(mockApodResponse);

        const testIp = `192.168.1.${Math.floor(Math.random() * 255)}`;

        // Use actual anonymous rate limit from config
        const anonymousLimit = config.rateLimitAnonymousRequests;

        // Make requests up to the limit
        for (let i = 0; i < anonymousLimit; i++) {
          await executeOperation(GET_TODAYS_APOD, {}, { clientIp: testIp });
        }

        // Next request should be rate limited
        const response = await executeOperation(GET_TODAYS_APOD, {}, { clientIp: testIp });

        expect(response.body.kind).toBe('single');
        if (response.body.kind === 'single') {
          const { errors } = response.body.singleResult;
          expect(errors).toBeDefined();
          expect(errors?.[0].extensions?.code).toBe('RATE_LIMIT_EXCEEDED');
        }
      });

      it('should rate limit per-IP (different IPs have separate buckets)', async () => {
        apodCache.get.mockResolvedValue(null);
        fetchApod.mockResolvedValue(mockApodResponse);

        const ip1 = `10.0.0.${Math.floor(Math.random() * 255)}`;
        const ip2 = `10.0.1.${Math.floor(Math.random() * 255)}`;

        // Exhaust IP1's limit using config value
        const anonymousLimit = config.rateLimitAnonymousRequests;
        for (let i = 0; i < anonymousLimit; i++) {
          await executeOperation(GET_TODAYS_APOD, {}, { clientIp: ip1 });
        }

        // IP2 should still work
        const response = await executeOperation(GET_TODAYS_APOD, {}, { clientIp: ip2 });

        expect(response.body.kind).toBe('single');
        if (response.body.kind === 'single') {
          const { errors } = response.body.singleResult;
          expect(errors).toBeUndefined();
        }
      });

      it('should NOT call cache/fetch when rate limited', async () => {
        apodCache.get.mockResolvedValue(null);
        fetchApod.mockResolvedValue(mockApodResponse);

        const testIp = `172.16.0.${Math.floor(Math.random() * 255)}`;

        // Exhaust limit using config value
        const anonymousLimit = config.rateLimitAnonymousRequests;
        for (let i = 0; i < anonymousLimit; i++) {
          await executeOperation(GET_TODAYS_APOD, {}, { clientIp: testIp });
        }

        // Clear mocks after exhausting limit
        jest.clearAllMocks();

        // Rate limited request
        await executeOperation(GET_TODAYS_APOD, {}, { clientIp: testIp });

        // Cache and fetch should NOT be called when rate limited
        expect(apodCache.get).not.toHaveBeenCalled();
        expect(fetchApod).not.toHaveBeenCalled();
      });
    });
  });

  describe('getApodByDate', () => {
    const authenticatedContext = {
      user: { id: 'test-user-123', email: 'test@example.com', role: 'USER' },
      clientIp: '127.0.0.1',
    };

    describe('Authentication', () => {
      it('should require authentication', async () => {
        const response = await executeOperation(
          GET_APOD_BY_DATE,
          { date: '2024-01-15' },
          { clientIp: '127.0.0.1' }
        );

        expect(response.body.kind).toBe('single');
        if (response.body.kind === 'single') {
          const { errors } = response.body.singleResult;
          expect(errors).toBeDefined();
          expect(errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
        }
      });
    });

    describe('Cache behavior', () => {
      it('should return cached result on cache hit', async () => {
        apodCache.get.mockResolvedValueOnce(mockApodResponse);

        const uniqueContext = {
          user: { id: `cache-hit-user-${Date.now()}`, email: 'test@example.com', role: 'USER' },
          clientIp: '127.0.0.1',
        };
        const response = await executeOperation(
          GET_APOD_BY_DATE,
          { date: '2024-01-15' },
          uniqueContext
        );

        expect(response.body.kind).toBe('single');
        if (response.body.kind === 'single') {
          const { data, errors } = response.body.singleResult;
          expect(errors).toBeUndefined();
          expect(data?.getApodByDate).toEqual(expect.objectContaining({
            date: mockApodResponse.date,
            title: mockApodResponse.title,
          }));
        }

        expect(apodCache.get).toHaveBeenCalled();
        expect(fetchApod).not.toHaveBeenCalled();
        expect(mockLoggerInfo).toHaveBeenCalledWith(
          'APOD cache hit',
          expect.objectContaining({
            resolver: 'getApodByDate',
            source: 'cache',
            date: '2024-01-15',
          })
        );
      });

      it('should call fetchApod and set cache on cache miss', async () => {
        apodCache.get.mockResolvedValueOnce(null);
        fetchApod.mockResolvedValueOnce(mockApodResponse);

        const uniqueUserId = `cache-miss-user-${Date.now()}`;
        const uniqueContext = {
          user: { id: uniqueUserId, email: 'test@example.com', role: 'USER' },
          clientIp: '127.0.0.1',
        };
        const response = await executeOperation(
          GET_APOD_BY_DATE,
          { date: '2024-01-15' },
          uniqueContext
        );

        expect(response.body.kind).toBe('single');
        if (response.body.kind === 'single') {
          const { data, errors } = response.body.singleResult;
          expect(errors).toBeUndefined();
          expect(data?.getApodByDate).toBeDefined();
        }

        expect(apodCache.get).toHaveBeenCalled();
        expect(fetchApod).toHaveBeenCalledWith({
          date: '2024-01-15',
          context: { userId: uniqueUserId },
        });
        expect(apodCache.set).toHaveBeenCalled();
        expect(mockLoggerInfo).toHaveBeenCalledWith(
          'APOD cache miss',
          expect.objectContaining({
            resolver: 'getApodByDate',
            source: 'nasa',
            date: '2024-01-15',
          })
        );
      });
    });

    describe('Rate limiting behavior', () => {
      it('should rate limit authenticated users per-user', async () => {
        apodCache.get.mockResolvedValue(null);
        fetchApod.mockResolvedValue(mockApodResponse);

        const uniqueUserId = `rate-limit-test-${Date.now()}`;
        const userContext = {
          user: { id: uniqueUserId, email: 'ratelimit@test.com', role: 'USER' },
          clientIp: '127.0.0.1',
        };

        // Use actual rate limit from config (same setting used by the resolver)
        const limit = config.rateLimitMaxRequests;

        // Make exactly `limit` requests - all should succeed
        for (let i = 0; i < limit; i++) {
          const res = await executeOperation(GET_APOD_BY_DATE, { date: '2024-01-15' }, userContext);
          expect(res.body.kind).toBe('single');
          if (res.body.kind === 'single') {
            expect(res.body.singleResult.errors).toBeUndefined();
          }
        }

        // The (limit + 1)th request MUST be rate limited
        const finalRes = await executeOperation(GET_APOD_BY_DATE, { date: '2024-01-15' }, userContext);
        expect(finalRes.body.kind).toBe('single');
        if (finalRes.body.kind === 'single') {
          const { errors } = finalRes.body.singleResult;
          expect(errors).toBeDefined();
          expect(errors?.[0].extensions?.code).toBe('RATE_LIMIT_EXCEEDED');
        } else {
          throw new Error('Expected single result with rate limit error');
        }
      });
    });
  });

  describe('Audit logging', () => {
    it('should log rate limit check with correct metadata', async () => {
      apodCache.get.mockResolvedValueOnce(mockApodResponse);

      const testIp = `audit-log-${Date.now()}`;
      await executeOperation(GET_TODAYS_APOD, {}, { clientIp: testIp });

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Rate limit check',
        expect.objectContaining({
          resolver: 'getTodaysApod',
          rateLimitSuccess: true,
        })
      );
    });
  });
});
