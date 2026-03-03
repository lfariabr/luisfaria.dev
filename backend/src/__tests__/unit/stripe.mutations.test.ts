import { stripeMutations } from '../../resolvers/stripe/mutations';

jest.mock('../../services/stripe', () => ({
  createCheckoutSession: jest.fn(),
}));

const { createCheckoutSession } = require('../../services/stripe');

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
});
