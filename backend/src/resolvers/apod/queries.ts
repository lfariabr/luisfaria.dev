import config from '../../config/config';
import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { applyRateLimit } from '../../utils/applyRateLimit';
import { fetchApod, withApodErrorHandling, APOD_CACHE_TTL_TODAY_SECONDS, APOD_CACHE_TTL_DATE_SECONDS } from '../../services/apod/';
import { apodCache } from '../../services/cache/apodCache';

export const ApodQueries = {
  /**
   * Fetches today's Astronomy Picture of the Day.
   * Public endpoint - no auth required, but logs user context if available.
   */
  getTodaysApod: async (_: unknown, __: unknown, context: { user?: { id: string }; clientIp: string }) => {
    // Rate limit: per-user for authenticated, per-IP for anonymous
    // More restrictive limit for unauthenticated clients (configurable via RATE_LIMIT_ANONYMOUS_REQUESTS)
    const limitKey = context.user?.id 
      ? `apod:today:${context.user.id}` 
      : `apod:today:ip:${context.clientIp}`;
    const limit = context.user ? config.rateLimitMaxRequests : config.rateLimitAnonymousRequests;
    
    await applyRateLimit(limitKey, limit, config.rateLimitWindow, {
      resolver: 'getTodaysApod',
      userId: context.user?.id,
      metadata: { clientIp: context.clientIp },
    });

    const cacheKey = apodCache.buildTodayKey();
    const cached = await apodCache.get(cacheKey);
    
    if (cached) {
      logger.info('APOD cache hit', { resolver: 'getTodaysApod', cacheKey, source: 'cache' });
      return cached;
    }

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

    const userId = context.user.id;
    const limitKey = `apod:date:${userId}`;
    
    await applyRateLimit(limitKey, config.rateLimitMaxRequests, config.rateLimitWindow, {
      resolver: 'getApodByDate',
      userId,
    });

    const cacheKey = apodCache.buildDateKey(args.date);
    const cached = await apodCache.get(cacheKey);
    
    if (cached) {
      logger.info('APOD cache hit', { resolver: 'getApodByDate', cacheKey, date: args.date, source: 'cache' });
      return cached;
    }

    const apod = await withApodErrorHandling(
      () => fetchApod({ date: args.date, context: { userId } }),
      'getApodByDate'
    );

    await apodCache.set(cacheKey, apod, APOD_CACHE_TTL_DATE_SECONDS);
    logger.info('APOD cache miss', { resolver: 'getApodByDate', cacheKey, date: args.date, source: 'nasa', ttlSeconds: APOD_CACHE_TTL_DATE_SECONDS });
    
    return apod;
  },
};