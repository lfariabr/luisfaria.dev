import config from "../../config/config";
import { logger } from "../../utils/logger";
import { fetchApodFromApi } from "./apod.api";
import { fetchApodHtmlFallback } from "./apod.fallback";
import { APOD_API_URL } from "./apod.constants";
import { ApodRequestContext, ApodResponse } from "./apod.types";

export async function fetchApod(
  options: { date?: string; context?: ApodRequestContext } = {}
): Promise<ApodResponse> {
  const { date, context } = options;

  const params = new URLSearchParams({ api_key: config.nasaApiKey });
  if (date) params.append("date", date);

  const url = `${APOD_API_URL}?${params.toString()}`;

  const logContext = {
    service: "apod",
    userId: context?.userId ?? "anonymous",
    date: date ?? "today",
  };

  try {
    return await fetchApodFromApi(url, logContext);
  } catch (error) {
    // HTML fallback only works for today's APOD
    if (date) {
      throw error; // Re-throw for historical requests
    }
    
    logger.warn("NASA API failed, falling back to HTML", {
      ...logContext,
      reason: error instanceof Error ? error.message : "unknown",
    });

    return await fetchApodHtmlFallback();
  }
}