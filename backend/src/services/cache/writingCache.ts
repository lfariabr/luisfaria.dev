import redisClient from '../redis';
import { logger } from '../../utils/logger';
import type { Post } from '../devto';

const LATEST_WRITING_KEY = 'devto:cache:latest-writing';

/** Redis cache for Latest writing, so dev.to is asked at most once per TTL. Errors read as a miss. */
export const writingCache = {
  async get(): Promise<Post[] | null> {
    try {
      const cached = await redisClient.get(LATEST_WRITING_KEY);
      return cached ? (JSON.parse(cached) as Post[]) : null;
    } catch (error) {
      logger.warn('Latest writing cache get error', { error });
      return null;
    }
  },

  async set(posts: Post[], ttlSeconds: number): Promise<void> {
    try {
      await redisClient.setEx(LATEST_WRITING_KEY, ttlSeconds, JSON.stringify(posts));
    } catch (error) {
      logger.warn('Latest writing cache set error', { ttlSeconds, error });
    }
  },
};
