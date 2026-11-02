import { logger } from '@/lib/logger';
import type { DiscordEvent } from '@/lib/discord/events';

export async function sendDiscordEvent(event: DiscordEvent): Promise<void> {
  try {
    const response = await fetch('/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const error = await response.text().catch(() => 'Failed to read error');
      logger.error('Discord webhook error response', { error, status: response.status });
    }
  } catch (error) {
    logger.error('Discord webhook failed', { error: String(error) });
  }
}
