import Stripe from 'stripe';
import config from '../config/config';

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2026-02-25.clover';

const stripeClient = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, { apiVersion: STRIPE_API_VERSION })
  : null;

const PRODUCTS = {
  coffee: {
    priceId: config.stripeCoffeePriceId,
    label: 'Buy me a coffee',
  },
  meeting: {
    priceId: config.stripeMeetingPriceId,
    label: 'Book a meeting',
  },
} as const;

export type StripeProductKey = keyof typeof PRODUCTS;

interface CreateCheckoutSessionInput {
  productKey: StripeProductKey;
  email?: string;
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession({
  productKey,
  email,
}: CreateCheckoutSessionInput): Promise<CheckoutSessionResult> {
  if (process.env.NODE_ENV === 'test') {
    return {
      sessionId: `test_session_${productKey}`,
      url: `https://checkout.stripe.com/test-${productKey}`,
    };
  }

  if (!stripeClient) {
    throw new Error('Stripe is not configured');
  }

  const product = PRODUCTS[productKey];
  if (!product?.priceId) {
    throw new Error(`Missing Stripe price for ${productKey}`);
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: product.priceId,
        quantity: 1,
      },
    ],
    success_url: `${config.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment/cancel`,
    customer_email: email || undefined,
    metadata: {
      productKey,
      productLabel: product.label,
      source: 'luisfaria.dev',
    },
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}
