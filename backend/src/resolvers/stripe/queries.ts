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
  checkoutSessionStatus: async (_: unknown, { sessionId }: { sessionId: string }) => {
    const session = await withStripeErrorHandling(
      () => getCheckoutSessionStatus(sessionId),
      'checkoutSessionStatus'
    );

    return {
      sessionId: session.sessionId,
      paymentStatus: session.paymentStatus,
      status: session.status,
    };
  },
};
