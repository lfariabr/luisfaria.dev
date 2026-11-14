import { firstGraphQLError, isRateLimited } from '@/lib/apollo/graphqlError';

const rateLimit = { message: 'Rate limit exceeded', extensions: { code: 'RATE_LIMITED', limit: 2 } };

describe('firstGraphQLError', () => {
  it('reads graphQLErrors when the response was 2xx', () => {
    expect(firstGraphQLError({ graphQLErrors: [rateLimit] })).toBe(rateLimit);
  });

  it('reads networkError.result.errors when the response was non-2xx (a 429 rate limit)', () => {
    const error = { graphQLErrors: [], networkError: { statusCode: 429, result: { errors: [rateLimit] } } };
    expect(firstGraphQLError(error)).toBe(rateLimit);
  });

  it('returns undefined for a network error without a GraphQL body, and for non-objects', () => {
    expect(firstGraphQLError({ graphQLErrors: [], networkError: new Error('offline') })).toBeUndefined();
    expect(firstGraphQLError({ networkError: { result: 'Bad Gateway' } })).toBeUndefined();
    expect(firstGraphQLError(undefined)).toBeUndefined();
    expect(firstGraphQLError('boom')).toBeUndefined();
  });
});

describe('isRateLimited', () => {
  it('is true only for RATE_LIMITED', () => {
    expect(isRateLimited(rateLimit)).toBe(true);
    expect(isRateLimited({ extensions: { code: 'BAD_USER_INPUT' } })).toBe(false);
    expect(isRateLimited(undefined)).toBe(false);
  });
});
