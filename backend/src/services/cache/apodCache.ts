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
   * Uses current date in YYYY-MM-DD format for consistency.
   */
  buildTodayKey(): string {
    const today = new Date().toISOString().split('T')[0];
    return `date:${today}`;
  },

  /**
   * Build cache key for a specific date.
   */
  buildDateKey(date: string): string {
    return `date:${date}`;
  },
};