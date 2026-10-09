import type Stripe from 'stripe';
import Payment, { PAYMENT_PRODUCT_KEYS, type PaymentProductKey, type PaymentStatus } from '../models/Payment';
import { notifyDiscord } from './discord';
import { sendCoffeeThankYouEmail, sendMeetingBookingEmail, type SendEmailResult } from './resendMailer';
import { meetingBookingUrl } from './stripe';
import { logger } from '../utils/logger';

const SUPPORT_CHECKOUT_SOURCE = 'luisfaria.dev';
const DEFAULT_CURRENCY = 'aud';
const DUPLICATE_KEY = 11000;

const isDuplicateKeyError = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: number }).code === DUPLICATE_KEY;

const isProductKey = (value: unknown): value is PaymentProductKey =>
  typeof value === 'string' && (PAYMENT_PRODUCT_KEYS as readonly string[]).includes(value);

const idOf = (ref: string | { id: string } | null | undefined) =>
  typeof ref === 'string' ? ref : ref?.id;

function toPaymentFields(session: Stripe.Checkout.Session) {
  const productKey = session.metadata?.productKey;
  if (session.metadata?.source !== SUPPORT_CHECKOUT_SOURCE || !isProductKey(productKey)) {
    logger.warn('Stripe session ignored: not from Support checkout', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
    });
    return null;
  }

  return {
    stripeSessionId: session.id,
    productKey,
    email: session.customer_details?.email ?? session.customer_email ?? undefined,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? DEFAULT_CURRENCY,
    stripePaymentIntentId: idOf(session.payment_intent),
  };
}

type PaymentFields = NonNullable<ReturnType<typeof toPaymentFields>>;

const formatAmount = (amount: number, currency: string) =>
  `${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;

const SUPPORTER_EMAILS: Record<
  PaymentProductKey,
  { kind: string; send: (to: string, fields: PaymentFields) => Promise<SendEmailResult | undefined> }
> = {
  coffee: {
    kind: 'coffee thank-you',
    send: (to) => sendCoffeeThankYouEmail(to),
  },
  meeting: {
    kind: 'meeting booking',
    send: async (to, fields) => {
      const bookingUrl = meetingBookingUrl(fields.productKey, 'paid');
      if (!bookingUrl) {
        logger.error('Meeting booking email skipped: CAL_MEETING_URL is not set', { sessionId: fields.stripeSessionId });
        return undefined;
      }
      return sendMeetingBookingEmail(to, bookingUrl);
    },
  },
};

async function sendSupporterEmail(fields: PaymentFields) {
  const { kind, send } = SUPPORTER_EMAILS[fields.productKey];
  if (!fields.email) {
    logger.warn('Supporter email skipped: no Supporter email', { sessionId: fields.stripeSessionId, email: kind });
    return undefined;
  }
  return send(fields.email, fields);
}

async function runPaidSideEffects(fields: PaymentFields) {
  const results = await Promise.allSettled([
    notifyDiscord(`💰 paid ${formatAmount(fields.amount, fields.currency)} — ${fields.productKey}`),
    sendSupporterEmail(fields),
  ]);

  results.forEach((result) => {
    const error =
      result.status === 'rejected'
        ? result.reason
        : (result.value as { error?: { message?: string } | null } | undefined)?.error;
    if (error) {
      logger.error('Payment side effect failed', {
        sessionId: fields.stripeSessionId,
        error: String((error as { message?: string }).message ?? error),
      });
    }
  });
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
    // The filter misses an already-settled Payment, so the upsert collides with the unique session id
    if (isDuplicateKeyError(error)) return false;
    throw error;
  }
}

async function markPaid(fields: PaymentFields) {
  if (await settle(fields, 'paid')) await runPaidSideEffects(fields);
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const fields = toPaymentFields(session);
  if (!fields) return;

  if (session.payment_status === 'paid') {
    await markPaid(fields);
    return;
  }

  await Payment.updateOne(
    { stripeSessionId: fields.stripeSessionId },
    { $setOnInsert: { ...fields, status: 'pending' } },
    { upsert: true }
  );
}

async function onAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
  const fields = toPaymentFields(session);
  if (fields) await markPaid(fields);
}

async function onAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  const fields = toPaymentFields(session);
  if (fields) await settle(fields, 'failed');
}

async function onChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = idOf(charge.payment_intent);
  // Partial refunds keep the Payment paid; only a full refund moves it to refunded
  if (!charge.refunded || !paymentIntentId) return;

  await Payment.updateOne({ stripePaymentIntentId: paymentIntentId }, { $set: { status: 'refunded' } });
}

export async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      return onCheckoutCompleted(event.data.object);
    case 'checkout.session.async_payment_succeeded':
      return onAsyncPaymentSucceeded(event.data.object);
    case 'checkout.session.async_payment_failed':
      return onAsyncPaymentFailed(event.data.object);
    case 'charge.refunded':
      return onChargeRefunded(event.data.object);
    default:
      return;
  }
}
