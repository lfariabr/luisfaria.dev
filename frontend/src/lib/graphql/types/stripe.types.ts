// Mirrors PAYMENT_PRODUCT_KEYS in backend/src/models/Payment.ts; keep the two lists in sync.
export const STRIPE_PRODUCT_KEYS = ['coffee', 'meeting'] as const;
export type StripeProductKey = (typeof STRIPE_PRODUCT_KEYS)[number];

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

export interface CreateCheckoutSessionData {
  createCheckoutSession: StripeCheckoutSession;
}

export interface CreateCheckoutSessionVariables {
  input: {
    productKey: StripeProductKey;
    email?: string;
    returnUrl?: string;
  };
}
