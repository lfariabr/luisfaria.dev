import { logger } from '../../utils/logger';
import { fetchLatestPosts, withDevtoErrorHandling, LATEST_WRITING_CACHE_TTL_SECONDS } from '../../services/devto';
import type { Post } from '../../services/devto';
import { writingCache } from '../../services/cache/writingCache';

let inFlight: Promise<Post[]> | undefined;

export const WritingQueries = {
  /**
   * Latest writing: the newest Posts from dev.to (ADR 0002, #515).
   * Public, no rate limit: Redis caches results; concurrent misses share a fetch within this process.
   */
  latestWriting: async () => {
    const cached = await writingCache.get();
    if (cached) {
      logger.info('Latest writing cache hit', { resolver: 'latestWriting', source: 'cache' });
      return cached;
    }

    if (inFlight) return inFlight;

    inFlight = (async () => {
      const posts = await withDevtoErrorHandling(() => fetchLatestPosts(), 'latestWriting');
      await writingCache.set(posts, LATEST_WRITING_CACHE_TTL_SECONDS);
      logger.info('Latest writing cache miss', {
        resolver: 'latestWriting',
        source: 'devto',
        ttlSeconds: LATEST_WRITING_CACHE_TTL_SECONDS,
      });
      return posts;
    })().finally(() => {
      inFlight = undefined;
    });
    return inFlight;
  },
};
