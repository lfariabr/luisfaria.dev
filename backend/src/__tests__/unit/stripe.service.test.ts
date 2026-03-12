import {
  createCheckoutSession,
  getCheckoutSessionStatus,
  StripeServiceError,
  isStripeServiceError,
  mapStripeErrorCode,
} from '../../services/stripe';

// Jest runs with NODE_ENV=test by default, so all service functions
// return test-mode stubs without requiring a real Stripe client.

describe('createCheckoutSession (test-mode stub)', () => {
  it('returns stub session for coffee product', async () => {
    const result = await createCheckoutSession({ productKey: 'coffee' });
    expect(result.sessionId).toBe('test_session_coffee');
    expect(result.url).toBe('https://checkout.stripe.com/test-coffee');
  });

  it('returns stub session for meeting product', async () => {
    const result = await createCheckoutSession({ productKey: 'meeting' });
    expect(result.sessionId).toBe('test_session_meeting');
    expect(result.url).toBe('https://checkout.stripe.com/test-meeting');
  });

  it('returns stub session regardless of returnUrl in test mode', async () => {
    const result = await createCheckoutSession({
      productKey: 'coffee',
      email: 'user@example.com',
      returnUrl: 'https://example.com/page',
    });
    expect(result.sessionId).toBe('test_session_coffee');
  });
});

describe('getCheckoutSessionStatus (test-mode stub)', () => {
  it('returns paid status for any sessionId', async () => {
    const result = await getCheckoutSessionStatus('cs_test_abc123');
    expect(result).toEqual({
      sessionId: 'cs_test_abc123',
      paymentStatus: 'paid',
      status: 'complete',
      customerEmail: 'test@example.com',
    });
  });

  it('preserves the sessionId passed in', async () => {
    const result = await getCheckoutSessionStatus('cs_live_xyz789');
    expect(result.sessionId).toBe('cs_live_xyz789');
  });
});

describe('StripeServiceError', () => {
  it('constructs with all fields', () => {
    const err = new StripeServiceError('NOT_CONFIGURED', 'Stripe missing', 503, { key: 'val' });
    expect(err.name).toBe('StripeServiceError');
    expect(err.code).toBe('NOT_CONFIGURED');
    expect(err.message).toBe('Stripe missing');
    expect(err.statusCode).toBe(503);
    expect(err.details).toEqual({ key: 'val' });
  });

  it('constructs with only required fields', () => {
    const err = new StripeServiceError('SESSION_NOT_FOUND', 'Not found');
    expect(err.statusCode).toBeUndefined();
    expect(err.details).toBeUndefined();
  });

  it('is an instance of Error', () => {
    const err = new StripeServiceError('MISSING_PRICE', 'No price');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('isStripeServiceError', () => {
  it('returns true for StripeServiceError instances', () => {
    const err = new StripeServiceError('NOT_CONFIGURED', 'msg');
    expect(isStripeServiceError(err)).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isStripeServiceError(new Error('plain'))).toBe(false);
  });

  it('returns false for null, string, and plain objects', () => {
    expect(isStripeServiceError(null)).toBe(false);
    expect(isStripeServiceError('string')).toBe(false);
    expect(isStripeServiceError({ code: 'NOT_CONFIGURED' })).toBe(false);
  });
});

describe('mapStripeErrorCode', () => {
  it.each([
    ['NOT_CONFIGURED', 'SERVICE_UNAVAILABLE'],
    ['MISSING_PRICE', 'SERVICE_UNAVAILABLE'],
    ['SESSION_NOT_FOUND', 'NOT_FOUND'],
    ['INVALID_RETURN_URL', 'BAD_USER_INPUT'],
  ] as const)('maps %s → %s', (code, expected) => {
    expect(mapStripeErrorCode(code)).toBe(expected);
  });
});
