import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import { connectRedis, disconnectRedis, getRedisClient } from '../../services/redis';
import { DevtoServiceError } from '../../services/devto';

// Only the dev.to call is faked; the Redis cache and error handling are real (#515).
jest.mock('../../services/devto/devto.service', () => ({
  ...jest.requireActual('../../services/devto/devto.service'),
  fetchLatestPosts: jest.fn(),
}));
const { fetchLatestPosts } = jest.requireMock('../../services/devto/devto.service') as {
  fetchLatestPosts: jest.Mock;
};

const LATEST_WRITING = `
  query LatestWriting {
    latestWriting { title url publishedAt }
  }
`;
const CACHE_KEY = 'devto:cache:latest-writing';
const POSTS = [
  { title: 'Newest', url: 'https://dev.to/lfariaus/newest', publishedAt: '2026-11-16T19:32:13Z' },
  { title: 'Older', url: 'https://dev.to/lfariaus/older', publishedAt: '2026-11-01T19:04:43Z' },
];

const run = async () => {
  const response = await executeOperation(LATEST_WRITING);
  if (response.body.kind !== 'single') throw new Error('expected a single result');
  return response.body.singleResult;
};

describe('latestWriting', () => {
  beforeAll(async () => {
    await dbHandler.connect();
    await connectRedis();
  });

  afterAll(async () => {
    await getRedisClient().del(CACHE_KEY);
    await dbHandler.closeDatabase();
    await disconnectRedis();
  });

  beforeEach(async () => {
    await getRedisClient().del(CACHE_KEY);
    fetchLatestPosts.mockReset();
  });

  it('returns the Posts from dev.to and caches them for an hour', async () => {
    fetchLatestPosts.mockResolvedValue(POSTS);

    const { data, errors } = await run();

    expect(errors).toBeUndefined();
    expect(data?.latestWriting).toEqual(POSTS);
    const ttl = await getRedisClient().ttl(CACHE_KEY);
    expect(ttl).toBeGreaterThan(3500);
    expect(ttl).toBeLessThanOrEqual(3600);
  });

  it('serves repeat requests from the cache without calling dev.to again', async () => {
    fetchLatestPosts.mockResolvedValue(POSTS);

    await run();
    await run();
    const { data } = await run();

    expect(data?.latestWriting).toEqual(POSTS);
    expect(fetchLatestPosts).toHaveBeenCalledTimes(1);
  });

  it('turns a dev.to outage into SERVICE_UNAVAILABLE and caches nothing', async () => {
    fetchLatestPosts.mockRejectedValue(new DevtoServiceError('dev.to request timed out', 'TIMEOUT'));

    const { data, errors } = await run();

    expect(data).toBeNull();
    expect(errors?.[0]?.extensions?.code).toBe('SERVICE_UNAVAILABLE');
    expect(await getRedisClient().exists(CACHE_KEY)).toBe(0);
  });
  it('coalesces overlapping misses and releases failed fetches for retry', async () => {
    let rejectFetch!: (error: Error) => void;
    let started!: () => void;
    const fetching = new Promise<void>((resolve) => { started = resolve; });
    fetchLatestPosts.mockImplementation(() => {
      started();
      return new Promise((_, reject) => { rejectFetch = reject; });
    });
    const first = run();
    await fetching;
    const second = run();
    // Let the second GraphQL request finish its Redis read while the fetch is pending.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(fetchLatestPosts).toHaveBeenCalledTimes(1);
    rejectFetch(new DevtoServiceError('offline', 'NETWORK_ERROR'));
    const results = await Promise.all([first, second]);
    results.forEach((result) => expect(result.errors?.[0]?.extensions?.code).toBe('SERVICE_UNAVAILABLE'));

    fetchLatestPosts.mockResolvedValue(POSTS);
    expect((await run()).data?.latestWriting).toEqual(POSTS);
    expect(fetchLatestPosts).toHaveBeenCalledTimes(2);
  });

  it('returns fetched posts when Redis reads and writes stall', async () => {
    const client = getRedisClient();
    const read = jest.spyOn(client, 'get').mockImplementation(() => new Promise(() => {}));
    const write = jest.spyOn(client, 'setEx').mockImplementation(() => new Promise(() => {}));
    fetchLatestPosts.mockResolvedValue(POSTS);
    try {
      const result = await run();
      expect(result.errors).toBeUndefined();
      expect(result.data?.latestWriting).toEqual(POSTS);
      expect(write).toHaveBeenCalledWith(CACHE_KEY, 3600, JSON.stringify(POSTS));
    } finally {
      read.mockRestore();
      write.mockRestore();
    }
  });

});
