import config from "../../config/config";
import { logger } from "../../utils/logger";
import { fetchApodFromApi } from "./apod.api";
import { fetchApodHtmlFallback } from "./apod.fallback";
import { APOD_API_URL } from "./apod.constants";
import { apodPageUrl } from "./apod.urls";
import { ApodRequestContext, ApodResponse, NasaApodRaw } from "./apod.types";

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
    // science.nasa.gov/apod/ serves any day (?date=YYMMDD), so the fallback covers both.
    logger.warn("NASA API failed, falling back to HTML", {
      ...logContext,
      reason: error instanceof Error ? error.message : "unknown",
    });

    apodData = await fetchApodHtmlFallback(date);
  }

  // Enrich with the APOD page for that day
  return {
    ...apodData,
    apod_url: apodPageUrl(apodData.date),
  };
}