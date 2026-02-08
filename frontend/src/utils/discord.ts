export async function sendDiscordWebhook(message: string): Promise<void> {
  try {
    const payload = { message };
    console.log('Sending Discord webhook with payload:', payload);
    
    const response = await fetch('/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('Discord webhook response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text().catch(() => 'Failed to read error');
      console.log('Discord webhook error response:', error);
      throw new Error(`Discord API error: ${response.status}`);
    }
  } catch (error) {
    console.log('Discord webhook failed:', error);
    throw new Error('Failed to send notification');
  }
}
