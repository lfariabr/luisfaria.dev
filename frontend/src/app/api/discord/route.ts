import { NextResponse } from 'next/server';

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
    console.log('Raw request body:', body);
    
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (parseError) {
      console.log('JSON parse error:', parseError);
      console.log('Failed to parse body:', body);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { message } = parsed;
    console.log('Message received:', message);
    
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
    console.log('Discord webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
