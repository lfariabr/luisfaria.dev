/**
 * @jest-environment node
 */
// Server-only code: runs under Node, which has AbortSignal.timeout (jsdom does not).
import { getLatestWriting, toLatestWriting, LATEST_WRITING_REVALIDATE_SECONDS } from '@/lib/devto/latestWriting';
import { LATEST_WRITING } from '@/content/profile';

jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn() } }));
import { logger } from '@/lib/logger';

// Trimmed from https://dev.to/api/articles?username=lfariaus (2026-11-17); the real payload has ~30 more fields.
const post = (title: string, published_at: string, slug: string) => ({
  type_of: 'article',
  id: 1,
  title,
  url: `https://dev.to/lfariaus/${slug}`,
  published_at,
  readable_publish_date: 'Nov 16',
  tag_list: ['buildinpublic'],
});
const PAYLOAD = [
  post('Newest', '2026-11-16T19:32:13Z', 'newest-feo'),
  post('Oldest', '2026-10-19T17:52:30Z', 'oldest-32a5'),
  post('Middle', '2026-11-01T19:04:43Z', 'middle-31h'),
  post('Fourth', '2026-08-28T10:00:00Z', 'fourth-2p0c'),
];

const realFetch = global.fetch;
const mockFetch = (impl: () => Promise<unknown>) => {
  const fn = jest.fn(impl);
  global.fetch = fn as unknown as typeof fetch;
  return fn;
};
afterEach(() => {
  global.fetch = realFetch;
  jest.clearAllMocks();
});

describe('toLatestWriting', () => {
  it('maps dev.to posts to the site shape, newest first, three of them', () => {
    expect(toLatestWriting(PAYLOAD)).toEqual([
      { date: '2026-11-16T19:32:13Z', title: 'Newest', href: 'https://dev.to/lfariaus/newest-feo' },
      { date: '2026-11-01T19:04:43Z', title: 'Middle', href: 'https://dev.to/lfariaus/middle-31h' },
      { date: '2026-10-19T17:52:30Z', title: 'Oldest', href: 'https://dev.to/lfariaus/oldest-32a5' },
    ]);
  });

  it('rejects a payload that is not a list of posts', () => {
    expect(() => toLatestWriting({ error: 'not found' })).toThrow();
    expect(() => toLatestWriting([{ title: 'No url', published_at: '2026-11-16T19:32:13Z' }])).toThrow();
  });
});

describe('getLatestWriting', () => {
  it('fetches the newest posts, cached for an hour', async () => {
    const fetchMock = mockFetch(async () => ({ ok: true, status: 200, json: async () => PAYLOAD }));

    const articles = await getLatestWriting();

    expect(articles.map((a) => a.title)).toEqual(['Newest', 'Middle', 'Oldest']);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://dev.to/api/articles?username=lfariaus&per_page=3',
      expect.objectContaining({ next: { revalidate: LATEST_WRITING_REVALIDATE_SECONDS } }),
    );
    expect(LATEST_WRITING_REVALIDATE_SECONDS).toBe(3600);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each([
    ['dev.to is down (non-2xx)', async () => ({ ok: false, status: 503, json: async () => ({}) })],
    ['the request fails or times out', async () => { throw new Error('The operation was aborted due to timeout'); }],
    ['the payload changed shape', async () => ({ ok: true, status: 200, json: async () => ({ articles: [] }) })],
    ['there are no posts', async () => ({ ok: true, status: 200, json: async () => [] })],
  ])('falls back to the static list when %s', async (_case, impl) => {
    mockFetch(impl);

    await expect(getLatestWriting()).resolves.toBe(LATEST_WRITING);
    expect(logger.warn).toHaveBeenCalledWith(
      'Latest writing: dev.to unavailable, using the static list',
      expect.objectContaining({ reason: expect.any(String) }),
    );
  });
});
