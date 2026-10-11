import { Errors } from '../utils/errors';
import { consume } from './consume';
import { RateLimitExceeded, RateLimitUnavailable, type RateLimitInfo } from './errors';
import { rateLimits, type RateLimitName, type SubjectKindOf } from './rateLimits';
import type { Subject } from './subject';

/** Maps a rate-limiting domain error to the GraphQL error the caller should see. */
export function toGraphQLError(error: RateLimitExceeded | RateLimitUnavailable) {
  if (error instanceof RateLimitUnavailable) return Errors.unavailable();

  const definition: (typeof rateLimits)[RateLimitName] = rateLimits[error.rateLimit];
  if (definition.visibility === 'silent') return Errors.rateLimitedSilently(definition.message);
  return Errors.rateLimited(error.info);
}

/** `consume` for resolvers: domain errors become GraphQL errors. */
export async function enforceRateLimit<N extends RateLimitName>(
  name: N,
  subject: Subject<SubjectKindOf<N>>,
): Promise<RateLimitInfo> {
  try {
    return await consume(name, subject);
  } catch (error) {
    if (error instanceof RateLimitExceeded || error instanceof RateLimitUnavailable) {
      throw toGraphQLError(error);
    }
    throw error;
  }
}
