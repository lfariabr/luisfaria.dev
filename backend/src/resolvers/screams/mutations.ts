import Scream from '../../models/Scream';
import { Errors } from '../../utils/errors';
import { enforceRateLimit, Subject } from '../../rateLimiting';
import { chatWithGogginsMode } from '../../services/openai';
import { sendGogginsEmail } from '../../services/resendMailer';

// Simple email normalization/validation (replace later with zod schema)
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const isValidEmail = (email: string) => /.+@.+\..+/.test(email);

const buildPrompt = (explicitMode: boolean) => {
  if (explicitMode) {
    return `Generate one short motivational scream (150-200 chars or 1-3 sentences). Unleash brutal truths about self-improvement: own your failures, embrace pain, grind relentlessly. Use profanity (e.g., "f#ck", "f#ck#n", "m*t#f*c#n") for raw intensity.`;
  }

  return `Generate one short motivational scream (150-200 chars or 1-3 sentences). Deliver brutal truths about self-improvement: own your failures, embrace pain, grind relentlessly. Keep it intense, clean, no profanity.`;
};

export const activateGogginsMode = async (_: any, { input }: any) => {
  const userEmailRaw = input?.userEmail;
  const explicitMode = Boolean(input?.explicitMode);

  if (!userEmailRaw || !isValidEmail(userEmailRaw)) {
    throw Errors.badInput('Invalid email address');
  }

  const userEmail = normalizeEmail(userEmailRaw);

  const rateLimitInfo = await enforceRateLimit('goggins', Subject.email(userEmail));

  // Generate scream via OpenAI
  const modelUsed = 'gpt-3.5-turbo'; // keep aligned with chatWithAI's default
  const prompt = buildPrompt(explicitMode);
  const text = await chatWithGogginsMode(prompt);

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