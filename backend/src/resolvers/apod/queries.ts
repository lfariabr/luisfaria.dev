import { GraphQLError } from 'graphql';
import { fetchApod, ApodServiceError } from '../../services/apod';

/**
 * Maps ApodServiceError codes to GraphQL error codes.
 */
function mapErrorCode(code: ApodServiceError['code']): string {
  switch (code) {
    case 'RATE_LIMITED':
      return 'TOO_MANY_REQUESTS';
    case 'NASA_API_ERROR':
      return 'EXTERNAL_SERVICE_ERROR';
    case 'VALIDATION_ERROR':
      return 'BAD_GATEWAY';
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

export const ApodQueries = {
  /**
   * Fetches today's Astronomy Picture of the Day.
   * Public endpoint - no auth required, but logs user context if available.
   */
  getTodaysApod: async (_: unknown, __: unknown, context: { user?: { id: string } }) => {
    try {
      const apod = await fetchApod({
        context: {
          userId: context.user?.id,
        },
      });
      return apod;
    } catch (error) {
      if (error instanceof ApodServiceError) {
        throw new GraphQLError(error.message, {
          extensions: {
            code: mapErrorCode(error.code),
            statusCode: error.statusCode,
            details: error.details,
          },
        });
      }
      // Unknown error - wrap it
      throw new GraphQLError('An unexpected error occurred while fetching APOD', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      });
    }
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
      throw new GraphQLError('Authentication required to browse historical APODs', {
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401 },
        },
      });
    }

    try {
      const apod = await fetchApod({
        date: args.date,
        context: {
          userId: context.user.id,
        },
      });
      return apod;
    } catch (error) {
      if (error instanceof ApodServiceError) {
        throw new GraphQLError(error.message, {
          extensions: {
            code: mapErrorCode(error.code),
            statusCode: error.statusCode,
            details: error.details,
          },
        });
      }
      throw new GraphQLError('An unexpected error occurred while fetching APOD', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      });
    }
  },
};