import type { StripeProductKey } from './stripe.types';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  email: string | null;
  productKey: StripeProductKey;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface PaymentsQueryData {
  payments: Payment[];
}
