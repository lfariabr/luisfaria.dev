import { createGraphQLError, ErrorCodes, Errors } from '../../utils/errors/graphqlErrors';
import { CLIENT_GRAPHQL_ERROR_CODES, isClientGraphQLError } from '../../utils/sentryFilter';

// Apollo's own errors (BadRequestError, ...) aren't exported; they're GraphQLErrors
// carrying extensions.code, which is all the filter reads.
const apolloError = (code: string) => Object.assign(new Error('x'), { extensions: { code } });

describe('isClientGraphQLError', () => {
  it.each([...CLIENT_GRAPHQL_ERROR_CODES])('filters %s', (code) => {
    expect(isClientGraphQLError(apolloError(code))).toBe(true);
  });

  it('filters the malformed-request codes Apollo raises', () => {
    for (const code of ['BAD_REQUEST', 'GRAPHQL_PARSE_FAILED', 'GRAPHQL_VALIDATION_FAILED']) {
      expect(isClientGraphQLError(apolloError(code))).toBe(true);
    }
  });

  it('filters our own auth and input errors', () => {
    expect(isClientGraphQLError(createGraphQLError('no', { code: ErrorCodes.UNAUTHENTICATED }))).toBe(true);
    expect(isClientGraphQLError(createGraphQLError('no', { code: ErrorCodes.BAD_USER_INPUT }))).toBe(true);
  });

  it('filters a used-up Rate limit (#501)', () => {
    expect(isClientGraphQLError(Errors.rateLimited({ limit: 2, remaining: 0, resetTime: new Date() }))).toBe(true);
  });

  it('reports server errors and errors without a code', () => {
    expect(isClientGraphQLError(createGraphQLError('boom', { code: ErrorCodes.INTERNAL_SERVER_ERROR }))).toBe(false);
    expect(isClientGraphQLError(createGraphQLError('down', { code: ErrorCodes.EXTERNAL_SERVICE_ERROR }))).toBe(false);
    expect(isClientGraphQLError(new Error('plain'))).toBe(false);
    expect(isClientGraphQLError(null)).toBe(false);
    expect(isClientGraphQLError('BAD_REQUEST')).toBe(false);
  });
});
