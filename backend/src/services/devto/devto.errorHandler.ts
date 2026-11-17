import { createErrorHandler, ErrorCodes, type ErrorCode } from "../../utils/errors";
import { DevtoServiceError, type DevtoErrorCode } from "./devto.errors";

function mapDevtoErrorCode(code: DevtoErrorCode): ErrorCode {
  const mapping: Record<DevtoErrorCode, ErrorCode> = {
    DEVTO_API_ERROR: ErrorCodes.EXTERNAL_SERVICE_ERROR,
    VALIDATION_ERROR: ErrorCodes.BAD_GATEWAY,
    NETWORK_ERROR: ErrorCodes.SERVICE_UNAVAILABLE,
    TIMEOUT: ErrorCodes.SERVICE_UNAVAILABLE,
  };
  return mapping[code] ?? ErrorCodes.INTERNAL_SERVER_ERROR;
}

function isDevtoServiceError(error: unknown): error is DevtoServiceError {
  return error instanceof DevtoServiceError;
}

/** Wraps dev.to operations so a DevtoServiceError becomes a GraphQL error with the right code. */
export const withDevtoErrorHandling = createErrorHandler(
  mapDevtoErrorCode,
  isDevtoServiceError,
  "An unexpected error occurred while fetching posts from dev.to",
);
