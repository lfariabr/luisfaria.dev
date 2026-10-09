import request from 'supertest';
import express from 'express';
import Stripe from 'stripe';
import * as dbHandler from '../helpers/dbHandler';

const WEBHOOK_SECRET = 'whsec_test_secret';

jest.mock('../../config/config', () => {
  const actual = jest.requireActual('../../config/config');
  return {
    __esModule: true,
    ...actual,
    default: {
      ...actual.default,
      stripeWebhookSecret: 'whsec_test_secret',
      calMeetingUrl: 'https://cal.com/lfariadev/consulting-session',
    },
  };
});

const mockNotifyDiscord = jest.fn().mockResolvedValue(undefined);
jest.mock('../../services/discord', () => ({
  notifyDiscord: (...args: unknown[]) => mockNotifyDiscord(...args),
}));

const mockSendCoffeeThankYouEmail = jest.fn().mockResolvedValue({ data: null, error: null });
const mockSendMeetingBookingEmail = jest.fn().mockResolvedValue({ data: null, error: null });
jest.mock('../../services/resendMailer', () => ({
  sendCoffeeThankYouEmail: (...args: unknown[]) => mockSendCoffeeThankYouEmail(...args),
  sendMeetingBookingEmail: (...args: unknown[]) => mockSendMeetingBookingEmail(...args),
}));

import stripeWebhookRouter from '../../routes/stripeWebhook';
import Payment from '../../models/Payment';
import { logger } from '../../utils/logger';
import config from '../../config/config';

function buildApp() {
  const app = express();
  app.use(stripeWebhookRouter);
  app.use(express.json());
  return app;
}

type SessionOverrides = Partial<{
  id: string;
  payment_status: string;
  productKey: string;
  source: string | undefined;
  amount_total: number;
  payment_intent: string;
  email: string;
}>;

function session(overrides: SessionOverrides = {}) {
  const productKey = overrides.productKey ?? 'coffee';
  const metadata: Record<string, string> = { productKey };
  const source = 'source' in overrides ? overrides.source : 'luisfaria.dev';
  if (source) metadata.source = source;

  return {
    id: overrides.id ?? 'cs_test_1',
    object: 'checkout.session',
    payment_status: overrides.payment_status ?? 'paid',
    amount_total: overrides.amount_total ?? 500,
    currency: 'aud',
    payment_intent: overrides.payment_intent ?? 'pi_test_1',
    customer_details: { email: overrides.email ?? 'supporter@example.com' },
    customer_email: null,
    metadata,
  };
}

function event(type: string, object: unknown, id = `evt_${Math.random().toString(36).slice(2)}`) {
  return { id, object: 'event', type, data: { object } };
}

function post(app: express.Express, body: unknown, signature?: string) {
  const payload = JSON.stringify(body);
  const req = request(app)
    .post('/webhooks/stripe')
    .set('Content-Type', 'application/json');
  const header =
    signature ?? Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  return req.set('stripe-signature', header).send(payload);
}

