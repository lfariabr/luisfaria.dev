/**
 * The Content-Security-Policy for every page (#479).
 *
 * proxy.ts makes a fresh nonce per request and sends this policy; Next.js reads
 * the nonce from it and stamps its own scripts. 'strict-dynamic' then trusts
 * whatever those scripts load (Google Maps, Turnstile, Sentry), so script-src
 * needs neither 'unsafe-inline' nor 'unsafe-eval'. The host list after it is a
 * fallback for browsers without 'strict-dynamic', which ignore the nonce rules.
 *
 * nginx sends its own CSP only for backend routes (nginx/conf/default.conf).
 */

export const NONCE_HEADER = 'x-nonce';

const SENTRY_INGEST = 'https://o4510868467417088.ingest.us.sentry.io';

export const createNonce = (): string => Buffer.from(crypto.randomUUID()).toString('base64');

export function buildCsp(nonce: string, { isDev = false }: { isDev?: boolean } = {}): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // React rebuilds server error stacks with eval in development only.
      ...(isDev ? ["'unsafe-eval'"] : []),
      'https://challenges.cloudflare.com',
      'https://maps.googleapis.com',
      'https://maps.gstatic.com',
      'https://www.googletagmanager.com',
    ],
    // Styles stay as before: Google Maps and Next.js set inline styles without a nonce.
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://maps.gstatic.com'],
    'connect-src': [
      "'self'",
      'data:',
      'https://luisfaria.dev',
      'https://challenges.cloudflare.com',
      'https://maps.googleapis.com',
      'https://places.googleapis.com',
      'https://maps.gstatic.com',
      'https://www.gstatic.com',
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://region1.google-analytics.com',
      SENTRY_INGEST,
      // The dev server's GraphQL API and hot reload.
      ...(isDev ? ['http://localhost:4000', 'ws:'] : []),
    ],
    'worker-src': ["'self'", 'blob:'],
    'frame-src': ['https://challenges.cloudflare.com'],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}
