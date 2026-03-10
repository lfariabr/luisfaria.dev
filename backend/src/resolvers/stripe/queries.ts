import {
  getCheckoutSessionStatus,
  isStripeServiceError,
  mapStripeErrorCode,
} from '../../services/stripe';
import { createErrorHandler } from '../../utils/errors';

const withStripeErrorHandling = createErrorHandler(
  mapStripeErrorCode,
  isStripeServiceError,
  'Unable to verify checkout session'
);

export const stripeQueries = {
  checkoutSessionStatus: async (_: unknown, { sessionId }: { sessionId: string }) =>
    withStripeErrorHandling(
      () => getCheckoutSessionStatus(sessionId),
      'checkoutSessionStatus'
    ),
};
