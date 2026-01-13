import { createErrorHandler, ErrorCodes, type ErrorCode } from '../../utils/errors';
import { ApodServiceError, type ApodErrorCode } from './apod.errors';

/**
 * Maps APOD service error codes to GraphQL error codes.
 */
function mapApodErrorCode(code: ApodErrorCode): ErrorCode {
  const mapping: Record<ApodErrorCode, ErrorCode> = {
    RATE_LIMITED: ErrorCodes.TOO_MANY_REQUESTS,
    NASA_API_ERROR: ErrorCodes.EXTERNAL_SERVICE_ERROR,
    VALIDATION_ERROR: ErrorCodes.BAD_GATEWAY,
    NETWORK_ERROR: ErrorCodes.SERVICE_UNAVAILABLE,
    TIMEOUT: ErrorCodes.SERVICE_UNAVAILABLE,
  };
  return mapping[code] ?? ErrorCodes.INTERNAL_SERVER_ERROR;
}

/**
 * Type guard for ApodServiceError.
 */
function isApodServiceError(error: unknown): error is ApodServiceError {
  return error instanceof ApodServiceError;
}

/**
 * Wraps APOD operations with consistent error handling.
 * Transforms ApodServiceError into GraphQL errors with proper codes.
 */
export const withApodErrorHandling = createErrorHandler(
  mapApodErrorCode,
  isApodServiceError,
  'An unexpected error occurred while fetching APOD'
);
