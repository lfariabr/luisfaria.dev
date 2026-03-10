import Stripe from 'stripe';
import config from '../config/config';
import { ErrorCodes, type ErrorCode, type ServiceError } from '../utils/errors';

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

export interface StripeSessionStatus {
  sessionId: string;
  paymentStatus: string;
  status: string | null;
  customerEmail: string | null;
}

type StripeServiceErrorCode = 'NOT_CONFIGURED' | 'MISSING_PRICE' | 'SESSION_NOT_FOUND';

export class StripeServiceError extends Error implements ServiceError {
  code: StripeServiceErrorCode;
  statusCode?: number;
  details?: unknown;

  constructor(code: StripeServiceErrorCode, message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'StripeServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface CreateCheckoutSessionInput {
  productKey: StripeProductKey;
  email?: string;
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

function assertStripeConfigured() {
  if (!stripeClient) {
    throw new StripeServiceError('NOT_CONFIGURED', 'Stripe is not configured', 503);
  }
}

function getStripeClient(): Stripe {
  assertStripeConfigured();
  return stripeClient as Stripe;
}

function normalizeEmail(email?: string): string | undefined {
  const trimmedEmail = email?.trim();
  return trimmedEmail ? trimmedEmail : undefined;
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

  const client = getStripeClient();

  const product = PRODUCTS[productKey];
  if (!product?.priceId) {
    throw new StripeServiceError(
      'MISSING_PRICE',
      `Stripe price is not configured for ${productKey}`,
      503,
      { productKey }
    );
  }

  const customerEmail = normalizeEmail(email);

  const session = await client.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: product.priceId,
        quantity: 1,
      },
    ],
    success_url: `${config.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontendUrl}/payment/cancel`,
    customer_email: customerEmail,
    metadata: {
      productKey,
      productLabel: product.label,
      source: 'luisfaria.dev',
    },
  });

  if (!session.url) {
    throw new StripeServiceError('NOT_CONFIGURED', 'Stripe did not return a checkout URL', 502);
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export async function getCheckoutSessionStatus(sessionId: string): Promise<StripeSessionStatus> {
  if (process.env.NODE_ENV === 'test') {
    return {
      sessionId,
      paymentStatus: 'paid',
      status: 'complete',
      customerEmail: 'test@example.com',
    };
  }

  const client = getStripeClient();

  try {
    const session = await client.checkout.sessions.retrieve(sessionId);
    return {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
      customerEmail: session.customer_email,
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      throw new StripeServiceError('SESSION_NOT_FOUND', 'Checkout session not found', 404, { sessionId });
    }
    throw error;
  }
}

export function mapStripeErrorCode(code: StripeServiceErrorCode): ErrorCode {
  const mapping: Record<StripeServiceErrorCode, ErrorCode> = {
    NOT_CONFIGURED: ErrorCodes.SERVICE_UNAVAILABLE,
    MISSING_PRICE: ErrorCodes.SERVICE_UNAVAILABLE,
    SESSION_NOT_FOUND: ErrorCodes.NOT_FOUND,
  };

  return mapping[code] ?? ErrorCodes.INTERNAL_SERVER_ERROR;
}

export function isStripeServiceError(error: unknown): error is StripeServiceError {
  return error instanceof StripeServiceError;
}
