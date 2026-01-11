import { ZodError } from 'zod';
import config from '../config/config';
import { logger } from '../utils/logger';
import { apodResponseSchema, ApodResponse, nasaErrorSchema } from '../validation/schemas/apod.schema';

// Re-export type for consumers
export type { ApodResponse };

// Configuration constants
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Custom error class for APOD service errors.
 * Provides structured error details for upstream handling.
 */
export class ApodServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'RATE_LIMITED' | 'NASA_API_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT',
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApodServiceError';
  }
}

/**
 * Context for logging and rate limiting purposes.
 */
export interface ApodRequestContext {
  userId?: string;
  requestId?: string;
}

/**
 * Helper to delay execution for retry logic.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches the Astronomy Picture of the Day from NASA API.
 * 
 * Features:
 * - Zod schema validation for response
 * - Structured error handling with error codes
 * - Latency and status code logging
 * - 429 rate limit detection and handling
 * - Request timeout with AbortController
 * - Automatic retry for transient failures (502, 503, 504)
 * - Optional user context for observability
 * 
 * @param options.date - Optional date in YYYY-MM-DD format
 * @param options.context - Optional context for logging (userId, requestId)
 * @returns Promise resolving to validated ApodResponse
 * @throws ApodServiceError with structured error details
 */
export async function fetchApod(
  options: { date?: string; context?: ApodRequestContext } = {}
): Promise<ApodResponse> {
  const { date, context } = options;
  const startTime = Date.now();
  
  // Build URL with API key from config
  const baseUrl = 'https://api.nasa.gov/planetary/apod';
  const params = new URLSearchParams({ api_key: config.nasaApiKey });
  if (date) {
    params.append('date', date);
  }
  const url = `${baseUrl}?${params.toString()}`;

  const logContext = {
    service: 'apod',
    userId: context?.userId || 'anonymous',
    requestId: context?.requestId,
    date: date || 'today',
  };

  logger.info('Fetching APOD from NASA API', logContext);

  let response!: Response;
  let statusCode!: number;

  // Retry loop for transient failures
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      logger.info(`Retrying NASA API request (attempt ${attempt + 1}/${MAX_RETRIES + 1})`, logContext);
      await delay(RETRY_DELAY_MS * attempt); // Linear backoff
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      statusCode = response.status;

      // Retry on gateway errors (502, 503, 504)
      if ([502, 503, 504].includes(statusCode) && attempt < MAX_RETRIES) {
        logger.warn(`NASA API returned ${statusCode}, will retry`, {
          ...logContext,
          statusCode,
          attempt: attempt + 1,
        });
        continue;
      }

      // Success or non-retryable error - break out of retry loop
      break;
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if it was a timeout (AbortError)
      if (error instanceof Error && error.name === 'AbortError') {
        const latency = Date.now() - startTime;
        if (attempt < MAX_RETRIES) {
          logger.warn(`NASA API request timed out after ${REQUEST_TIMEOUT_MS}ms, will retry`, {
            ...logContext,
            latencyMs: latency,
            attempt: attempt + 1,
          });
          continue;
        }
        logger.error('NASA API request timed out after all retries', {
          ...logContext,
          latencyMs: latency,
          timeoutMs: REQUEST_TIMEOUT_MS,
          attempts: attempt + 1,
        });
        throw new ApodServiceError(
          `NASA API request timed out after ${REQUEST_TIMEOUT_MS}ms`,
          'TIMEOUT',
          undefined,
          { timeoutMs: REQUEST_TIMEOUT_MS, attempts: attempt + 1 }
        );
      }

      // Network error - retry if attempts remaining
      if (attempt < MAX_RETRIES) {
        logger.warn('Network error fetching APOD, will retry', {
          ...logContext,
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt: attempt + 1,
        });
        continue;
      }

      const latency = Date.now() - startTime;
      logger.error('Network error fetching APOD after all retries', {
        ...logContext,
        latencyMs: latency,
        error: error instanceof Error ? error.message : 'Unknown network error',
        attempts: attempt + 1,
      });
      throw new ApodServiceError(
        'Failed to connect to NASA API',
        'NETWORK_ERROR',
        undefined,
        error
      );
    }
  }

  const latency = Date.now() - startTime;

  // Handle rate limiting (429)
  if (statusCode === 429) {
    logger.warn('NASA API rate limit exceeded', {
      ...logContext,
      statusCode,
      latencyMs: latency,
    });
    throw new ApodServiceError(
      'NASA API rate limit exceeded. Please try again later.',
      'RATE_LIMITED',
      429
    );
  }

  // Handle other non-OK responses
  if (!response.ok) {
    let errorMessage = `NASA API returned status ${statusCode}`;
    let errorDetails: unknown;

    try {
      const errorBody = await response.json();
      const parsed = nasaErrorSchema.safeParse(errorBody);
      if (parsed.success) {
        errorMessage = parsed.data.error.message;
        errorDetails = parsed.data.error;
      } else {
        errorDetails = errorBody;
      }
    } catch {
      // Response body wasn't JSON, use default message
    }

    logger.error('NASA API error response', {
      ...logContext,
      statusCode,
      latencyMs: latency,
      errorMessage,
    });

    throw new ApodServiceError(
      errorMessage,
      'NASA_API_ERROR',
      statusCode,
      errorDetails
    );
  }

  // Parse and validate response
  let rawData: unknown;
  try {
    rawData = await response.json();
  } catch (error) {
    logger.error('Failed to parse NASA API response as JSON', {
      ...logContext,
      statusCode,
      latencyMs: latency,
    });
    throw new ApodServiceError(
      'Invalid JSON response from NASA API',
      'VALIDATION_ERROR',
      statusCode
    );
  }

  // Validate against Zod schema
  const parseResult = apodResponseSchema.safeParse(rawData);
  
  if (!parseResult.success) {
    logger.error('NASA API response failed schema validation', {
      ...logContext,
      statusCode,
      latencyMs: latency,
      validationErrors: parseResult.error.errors,
    });
    throw new ApodServiceError(
      'NASA API response did not match expected schema',
      'VALIDATION_ERROR',
      statusCode,
      parseResult.error.errors
    );
  }

  // Success!
  logger.info('APOD fetched successfully', {
    ...logContext,
    statusCode,
    latencyMs: latency,
    title: parseResult.data.title,
    mediaType: parseResult.data.media_type,
  });

  return parseResult.data;
}