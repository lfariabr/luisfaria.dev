'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect
} from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, ApolloError } from '@apollo/client';
import { logger } from '@/lib/logger';
import { UserRole } from '../graphql/types/user.types';
import { ME_QUERY } from '../graphql/queries/auth.queries';
import { LOGIN_MUTATION, REGISTER_MUTATION, LOGOUT_MUTATION } from '../graphql/mutations/auth.mutations';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Definitive auth lifecycle state.
 * - `initializing`: the bootstrap ME query has not resolved yet — outcome unknown.
 * - `authenticated`: a session is confirmed.
 * - `unauthenticated`: the session is *definitively* absent (no token / 401), or
 *   the bootstrap failed transiently before a session was ever established.
 *
 * Protected routes must redirect ONLY on `unauthenticated`, never on `initializing`.
 */
export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (credentials: { name: string, email: string, password: string, captchaToken: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refetchUser: () => void;
}

// Classify a ME failure: is it a *definitive* "you are not logged in" (401 /
// UNAUTHENTICATED), or a transient network/server error we should not log out on?
function isUnauthenticatedError(error: ApolloError | undefined): boolean {
  if (!error) return false;
  const hasUnauthCode = error.graphQLErrors?.some(
    (e) => e.extensions?.code === 'UNAUTHENTICATED'
  );
  const statusCode = (error.networkError as { statusCode?: number } | null)?.statusCode;
  return Boolean(hasUnauthCode) || statusCode === 401;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Format error message for better UX
const formatError = (err: any): string => {
  // Check if it's an Apollo error with GraphQL errors
  if (err.graphQLErrors && err.graphQLErrors.length > 0) {
    const graphQLError = err.graphQLErrors[0];
    
    // Handle specific error codes with user-friendly messages
    if (graphQLError.extensions?.code === 'UNAUTHENTICATED') {
      return 'Invalid email or password. Please try again.';
    }
    
    if (graphQLError.extensions?.code === 'BAD_USER_INPUT') {
      return 'Please check your information and try again.';
    }
    
    // Return the message from the GraphQL error if available
    return graphQLError.message || 'An error occurred. Please try again.';
  }
  
  // Handle network errors
  if (err.networkError) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  // Default error message
  return err.message || 'An unexpected error occurred. Please try again.';
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  status: 'initializing',
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  refetchUser: () => {},
});

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Bootstrap the current user on mount — the httpOnly cookie is sent automatically.
  // We derive auth state from the query result (works for refetches too) instead of
  // one-shot callbacks, so a transient ME failure cannot silently destroy a session.
  const { data, error: meError, refetch } = useQuery(ME_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    // Confirmed session.
    if (data?.me) {
      setUser(data.me);
      setStatus('authenticated');
      return;
    }

    // Definitively logged out: backend returned a null `me`, or a 401 / UNAUTHENTICATED.
    if (isUnauthenticatedError(meError) || (data && data.me === null && !meError)) {
      setUser(null);
      setStatus('unauthenticated');
      return;
    }

    // Transient network/server error. Do NOT tear down an existing session over a
    // blip — keep the last-known user and let RetryLink / the `online` listener
    // recover. Only fall back to `unauthenticated` if we never established a session
    // (initial load after retries are exhausted), so the user sees login rather than
    // an infinite spinner.
    if (meError) {
      logger.warn('Auth bootstrap: non-auth ME failure; preserving current session', {
        reason: meError.networkError ? 'network' : 'unknown',
        message: meError.message,
      });
      setStatus((prev) => (prev === 'authenticated' ? prev : 'unauthenticated'));
    }
  }, [data, meError]);

  // Self-heal: when connectivity returns and we are not confirmed authenticated,
  // re-verify the session instead of leaving the user stranded on a stale failure.
  useEffect(() => {
    const recheck = () => {
      if (status !== 'authenticated') {
        refetch().catch(() => {});
      }
    };
    window.addEventListener('online', recheck);
    return () => window.removeEventListener('online', recheck);
  }, [status, refetch]);

  const refetchUser = useCallback(() => {
    refetch().catch(() => {});
  }, [refetch]);

  // `loading` stays true only while the FIRST resolution is pending, so background
  // refetches never trigger a full-page auth spinner on protected routes.
  const loading = status === 'initializing';

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [registerMutation] = useMutation(REGISTER_MUTATION);
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
  
    try {
      const { data, errors } = await loginMutation({
        variables: {
          input: { email, password }
        },
        errorPolicy: 'all'
      });
  
      if (data?.login) {
        // Backend sets httpOnly cookie automatically
        // Just update local state with user data
        setUser(data.login.user);
        setStatus('authenticated');
        router.push('/');
      } else {
        const errorMessage =
          errors?.[0]?.message || 'Login failed. Please try again.';
        setError(errorMessage);
      }
    } catch (err) {
      const formatted = formatError(err);
      setError(formatted);
    }
  }, [loginMutation, router]);

  const register = useCallback(async (credentials: { name: string; email: string; password: string; captchaToken: string }) => {
    const { name, email, password, captchaToken } = credentials;
    setError(null);
    
    try {
      const { data } = await registerMutation({
        variables: { 
          input: { name, email, password, captchaToken }
        },
      }); 
      
      if (data?.register) {
        // Backend sets httpOnly cookie automatically
        // Just update local state with user data
        setUser(data.register.user);
        setStatus('authenticated');
        router.push('/');
      }
    } catch (err: unknown) {
      if (err instanceof ApolloError) {
        if (err.graphQLErrors && err.graphQLErrors.length > 0) {
          setError(err.graphQLErrors[0].message);
        } else if (err.networkError) {
          setError(`Network error: ${err.networkError.message}`);
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        logger.error('Unexpected register error', { error: err.message });
        setError(err.message);
      } else {
        logger.error('Unexpected register error', { error: String(err) });
        setError('An unexpected error occurred. Please try again.');
      }
    }
  }, [registerMutation, router]);

  const logout = useCallback(async () => {
    try {
      // Call backend to clear httpOnly cookie
      await logoutMutation();
    } catch (err) {
      // Even if mutation fails, clear local state
      logger.warn('Logout failed', { error: String(err) });
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      router.push('/login');
    }
  }, [logoutMutation, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        status,
        error,
        login,
        register,
        logout,
        isAuthenticated: status === 'authenticated',
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
