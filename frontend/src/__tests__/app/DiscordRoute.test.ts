/**
 * @jest-environment node
 */
import { POST } from '@/app/api/discord/route';

jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const WEBHOOK_URL = 'https://discord.test/webhook';

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );

describe('POST /api/discord', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;
  const originalWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

  beforeEach(() => {
    process.env.DISCORD_WEBHOOK_URL = WEBHOOK_URL;
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env.DISCORD_WEBHOOK_URL = originalWebhookUrl;
  });

  const sentPayload = () => JSON.parse(fetchMock.mock.calls[0][1].body);

  it.each([
    [{ event: 'chatbot_message' }, 'Chatbot message submitted'],
    [{ event: 'apod_fab_opened' }, '🔭 APOD FAB clicked'],
    [{ event: 'stripe_fab_opened' }, '☕ Stripe FAB opened'],
    [{ event: 'stripe_option_selected', productKey: 'coffee' }, '💳 Stripe option selected: coffee'],
    [{ event: 'stripe_option_selected', productKey: 'meeting' }, '💳 Stripe option selected: meeting'],
  ])('forwards %j with its fixed message and mentions disabled', async (body, content) => {
    const response = await post(body);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(WEBHOOK_URL);
    expect(sentPayload()).toEqual({ content, allowed_mentions: { parse: [] } });
  });

  it('ignores any extra text the caller sends alongside a known event', async () => {
    await post({ event: 'chatbot_message', message: '@everyone 💰 paid $1000', content: 'spoof' });

    expect(sentPayload()).toEqual({
      content: 'Chatbot message submitted',
      allowed_mentions: { parse: [] },
    });
  });

  it.each([
    ['an unknown event', { event: 'paid' }],
    ['the old free-text shape', { message: '@everyone 💰 paid $1000' }],
    ['an unknown product key', { event: 'stripe_option_selected', productKey: '@everyone' }],
    ['a missing product key', { event: 'stripe_option_selected' }],
    ['a prototype key', { event: 'toString' }],
    ['a non-object body', ['chatbot_message']],
  ])('rejects %s with 400 and sends nothing', async (_label, body) => {
    const response = await post(body);

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON with 400 and sends nothing', async () => {
    const response = await post('not json');

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 500 when the webhook URL is not configured', async () => {
    delete process.env.DISCORD_WEBHOOK_URL;

    const response = await post({ event: 'chatbot_message' });

    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
