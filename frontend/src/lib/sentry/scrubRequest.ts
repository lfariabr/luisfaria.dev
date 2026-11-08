import type { ErrorEvent } from '@sentry/nextjs';

// Header names whose values must never reach Sentry: the session cookie
// (`token`, a reusable JWT) and any bearer credentials.
const SECRET_HEADERS = new Set(['cookie', 'set-cookie', 'authorization', 'proxy-authorization']);
const FILTERED = '[Filtered]';

/**
 * Sentry `beforeSend` for the server and edge runtimes. `onRequestError`
 * attaches the failing request's headers to the event, so a crash on a
 * logged-in page would otherwise send the session cookie to Sentry.
 */
export function scrubRequest(event: ErrorEvent): ErrorEvent {
  const request = event.request;
  if (!request) return event;

  if (request.cookies) request.cookies = {};
  if (request.headers) {
    for (const name of Object.keys(request.headers)) {
      if (SECRET_HEADERS.has(name.toLowerCase())) request.headers[name] = FILTERED;
    }
  }
  return event;
}
