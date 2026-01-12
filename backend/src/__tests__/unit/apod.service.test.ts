// npm test -- --testPathPattern="apod.service" --verbose 2>&1

import { ApodServiceError } from '../../services/apod/apod.errors';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock config
jest.mock('../../config/config', () => ({
  default: {
    nasaApiKey: 'test-api-key',
    nodeEnv: 'test',
  },
}));

// Mock the internal API and fallback modules
jest.mock('../../services/apod/apod.api');
jest.mock('../../services/apod/apod.fallback');

import { fetchApod } from '../../services/apod/';
import { fetchApodFromApi } from '../../services/apod/apod.api';
import { fetchApodHtmlFallback } from '../../services/apod/apod.fallback';

const mockFetchApodFromApi = fetchApodFromApi as jest.MockedFunction<typeof fetchApodFromApi>;
const mockFetchApodHtmlFallback = fetchApodHtmlFallback as jest.MockedFunction<typeof fetchApodHtmlFallback>;

describe('APOD Service - fetchApod (Orchestrator)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockApodResponse = {
    copyright: 'Test Photographer',
    date: '2024-01-15',
    explanation: 'A beautiful image of the cosmos.',
    media_type: 'image' as const,
    service_version: 'v1',
    title: 'Cosmic Wonder',
    url: 'https://apod.nasa.gov/apod/image.jpg',
    hdurl: 'https://apod.nasa.gov/apod/image_hd.jpg',
  };

  const mockFallbackResponse = {
    date: '2024-01-15',
    explanation: 'Fallback explanation',
    media_type: 'image' as const,
    service_version: 'v1',
    title: 'Fallback Title',
    url: 'https://apod.nasa.gov/apod/fallback.jpg',
    hdurl: 'https://apod.nasa.gov/apod/fallback.jpg',
  };

  describe('API Success', () => {
    it('should return APOD from API when successful', async () => {
      mockFetchApodFromApi.mockResolvedValueOnce(mockApodResponse);

      const result = await fetchApod();

      expect(result).toEqual(mockApodResponse);
      expect(mockFetchApodFromApi).toHaveBeenCalledTimes(1);
      expect(mockFetchApodHtmlFallback).not.toHaveBeenCalled();
    });

    it('should pass date parameter to API', async () => {
      mockFetchApodFromApi.mockResolvedValueOnce(mockApodResponse);

      await fetchApod({ date: '2023-12-25' });

      expect(mockFetchApodFromApi).toHaveBeenCalledWith(
        expect.stringContaining('date=2023-12-25'),
        expect.any(Object)
      );
    });

    it('should include API key in URL', async () => {
      mockFetchApodFromApi.mockResolvedValueOnce(mockApodResponse);

      await fetchApod();

      // Verify URL contains api_key parameter (value depends on config)
      expect(mockFetchApodFromApi).toHaveBeenCalledWith(
        expect.stringContaining('api_key='),
        expect.any(Object)
      );
    });

    it('should pass user context in logContext', async () => {
      mockFetchApodFromApi.mockResolvedValueOnce(mockApodResponse);

      await fetchApod({ context: { userId: 'user-123' } });

      expect(mockFetchApodFromApi).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: 'user-123' })
      );
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to HTML scraping when API fails', async () => {
      const { logger } = require('../../utils/logger');
      mockFetchApodFromApi.mockRejectedValueOnce(new Error('API failed'));
      mockFetchApodHtmlFallback.mockResolvedValueOnce(mockFallbackResponse);

      const result = await fetchApod();

      expect(result).toEqual(mockFallbackResponse);
      expect(mockFetchApodFromApi).toHaveBeenCalledTimes(1);
      expect(mockFetchApodHtmlFallback).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        'NASA API failed, falling back to HTML',
        expect.objectContaining({ reason: 'API failed' })
      );
    });

    it('should fallback when API throws ApodServiceError', async () => {
      mockFetchApodFromApi.mockRejectedValueOnce(
        new ApodServiceError('Rate limit', 'RATE_LIMITED', 429)
      );
      mockFetchApodHtmlFallback.mockResolvedValueOnce(mockFallbackResponse);

      const result = await fetchApod();

      expect(result).toEqual(mockFallbackResponse);
    });

    it('should throw if both API and fallback fail', async () => {
      mockFetchApodFromApi.mockRejectedValueOnce(new Error('API failed'));
      mockFetchApodHtmlFallback.mockRejectedValueOnce(new Error('Fallback failed'));

      await expect(fetchApod()).rejects.toThrow('Fallback failed');
    });
  });

  describe('Video Media Type', () => {
    it('should handle video responses from API', async () => {
      const videoResponse = {
        ...mockApodResponse,
        media_type: 'video' as const,
        url: 'https://youtube.com/embed/xyz',
        hdurl: undefined,
      };
      mockFetchApodFromApi.mockResolvedValueOnce(videoResponse);

      const result = await fetchApod();

      expect(result.media_type).toBe('video');
    });
  });
});
