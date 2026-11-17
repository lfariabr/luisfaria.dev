/**
 * @jest-environment node
 */
import { buildCsp, createNonce } from '@/lib/security/csp';

const directive = (csp: string, name: string) =>
  csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? '';

describe('buildCsp', () => {
  it('trusts scripts by nonce and strict-dynamic, with no inline or eval in production', () => {
    const scripts = directive(buildCsp('abc123'), 'script-src');
    expect(scripts).toContain("'nonce-abc123'");
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it("adds 'unsafe-eval' and the local API only in development", () => {
    const csp = buildCsp('abc123', { isDev: true });
    expect(directive(csp, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(csp, 'connect-src')).toContain('http://localhost:4000');
    expect(directive(buildCsp('abc123'), 'connect-src')).not.toContain('localhost');
  });

  it('keeps the protections and third parties the nginx policy had', () => {
    const csp = buildCsp('abc123');
    for (const rule of [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'frame-src https://challenges.cloudflare.com',
    ]) {
      expect(csp).toContain(rule);
    }
    expect(directive(csp, 'connect-src')).toContain('https://o4510868467417088.ingest.us.sentry.io');
    expect(directive(csp, 'connect-src')).toContain('https://places.googleapis.com');
  });
});

describe('createNonce', () => {
  it('is base64 and different every time', () => {
    const a = createNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(createNonce()).not.toBe(a);
  });
});
