import express, { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import config from '../config/config';
import { applyStripeEvent } from '../services/payments';
import { logger } from '../utils/logger';

const router = Router();

router.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];
    if (!config.stripeWebhookSecret) {
      logger.error('Stripe webhook received but STRIPE_WEBHOOK_SECRET is not set');
      res.status(503).json({ error: 'Webhook not configured' });
      return;
    }

    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(req.body, signature ?? '', config.stripeWebhookSecret);
    } catch (error) {
      logger.warn('Stripe webhook signature verification failed', { error: String(error) });
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    try {
      await applyStripeEvent(event);
      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Stripe webhook handling failed', { eventId: event.id, type: event.type, error: String(error) });
      res.status(500).json({ error: 'Webhook handling failed' });
    }
  }
);

export default router;
