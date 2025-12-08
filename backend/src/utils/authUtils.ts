import { GraphQLError } from 'graphql';

// Check if user is authenticated
export const checkAuth = (context: any) => {
  if (!context.user) {
    throw new GraphQLError('Not authenticated', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
  return context.user;
};

// Check if user has the required role
export const checkRole = (context: any, requiredRole: string = 'admin') => {
  const user = checkAuth(context);
  
  if (user.role !== requiredRole && user.role !== 'admin') {
    throw new GraphQLError('Not authorized', {
      extensions: {
        code: 'FORBIDDEN',
        http: { status: 403 },
      },
    });
  }
  
  return user;
};

// Cookie Options
export const AUTH_COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days