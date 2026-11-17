/** @jest-environment node */
import { fetchGql } from '@/lib/graphql/fetchGql';

jest.mock('react', () => ({ ...jest.requireActual('react'), cache: (fn: unknown) => fn }));

const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; });

it('aborts a stalled GraphQL request and propagates the timeout', async () => {
  let signal: AbortSignal | undefined;
  global.fetch = jest.fn((_url, options) => new Promise((_resolve, reject) => {
    signal = options?.signal as AbortSignal;
    signal.addEventListener('abort', () => reject(signal?.reason), { once: true });
  }));
  await expect(fetchGql('query { latestWriting { title } }', { timeoutMs: 20 })).rejects.toMatchObject({ name: 'TimeoutError' });
  expect(signal?.aborted).toBe(true);
});

it('keeps the deadline active while consuming the response body', async () => {
  global.fetch = jest.fn(async (_url, options) => ({
    ok: true,
    json: () => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(options.signal?.reason), { once: true });
    }),
  })) as unknown as typeof fetch;
  await expect(fetchGql('query { latestWriting { title } }', { timeoutMs: 20 })).rejects.toMatchObject({ name: 'TimeoutError' });
});
