import { rateLimiter } from "../services/rateLimiter";
import { logger } from './logger';
import { GraphQLError } from 'graphql';

export async function applyRateLimit(
    limitKey: string,
    limit: number,
    window: number,
    context : {
        resolver: string;
        userId?: string;
        metadata?: Record<string, unknown>;
    }
) {
    const result = await rateLimiter.limit(limitKey, limit, window);

    logger.info('Rate limit check', {
        resolver: context.resolver,
        userId: context.userId ?? 'anonymous',
        rateLimitKey: limitKey,
        rateLimitSuccess: result.success,
        rateLimitRemaining: result.remaining,
        ...context.metadata,
    });

    if (!result.success) {
        throw new GraphQLError('Rate limit exceeded', {
            extensions: {
                code: 'RATE_LIMITED',
                limit: result.limit,
                remaining: result.remaining,
                resetTime: result.resetTime.toISOString(),
            },
        });
    }
    return result;
}