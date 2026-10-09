import {
  getCheckoutSessionStatus,
  isStripeServiceError,
  mapStripeErrorCode,
} from '../../services/stripe';
import { createErrorHandler } from '../../utils/errors';
import config from '../../config/config';

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
      productKey: session.productKey,
      bookingUrl:
        session.paymentStatus === 'paid' && session.productKey === 'meeting' && config.calMeetingUrl
          ? config.calMeetingUrl
          : null,
    };
  },
};
