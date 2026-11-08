import * as Sentry from '@sentry/nextjs';
import { scrubRequest } from './src/lib/sentry/scrubRequest';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Never send the session cookie or auth headers (onRequestError attaches request headers)
    beforeSend: scrubRequest,

    // Debug mode to see what's happening
    // debug: process.env.NODE_ENV === 'development',
  });
  
  console.log('✅ Sentry initialized (server-side) with DSN:', SENTRY_DSN.substring(0, 30) + '...');
} else {
  console.warn('⚠️  Sentry DSN not set — error tracking disabled (server-side)');
}
