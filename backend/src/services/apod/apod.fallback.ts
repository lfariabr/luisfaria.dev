import { NasaApodRaw } from "./apod.types";
import { REQUEST_TIMEOUT_MS } from "./apod.constants";
import { APOD_HTML_URL } from "./apod.constants";

export async function fetchApodHtmlFallback(): Promise<NasaApodRaw> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(APOD_HTML_URL, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
  
  if (!res.ok) {
    throw new Error(`APOD HTML fallback failed with status ${res.status}`);
  }

  const html = await res.text();

  // --- TITLE ---
  const titleMatch = html.match(/<b>\s*([^<]+)\s*<\/b>/i);
  const title =
    titleMatch?.[1]?.trim() ?? "Astronomy Picture of the Day";

  // --- IMAGE ---
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
  const imagePath = imgMatch?.[1];

  const imageUrl = imagePath
    ? new URL(imagePath, "https://apod.nasa.gov/apod/").toString()
    : "https://apod.nasa.gov/apod/astropix.html";

  // --- EXPLANATION ---
  const explanationMatch = html.match(
    /Explanation:\s*<\/b>\s*([\s\S]*?)<p>/i
  );

  const explanation = explanationMatch
    ? explanationMatch[1]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "See the official NASA APOD page for today's explanation.";

  // --- DATE ---
  // APOD HTML does not reliably expose YYYY-MM-DD,
  // so we safely use today's date.
  const date = new Date().toISOString().slice(0, 10);

  // Note: apod_url is added by the service layer, not here
  return {
    date,
    title,
    explanation,
    media_type: "image",
    service_version: "v1",
    url: imageUrl,
    hdurl: imageUrl,
  };
}