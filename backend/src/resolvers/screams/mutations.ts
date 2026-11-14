import Scream from '../../models/Scream';
import { Errors } from '../../utils/errors';
import { enforceRateLimit, Subject } from '../../rateLimiting';
import { pickScream } from '../../data/gogginsScreams';
import { sendGogginsEmail } from '../../services/resendMailer';
import { notifyDiscord } from '../../services/discord';
import { logger } from '../../utils/logger';

// Simple email normalization/validation (replace later with zod schema)
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isValidEmail = (email: string) => /.+@.+\..+/.test(email);

export const activateGogginsMode = async (_: any, { input }: any) => {
  const userEmailRaw = input?.userEmail;
  const explicitMode = Boolean(input?.explicitMode);

  if (!userEmailRaw || !isValidEmail(userEmailRaw)) {
    throw Errors.badInput('Invalid email address');
  }

  const userEmail = normalizeEmail(userEmailRaw);

  const rateLimitInfo = await enforceRateLimit('goggins', Subject.email(userEmail));

  // Pick a static message, never the one this email got last (#497)
  const modelUsed = 'static';
  const previous = await Scream.findOne({ userEmail }).sort({ createdAt: -1 }).select('text').lean();
  const text = pickScream(explicitMode, previous?.text);

  // Persist
  const isSubscriber = true; // TODO: replace with Stripe/customer check
  const subscriptionType = 'free';

  const newScream = await Scream.create({
    userEmail,
    text,
    modelUsed: modelUsed,
    explicitMode,
    isSubscriber,
    subscriptionType,
  });

  // Fire-and-forget so Discord latency or outages never affect the scream.
  notifyDiscord(`💪 Goggins mode: ${userEmail} (tone: ${explicitMode ? 'explicit' : 'filtered'})`).catch(
    (error: unknown) => {
      logger.error('Goggins Discord notification failed', { error: String(error) });
    },
  );

  if (process.env.NODE_ENV !== 'test') {
    // Fire-and-forget email notification (non-blocking, non-fatal)
    void sendGogginsEmail(userEmail, text, { explicitMode })
      .then(({ error }) => {
        if (error) {
          console.error('[screams] sendGogginsEmail error:', error);
        }
      })
      .catch((err) => {
        console.error('[screams] sendGogginsEmail exception:', err);
      });
  }

  return {
    id: newScream.id,
    userEmail: newScream.userEmail,
    text: newScream.text,
    modelUsed: newScream.modelUsed,
    explicitMode: newScream.explicitMode,
    isSubscriber: newScream.isSubscriber,
    createdAt: newScream.createdAt.toISOString(),
    rateLimitInfo: {
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      resetTime: rateLimitInfo.resetTime.toISOString(),
    },
  };
};

export const screamMutations = {
  activateGogginsMode,
};