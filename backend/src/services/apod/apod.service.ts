import config from "../../config/config";
import { logger } from "../../utils/logger";
import { fetchApodFromApi } from "./apod.api";
import { fetchApodHtmlFallback } from "./apod.fallback";
import { APOD_API_URL } from "./apod.constants";
import { ApodRequestContext, ApodResponse, NasaApodRaw } from "./apod.types";

/**
 * Generates the direct APOD page URL for a given date.
 * Format: https://apod.nasa.gov/apod/apYYMMDD.html
 */
function buildApodPageUrl(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}`);
  }
  const [year, month, day] = date.split("-");
  const shortYear = year.slice(2);
  return `https://apod.nasa.gov/apod/ap${shortYear}${month}${day}.html`;
}

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

  let apodData: NasaApodRaw;

  try {
    apodData = await fetchApodFromApi(url, logContext);
  } catch (error) {
    // HTML fallback only works for today's APOD
    const today = new Date().toISOString().slice(0, 10);
    if (date && date !== today) {
      throw error; // Re-throw for historical requests
    }
    
    logger.warn("NASA API failed, falling back to HTML", {
      ...logContext,
      reason: error instanceof Error ? error.message : "unknown",
    });

    apodData = await fetchApodHtmlFallback();
  }

  // Enrich with direct APOD page URL
  return {
    ...apodData,
    apod_url: buildApodPageUrl(apodData.date),
  };
}