import { logger } from "../../utils/logger";
import { apodResponseSchema, nasaErrorSchema } from "../../validation/schemas/apod.schema";
import { ApodServiceError } from "./apod.errors";
import { ApodResponse } from "./apod.types";
import {
  REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAY_MS,
} from "./apod.constants";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Fetches APOD from NASA API with retry logic and timeout handling.
 * Pure infrastructure concern - no business logic.
 */
export async function fetchApodFromApi(
  url: string,
  logContext: Record<string, unknown>
): Promise<ApodResponse> {
  const startTime = Date.now();
  let response!: Response;
  let statusCode!: number;

  logger.info("Fetching APOD from NASA API", logContext);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      logger.info(`Retrying NASA API request (attempt ${attempt + 1}/${MAX_RETRIES + 1})`, logContext);
      await delay(RETRY_DELAY_MS * attempt);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      statusCode = response.status;

      if ([502, 503, 504].includes(statusCode) && attempt < MAX_RETRIES) {
        logger.warn(`NASA API returned ${statusCode}, will retry`, {
          ...logContext,
          statusCode,
          attempt: attempt + 1,
        });
        continue;
      }
      break;
    } catch (err) {
      clearTimeout(timeoutId);

      // Handle timeout (AbortError)
      if (err instanceof Error && err.name === "AbortError") {
        if (attempt < MAX_RETRIES) {
          logger.warn(`NASA API request timed out, will retry`, {
            ...logContext,
            timeoutMs: REQUEST_TIMEOUT_MS,
            attempt: attempt + 1,
          });
          continue;
        }
        const latency = Date.now() - startTime;
        logger.error("NASA API request timed out after all retries", {
          ...logContext,
          latencyMs: latency,
          attempts: attempt + 1,
        });
        throw new ApodServiceError(
          `NASA API request timed out after ${REQUEST_TIMEOUT_MS}ms`,
          "TIMEOUT",
          undefined,
          { timeoutMs: REQUEST_TIMEOUT_MS, attempts: attempt + 1 }
        );
      }

      // Handle network errors
      if (attempt < MAX_RETRIES) {
        logger.warn("Network error fetching APOD, will retry", {
          ...logContext,
          error: err instanceof Error ? err.message : "Unknown error",
          attempt: attempt + 1,
        });
        continue;
      }

      const latency = Date.now() - startTime;
      logger.error("Network error fetching APOD after all retries", {
        ...logContext,
        latencyMs: latency,
        error: err instanceof Error ? err.message : "Unknown network error",
        attempts: attempt + 1,
      });
      throw new ApodServiceError(
        "Failed to connect to NASA API",
        "NETWORK_ERROR",
        undefined,
        err
      );
    }
  }

  const latency = Date.now() - startTime;

  // Handle rate limiting
  if (statusCode === 429) {
    logger.warn("NASA API rate limit exceeded", {
      ...logContext,
      statusCode,
      latencyMs: latency,
    });
    throw new ApodServiceError("NASA API rate limit exceeded", "RATE_LIMITED", 429);
  }

  // Handle other non-OK responses
  if (!response.ok) {
    let message = `NASA API returned ${statusCode}`;
    let details;

    try {
      const body = await response.json();
      const parsed = nasaErrorSchema.safeParse(body);
      if (parsed.success) {
        message = parsed.data.error.message;
        details = parsed.data.error;
      } else {
        details = body;
      }
    } catch {
      // Response body wasn't JSON
    }

    logger.error("NASA API error response", {
      ...logContext,
      statusCode,
      latencyMs: latency,
      errorMessage: message,
    });

    throw new ApodServiceError(message, "NASA_API_ERROR", statusCode, details);
  }

  // Parse and validate response
  let rawData: unknown;
  try {
    rawData = await response.json();
  } catch {
    logger.error("Failed to parse NASA API response as JSON", {
      ...logContext,
      statusCode,
      latencyMs: latency,
    });
    throw new ApodServiceError(
      "Invalid JSON response from NASA API",
      "VALIDATION_ERROR",
      statusCode
    );
  }

  const parsed = apodResponseSchema.safeParse(rawData);

  if (!parsed.success) {
    logger.error("NASA API response failed schema validation", {
      ...logContext,
      statusCode,
      latencyMs: latency,
      validationErrors: parsed.error.errors,
    });
    throw new ApodServiceError(
      "NASA API response failed schema validation",
      "VALIDATION_ERROR",
      statusCode,
      parsed.error.errors
    );
  }

  logger.info("APOD fetched successfully", {
    ...logContext,
    statusCode,
    latencyMs: latency,
    title: parsed.data.title,
    mediaType: parsed.data.media_type,
  });

  return parsed.data;
}