import * as Sentry from '@sentry/node';
import type { EventHint } from '@sentry/node';
import { GraphQLError } from 'graphql';
import config from './config/config';

// GraphQL extension codes that represent auth flow, not bugs
const AUTH_CODES = new Set(['UNAUTHENTICATED', 'FORBIDDEN', 'BAD_USER_INPUT']);

// Initialize Sentry only if DSN is provided
const sentryDsn = process.env.SENTRY_DSN || '';

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: config.nodeEnv,
    release: process.env.npm_package_version || '1.0.0',

    // Performance monitoring - sample 20% of transactions in prod
    tracesSampleRate: config.nodeEnv === 'production' ? 0.2 : 1.0,

    // Filter out noisy or expected errors
    beforeSend(event, hint: EventHint) {
      // Skip HTTP 401/403 - auth flow, not bugs
      const statusCode = event.contexts?.response?.status_code;
      if (statusCode === 401 || statusCode === 403) {
        return null;
      }

      // Skip GraphQL auth/validation errors by inspecting the original thrown error
      const original = hint.originalException;
      if (original instanceof GraphQLError) {
        const code = original.extensions?.code;
        if (typeof code === 'string' && AUTH_CODES.has(code)) {
          return null;
        }
      }

      return event;
    },

    // Attach server metadata
    initialScope: {
      tags: {
        service: 'portfolio-api',
      },
    },
  });

  console.log('Sentry initialized for backend');
} else {
  console.log('Sentry DSN not set - error tracking disabled');
}

export { Sentry };
