import { logger } from '../../utils/logger';
import { fetchLatestPosts, withDevtoErrorHandling, LATEST_WRITING_CACHE_TTL_SECONDS } from '../../services/devto';
import { writingCache } from '../../services/cache/writingCache';

export const WritingQueries = {
  /**
   * Latest writing: the newest Posts from dev.to (ADR 0002, #515).
   * Public, no rate limit: the cache means visitors can't make it call dev.to more than once per TTL.
   */
  latestWriting: async () => {
    const cached = await writingCache.get();
    if (cached) {
      logger.info('Latest writing cache hit', { resolver: 'latestWriting', source: 'cache' });
      return cached;
    }

    const posts = await withDevtoErrorHandling(() => fetchLatestPosts(), 'latestWriting');
    await writingCache.set(posts, LATEST_WRITING_CACHE_TTL_SECONDS);
    logger.info('Latest writing cache miss', {
      resolver: 'latestWriting',
      source: 'devto',
      ttlSeconds: LATEST_WRITING_CACHE_TTL_SECONDS,
    });
    return posts;
  },
};
