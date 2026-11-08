// Browser-side Sentry. Next.js (15.3+) loads this file automatically before the
// app starts; the old sentry.client.config.ts was only picked up through
// withSentryConfig, which next.config.ts no longer uses (e506cb2), so browser
// errors never reached Sentry (#431).
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Session replay: 1% of sessions, 100% of sessions with an error
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    integrations: [Sentry.replayIntegration(), Sentry.browserTracingIntegration()],

    // Skip ResizeObserver noise (common in modern browsers)
    beforeSend(event) {
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
        return null;
      }
      return event;
    },

    debug: process.env.NODE_ENV === 'development',
  });
}

// Lets Sentry trace client-side navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
