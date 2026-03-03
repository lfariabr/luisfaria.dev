'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  ReactNode,
  useCallback
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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (credentials: { name: string, email: string, password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refetchUser: () => void;
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
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  isAuthenticated: false,
  refetchUser: () => {},
});

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Query current user on mount - cookie is sent automatically
  const { loading, refetch: refetchUser } = useQuery(ME_QUERY, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.me) {
        setUser(data.me);
      }
    },
    onError: () => {
      // Not authenticated or token expired - this is expected
      setUser(null);
    },
  });

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

  const register = useCallback(async (credentials: { name: string; email: string; password: string }) => {
    const { name, email, password } = credentials;
    setError(null);
    
    try {
      const { data } = await registerMutation({
        variables: { 
          input: { name, email, password }
        },
      }); 
      
      if (data?.register) {
        // Backend sets httpOnly cookie automatically
        // Just update local state with user data
        setUser(data.register.user);
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
      router.push('/login');
    }
  }, [logoutMutation, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
