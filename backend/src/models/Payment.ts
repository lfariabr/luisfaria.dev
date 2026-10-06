import mongoose, { Document, Schema } from 'mongoose';

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PRODUCT_KEYS = ['coffee', 'meeting'] as const;
export type PaymentProductKey = (typeof PAYMENT_PRODUCT_KEYS)[number];

export interface IPayment extends Document {
  email?: string;
  productKey: PaymentProductKey;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    email: { type: String, trim: true, lowercase: true },
    productKey: { type: String, enum: PAYMENT_PRODUCT_KEYS, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true },
    status: { type: String, enum: PAYMENT_STATUSES, required: true },
    stripeSessionId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String, index: true },
  },
  { timestamps: true }
);

PaymentSchema.index({ createdAt: -1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
