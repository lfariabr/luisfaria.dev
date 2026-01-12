// Barrel export for APOD service module
// Clean, single entry point for consumers

// Main service function (orchestrator)
export { fetchApod } from "./apod.service";

// Types
export type { ApodResponse, ApodRequestContext } from "./apod.types";

// Errors
export { ApodServiceError } from "./apod.errors";
export type { ApodErrorCode } from "./apod.errors";

// Constants (for testing/config overrides)
export {
  APOD_API_URL,
  APOD_HTML_URL,
  REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAY_MS,
} from "./apod.constants";
