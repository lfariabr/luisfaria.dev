// npm test -- --testPathPattern="apod.resolver" --verbose 2>&1

import { ApodQueries } from '../../resolvers/apod/queries';
import { GraphQLError } from 'graphql';

// Mock the APOD service
jest.mock('../../services/apod/', () => ({
  fetchApod: jest.fn(),
  ApodServiceError: class ApodServiceError extends Error {
    constructor(
      message: string,
      public readonly code: 'RATE_LIMITED' | 'NASA_API_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR',
      public readonly statusCode?: number,
      public readonly details?: unknown
    ) {
      super(message);
      this.name = 'ApodServiceError';
    }
  },
}));

const { fetchApod } = require('../../services/apod/');

describe('APOD Resolver - ApodQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodaysApod', () => {
    it('should return APOD data successfully', async () => {
      const mockApod = {
        date: '2024-01-15',
        explanation: 'Beautiful cosmos',
        media_type: 'image',
        service_version: 'v1',
        title: 'Cosmic Wonder',
        url: 'https://apod.nasa.gov/apod/image.jpg',
      };

      fetchApod.mockResolvedValueOnce(mockApod);

      const result = await ApodQueries.getTodaysApod({}, {}, { user: undefined });

      expect(result).toEqual(mockApod);
      expect(fetchApod).toHaveBeenCalledWith({
        context: { userId: undefined },
      });
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

      fetchApod.mockResolvedValueOnce(mockApod);

      await ApodQueries.getTodaysApod({}, {}, { user: { id: 'user-123' } });

      expect(fetchApod).toHaveBeenCalledWith({
        context: { userId: 'user-123' },
      });
    });

    it('should throw GraphQLError with TOO_MANY_REQUESTS code on rate limit', async () => {
      const { ApodServiceError } = require('../../services/apod');
      fetchApod.mockRejectedValueOnce(
        new ApodServiceError('Rate limit exceeded', 'RATE_LIMITED', 429)
      );

      try {
        await ApodQueries.getTodaysApod({}, {}, { user: undefined });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('TOO_MANY_REQUESTS');
        expect((error as GraphQLError).extensions?.statusCode).toBe(429);
      }
    });

    it('should throw GraphQLError with EXTERNAL_SERVICE_ERROR code on NASA API error', async () => {
      const { ApodServiceError } = require('../../services/apod');
      fetchApod.mockRejectedValueOnce(
        new ApodServiceError('Invalid API key', 'NASA_API_ERROR', 403)
      );

      try {
        await ApodQueries.getTodaysApod({}, {}, { user: undefined });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('EXTERNAL_SERVICE_ERROR');
        expect((error as GraphQLError).extensions?.statusCode).toBe(403);
      }
    });

    it('should throw GraphQLError with BAD_GATEWAY code on validation error', async () => {
      const { ApodServiceError } = require('../../services/apod');
      fetchApod.mockRejectedValueOnce(
        new ApodServiceError('Invalid response', 'VALIDATION_ERROR', 200, [{ field: 'date' }])
      );

      try {
        await ApodQueries.getTodaysApod({}, {}, { user: undefined });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('BAD_GATEWAY');
        expect((error as GraphQLError).extensions?.details).toEqual([{ field: 'date' }]);
      }
    });

    it('should throw GraphQLError with SERVICE_UNAVAILABLE code on network error', async () => {
      const { ApodServiceError } = require('../../services/apod');
      fetchApod.mockRejectedValueOnce(
        new ApodServiceError('Failed to connect', 'NETWORK_ERROR')
      );

      try {
        await ApodQueries.getTodaysApod({}, {}, { user: undefined });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).extensions?.code).toBe('SERVICE_UNAVAILABLE');
      }
    });

    it('should handle unknown errors with INTERNAL_SERVER_ERROR', async () => {
      fetchApod.mockRejectedValueOnce(new Error('Random unexpected error'));

      try {
        await ApodQueries.getTodaysApod({}, {}, { user: undefined });
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

    it('should fetch APOD for specific date when authenticated', async () => {
      const mockApod = {
        date: '2023-12-25',
        explanation: 'Holiday special',
        media_type: 'image',
        service_version: 'v1',
        title: 'Christmas Star',
        url: 'https://example.com/holiday.jpg',
      };

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

    it('should propagate service errors with correct GraphQL error codes', async () => {
      const { ApodServiceError } = require('../../services/apod');
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
