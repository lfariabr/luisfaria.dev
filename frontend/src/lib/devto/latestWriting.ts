import { z } from 'zod';
import { LATEST_WRITING, type Article } from '@/content/profile';
import { logger } from '@/lib/logger';

/** dev.to is where writing lives; the site reads it (ADR 0002, #512). */
export const DEVTO_USERNAME = 'lfariaus';
export const LATEST_WRITING_COUNT = 3;
/** How long a fetched list is served before Next.js refetches it in the background. */
export const LATEST_WRITING_REVALIDATE_SECONDS = 60 * 60;
const TIMEOUT_MS = 5000;

const devtoArticleSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  published_at: z.iso.datetime(),
});

/** The dev.to fields Latest writing uses, mapped to the site's Article shape, newest first. */
export function toLatestWriting(payload: unknown, count = LATEST_WRITING_COUNT): Article[] {
  const articles = z.array(devtoArticleSchema).parse(payload);
  return articles
    .map((a) => ({ date: a.published_at, title: a.title, href: a.url }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count);
}

/**
 * The newest posts from dev.to's public API. Any failure (timeout, non-2xx, an
 * unexpected shape, no posts) returns the static `LATEST_WRITING` list instead, so
 * the homepage always renders.
 */
export async function getLatestWriting(): Promise<Article[]> {
  const url = `https://dev.to/api/articles?username=${DEVTO_USERNAME}&per_page=${LATEST_WRITING_COUNT}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: LATEST_WRITING_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`dev.to returned ${res.status}`);
    const articles = toLatestWriting(await res.json());
    if (articles.length === 0) throw new Error('dev.to returned no posts');
    return articles;
  } catch (error) {
    logger.warn('Latest writing: dev.to unavailable, using the static list', {
      reason: error instanceof Error ? error.message : String(error),
    });
    return LATEST_WRITING;
  }
}
