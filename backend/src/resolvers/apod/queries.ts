import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { enforceRateLimit, Subject } from '../../rateLimiting';
import { fetchApod, withApodErrorHandling, APOD_CACHE_TTL_TODAY_SECONDS, APOD_CACHE_TTL_DATE_SECONDS } from '../../services/apod/';
import { apodCache } from '../../services/cache/apodCache';

export const ApodQueries = {
  /**
   * Fetches today's Astronomy Picture of the Day.
   * Public endpoint - no auth required, but logs user context if available.
   * 
   * Flow: Cache check → (if miss) Rate limit → NASA API
   * Rate limit only consumed on cache miss to prevent UX degradation.
   */
  getTodaysApod: async (_: unknown, __: unknown, context: { user?: { id: string }; clientIp?: string }) => {
    // Check cache FIRST - no rate limit consumed on cache hits
    const cacheKey = apodCache.buildTodayKey();
    const cached = await apodCache.get(cacheKey);
    
    if (cached) {
      logger.info('APOD cache hit', { resolver: 'getTodaysApod', cacheKey, source: 'cache' });
      return cached;
    }

    // Cache miss - count against the APOD rate limit: per user when signed in, per IP otherwise
    await enforceRateLimit('apod', context.user ? Subject.user(context.user.id) : Subject.ip(context.clientIp));

    const apod = await withApodErrorHandling(
      () => fetchApod({ context: { userId: context.user?.id } }),
      'getTodaysApod'
    );

    await apodCache.set(cacheKey, apod, APOD_CACHE_TTL_TODAY_SECONDS);
    logger.info('APOD cache miss', { resolver: 'getTodaysApod', cacheKey, source: 'nasa', ttlSeconds: APOD_CACHE_TTL_TODAY_SECONDS });
    
    return apod;
  },

  /**
   * Fetches APOD for a specific date.
   * Requires authentication to prevent abuse.
   * 
   * Flow: Auth check → Cache check → (if miss) Rate limit → NASA API
   * Rate limit only consumed on cache miss to prevent UX degradation.
   */
  getApodByDate: async (
    _: unknown,
    args: { date: string },
    context: { user?: { id: string } }
  ) => {
    // Require auth for historical lookups
    if (!context.user) {
      throw Errors.unauthenticated('Authentication required to browse historical APODs');
    }

    // Check cache FIRST - no rate limit consumed on cache hits
    const cacheKey = apodCache.buildDateKey(args.date);
    const cached = await apodCache.get(cacheKey);
    
    if (cached) {
      logger.info('APOD cache hit', { resolver: 'getApodByDate', cacheKey, date: args.date, source: 'cache' });
      return cached;
    }

    // Cache miss - shares the APOD rate limit with getTodaysApod
    const userId = context.user.id;
    await enforceRateLimit('apod', Subject.user(userId));

    const apod = await withApodErrorHandling(
      () => fetchApod({ date: args.date, context: { userId } }),
      'getApodByDate'
    );

    await apodCache.set(cacheKey, apod, APOD_CACHE_TTL_DATE_SECONDS);
    logger.info('APOD cache miss', { resolver: 'getApodByDate', cacheKey, date: args.date, source: 'nasa', ttlSeconds: APOD_CACHE_TTL_DATE_SECONDS });
    
    return apod;
  },
};