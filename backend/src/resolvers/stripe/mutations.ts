import { createCheckoutSession, type StripeProductKey } from '../../services/stripe';
import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';

const ALLOWED_PRODUCT_KEYS: StripeProductKey[] = ['coffee', 'meeting'];

interface CheckoutInput {
  input: {
    productKey: string;
    email?: string;
  };
}

export const stripeMutations = {
  createCheckoutSession: async (_: unknown, { input }: CheckoutInput) => {
    const normalizedKey = input.productKey?.trim().toLowerCase();

    if (!ALLOWED_PRODUCT_KEYS.includes(normalizedKey as StripeProductKey)) {
      throw Errors.badInput('Invalid product key. Expected: coffee or meeting');
    }

    try {
      return await createCheckoutSession({
        productKey: normalizedKey as StripeProductKey,
        email: input.email?.trim() || undefined,
      });
    } catch (error) {
      logger.error('Failed to create Stripe checkout session', {
        resolver: 'createCheckoutSession',
        productKey: normalizedKey,
        error: String(error),
      });
      throw Errors.internal('Unable to start checkout');
    }
  },
};
