import redisClient from '../redis';
import { logger } from '../../utils/logger';
import type { Post } from '../devto';

const LATEST_WRITING_KEY = 'devto:cache:latest-writing';

const CACHE_OPERATION_TIMEOUT_MS = 500;

async function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Redis operation timed out')), CACHE_OPERATION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Redis cache for Latest writing. Errors and timeouts read as a miss. */
export const writingCache = {
  async get(): Promise<Post[] | null> {
    try {
      const cached = await withTimeout(redisClient.get(LATEST_WRITING_KEY));
      return cached ? (JSON.parse(cached) as Post[]) : null;
    } catch (error) {
      logger.warn('Latest writing cache get error', { error });
      return null;
    }
  },

  async set(posts: Post[], ttlSeconds: number): Promise<void> {
    try {
      await withTimeout(redisClient.setEx(LATEST_WRITING_KEY, ttlSeconds, JSON.stringify(posts)));
    } catch (error) {
      logger.warn('Latest writing cache set error', { ttlSeconds, error });
    }
  },
};
