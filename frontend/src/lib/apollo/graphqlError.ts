/** The parts of a GraphQL error the UI reads. */
export type GraphQLErrorLike = { message?: string; extensions?: Record<string, unknown> };

type ApolloErrorShape = {
  graphQLErrors?: ReadonlyArray<GraphQLErrorLike>;
  networkError?: { result?: unknown } | null;
};

/**
 * The first GraphQL error behind an Apollo error. A non-2xx response (the backend sends
 * rate limits as HTTP 429) arrives as a `networkError` with an empty `graphQLErrors`; its
 * GraphQL errors are in `networkError.result.errors`, so look there too (#501).
 */
export function firstGraphQLError(error: unknown): GraphQLErrorLike | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const { graphQLErrors, networkError } = error as ApolloErrorShape;
  if (graphQLErrors?.length) return graphQLErrors[0];
  const result = networkError?.result;
  if (typeof result !== 'object' || result === null) return undefined;
  const errors = (result as { errors?: unknown }).errors;
  return Array.isArray(errors) && errors.length > 0 ? (errors[0] as GraphQLErrorLike) : undefined;
}

export function isRateLimited(error: GraphQLErrorLike | undefined): boolean {
  return error?.extensions?.code === 'RATE_LIMITED';
}
