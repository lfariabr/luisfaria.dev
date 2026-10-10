import { getRedisClient } from '../services/redis';
import { logger } from '../utils/logger';
import { hit } from './counter';
import { RateLimitExceeded, RateLimitUnavailable, type RateLimitInfo } from './errors';
import { rateLimits, type RateLimitName, type SubjectKindOf } from './rateLimits';
import { UNKNOWN_SUBJECT_ID, type Subject } from './subject';

const keyFor = (name: RateLimitName, subject: Subject) => `rl:${name}:${subject.kind}:${subject.id}`;

/**
 * Counts one request by `subject` against the named Rate limit.
 * Returns what is left; throws RateLimitExceeded when over the limit, and
 * RateLimitUnavailable when the counter cannot be read and the rate limit fails closed.
 */
export async function consume<N extends RateLimitName>(
  name: N,
  subject: Subject<SubjectKindOf<N>>,
): Promise<RateLimitInfo> {
  const definition = rateLimits[name];
  const limit = (definition.limits as Record<string, number>)[subject.kind];

  if (subject.id === UNKNOWN_SUBJECT_ID) {
    logger.warn('Rate limit subject missing; counting as unknown', { rateLimit: name, subjectKind: subject.kind });
  }

  let result;
  try {
    result = await hit(keyFor(name, subject), limit, definition.windowSeconds);
  } catch (error) {
    if (definition.failure === 'closed') {
      logger.error('Rate limit check failed; failing closed', { rateLimit: name, error });
      throw new RateLimitUnavailable(name, error);
    }
    logger.error('Rate limit check failed; failing open', { rateLimit: name, error });
    return { limit, remaining: limit, resetTime: new Date(Date.now() + definition.windowSeconds * 1000) };
  }

  const info = { limit, remaining: result.remaining, resetTime: result.resetTime };
  if (!result.allowed) {
    logger.warn('Rate limit exceeded', { rateLimit: name, subjectKind: subject.kind });
    throw new RateLimitExceeded(name, info);
  }
  return info;
}

/** Clears one subject's count. For tests and manual support only. */
export async function resetCount<N extends RateLimitName>(name: N, subject: Subject<SubjectKindOf<N>>): Promise<void> {
  await getRedisClient().del(keyFor(name, subject));
}
