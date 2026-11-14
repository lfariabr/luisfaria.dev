import { APOD_HTML_URL } from "./apod.constants";

/** `2026-11-13` → `261113`, the form science.nasa.gov/apod/?date= takes. */
export function toApodDateParam(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}`);
  }
  const [year, month, day] = date.split("-");
  return `${year.slice(2)}${month}${day}`;
}

/** The APOD page for a date (today's page without one). */
export function apodPageUrl(date?: string): string {
  return date ? `${APOD_HTML_URL}?date=${toApodDateParam(date)}` : APOD_HTML_URL;
}
