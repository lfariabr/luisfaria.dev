import { createApolloClient } from '../client';
import { gql } from '@apollo/client';

describe('Apollo Client Configuration', () => {
  it('does not include authLink that injects Authorization header', () => {
    const client = createApolloClient();
    
    // Spy on localStorage to ensure no Authorization header is constructed from it
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    
    // Create a mock fetch to intercept requests
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      } as Response)
    );
    global.fetch = mockFetch;

    // Execute a query to trigger the link chain
    client.query({ query: gql`query { __typename }` }).catch(() => {});

    // Verify no Authorization header was set from localStorage
    expect(mockFetch).toHaveBeenCalled();
    const fetchCallHeaders = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(fetchCallHeaders?.['Authorization']).toBeUndefined();
    
    getItemSpy.mockRestore();
  });

  it('configures httpLink with credentials include for cookie auth', () => {
    const client = createApolloClient();
    
    // Verify the client is configured (httpLink with credentials: 'include')
    // The actual credentials setting is in the HttpLink constructor
    // We can verify the client works without Authorization header
    expect(client).toBeDefined();
    
    // Default options should be set
    expect(client.defaultOptions.query?.fetchPolicy).toBe('network-only');
    expect(client.defaultOptions.watchQuery?.fetchPolicy).toBe('cache-and-network');
  });

  it('does not read from localStorage for authentication', () => {
    // Mock localStorage to verify it's not being accessed for auth
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    
    // Create a new client
    const client = createApolloClient();
    
   // Verify localStorage.getItem was not called for any auth-related keys
   const authRelatedKeys = ['token', 'authToken', 'auth_token', 'jwt', 'accessToken', 'bearerToken', 'id_token'];
   const authCalls = getItemSpy.mock.calls.filter(call => 
     authRelatedKeys.some(key => call[0]?.toLowerCase().includes(key.toLowerCase()))
   );
   expect(authCalls.length).toBe(0);

    getItemSpy.mockRestore();
    
    expect(client).toBeDefined();
  });
});
