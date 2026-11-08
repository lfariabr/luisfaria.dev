import type { ErrorEvent } from '@sentry/nextjs';
import { scrubRequest } from '@/lib/sentry/scrubRequest';

const event = (request?: ErrorEvent['request']): ErrorEvent => ({ type: undefined, request });

describe('scrubRequest', () => {
  it('filters the session cookie and auth headers, any case', () => {
    const out = scrubRequest(
      event({
        url: 'https://luisfaria.dev/admin',
        headers: {
          Cookie: 'token=eyJhbGciOi.secret.jwt',
          authorization: 'Bearer abc',
          'Proxy-Authorization': 'Basic xyz',
          'set-cookie': 'token=new',
          'user-agent': 'jest',
        },
        cookies: { token: 'eyJhbGciOi.secret.jwt' },
      })
    );

    expect(out.request?.headers).toEqual({
      Cookie: '[Filtered]',
      authorization: '[Filtered]',
      'Proxy-Authorization': '[Filtered]',
      'set-cookie': '[Filtered]',
      'user-agent': 'jest',
    });
    expect(out.request?.cookies).toEqual({});
    expect(out.request?.url).toBe('https://luisfaria.dev/admin');
  });

  it('leaves events without a request alone', () => {
    const e = event();
    expect(scrubRequest(e)).toBe(e);
  });
});
