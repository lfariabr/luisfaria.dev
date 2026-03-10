export type StripeProductKey = 'coffee' | 'meeting';

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
  };
}
