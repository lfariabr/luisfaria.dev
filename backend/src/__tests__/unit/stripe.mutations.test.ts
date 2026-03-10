import { stripeMutations } from '../../resolvers/stripe/mutations';
import { stripeQueries } from '../../resolvers/stripe/queries';

jest.mock('../../services/stripe', () => ({
  createCheckoutSession: jest.fn(),
  getCheckoutSessionStatus: jest.fn(),
  isStripeServiceError: (error: unknown) => !!error && typeof error === 'object' && 'code' in error,
  mapStripeErrorCode: (code: string) => {
    if (code === 'SESSION_NOT_FOUND') return 'NOT_FOUND';
    if (code === 'NOT_CONFIGURED' || code === 'MISSING_PRICE') return 'SERVICE_UNAVAILABLE';
    return 'INTERNAL_SERVER_ERROR';
  },
}));

const { createCheckoutSession, getCheckoutSessionStatus } = require('../../services/stripe');

describe('stripeMutations.createCheckoutSession', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a checkout session for valid coffee product', async () => {
    createCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_1',
      url: 'https://checkout.stripe.com/c/pay/cs_test_1',
    });

    const result = await stripeMutations.createCheckoutSession(
      {},
      { input: { productKey: 'coffee', email: 'test@email.com' } }
    );

    expect(createCheckoutSession).toHaveBeenCalledWith({
      productKey: 'coffee',
      email: 'test@email.com',
    });
    expect(result).toEqual({
      sessionId: 'cs_test_1',
      url: 'https://checkout.stripe.com/c/pay/cs_test_1',
    });
  });

  it('rejects invalid product key', async () => {
    await expect(
      stripeMutations.createCheckoutSession({}, { input: { productKey: 'invalid' } })
    ).rejects.toMatchObject({
      extensions: {
        code: 'BAD_USER_INPUT',
      },
    });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it('maps service errors to internal error', async () => {
    createCheckoutSession.mockRejectedValue(new Error('Stripe is down'));

    await expect(
      stripeMutations.createCheckoutSession({}, { input: { productKey: 'meeting' } })
    ).rejects.toMatchObject({
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  });

  it('maps Stripe service errors to service unavailable', async () => {
    createCheckoutSession.mockRejectedValue(
      Object.assign(new Error('Stripe is not configured'), {
        code: 'NOT_CONFIGURED',
        statusCode: 503,
      })
    );

    await expect(
      stripeMutations.createCheckoutSession({}, { input: { productKey: 'meeting' } })
    ).rejects.toMatchObject({
      extensions: {
        code: 'SERVICE_UNAVAILABLE',
      },
    });
  });
});

describe('stripeQueries.checkoutSessionStatus', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns checkout session status when the session exists', async () => {
    getCheckoutSessionStatus.mockResolvedValue({
      sessionId: 'cs_test_1',
      paymentStatus: 'paid',
      status: 'complete',
      customerEmail: 'paid@example.com',
    });

    const result = await stripeQueries.checkoutSessionStatus({}, { sessionId: 'cs_test_1' });

    expect(result).toEqual({
      sessionId: 'cs_test_1',
      paymentStatus: 'paid',
      status: 'complete',
    });
  });

  it('maps missing session status to not found', async () => {
    getCheckoutSessionStatus.mockRejectedValue(
      Object.assign(new Error('Checkout session not found'), {
        code: 'SESSION_NOT_FOUND',
        statusCode: 404,
      })
    );

    await expect(
      stripeQueries.checkoutSessionStatus({}, { sessionId: 'missing' })
    ).rejects.toMatchObject({
      extensions: {
        code: 'NOT_FOUND',
      },
    });
  });
});
