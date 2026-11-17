import { z } from "zod";
import { DevtoServiceError } from "./devto.errors";
import { DEVTO_API_URL, DEVTO_USERNAME, LATEST_WRITING_COUNT, REQUEST_TIMEOUT_MS } from "./devto.constants";

/** A Post on dev.to, as the site uses it (CONTEXT.md: Post). */
export type Post = { title: string; url: string; publishedAt: string };

const devtoArticleSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  published_at: z.iso.datetime(),
});

/** Maps dev.to's article list to Posts, newest first, `count` of them. Throws on an unexpected shape. */
export function toPosts(payload: unknown, count = LATEST_WRITING_COUNT): Post[] {
  const parsed = z.array(devtoArticleSchema).safeParse(payload);
  if (!parsed.success) {
    throw new DevtoServiceError("dev.to response failed schema validation", "VALIDATION_ERROR");
  }
  return parsed.data
    .map((a) => ({ title: a.title, url: a.url, publishedAt: a.published_at }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, count);
}

/** The newest Posts from dev.to's public API (no key needed). */
export async function fetchLatestPosts(count = LATEST_WRITING_COUNT): Promise<Post[]> {
  const url = `${DEVTO_API_URL}?username=${DEVTO_USERNAME}&per_page=${count}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

    if (!res.ok) {
      throw new DevtoServiceError(`dev.to returned ${res.status}`, "DEVTO_API_ERROR", res.status);
    }

    return toPosts(await res.json(), count);
  } catch (error) {
    if (error instanceof DevtoServiceError) throw error;
    if (error instanceof SyntaxError) {
      throw new DevtoServiceError("dev.to response contained malformed JSON", "VALIDATION_ERROR");
    }
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new DevtoServiceError(
      timedOut ? "dev.to request timed out" : "dev.to request failed",
      timedOut ? "TIMEOUT" : "NETWORK_ERROR",
    );
  }
}
