import { NasaApodRaw } from "./apod.types";
import { APOD_HTML_URL, REQUEST_TIMEOUT_MS } from "./apod.constants";
import { ApodServiceError } from "./apod.errors";
import { apodPageUrl } from "./apod.urls";

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function toText(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

/** `November 13, 2026` → `2026-11-13`, or undefined if it doesn't parse. */
function toIsoDate(text: string): string | undefined {
  const parsed = new Date(`${text} 00:00:00 UTC`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

/**
 * Reads the media-detail hero block of a science.nasa.gov APOD page. Only that block
 * counts: the rest of the page (header logo, news cards) has images that aren't the APOD.
 */
export function parseApodHtml(html: string, fallbackDate: string): NasaApodRaw {
  const heroStart = html.indexOf('class="media-detail-hero__media');
  if (heroStart === -1) {
    throw new ApodServiceError("APOD page has no media-detail hero block", "VALIDATION_ERROR");
  }
  const tableEnd = html.indexOf("</table>", heroStart);
  const hero = html.slice(heroStart, tableEnd === -1 ? undefined : tableEnd);
  // Today's page titles it with an h2, a dated page with an h1.
  const titleAt = hero.search(/<h[12][\s>]/i);
  const media = titleAt === -1 ? hero : hero.slice(0, titleAt);

  const image = media.match(/<img[^>]+src="([^"]+)"/i)?.[1];
  const video = media.match(/<iframe[^>]+src="([^"]+)"/i)?.[1] ?? media.match(/<video[^>]+src="([^"]+)"/i)?.[1];
  const src = image ?? video;
  if (!src) {
    throw new ApodServiceError("APOD hero block has no image or video", "VALIDATION_ERROR");
  }
  const url = new URL(decodeEntities(src), APOD_HTML_URL).toString();

  const titleHtml = hero.match(/<h([12])[^>]*>([\s\S]*?)<\/h\1>/i)?.[2];
  const title = titleHtml ? toText(titleHtml) : "Astronomy Picture of the Day";

  const descriptionHtml = hero.match(/media-detail-hero__description[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "";
  const explanation =
    toText(
      descriptionHtml
        .replace(/<strong>\s*Explanation:?\s*<\/strong>/i, "")
        .replace(/<strong>\s*Tomorrow'?s picture:?[\s\S]*$/i, ""),
    ) || "See the official NASA APOD page for this day's explanation.";

  const dateCell = hero.match(/<th[^>]*>\s*Date:?\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i)?.[1];
  const date = (dateCell && toIsoDate(toText(dateCell))) ?? fallbackDate;

  const isImage = Boolean(image);
  return {
    date,
    title,
    explanation,
    media_type: isImage ? "image" : "video",
    service_version: "v1",
    url,
    // The asset URL without its resize query is the full-resolution file.
    ...(isImage ? { hdurl: url.split("?")[0] } : {}),
  };
}

/** Today's APOD (or `date`'s) scraped from science.nasa.gov, for when the NASA API is down. */
export async function fetchApodHtmlFallback(date?: string): Promise<NasaApodRaw> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(apodPageUrl(date), { signal: controller.signal });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    throw new ApodServiceError(
      aborted ? "APOD page timed out" : "APOD page request failed",
      aborted ? "TIMEOUT" : "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    throw new ApodServiceError(`APOD page returned ${res.status}`, "NASA_API_ERROR", res.status);
  }

  return parseApodHtml(await res.text(), date ?? new Date().toISOString().slice(0, 10));
}
