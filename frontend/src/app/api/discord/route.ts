import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function POST(request: Request) {
  
  if (!DISCORD_WEBHOOK_URL) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    logger.debug('Discord route received request', { bodyLength: body.length });

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (parseError) {
      logger.error('JSON parse error', { error: String(parseError), bodyPresent: !!body });
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { message } = parsed;
    logger.debug('Discord message received', { message });
    
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });

    if (!response.ok) {
      const error = await response.text();
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
