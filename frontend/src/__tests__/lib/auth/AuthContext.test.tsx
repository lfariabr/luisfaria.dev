import { renderHook, waitFor, act } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { ME_QUERY } from '@/lib/graphql/queries/auth.queries';
import { LOGIN_MUTATION, LOGOUT_MUTATION, REGISTER_MUTATION } from '@/lib/graphql/mutations/auth.mutations';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
};

const mockAdminUser = {
  id: '2',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN',
};

describe('AuthContext - ME_QUERY Bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets user on successful ME_QUERY response', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ME_QUERY,
        },
        result: {
          data: {
            me: mockUser,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    // Wait for ME_QUERY to resolve
    await waitFor(() => expect(result.current.loading).toBe(false));

    // User should be set
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('sets user to null on UNAUTHENTICATED error', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ME_QUERY,
        },
        result: {
          errors: [
            new GraphQLError('Not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' },
            }),
          ],
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for ME_QUERY to resolve with error
    await waitFor(() => expect(result.current.loading).toBe(false));

    // User should be null (not authenticated)
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets user to null on network error', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ME_QUERY,
        },
        error: new Error('Network error'),
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for error to be handled
    await waitFor(() => expect(result.current.loading).toBe(false));

    // User should be null
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('correctly identifies admin user role', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ME_QUERY,
        },
        result: {
          data: {
            me: mockAdminUser,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.role).toBe('ADMIN');
    expect(result.current.isAuthenticated).toBe(true);
  });
});

describe('AuthContext - Login Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets user after successful login', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ME_QUERY,
        },
        result: {
          errors: [
            new GraphQLError('Not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' },
            }),
          ],
        },
      },
      {
        request: {
          query: LOGIN_MUTATION,
          variables: {
            input: { email: 'test@example.com', password: 'password123' },
          },
        },
        result: {
          data: {
            login: {
              user: mockUser,
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial ME_QUERY to fail
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();

    // Perform login
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // User should be set after login
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('sets error on login failure', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ME_QUERY,
        },
        result: {
          errors: [
            new GraphQLError('Not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' },
            }),
          ],
        },
      },
      {
        request: {
          query: LOGIN_MUTATION,
          variables: {
            input: { email: 'test@example.com', password: 'wrongpassword' },
          },
        },
        result: {
          errors: [
            new GraphQLError('Invalid email or password', {
              extensions: { code: 'UNAUTHENTICATED' },
            }),
          ],
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Perform login with wrong password
    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword');
    });

    // User should still be null, error should be set
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});

describe('AuthContext - Register Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends captchaToken, sets user, and redirects after successful register', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ME_QUERY,
        },
        result: {
          errors: [
            new GraphQLError('Not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' },
            }),
          ],
        },
      },
      {
        request: {
          query: REGISTER_MUTATION,
          variables: {
            input: {
              name: 'Test User',
              email: 'test@example.com',
              password: 'Test1234!',
              captchaToken: 'turnstile-test-token',
            },
          },
        },
        result: {
          data: {
            register: {
              user: mockUser,
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();

    await act(async () => {
      await result.current.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test1234!',
        captchaToken: 'turnstile-test-token',
      });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('sets error when register mutation fails', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ME_QUERY,
        },
        result: {
          errors: [
            new GraphQLError('Not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' },
            }),
          ],
        },
      },
      {
        request: {
          query: REGISTER_MUTATION,
          variables: {
            input: {
              name: 'Test User',
              email: 'test@example.com',
              password: 'Test1234!',
              captchaToken: 'turnstile-test-token',
            },
          },
        },
        result: {
          errors: [
            new GraphQLError('Captcha verification failed', {
              extensions: { code: 'BAD_USER_INPUT' },
            }),
          ],
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test1234!',
        captchaToken: 'turnstile-test-token',
      });
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Captcha verification failed');
  });
});

describe('AuthContext - Logout Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('clears user after logout', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ME_QUERY,
        },
        result: {
          data: {
            me: mockUser,
          },
        },
      },
      {
        request: {
          query: LOGOUT_MUTATION,
        },
        result: {
          data: {
            logout: true,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for ME_QUERY to set user
    await waitFor(() => expect(result.current.user).toEqual(mockUser));
    expect(result.current.isAuthenticated).toBe(true);

    // Perform logout
    await act(async () => {
      await result.current.logout();
    });

    // User should be cleared
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('clears user even if logout mutation fails', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: ME_QUERY,
        },
        result: {
          data: {
            me: mockUser,
          },
        },
      },
      {
        request: {
          query: LOGOUT_MUTATION,
        },
        error: new Error('Network error'),
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    // Perform logout (mutation will fail)
    await act(async () => {
      await result.current.logout();
    });

    // User should still be cleared despite mutation failure
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

describe('AuthContext - Session resilience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes a definitive status that resolves to authenticated', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: ME_QUERY },
        result: { data: { me: mockUser } },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Starts in the indeterminate state so protected routes don't redirect early.
    expect(result.current.status).toBe('initializing');

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('reports unauthenticated on a 401 / UNAUTHENTICATED bootstrap', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: ME_QUERY },
        result: {
          errors: [
            new GraphQLError('Not authenticated', {
              extensions: { code: 'UNAUTHENTICATED' },
            }),
          ],
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('enters a recoverable error state (not unauthenticated) on a first-boot network failure', async () => {
    const mocks: MockedResponse[] = [
      {
        // No prior session in memory (a fresh refresh) + a transient network error.
        request: { query: ME_QUERY },
        error: new Error('Network error'),
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // A blip on refresh must NOT be classified as logged-out — that would bounce a
    // user with a valid cookie to /login. It must be recoverable.
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.status).not.toBe('unauthenticated');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('does NOT clear an authenticated session on a transient network error', async () => {
    const mocks: MockedResponse[] = [
      {
        request: { query: ME_QUERY },
        result: { data: { me: mockUser } },
      },
      {
        // A later re-verification blips on the network — this must not log the user out.
        request: { query: ME_QUERY },
        error: new Error('Network error'),
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>{children}</AuthProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Establish the session.
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user).toEqual(mockUser);

    // Trigger a re-verification that fails with a network error — awaited so the
    // failure is actually processed before we assert.
    await act(async () => {
      await result.current.refetchUser();
    });

    // Session is preserved — the user stays logged in through the blip.
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.status).toBe('authenticated');
    });
  });
});
