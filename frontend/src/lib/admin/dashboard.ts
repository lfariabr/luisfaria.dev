import type { Article } from '@/lib/graphql/types/article.types';
import type { Payment } from '@/lib/graphql/types/payment.types';
import type { Pin } from '@/lib/graphql/types/pin.types';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const PENDING_STALE_AFTER_HOURS = 24;
export const ATTENTION_WINDOW_DAYS = 30;
export const NEW_USERS_WINDOW_DAYS = 7;

// Mongoose Date fields without a resolver serialize as epoch-ms strings; others are ISO.
export const toDate = (value: string): Date =>
  /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value);

const ageMs = (value: string, now: Date) => now.getTime() - toDate(value).getTime();

const isWithinDays = (value: string, days: number, now: Date) => ageMs(value, now) <= days * DAY_MS;

const isThisMonth = (value: string, now: Date) => {
  const date = toDate(value);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

export const recentFailedPayments = (payments: Payment[], now: Date) =>
  payments.filter(
    (payment) =>
      payment.status === 'failed' && isWithinDays(payment.createdAt, ATTENTION_WINDOW_DAYS, now),
  );

export const stalePendingPayments = (payments: Payment[], now: Date) =>
  payments.filter(
    (payment) =>
      payment.status === 'pending' &&
      ageMs(payment.createdAt, now) > PENDING_STALE_AFTER_HOURS * HOUR_MS,
  );

export const recentDraftArticles = (articles: Article[], now: Date) =>
  articles.filter(
    (article) =>
      !article.published && isWithinDays(article.updatedAt, ATTENTION_WINDOW_DAYS, now),
  );

export type CurrencyTotals = Record<string, number>;

export const paymentsThisMonth = (payments: Payment[], now: Date) => {
  const thisMonth = payments.filter((payment) => isThisMonth(payment.createdAt, now));
  const paid = thisMonth.filter((payment) => payment.status === 'paid');

  return {
    paidCount: paid.length,
    paidTotals: paid.reduce<CurrencyTotals>((totals, payment) => {
      const currency = payment.currency.toUpperCase();
      totals[currency] = (totals[currency] ?? 0) + payment.amount;
      return totals;
    }, {}),
    refundedOrFailedCount: thisMonth.filter(
      (payment) => payment.status === 'refunded' || payment.status === 'failed',
    ).length,
  };
};

export const formatCurrencyTotals = (totals: CurrencyTotals) =>
  Object.entries(totals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, cents]) => `${currency} ${(cents / 100).toFixed(2)}`)
    .join(' · ');

export const countNewSince = (items: { createdAt: string }[], days: number, now: Date) =>
  items.filter((item) => isWithinDays(item.createdAt, days, now)).length;

export const latestPin = (pins: Pin[]) =>
  pins.reduce<Pin | null>(
    (latest, pin) => (!latest || toDate(pin.date) > toDate(latest.date) ? pin : latest),
    null,
  );
