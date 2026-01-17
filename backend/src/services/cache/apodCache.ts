import redisClient from '../redis';
import { logger } from '../../utils/logger';
import type { ApodResponse } from '../apod/apod.types';

const CACHE_PREFIX = 'apod:cache:';

export const apodCache = {
  /**
   * Get cached APOD response by key.
   * Returns null if not found or on error.
   */
  async get(key: string): Promise<ApodResponse | null> {
    try {
      const cached = await redisClient.get(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;
      return JSON.parse(cached) as ApodResponse;
    } catch (error) {
      logger.warn('APOD cache get error', { key, error });
      return null;
    }
  },

  /**
   * Store APOD response in cache with TTL.
   */
  async set(key: string, value: ApodResponse, ttlSeconds: number): Promise<void> {
    try {
      await redisClient.setEx(
        `${CACHE_PREFIX}${key}`,
        ttlSeconds,
        JSON.stringify(value)
      );
    } catch (error) {
      logger.warn('APOD cache set error', { key, ttlSeconds, error });
    }
  },

  /**
   * Build cache key for today's APOD.
   *
   * Uses US Eastern timezone (America/New_York) to match NASA APOD's server-local
   * date interpretation. The APOD API publishes new images based on Eastern time,
   * so using UTC can cause off-by-one cache key mismatches (e.g., at 11pm UTC on
   * Jan 15, it's already Jan 16 UTC but still Jan 15 Eastern where APOD updates).
   *
   * @see https://api.nasa.gov/ - APOD API documentation
   * @see buildTodayKey - Called by getTodaysApod resolver for cache lookup
   */
  buildTodayKey(): string {
    const now = new Date();
    // Get date in Eastern timezone to match NASA APOD API
    const easternDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const year = easternDate.getFullYear();
    const month = String(easternDate.getMonth() + 1).padStart(2, '0');
    const day = String(easternDate.getDate()).padStart(2, '0');
    return `date:${year}-${month}-${day}`;
  },

  /**
   * Build cache key for a specific date.
   */
  buildDateKey(date: string): string {
    return `date:${date}`;
  },
};