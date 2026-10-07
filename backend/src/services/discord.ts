import config from '../config/config';
import { logger } from '../utils/logger';

const DISCORD_TIMEOUT_MS = 5000;

export async function notifyDiscord(content: string): Promise<void> {
  if (config.nodeEnv === 'test') return;
  if (!config.discordWebhookUrl) {
    logger.warn('notifyDiscord skipped: DISCORD_WEBHOOK_URL is not set');
    return;
  }

  try {
    const response = await fetch(config.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      signal: AbortSignal.timeout(DISCORD_TIMEOUT_MS),
    });
    if (!response.ok) {
      logger.error('Discord webhook returned an error', { status: response.status });
    }
  } catch (error) {
    logger.error('Discord webhook failed', { error: String(error) });
  }
}
