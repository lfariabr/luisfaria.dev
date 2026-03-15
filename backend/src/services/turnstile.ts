import config from '../config/config';
import { z } from 'zod';
import { Errors } from '../utils/errors';
import { logger } from '../utils/logger';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TEST_BYPASS_TOKEN = 'test-turnstile-pass';
const TURNSTILE_TIMEOUT_MS = (() => {
  const parsed = Number(process.env.TURNSTILE_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
})();

const turnstileVerificationSchema = z.object({
  success: z.boolean(),
  'error-codes': z.array(z.string()).optional(),
});

type TurnstileVerificationResponse = z.infer<typeof turnstileVerificationSchema>;

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    if (token === TEST_BYPASS_TOKEN) return;
    throw Errors.badInput('Captcha verification failed');
  }

  if (!config.turnstileSecretKey) {
    logger.error('Turnstile secret key is not configured');
    throw Errors.internal('Registration protection is not configured');
  }

  const payload = new URLSearchParams({
    secret: config.turnstileSecretKey,
    response: token,
  });

  if (remoteIp && remoteIp !== 'unknown') {
    payload.set('remoteip', remoteIp);
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TURNSTILE_TIMEOUT_MS);

  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: payload,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Turnstile verification request timed out', { timeoutMs: TURNSTILE_TIMEOUT_MS });
      throw Errors.internal('Captcha verification service unavailable');
    }
    logger.error('Turnstile verification request failed', { error });
    throw Errors.internal('Captcha verification service unavailable');
  }

  if (!response.ok) {
    logger.error('Turnstile verification returned non-OK response', { status: response.status });
    throw Errors.internal('Captcha verification service unavailable');
  }

  let parsedResult: unknown;
  try {
    parsedResult = await response.json();
  } catch (error) {
    logger.error('Failed to parse Turnstile verification response', { error });
    throw Errors.internal('Captcha verification service unavailable');
  }

  const validation = turnstileVerificationSchema.safeParse(parsedResult);
  if (!validation.success) {
    logger.error('Turnstile verification response schema invalid', { issues: validation.error.issues });
    throw Errors.internal('Captcha verification service unavailable');
  }

  const result: TurnstileVerificationResponse = validation.data;
  if (!result.success) {
    logger.warn('Turnstile verification failed', { errorCodes: result['error-codes'] ?? [] });
    throw Errors.badInput('Captcha verification failed');
  }
}
