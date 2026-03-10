import { GraphQLError } from 'graphql';
import { logger } from '../logger';

/**
 * Standard GraphQL error codes used across the application.
 */
export const ErrorCodes = {
  BAD_USER_INPUT: 'BAD_USER_INPUT',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

interface GraphQLErrorOptions {
  code: ErrorCode;
  statusCode?: number;
  details?: unknown;
  http?: { status: number };
}

/**
 * Creates a GraphQL error with standardized extensions.
 */
export function createGraphQLError(
  message: string,
  options: GraphQLErrorOptions
): GraphQLError {
  const { code, statusCode, details, http } = options;
  return new GraphQLError(message, {
    extensions: {
      code,
      ...(statusCode !== undefined && { statusCode }),
      ...(details !== undefined && { details }),
      ...(http !== undefined && { http }),
    },
  });
}

/**
 * Common error factories for frequently used error types.
 */
export const Errors = {
  unauthenticated: (message = 'Authentication required') =>
    createGraphQLError(message, {
      code: ErrorCodes.UNAUTHENTICATED,
      http: { status: 401 },
    }),

  forbidden: (message = 'Not authorized') =>
    createGraphQLError(message, {
      code: ErrorCodes.FORBIDDEN,
      http: { status: 403 },
    }),

  notFound: (resource = 'Resource') =>
    createGraphQLError(`${resource} not found`, {
      code: ErrorCodes.NOT_FOUND,
      http: { status: 404 },
    }),

  badInput: (message: string) =>
    createGraphQLError(message, {
      code: ErrorCodes.BAD_USER_INPUT,
      http: { status: 400 },
    }),

  internal: (message = 'An unexpected error occurred') =>
    createGraphQLError(message, {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      http: { status: 500 },
    }),
};

/**
 * Base interface for service errors that can be transformed to GraphQL errors.
 */
export interface ServiceError extends Error {
  code: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Type for a function that maps service error codes to GraphQL error codes.
 */
export type ErrorCodeMapper<T extends string> = (code: T) => ErrorCode;

/**
 * Creates a resolver wrapper that handles service errors consistently.
 * 
 * @param mapErrorCode - Function to map service error codes to GraphQL codes
 * @param isServiceError - Type guard to identify service-specific errors
 * @param defaultMessage - Default message for unknown errors
 */
export function createErrorHandler<TCode extends string, TError extends ServiceError & { code: TCode }>(
  mapErrorCode: (code: TCode) => ErrorCode,
  isServiceError: (error: unknown) => error is TError,
  defaultMessage = 'An unexpected error occurred'
) {
  return function withErrorHandling<T>(
    fn: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    return fn().catch((error) => {
      if (isServiceError(error)) {
        logger.error(`Service error in ${operationName}`, {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          details: error.details,
        });
        throw createGraphQLError(error.message, {
          code: mapErrorCode(error.code),
          statusCode: error.statusCode,
          details: error.details,
        });
      }
      logger.error(`Unexpected error in ${operationName}`, { error });
      throw Errors.internal(defaultMessage);
    });
  };
}
