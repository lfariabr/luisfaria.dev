import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import { connectRedis, disconnectRedis, getRedisClient } from '../../services/redis';
import { writingCache } from '../../services/cache/writingCache';
import type { Post } from '../../services/devto';
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
    let resolveFetch!: (posts: Post[]) => void;
    let rejectFetch!: (error: Error) => void;
    const pendingFetch = new Promise<Post[]>((resolve, reject) => {
      resolveFetch = resolve;
      rejectFetch = reject;
    });
    let started!: () => void;
    const fetching = new Promise<void>((resolve) => { started = resolve; });
    let secondReadCompleted!: () => void;
    const secondRead = new Promise<void>((resolve) => { secondReadCompleted = resolve; });
    const get = writingCache.get.bind(writingCache);
    let reads = 0;
    const read = jest.spyOn(writingCache, 'get').mockImplementation(() => {
      const result = get();
      if (++reads === 2) {
        // Notify after the resolver's await continuation has joined inFlight.
        void result.then(() => queueMicrotask(secondReadCompleted));
      }
      return result;
    });
    fetchLatestPosts.mockImplementation(() => {
      started();
      return pendingFetch;
    });
    const requests: ReturnType<typeof run>[] = [];
    try {
      requests.push(run());
      await fetching;
      requests.push(run());
      await secondRead;
      expect(fetchLatestPosts).toHaveBeenCalledTimes(1);
      rejectFetch(new DevtoServiceError('offline', 'NETWORK_ERROR'));
      const results = await Promise.all(requests);
      results.forEach((result) => expect(result.errors?.[0]?.extensions?.code).toBe('SERVICE_UNAVAILABLE'));

      fetchLatestPosts.mockResolvedValue(POSTS);
      expect((await run()).data?.latestWriting).toEqual(POSTS);
      expect(fetchLatestPosts).toHaveBeenCalledTimes(2);
    } finally {
      resolveFetch(POSTS);
      started();
      secondReadCompleted();
      read.mockRestore();
      await Promise.allSettled(requests);
    }
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
