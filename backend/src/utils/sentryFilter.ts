/**
 * GraphQL error codes caused by the client, not by our code. They are logged
 * but never sent to Sentry: a malformed or unauthorised request isn't a bug.
 * Used by the Apollo error plugin (index.ts) and Sentry's beforeSend (instrument.ts).
 */
export const CLIENT_GRAPHQL_ERROR_CODES: ReadonlySet<string> = new Set([
  // Auth flow and invalid input
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'BAD_USER_INPUT',
  // Apollo rejecting a malformed request (empty query, bad JSON, unknown field)
  'BAD_REQUEST',
  'GRAPHQL_PARSE_FAILED',
  'GRAPHQL_VALIDATION_FAILED',
]);

/** True when the error carries one of the client-caused codes above. */
export function isClientGraphQLError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { extensions?: { code?: unknown } }).extensions?.code;
  return typeof code === 'string' && CLIENT_GRAPHQL_ERROR_CODES.has(code);
}