describe('POST /webhooks/stripe', () => {
  const app = buildApp();

  beforeAll(async () => {
    await dbHandler.connect();
    await Payment.init();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe('signature verification', () => {
    it('rejects a request without a signature and writes nothing', async () => {
      const res = await request(app)
        .post('/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(event('checkout.session.completed', session())));

      expect(res.status).toBe(400);
      expect(await Payment.countDocuments()).toBe(0);
    });

    it('rejects a request with an invalid signature and writes nothing', async () => {
      const res = await post(app, event('checkout.session.completed', session()), 't=1,v1=bad');

      expect(res.status).toBe(400);
      expect(await Payment.countDocuments()).toBe(0);
      expect(mockNotifyDiscord).not.toHaveBeenCalled();
    });
  });

  describe('checkout.session.completed', () => {
    it('records a paid coffee Payment, pings Discord and thanks the Supporter', async () => {
      const res = await post(app, event('checkout.session.completed', session()));

      expect(res.status).toBe(200);
      const payment = await Payment.findOne({ stripeSessionId: 'cs_test_1' }).lean();
      expect(payment).toMatchObject({
        email: 'supporter@example.com',
        productKey: 'coffee',
        amount: 500,
        currency: 'aud',
        status: 'paid',
        stripePaymentIntentId: 'pi_test_1',
      });
      expect(mockNotifyDiscord).toHaveBeenCalledTimes(1);
      expect(mockNotifyDiscord).toHaveBeenCalledWith('💰 paid AUD 5.00 — coffee');
      expect(mockSendCoffeeThankYouEmail).toHaveBeenCalledWith('supporter@example.com');
    });

    it('does not send the coffee thank-you to meeting Supporters', async () => {
      await post(
        app,
        event('checkout.session.completed', session({ productKey: 'meeting', amount_total: 15000 }))
      );

      expect(mockNotifyDiscord).toHaveBeenCalledWith('💰 paid AUD 150.00 — meeting');
      expect(mockSendCoffeeThankYouEmail).not.toHaveBeenCalled();
    });

    it('records an unpaid session as pending without side effects', async () => {
      await post(app, event('checkout.session.completed', session({ payment_status: 'unpaid' })));

      const payment = await Payment.findOne({ stripeSessionId: 'cs_test_1' }).lean();
      expect(payment?.status).toBe('pending');
      expect(mockNotifyDiscord).not.toHaveBeenCalled();
      expect(mockSendCoffeeThankYouEmail).not.toHaveBeenCalled();
    });

    it('ignores sessions that did not come from Support checkout', async () => {
      const res = await post(app, event('checkout.session.completed', session({ source: undefined })));

      expect(res.status).toBe(200);
      expect(await Payment.countDocuments()).toBe(0);
      expect(mockNotifyDiscord).not.toHaveBeenCalled();
    });

    it('is idempotent when the same event is delivered twice', async () => {
      const body = event('checkout.session.completed', session(), 'evt_replayed');

      await post(app, body);
      const replay = await post(app, body);

      expect(replay.status).toBe(200);
      expect(await Payment.countDocuments()).toBe(1);
      expect(mockNotifyDiscord).toHaveBeenCalledTimes(1);
      expect(mockSendCoffeeThankYouEmail).toHaveBeenCalledTimes(1);
    });

    it('still acknowledges the event when the email fails', async () => {
      mockSendCoffeeThankYouEmail.mockRejectedValueOnce(new Error('resend down'));

      const res = await post(app, event('checkout.session.completed', session()));

      expect(res.status).toBe(200);
      expect((await Payment.findOne().lean())?.status).toBe('paid');
    });
  });

  describe('meeting booking email', () => {
    const meeting = () => session({ productKey: 'meeting', amount_total: 15000 });

    afterEach(() => {
      config.calMeetingUrl = 'https://cal.com/lfariadev/consulting-session';
    });

    it('sends the Cal.com booking link to meeting Supporters', async () => {
      await post(app, event('checkout.session.completed', meeting()));

      expect(mockSendMeetingBookingEmail).toHaveBeenCalledTimes(1);
      expect(mockSendMeetingBookingEmail).toHaveBeenCalledWith(
        'supporter@example.com',
        'https://cal.com/lfariadev/consulting-session'
      );
    });

    it('never sends it to coffee Supporters', async () => {
      await post(app, event('checkout.session.completed', session()));

      expect(mockSendMeetingBookingEmail).not.toHaveBeenCalled();
    });

    it('sends it only once when the event is replayed', async () => {
      const body = event('checkout.session.completed', meeting(), 'evt_meeting_replayed');

      await post(app, body);
      await post(app, body);

      expect(mockSendMeetingBookingEmail).toHaveBeenCalledTimes(1);
    });

    it('waits for an async meeting payment to succeed before sending it', async () => {
      await post(app, event('checkout.session.completed', session({ productKey: 'meeting', payment_status: 'unpaid' })));
      expect(mockSendMeetingBookingEmail).not.toHaveBeenCalled();

      await post(app, event('checkout.session.async_payment_succeeded', meeting()));
      expect(mockSendMeetingBookingEmail).toHaveBeenCalledTimes(1);
    });

    it('logs and skips the email when CAL_MEETING_URL is not configured', async () => {
      config.calMeetingUrl = '';
      const errorSpy = jest.spyOn(logger, 'error');

      const res = await post(app, event('checkout.session.completed', meeting()));

      expect(res.status).toBe(200);
      expect((await Payment.findOne().lean())?.status).toBe('paid');
      expect(mockSendMeetingBookingEmail).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        'Meeting booking email skipped: CAL_MEETING_URL is not set',
        expect.objectContaining({ sessionId: 'cs_test_1' })
      );
      errorSpy.mockRestore();
    });
  });

  describe('logging', () => {
    it('logs an email failure returned by Resend with the session id', async () => {
      const errorSpy = jest.spyOn(logger, 'error');
      mockSendCoffeeThankYouEmail.mockResolvedValueOnce({ data: null, error: { message: 'domain not verified' } });

      await post(app, event('checkout.session.completed', session()));

      expect(errorSpy).toHaveBeenCalledWith(
        'Payment side effect failed',
        expect.objectContaining({ sessionId: 'cs_test_1', error: expect.stringContaining('domain not verified') })
      );
      errorSpy.mockRestore();
    });

    it('warns when a session is ignored for missing Support checkout metadata', async () => {
      const warnSpy = jest.spyOn(logger, 'warn');

      await post(app, event('checkout.session.completed', session({ source: undefined })));

      expect(warnSpy).toHaveBeenCalledWith(
        'Stripe session ignored: not from Support checkout',
        expect.objectContaining({ sessionId: 'cs_test_1' })
      );
      warnSpy.mockRestore();
    });

    it('warns when a paid coffee Payment has no email to thank', async () => {
      const warnSpy = jest.spyOn(logger, 'warn');
      const noEmail = { ...session(), customer_details: { email: null } };

      await post(app, event('checkout.session.completed', noEmail));

      expect(mockSendCoffeeThankYouEmail).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        'Coffee thank-you skipped: no Supporter email',
        expect.objectContaining({ sessionId: 'cs_test_1' })
      );
      warnSpy.mockRestore();
    });
  });

  describe('async payments', () => {
    it('moves a pending Payment to paid and fires side effects once', async () => {
      await post(app, event('checkout.session.completed', session({ payment_status: 'unpaid' })));
      await post(app, event('checkout.session.async_payment_succeeded', session()));

      expect((await Payment.findOne().lean())?.status).toBe('paid');
      expect(mockNotifyDiscord).toHaveBeenCalledTimes(1);
      expect(mockSendCoffeeThankYouEmail).toHaveBeenCalledTimes(1);
    });

    it('moves a pending Payment to failed', async () => {
      await post(app, event('checkout.session.completed', session({ payment_status: 'unpaid' })));
      await post(
        app,
        event('checkout.session.async_payment_failed', session({ payment_status: 'unpaid' }))
      );

      expect((await Payment.findOne().lean())?.status).toBe('failed');
      expect(mockNotifyDiscord).not.toHaveBeenCalled();
    });

    it('does not downgrade a paid Payment when a late completed event arrives', async () => {
      await post(app, event('checkout.session.async_payment_succeeded', session()));
      await post(app, event('checkout.session.completed', session({ payment_status: 'unpaid' })));

      expect((await Payment.findOne().lean())?.status).toBe('paid');
    });
  });

  describe('charge.refunded', () => {
    it('marks the matching Payment as refunded', async () => {
      await post(app, event('checkout.session.completed', session()));
      await post(
        app,
        event('charge.refunded', { id: 'ch_1', object: 'charge', payment_intent: 'pi_test_1', refunded: true })
      );

      expect((await Payment.findOne().lean())?.status).toBe('refunded');
    });

    it('leaves the Payment paid on a partial refund', async () => {
      await post(app, event('checkout.session.completed', session()));
      await post(
        app,
        event('charge.refunded', { id: 'ch_1', object: 'charge', payment_intent: 'pi_test_1', refunded: false })
      );

      expect((await Payment.findOne().lean())?.status).toBe('paid');
    });

    it('does not move a refunded Payment back to paid on replay', async () => {
      const completed = event('checkout.session.completed', session(), 'evt_completed');
      await post(app, completed);
      await post(
        app,
        event('charge.refunded', { id: 'ch_1', object: 'charge', payment_intent: 'pi_test_1', refunded: true })
      );
      await post(app, completed);

      expect((await Payment.findOne().lean())?.status).toBe('refunded');
      expect(mockNotifyDiscord).toHaveBeenCalledTimes(1);
    });
  });

  it('acknowledges event types it does not handle', async () => {
    const res = await post(app, event('customer.created', { id: 'cus_1', object: 'customer' }));

    expect(res.status).toBe(200);
    expect(await Payment.countDocuments()).toBe(0);
  });
});
