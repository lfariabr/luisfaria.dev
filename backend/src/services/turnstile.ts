import config from '../config/config';
import { Errors } from '../utils/errors';
import { logger } from '../utils/logger';

interface TurnstileVerificationResponse {
  success: boolean;
  'error-codes'?: string[];
}

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TEST_BYPASS_TOKEN = 'test-turnstile-pass';

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
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: payload,
    });
  } catch (error) {
    logger.error('Turnstile verification request failed', { error });
    throw Errors.internal('Captcha verification service unavailable');
  }

  if (!response.ok) {
    logger.error('Turnstile verification returned non-OK response', { status: response.status });
    throw Errors.internal('Captcha verification service unavailable');
  }

  const result = await response.json() as TurnstileVerificationResponse;
  if (!result.success) {
    logger.warn('Turnstile verification failed', { errorCodes: result['error-codes'] ?? [] });
    throw Errors.badInput('Captcha verification failed');
  }
}
