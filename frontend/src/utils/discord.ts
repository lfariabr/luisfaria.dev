import { logger } from '@/lib/logger';

export async function sendDiscordWebhook(message: string): Promise<void> {
  try {
    const payload = { message };
    logger.debug('Sending Discord webhook', { message });

    const response = await fetch('/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    logger.debug('Discord webhook response', { status: response.status });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Failed to read error');
      logger.error('Discord webhook error response', { error, status: response.status });
      throw new Error(`Discord API error: ${response.status}`);
    }
  } catch (error) {
    logger.error('Discord webhook failed', { error: String(error) });
    throw new Error('Failed to send notification');
  }
}