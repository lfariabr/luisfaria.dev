import {
  countNewSince,
  formatCurrencyTotals,
  latestPin,
  paymentsThisMonth,
  recentDraftArticles,
  recentFailedPayments,
  stalePendingPayments,
  toDate,
} from '@/lib/admin/dashboard';
import type { Article } from '@/lib/graphql/types/article.types';
import type { Payment } from '@/lib/graphql/types/payment.types';
import type { Pin } from '@/lib/graphql/types/pin.types';

const NOW = new Date(2026, 9, 15, 12);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const payment = (overrides: Partial<Payment>): Payment => ({
  id: 'p',
  email: null,
  productKey: 'coffee',
  amount: 500,
  currency: 'aud',
  status: 'paid',
  createdAt: ago(HOUR),
  ...overrides,
});

const article = (overrides: Partial<Article>): Article =>
  ({ id: 'a', published: false, updatedAt: ago(DAY), createdAt: ago(DAY), ...overrides }) as Article;

const pin = (overrides: Partial<Pin>): Pin =>
  ({ id: 'pin', placeName: 'Somewhere', date: ago(DAY), ...overrides }) as Pin;

describe('toDate', () => {
  it('parses ISO strings and epoch-ms strings to the same instant', () => {
    const iso = '2026-10-01T00:00:00.000Z';
    expect(toDate(String(Date.parse(iso))).toISOString()).toBe(iso);
    expect(toDate(iso).toISOString()).toBe(iso);
  });
});

describe('stalePendingPayments', () => {
  it('flags pending payments older than 24h only', () => {
    const payments = [
      payment({ id: 'fresh', status: 'pending', createdAt: ago(24 * HOUR) }),
      payment({ id: 'stale', status: 'pending', createdAt: ago(24 * HOUR + 1) }),
      payment({ id: 'paid', status: 'paid', createdAt: ago(10 * DAY) }),
    ];

    expect(stalePendingPayments(payments, NOW).map((p) => p.id)).toEqual(['stale']);
  });
});

describe('recentFailedPayments', () => {
  it('flags failed payments within the last 30 days', () => {
    const payments = [
      payment({ id: 'edge', status: 'failed', createdAt: ago(30 * DAY) }),
      payment({ id: 'old', status: 'failed', createdAt: ago(30 * DAY + 1) }),
      payment({ id: 'refunded', status: 'refunded' }),
    ];

    expect(recentFailedPayments(payments, NOW).map((p) => p.id)).toEqual(['edge']);
  });
});

describe('recentDraftArticles', () => {
  it('flags drafts updated within 30 days, including epoch-ms dates', () => {
    const articles = [
      article({ id: 'recent' }),
      article({ id: 'epoch', updatedAt: String(NOW.getTime() - 2 * DAY) }),
      article({ id: 'abandoned', updatedAt: ago(30 * DAY + 1) }),
      article({ id: 'published', published: true }),
    ];

    expect(recentDraftArticles(articles, NOW).map((a) => a.id)).toEqual(['recent', 'epoch']);
  });
});

describe('paymentsThisMonth', () => {
  it('counts and sums paid payments per currency for the current local calendar month', () => {
    const payments = [
      payment({ amount: 500, currency: 'aud' }),
      payment({ amount: 4000, currency: 'AUD' }),
      payment({ amount: 1000, currency: 'usd' }),
      payment({ status: 'refunded' }),
      payment({ status: 'failed' }),
      payment({ status: 'pending' }),
      payment({ amount: 9999, createdAt: new Date(2026, 8, 30, 23, 59, 59).toISOString() }),
      payment({ amount: 100, createdAt: new Date(2026, 9, 1).toISOString() }),
    ];

    const month = paymentsThisMonth(payments, NOW);

    expect(month.paidCount).toBe(4);
    expect(month.paidTotals).toEqual({ AUD: 4600, USD: 1000 });
    expect(month.refundedOrFailedCount).toBe(2);
    expect(formatCurrencyTotals(month.paidTotals)).toBe('AUD 46.00 · USD 10.00');
  });

  it('formats an empty month as an empty string', () => {
    expect(formatCurrencyTotals(paymentsThisMonth([], NOW).paidTotals)).toBe('');
  });
});

describe('countNewSince', () => {
  it('counts items created within the window', () => {
    const items = [{ createdAt: ago(7 * DAY) }, { createdAt: ago(7 * DAY + 1) }, { createdAt: String(NOW.getTime()) }];

    expect(countNewSince(items, 7, NOW)).toBe(2);
  });
});

describe('latestPin', () => {
  it('returns the pin with the most recent visit date', () => {
    const pins = [pin({ placeName: 'Old', date: ago(5 * DAY) }), pin({ placeName: 'New', date: ago(DAY) })];

    expect(latestPin(pins)?.placeName).toBe('New');
    expect(latestPin([])).toBeNull();
  });
});
