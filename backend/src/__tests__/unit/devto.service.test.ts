import { fetchLatestPosts, toPosts, DevtoServiceError } from '../../services/devto';
// Saved from https://dev.to/api/articles?username=lfariaus&per_page=3 on 2026-11-17, trimmed to a few fields.
import savedResponse from '../fixtures/devto-latest-articles.json';

const realFetch = global.fetch;
const mockFetch = (impl: () => Promise<unknown>) => {
  const fn = jest.fn(impl);
  global.fetch = fn as unknown as typeof fetch;
  return fn;
};
afterEach(() => {
  global.fetch = realFetch;
});

describe('toPosts', () => {
  it('maps the saved dev.to response to Posts, newest first', () => {
    expect(toPosts(savedResponse)).toEqual([
      {
        title: "My server didn't go down. Chasing the false alarm hardened everything else.",
        url: 'https://dev.to/lfariaus/my-server-didnt-go-down-chasing-the-false-alarm-hardened-everything-else-feo',
        publishedAt: '2026-11-16T19:32:13Z',
      },
      {
        title: 'I attempted 2,000 pull-ups. The next morning, I open-sourced my timer.',
        url: 'https://dev.to/lfariaus/i-attempted-2000-pull-ups-the-next-morning-i-open-sourced-my-timer-31h',
        publishedAt: '2026-11-01T19:04:43Z',
      },
      {
        title: '35 seconds to log a coffee: what one screen recording taught me about iPhone Safari',
        url: 'https://dev.to/lfariaus/35-seconds-to-log-a-coffee-what-one-screen-recording-taught-me-about-iphone-safari-32a5',
        publishedAt: '2026-10-19T17:52:30Z',
      },
    ]);
  });

  it('sorts by date and caps the count, whatever order dev.to sends', () => {
    const shuffled = [savedResponse[2], savedResponse[0], savedResponse[1]];
    expect(toPosts(shuffled, 2).map((p) => p.publishedAt)).toEqual(['2026-11-16T19:32:13Z', '2026-11-01T19:04:43Z']);
  });

  it('throws a VALIDATION_ERROR when the shape changes', () => {
    expect(() => toPosts({ articles: [] })).toThrow(DevtoServiceError);
    expect(() => toPosts([{ title: 'No url', published_at: '2026-11-16T19:32:13Z' }])).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });
});

describe('fetchLatestPosts', () => {
  it('asks dev.to for the newest posts by lfariaus', async () => {
    const fetchMock = mockFetch(async () => ({ ok: true, status: 200, json: async () => savedResponse }));

    const posts = await fetchLatestPosts();

    expect(posts).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://dev.to/api/articles?username=lfariaus&per_page=3',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('raises DEVTO_API_ERROR on a non-2xx response', async () => {
    mockFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }));
    await expect(fetchLatestPosts()).rejects.toMatchObject({ code: 'DEVTO_API_ERROR', statusCode: 503 });
  });

  it('raises TIMEOUT when the request times out, NETWORK_ERROR when it fails', async () => {
    mockFetch(async () => {
      throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
    });
    await expect(fetchLatestPosts()).rejects.toMatchObject({ code: 'TIMEOUT' });

    mockFetch(async () => {
      throw new TypeError('fetch failed');
    });
    await expect(fetchLatestPosts()).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
