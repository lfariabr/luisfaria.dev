import { fetchApod, withApodErrorHandling } from '../../services/apod/';
import { Errors } from '../../utils/errors';

export const ApodQueries = {
  /**
   * Fetches today's Astronomy Picture of the Day.
   * Public endpoint - no auth required, but logs user context if available.
   */
  getTodaysApod: async (_: unknown, __: unknown, context: { user?: { id: string } }) =>
    withApodErrorHandling(
      () => fetchApod({ context: { userId: context.user?.id } }),
      'getTodaysApod'
    ),

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
    return withApodErrorHandling(
      () => fetchApod({ date: args.date, context: { userId } }),
      'getApodByDate'
    );
  },
};