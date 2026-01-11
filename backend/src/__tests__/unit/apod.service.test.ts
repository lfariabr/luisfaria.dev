// npm test -- --testPathPattern="apod" --verbose 2>&1

// Mock the config module BEFORE importing the service
jest.mock('../../config/config', () => ({
  default: {
    nasaApiKey: 'test-api-key',
    nodeEnv: 'test',
  },
}));

import { fetchApod, ApodServiceError } from '../../services/apod';

// Mock the logger to prevent console output during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('APOD Service - fetchApod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should fetch and validate APOD successfully', async () => {
      const mockApodResponse = {
        copyright: 'Test Photographer',
        date: '2024-01-15',
        explanation: 'A beautiful image of the cosmos.',
        media_type: 'image',
        service_version: 'v1',
        title: 'Cosmic Wonder',
        url: 'https://apod.nasa.gov/apod/image.jpg',
        hdurl: 'https://apod.nasa.gov/apod/image_hd.jpg',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApodResponse),
      });

      const result = await fetchApod();

      expect(result).toEqual(mockApodResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.nasa.gov/planetary/apod'),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it('should fetch APOD for a specific date', async () => {
      const mockApodResponse = {
        date: '2023-12-25',
        explanation: 'Christmas in space!',
        media_type: 'image',
        service_version: 'v1',
        title: 'Holiday Star',
        url: 'https://apod.nasa.gov/apod/holiday.jpg',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApodResponse),
      });

      const result = await fetchApod({ date: '2023-12-25' });

      expect(result.date).toBe('2023-12-25');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('date=2023-12-25'),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it('should handle video media type', async () => {
      const mockVideoResponse = {
        date: '2024-01-10',
        explanation: 'An amazing cosmic video.',
        media_type: 'video',
        service_version: 'v1',
        title: 'Space Video',
        url: 'https://www.youtube.com/embed/xyz123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockVideoResponse),
      });

      const result = await fetchApod();

      expect(result.media_type).toBe('video');
      expect(result.hdurl).toBeUndefined();
    });

    it('should pass user context for logging', async () => {
      const { logger } = require('../../utils/logger');
      
      const mockApodResponse = {
        date: '2024-01-15',
        explanation: 'Test explanation',
        media_type: 'image',
        service_version: 'v1',
        title: 'Test Title',
        url: 'https://apod.nasa.gov/apod/test.jpg',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApodResponse),
      });

      await fetchApod({
        context: { userId: 'user-123', requestId: 'req-456' },
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Fetching APOD from NASA API',
        expect.objectContaining({
          userId: 'user-123',
          requestId: 'req-456',
        })
      );
    });
  });

  describe('Rate Limiting (429)', () => {
    it('should throw RATE_LIMITED error on 429 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({}),
      });

      try {
        await fetchApod();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApodServiceError);
        expect((error as ApodServiceError).code).toBe('RATE_LIMITED');
        expect((error as ApodServiceError).statusCode).toBe(429);
      }
    });

    it('should log warning on rate limit', async () => {
      const { logger } = require('../../utils/logger');
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({}),
      });

      await expect(fetchApod()).rejects.toThrow();

      expect(logger.warn).toHaveBeenCalledWith(
        'NASA API rate limit exceeded',
        expect.objectContaining({
          statusCode: 429,
        })
      );
    });
  });

  describe('NASA API Errors', () => {
    it('should handle 403 Forbidden with structured error', async () => {
      const nasaError = {
        error: {
          code: 'API_KEY_INVALID',
          message: 'An invalid api_key was supplied.',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve(nasaError),
      });

      try {
        await fetchApod();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApodServiceError);
        expect((error as ApodServiceError).code).toBe('NASA_API_ERROR');
        expect((error as ApodServiceError).statusCode).toBe(403);
        expect((error as ApodServiceError).message).toBe('An invalid api_key was supplied.');
      }
    });

    it('should handle 404 Not Found for invalid date', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: { code: 'NOT_FOUND', message: 'No data found for date' } }),
      });

      try {
        await fetchApod({ date: '1990-01-01' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApodServiceError);
        expect((error as ApodServiceError).code).toBe('NASA_API_ERROR');
        expect((error as ApodServiceError).statusCode).toBe(404);
      }
    });

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      try {
        await fetchApod();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApodServiceError);
        expect((error as ApodServiceError).code).toBe('NASA_API_ERROR');
        expect((error as ApodServiceError).statusCode).toBe(500);
      }
    });
  });

  describe('Network Errors', () => {
    it('should throw NETWORK_ERROR on fetch failure', async () => {
      // Mock 3 failures for all retry attempts
      mockFetch
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockRejectedValueOnce(new Error('ETIMEDOUT'));

      try {
        await fetchApod();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApodServiceError);
        expect((error as ApodServiceError).code).toBe('NETWORK_ERROR');
        expect((error as ApodServiceError).message).toBe('Failed to connect to NASA API');
      }
    });

    it('should log network error with latency', async () => {
      const { logger } = require('../../utils/logger');
      
      // Mock 3 failures for all retry attempts
      mockFetch
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'));

      await expect(fetchApod()).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Network error fetching APOD after all retries',
        expect.objectContaining({
          latencyMs: expect.any(Number),
          attempts: 3,
        })
      );
    });
  });

  describe('Validation Errors (Invalid Payloads)', () => {
    it('should throw VALIDATION_ERROR for missing required fields', async () => {
      const invalidResponse = {
        date: '2024-01-15',
        // Missing: explanation, media_type, service_version, title, url
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(invalidResponse),
      });

      try {
        await fetchApod();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApodServiceError);
        expect((error as ApodServiceError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('should throw VALIDATION_ERROR for invalid date format', async () => {
      const invalidResponse = {
        date: 'January 15, 2024', // Wrong format
        explanation: 'Test',
        media_type: 'image',
        service_version: 'v1',
        title: 'Test',
        url: 'https://example.com/image.jpg',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(invalidResponse),
      });

      try {
        await fetchApod();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApodServiceError);
        expect((error as ApodServiceError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('should throw VALIDATION_ERROR for invalid media_type', async () => {
      const invalidResponse = {
        date: '2024-01-15',
        explanation: 'Test',
        media_type: 'audio', // Invalid - only 'image' or 'video' allowed
        service_version: 'v1',
        title: 'Test',
        url: 'https://example.com/audio.mp3',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(invalidResponse),
      });

      try {
        await fetchApod();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApodServiceError);
        expect((error as ApodServiceError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('should throw VALIDATION_ERROR for invalid URL', async () => {
      const invalidResponse = {
        date: '2024-01-15',
        explanation: 'Test',
        media_type: 'image',
        service_version: 'v1',
        title: 'Test',
        url: 'not-a-valid-url',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(invalidResponse),
      });

      try {
        await fetchApod();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApodServiceError);
        expect((error as ApodServiceError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('should throw VALIDATION_ERROR for non-JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Unexpected token')),
      });

      try {
        await fetchApod();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApodServiceError);
        expect((error as ApodServiceError).code).toBe('VALIDATION_ERROR');
        expect((error as ApodServiceError).message).toBe('Invalid JSON response from NASA API');
      }
    });

    it('should include validation error details', async () => {
      const { logger } = require('../../utils/logger');
      
      const invalidResponse = {
        date: '2024-01-15',
        // Missing required fields
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(invalidResponse),
      });

      await expect(fetchApod()).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'NASA API response failed schema validation',
        expect.objectContaining({
          validationErrors: expect.any(Array),
        })
      );
    });
  });

  describe('Latency Logging', () => {
    it('should log latency on successful request', async () => {
      const { logger } = require('../../utils/logger');
      
      const mockApodResponse = {
        date: '2024-01-15',
        explanation: 'Test',
        media_type: 'image',
        service_version: 'v1',
        title: 'Test',
        url: 'https://example.com/image.jpg',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApodResponse),
      });

      await fetchApod();

      expect(logger.info).toHaveBeenCalledWith(
        'APOD fetched successfully',
        expect.objectContaining({
          latencyMs: expect.any(Number),
          statusCode: 200,
        })
      );
    });
  });
});
