import {
  createCheckoutSession,
  isStripeServiceError,
  mapStripeErrorCode,
  type StripeProductKey,
} from '../../services/stripe';
import { createErrorHandler, Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';

const ALLOWED_PRODUCT_KEYS: StripeProductKey[] = ['coffee', 'meeting'];
const withStripeErrorHandling = createErrorHandler(
  mapStripeErrorCode,
  isStripeServiceError,
  'Unable to start checkout'
);

interface CheckoutInput {
  input: {
    productKey: string;
    email?: string;
  };
}

export const stripeMutations = {
  createCheckoutSession: async (_: unknown, { input }: CheckoutInput) => {
    const normalizedKey = input.productKey?.trim().toLowerCase();
    logger.info('createCheckoutSession requested', { productKey: normalizedKey, hasEmail: !!input.email });

    if (!ALLOWED_PRODUCT_KEYS.includes(normalizedKey as StripeProductKey)) {
      throw Errors.badInput('Invalid product key. Expected: coffee or meeting');
    }

    return withStripeErrorHandling(
      () =>
        createCheckoutSession({
          productKey: normalizedKey as StripeProductKey,
          email: input.email,
        }),
      'createCheckoutSession'
    );
  },
};
