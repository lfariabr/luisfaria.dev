import type Stripe from 'stripe';
import Payment, { PAYMENT_PRODUCT_KEYS, type PaymentProductKey, type PaymentStatus } from '../models/Payment';
import { notifyDiscord } from './discord';
import { sendCoffeeThankYouEmail } from './resendMailer';
import { logger } from '../utils/logger';

const SUPPORT_CHECKOUT_SOURCE = 'luisfaria.dev';
const DUPLICATE_KEY = 11000;

const isDuplicateKeyError = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === DUPLICATE_KEY;

const isProductKey = (value: unknown): value is PaymentProductKey =>
  typeof value === 'string' && (PAYMENT_PRODUCT_KEYS as readonly string[]).includes(value);

const idOf = (ref: string | { id: string } | null | undefined) =>
  typeof ref === 'string' ? ref : ref?.id;

function toPaymentFields(session: Stripe.Checkout.Session) {
  const productKey = session.metadata?.productKey;
  if (session.metadata?.source !== SUPPORT_CHECKOUT_SOURCE || !isProductKey(productKey)) return null;

  return {
    stripeSessionId: session.id,
    productKey,
    email: session.customer_details?.email ?? session.customer_email ?? undefined,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? 'aud',
    stripePaymentIntentId: idOf(session.payment_intent),
  };
}

type PaymentFields = NonNullable<ReturnType<typeof toPaymentFields>>;

const formatAmount = (amount: number, currency: string) =>
  `${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;

async function onPaid(fields: PaymentFields) {
  const results = await Promise.allSettled([
    notifyDiscord(`💰 paid ${formatAmount(fields.amount, fields.currency)} — ${fields.productKey}`),
    fields.productKey === 'coffee' && fields.email ? sendCoffeeThankYouEmail(fields.email) : Promise.resolve(),
  ]);

  results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .forEach((r) => logger.error('Payment side effect failed', { sessionId: fields.stripeSessionId, error: String(r.reason) }));
}

async function recordPending(fields: PaymentFields) {
  await Payment.updateOne(
    { stripeSessionId: fields.stripeSessionId },
    { $setOnInsert: { ...fields, status: 'pending' } },
    { upsert: true }
  );
}

/** Moves a Payment into a settled status unless it is already paid or refunded. Returns true if it moved. */
async function settle(fields: PaymentFields, status: Extract<PaymentStatus, 'paid' | 'failed'>): Promise<boolean> {
  try {
    await Payment.findOneAndUpdate(
      { stripeSessionId: fields.stripeSessionId, status: { $nin: ['paid', 'refunded'] } },
      { $set: { ...fields, status } },
      { upsert: true }
    );
    return true;
  } catch (error) {
    if (isDuplicateKeyError(error)) return false;
    throw error;
  }
}

async function onSession(session: Stripe.Checkout.Session, target: 'completed' | 'succeeded' | 'failed') {
  const fields = toPaymentFields(session);
  if (!fields) return;

  if (target === 'failed') {
    await settle(fields, 'failed');
    return;
  }

  if (target === 'completed' && session.payment_status !== 'paid') {
    await recordPending(fields);
    return;
  }

  if (await settle(fields, 'paid')) await onPaid(fields);
}

async function onChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = idOf(charge.payment_intent);
  if (!charge.refunded || !paymentIntentId) return;

  await Payment.updateOne({ stripePaymentIntentId: paymentIntentId }, { $set: { status: 'refunded' } });
}

export async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      return onSession(event.data.object, 'completed');
    case 'checkout.session.async_payment_succeeded':
      return onSession(event.data.object, 'succeeded');
    case 'checkout.session.async_payment_failed':
      return onSession(event.data.object, 'failed');
    case 'charge.refunded':
      return onChargeRefunded(event.data.object);
    default:
      return;
  }
}
