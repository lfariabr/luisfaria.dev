import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { discordMessageFor } from '@/lib/discord/events';

// Accepts only a known event key (see lib/discord/events.ts) and sends its fixed message,
// so callers can never put their own text into the channel.
export async function POST(request: Request) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const content = discordMessageFor(body);
  if (!content) {
    return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Discord webhook error', { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
