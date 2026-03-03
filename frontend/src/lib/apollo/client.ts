import { ApolloClient, InMemoryCache, HttpLink, from, NormalizedCacheObject } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { logger } from '@/lib/logger';

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

// Create a function to build Apollo Client with proper error handling and retry logic
export function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  // Error handling link for better debugging
  const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        logger.error('GraphQL error', { message, locations, path, extensions });
      });
    }

    if (networkError) {
      const operationName = operation?.operationName || 'unknown';
      const meta = {
        operation: operationName,
        error: toErrorMessage(networkError),
      };

      // 'Me' runs on app bootstrap and can fail locally when backend isn't up.
      if (operationName === 'Me') {
        logger.debug('Network error during auth bootstrap', meta);
      } else {
        logger.warn('Network error', meta);
      }
    }
  });

  // Retry link for handling transient network issues
  const retryLink = new RetryLink({
    delay: {
      initial: 300, // First retry after 300ms
      max: 3000,    // Maximum delay between retries (3s)
      jitter: true, // Add randomness to delays to prevent thundering herd
    },
    attempts: {
      max: 3,       // Maximum number of retries
      retryIf: (error) => {
        // Only retry on network errors, not auth failures
        const shouldRetry = !!error && error.statusCode !== 401;
        logger.debug('Retry decision', { shouldRetry, error: String(error) });
        return shouldRetry;
      },
    },
  });

  // HTTP link with proper CORS and credentials
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
    credentials: 'include',
    // Force use of fetch polyfill for consistent behavior
    fetch: (uri: RequestInfo, options?: RequestInit) => {
      return fetch(uri, {
        ...options,
        // Ensure CORS is enabled and credentials are sent
        mode: 'cors',
        credentials: 'include',
      });
    },
  });

  // Combine all links - no authLink needed, cookies are sent automatically
  const link = from([errorLink, retryLink, httpLink]);

  // Create and return the Apollo Client
  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
    connectToDevTools: process.env.NODE_ENV === 'development',
  });
}

// Create a singleton instance of Apollo Client
export const client = createApolloClient();

// Helper function to get a new client instance for SSR if needed
export function getClient() {
  return client;
}
