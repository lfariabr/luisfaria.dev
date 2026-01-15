import config from '../../config/config';
import { Errors } from '../../utils/errors';
import { applyRateLimit } from '../../utils/applyRateLimit';
import { fetchApod, withApodErrorHandling } from '../../services/apod/';

export const ApodQueries = {
  /**
   * Fetches today's Astronomy Picture of the Day.
   * Public endpoint - no auth required, but logs user context if available.
   */
  getTodaysApod: async (_: unknown, __: unknown, context: { user?: { id: string } }) => {
    // Rate limit for public endpoint - uses global key (not per-user)
    // More restrictive: 10 requests per hour for unauthenticated, normal limits for authenticated
    const limitKey = context.user?.id 
      ? `apod:today:${context.user.id}` 
      : 'apod:today:public';
    const limit = context.user ? config.rateLimitMaxRequests : 10;
    
    await applyRateLimit(limitKey, limit, config.rateLimitWindow, {
      resolver: 'getTodaysApod',
      userId: context.user?.id,
    });

    return withApodErrorHandling(
      () => fetchApod({ context: { userId: context.user?.id } }),
      'getTodaysApod'
    );
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

    return withApodErrorHandling(
      () => fetchApod({ date: args.date, context: { userId } }),
      'getApodByDate'
    );
  },
};