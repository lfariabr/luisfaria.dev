jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../config/config', () => ({
  __esModule: true,
  default: {
    nodeEnv: 'production',
    discordWebhookUrl: 'https://discord.test/webhook',
  },
}));

import { notifyDiscord } from '../../services/discord';

describe('notifyDiscord', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 204 });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('disables every mention so user-supplied text can never ping the channel', async () => {
    await notifyDiscord('@everyone 📝 New registration: someone@example.com');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://discord.test/webhook');
    expect(JSON.parse(init.body)).toEqual({
      content: '@everyone 📝 New registration: someone@example.com',
      allowed_mentions: { parse: [] },
    });
  });
});
