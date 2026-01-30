import { GraphQLError } from 'graphql';
import Scream from '../../models/Scream';
import { rateLimiter } from '../../services/rateLimiter';
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
    throw new GraphQLError('Invalid email address', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const userEmail = normalizeEmail(userEmailRaw);

  // Redis rate limit (2/day)
  const key = `goggins:${userEmail}`;
  const limitResult = await rateLimiter.limit(key, 2, 86400); // 100 for testing

  if (!limitResult.success) {
    const resetIn = Math.max(0, Math.ceil((limitResult.resetTime.getTime() - Date.now()) / 1000));
    throw new GraphQLError('Rate limit exceeded', {
      extensions: {
        code: 'RATE_LIMITED',
        limit: limitResult.limit,
        remaining: 0,
        resetTime: limitResult.resetTime.toISOString(),
        resetIn,
      },
    });
  }

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

  const resetIn = Math.max(0, Math.ceil((limitResult.resetTime.getTime() - Date.now()) / 1000));

  // Match SDL Scream type (RateLimitInfo { allowed, resetIn, limit, remaining })
  return {
    id: newScream.id,
    userEmail: newScream.userEmail,
    text: newScream.text,
    modelUsed: newScream.modelUsed,
    explicitMode: newScream.explicitMode,
    isSubscriber: newScream.isSubscriber,
    createdAt: newScream.createdAt.toISOString(),
    rateLimitInfo: {
      allowed: true,
      resetIn,
      limit: limitResult.limit,
      remaining: limitResult.remaining,
    },
  };
};

export const screamMutations = {
  activateGogginsMode,
};