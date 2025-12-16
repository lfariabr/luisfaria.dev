import { createApolloClient } from '../client';
import { gql } from '@apollo/client';

describe('Apollo Client Configuration', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    // Restore global.fetch after each test
    global.fetch = originalFetch;
  });

  it('does not include authLink that injects Authorization header', async () => {
    // Spy on localStorage BEFORE creating client to capture any reads during construction
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

    // Create mock fetch BEFORE creating client
    const mockFetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { __typename: 'Query' } }),
        text: () => Promise.resolve(JSON.stringify({ data: { __typename: 'Query' } })),
      } as Response)
    );
    global.fetch = mockFetch;

    try {
      const client = createApolloClient();

      // Execute a query and await it
      await client.query({ query: gql`query { __typename }` });

      // Verify no Authorization header was set from localStorage
      expect(mockFetch).toHaveBeenCalled();
      const fetchOptions = mockFetch.mock.calls[0]?.[1];
      const headers = fetchOptions?.headers as Record<string, string> | undefined;
      expect(headers?.['Authorization']).toBeUndefined();
    } finally {
      getItemSpy.mockRestore();
    }
  });

  it('sends requests with credentials include for cookie auth', async () => {
    // Create mock fetch to intercept and verify credentials
    const mockFetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { __typename: 'Query' } }),
        text: () => Promise.resolve(JSON.stringify({ data: { __typename: 'Query' } })),
      } as Response)
    );
    global.fetch = mockFetch;

    const client = createApolloClient();

    // Execute a query to trigger fetch
    await client.query({ query: gql`query { __typename }` });

    // Verify fetch was called with credentials: 'include'
    expect(mockFetch).toHaveBeenCalled();
    const fetchOptions = mockFetch.mock.calls[0]?.[1];
    expect(fetchOptions?.credentials).toBe('include');
  });

  it('sets default fetch policies correctly', () => {
    const client = createApolloClient();

    expect(client).toBeDefined();
    expect(client.defaultOptions.query?.fetchPolicy).toBe('network-only');
    expect(client.defaultOptions.watchQuery?.fetchPolicy).toBe('cache-and-network');
  });

  it('does not read from localStorage for authentication during client creation', () => {
    // Spy on localStorage BEFORE creating client
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');

    try {
      const client = createApolloClient();

      // Verify localStorage.getItem was not called for any auth-related keys
      const authRelatedKeys = ['token', 'authToken', 'auth_token', 'jwt', 'accessToken', 'bearerToken', 'id_token'];
      const authCalls = getItemSpy.mock.calls.filter(call =>
        authRelatedKeys.some(key => call[0]?.toLowerCase().includes(key.toLowerCase()))
      );
      expect(authCalls.length).toBe(0);

      expect(client).toBeDefined();
    } finally {
      getItemSpy.mockRestore();
    }
  });
});
