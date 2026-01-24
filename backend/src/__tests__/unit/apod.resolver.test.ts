// npm test -- --testPathPattern="apod.resolver" --verbose 2>&1

import { ApodQueries } from '../../resolvers/apod/queries';
import { GraphQLError } from 'graphql';

// Mock the APOD service - import real error handler and error class
jest.mock('../../services/apod/', () => {
  const actual = jest.requireActual('../../services/apod/');
  return {
    ...actual,
    fetchApod: jest.fn(),
  };
});

// Mock the cache service
jest.mock('../../services/cache/apodCache', () => ({
  apodCache: {
    get: jest.fn(),
    set: jest.fn(),
    buildTodayKey: jest.fn().mockReturnValue('date:2024-01-15'),
    buildDateKey: jest.fn((date: string) => `date:${date}`),
  },
}));

// Mock rate limiter
jest.mock('../../utils/applyRateLimit', () => ({
  applyRateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 4, limit: 5 }),
}));

const { fetchApod } = require('../../services/apod/');
const { apodCache } = require('../../services/cache/apodCache');
const { applyRateLimit } = require('../../utils/applyRateLimit');

describe('APOD Resolver - ApodQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodaysApod', () => {
    it('should return APOD data successfully on cache miss', async () => {
      const mockApod = {
        date: '2024-01-15',
        explanation: 'Beautiful cosmos',
        media_type: 'image',
        service_version: 'v1',
        title: 'Cosmic Wonder',
        url: 'https://apod.nasa.gov/apod/image.jpg',
      };

      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockResolvedValueOnce(mockApod);

      const result = await ApodQueries.getTodaysApod({}, {}, { user: undefined, clientIp: '127.0.0.1' });

      expect(result).toEqual(mockApod);
      expect(fetchApod).toHaveBeenCalledWith({
        context: { userId: undefined },
      });
    });

    it('should NOT call rate limiter on cache hit', async () => {
      const cachedApod = {
        date: '2024-01-15',
        explanation: 'Cached cosmos',
        media_type: 'image',
        service_version: 'v1',
        title: 'Cached Wonder',
        url: 'https://apod.nasa.gov/apod/cached.jpg',
      };

      apodCache.get.mockResolvedValueOnce(cachedApod); // Cache hit

      const result = await ApodQueries.getTodaysApod({}, {}, { user: undefined, clientIp: '127.0.0.1' });

      expect(result).toEqual(cachedApod);
      expect(applyRateLimit).not.toHaveBeenCalled();
      expect(fetchApod).not.toHaveBeenCalled();
    });

    it('should call rate limiter only on cache miss', async () => {
      const mockApod = {
        date: '2024-01-15',
        explanation: 'Fresh cosmos',
        media_type: 'image',
        service_version: 'v1',
        title: 'Fresh Wonder',
        url: 'https://apod.nasa.gov/apod/fresh.jpg',
      };

      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockResolvedValueOnce(mockApod);

      await ApodQueries.getTodaysApod({}, {}, { user: undefined, clientIp: '127.0.0.1' });

      expect(applyRateLimit).toHaveBeenCalledTimes(1);
      expect(fetchApod).toHaveBeenCalledTimes(1);
    });

    it('should pass user context when authenticated', async () => {
      const mockApod = {
        date: '2024-01-15',
        explanation: 'Test',
        media_type: 'image',
        service_version: 'v1',
        title: 'Test',
        url: 'https://example.com/image.jpg',
      };

      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockResolvedValueOnce(mockApod);

      await ApodQueries.getTodaysApod({}, {}, { user: { id: 'user-123' }, clientIp: '127.0.0.1' });

      expect(fetchApod).toHaveBeenCalledWith({
        context: { userId: 'user-123' },
      });
    });

    it('should throw GraphQLError with TOO_MANY_REQUESTS code on rate limit', async () => {
      const { ApodServiceError } = require('../../services/apod');
      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockRejectedValueOnce(
        new ApodServiceError('Rate limit exceeded', 'RATE_LIMITED', 429)
      );

      try {
        await ApodQueries.getTodaysApod({}, {}, { user: undefined, clientIp: '127.0.0.1' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('TOO_MANY_REQUESTS');
        expect((error as GraphQLError).extensions?.statusCode).toBe(429);
      }
    });

    it('should throw GraphQLError with EXTERNAL_SERVICE_ERROR code on NASA API error', async () => {
      const { ApodServiceError } = require('../../services/apod');
      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockRejectedValueOnce(
        new ApodServiceError('Invalid API key', 'NASA_API_ERROR', 403)
      );

      try {
        await ApodQueries.getTodaysApod({}, {}, { user: undefined, clientIp: '127.0.0.1' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('EXTERNAL_SERVICE_ERROR');
        expect((error as GraphQLError).extensions?.statusCode).toBe(403);
      }
    });

    it('should throw GraphQLError with BAD_GATEWAY code on validation error', async () => {
      const { ApodServiceError } = require('../../services/apod');
      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockRejectedValueOnce(
        new ApodServiceError('Invalid response', 'VALIDATION_ERROR', 200, [{ field: 'date' }])
      );

      try {
        await ApodQueries.getTodaysApod({}, {}, { user: undefined, clientIp: '127.0.0.1' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('BAD_GATEWAY');
        expect((error as GraphQLError).extensions?.details).toEqual([{ field: 'date' }]);
      }
    });

    it('should throw GraphQLError with SERVICE_UNAVAILABLE code on network error', async () => {
      const { ApodServiceError } = require('../../services/apod');
      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockRejectedValueOnce(
        new ApodServiceError('Failed to connect', 'NETWORK_ERROR')
      );

      try {
        await ApodQueries.getTodaysApod({}, {}, { user: undefined, clientIp: '127.0.0.1' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('SERVICE_UNAVAILABLE');
      }
    });

    it('should handle unknown errors with INTERNAL_SERVER_ERROR', async () => {
      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockRejectedValueOnce(new Error('Random unexpected error'));

      try {
        await ApodQueries.getTodaysApod({}, {}, { user: undefined, clientIp: '127.0.0.1' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('INTERNAL_SERVER_ERROR');
        expect((error as GraphQLError).message).toBe(
          'An unexpected error occurred while fetching APOD'
        );
      }
    });
  });

  describe('getApodByDate', () => {
    it('should require authentication', async () => {
      try {
        await ApodQueries.getApodByDate({}, { date: '2024-01-15' }, { user: undefined });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('UNAUTHENTICATED');
      }
    });

    it('should fetch APOD for specific date when authenticated (cache miss)', async () => {
      const mockApod = {
        date: '2023-12-25',
        explanation: 'Holiday special',
        media_type: 'image',
        service_version: 'v1',
        title: 'Christmas Star',
        url: 'https://example.com/holiday.jpg',
      };

      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockResolvedValueOnce(mockApod);

      const result = await ApodQueries.getApodByDate(
        {},
        { date: '2023-12-25' },
        { user: { id: 'user-456' } }
      );

      expect(result).toEqual(mockApod);
      expect(fetchApod).toHaveBeenCalledWith({
        date: '2023-12-25',
        context: { userId: 'user-456' },
      });
    });

    it('should NOT call rate limiter on cache hit', async () => {
      const cachedApod = {
        date: '2023-12-25',
        explanation: 'Cached holiday',
        media_type: 'image',
        service_version: 'v1',
        title: 'Cached Star',
        url: 'https://example.com/cached-holiday.jpg',
      };

      apodCache.get.mockResolvedValueOnce(cachedApod); // Cache hit

      const result = await ApodQueries.getApodByDate(
        {},
        { date: '2023-12-25' },
        { user: { id: 'user-456' } }
      );

      expect(result).toEqual(cachedApod);
      expect(applyRateLimit).not.toHaveBeenCalled();
      expect(fetchApod).not.toHaveBeenCalled();
    });

    it('should call rate limiter only on cache miss', async () => {
      const mockApod = {
        date: '2023-12-25',
        explanation: 'Fresh holiday',
        media_type: 'image',
        service_version: 'v1',
        title: 'Fresh Star',
        url: 'https://example.com/fresh-holiday.jpg',
      };

      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockResolvedValueOnce(mockApod);

      await ApodQueries.getApodByDate(
        {},
        { date: '2023-12-25' },
        { user: { id: 'user-456' } }
      );

      expect(applyRateLimit).toHaveBeenCalledTimes(1);
      expect(fetchApod).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors with correct GraphQL error codes', async () => {
      const { ApodServiceError } = require('../../services/apod');
      apodCache.get.mockResolvedValueOnce(null); // Cache miss
      fetchApod.mockRejectedValueOnce(
        new ApodServiceError('Rate limit exceeded', 'RATE_LIMITED', 429)
      );

      try {
        await ApodQueries.getApodByDate(
          {},
          { date: '2023-12-25' },
          { user: { id: 'user-456' } }
        );
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('TOO_MANY_REQUESTS');
      }
    });
  });
});
