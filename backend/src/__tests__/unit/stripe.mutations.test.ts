import { stripeMutations } from '../../resolvers/stripe/mutations';
import { stripeQueries } from '../../resolvers/stripe/queries';
import config from '../../config/config';

const CAL_URL = 'https://cal.com/lfariadev/consulting-session';

jest.mock('../../config/config', () => {
  const actual = jest.requireActual('../../config/config');
  return {
    __esModule: true,
    ...actual,
    default: { ...actual.default, calMeetingUrl: 'https://cal.com/lfariadev/consulting-session' },
  };
});

jest.mock('../../services/stripe', () => ({
  createCheckoutSession: jest.fn(),
  getCheckoutSessionStatus: jest.fn(),
  meetingBookingUrl: jest.requireActual('../../services/stripe').meetingBookingUrl,
  isStripeServiceError: (error: unknown) => !!error && typeof error === 'object' && 'code' in error,
  mapStripeErrorCode: (code: string) => {
    if (code === 'SESSION_NOT_FOUND') return 'NOT_FOUND';
    if (code === 'NOT_CONFIGURED' || code === 'MISSING_PRICE') return 'SERVICE_UNAVAILABLE';
    if (code === 'INVALID_RETURN_URL') return 'BAD_USER_INPUT';
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
      returnUrl: undefined,
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
      productKey: 'coffee',
    });

    const result = await stripeQueries.checkoutSessionStatus({}, { sessionId: 'cs_test_1' });

    expect(result).toEqual({
      sessionId: 'cs_test_1',
      paymentStatus: 'paid',
      status: 'complete',
      productKey: 'coffee',
      bookingUrl: null,
    });
  });

  describe('bookingUrl', () => {
    const meetingSession = (paymentStatus: string) => ({
      sessionId: 'cs_meeting',
      paymentStatus,
      status: 'complete',
      customerEmail: 'paid@example.com',
      productKey: 'meeting',
    });

    afterEach(() => {
      config.calMeetingUrl = CAL_URL;
    });

    it('hands out the Cal.com link for a paid meeting', async () => {
      getCheckoutSessionStatus.mockResolvedValue(meetingSession('paid'));

      const result = await stripeQueries.checkoutSessionStatus({}, { sessionId: 'cs_meeting' });

      expect(result).toMatchObject({ productKey: 'meeting', bookingUrl: CAL_URL });
    });

    it('withholds the link while the meeting is unpaid', async () => {
      getCheckoutSessionStatus.mockResolvedValue(meetingSession('unpaid'));

      const result = await stripeQueries.checkoutSessionStatus({}, { sessionId: 'cs_meeting' });

      expect(result.bookingUrl).toBeNull();
    });

    it('returns no link when CAL_MEETING_URL is not configured', async () => {
      config.calMeetingUrl = '';
      getCheckoutSessionStatus.mockResolvedValue(meetingSession('paid'));

      const result = await stripeQueries.checkoutSessionStatus({}, { sessionId: 'cs_meeting' });

      expect(result.bookingUrl).toBeNull();
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

describe('stripeMutations.createCheckoutSession — meeting product', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a checkout session for the meeting product', async () => {
    createCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_meeting_1',
      url: 'https://checkout.stripe.com/c/pay/cs_test_meeting_1',
    });

    const result = await stripeMutations.createCheckoutSession(
      {},
      { input: { productKey: 'meeting', email: 'user@example.com' } }
    );

    expect(createCheckoutSession).toHaveBeenCalledWith({
      productKey: 'meeting',
      email: 'user@example.com',
      returnUrl: undefined,
    });
    expect(result).toEqual({
      sessionId: 'cs_test_meeting_1',
      url: 'https://checkout.stripe.com/c/pay/cs_test_meeting_1',
    });
  });
});

describe('stripeMutations.createCheckoutSession — returnUrl', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes returnUrl through to the service', async () => {
    createCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_2',
      url: 'https://checkout.stripe.com/c/pay/cs_test_2',
    });

    await stripeMutations.createCheckoutSession(
      {},
      { input: { productKey: 'coffee', returnUrl: 'https://luisfaria.dev/projects' } }
    );

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ returnUrl: 'https://luisfaria.dev/projects' })
    );
  });

  it('maps INVALID_RETURN_URL service error to BAD_USER_INPUT', async () => {
    createCheckoutSession.mockRejectedValue(
      Object.assign(new Error('Return URL must belong to the frontend origin'), {
        code: 'INVALID_RETURN_URL',
        statusCode: 400,
        details: { returnUrl: 'https://evil.com' },
      })
    );

    await expect(
      stripeMutations.createCheckoutSession(
        {},
        { input: { productKey: 'coffee', returnUrl: 'https://evil.com' } }
      )
    ).rejects.toMatchObject({
      extensions: { code: 'BAD_USER_INPUT' },
    });
  });
});
