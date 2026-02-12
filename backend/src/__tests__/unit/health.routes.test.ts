// npm test -- --testPathPattern="health.routes" --verbose

import request from 'supertest';
import express from 'express';

// ---------------------------------------------------------------------------
// Mock mongoose — must be declared before importing the router
// ---------------------------------------------------------------------------
const mockPing = jest.fn();
jest.mock('mongoose', () => ({
  connection: {
    readyState: 1,
    db: {
      admin: () => ({ ping: mockPing }),
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock Redis
// ---------------------------------------------------------------------------
const mockRedisPing = jest.fn();
jest.mock('../../services/redis', () => ({
  getRedisClient: () => ({ ping: mockRedisPing }),
}));

// ---------------------------------------------------------------------------
// Import router AFTER mocks are in place
// ---------------------------------------------------------------------------
import healthRouter from '../../routes/health';
import mongoose from 'mongoose';

function buildApp() {
  const app = express();
  app.use(healthRouter);
  return app;
}

// Helper: build an app that overrides remoteAddress for untrusted-IP tests
function buildUntrustedApp() {
  const app = express();
  app.use((req, _res, next) => {
    // Override the getter so isTrusted() sees a public IP
    Object.defineProperty(req.socket, 'remoteAddress', { value: '203.0.113.1' });
    next();
  });
  app.use(healthRouter);
  return app;
}

describe('Health Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: healthy state
    (mongoose.connection as any).readyState = 1;
    (mongoose.connection as any).db = { admin: () => ({ ping: mockPing }) };
    mockPing.mockResolvedValue({ ok: 1 });
    mockRedisPing.mockResolvedValue('PONG');
  });

  // -----------------------------------------------------------------------
  // GET /health — liveness probe
  // -----------------------------------------------------------------------
  describe('GET /health', () => {
    it('returns 200 with { status: "ok" }', async () => {
      const res = await request(buildApp()).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  // -----------------------------------------------------------------------
  // GET /health/ready — readiness probe
  // -----------------------------------------------------------------------
  describe('GET /health/ready', () => {
    it('returns 200 with coarse checks when healthy', async () => {
      const res = await request(buildApp()).get('/health/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.checks.mongodb).toEqual({ status: 'ok' });
      expect(res.body.checks.redis).toEqual({ status: 'ok' });
      // Should NOT leak latency or detail
      expect(res.body.checks.mongodb.latency).toBeUndefined();
      expect(res.body.checks.redis.latency).toBeUndefined();
    });

    it('returns 503 with "degraded" when MongoDB is down', async () => {
      (mongoose.connection as any).readyState = 0;

      const res = await request(buildApp()).get('/health/ready');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.checks.mongodb.status).toBe('error');
    });

    it('returns 503 with "degraded" when Redis ping fails', async () => {
      mockRedisPing.mockRejectedValueOnce(new Error('Connection refused'));

      const res = await request(buildApp()).get('/health/ready');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.checks.redis.status).toBe('error');
    });
  });

  // -----------------------------------------------------------------------
  // GET /health/details — internal diagnostics (trust-gated)
  // -----------------------------------------------------------------------
  describe('GET /health/details', () => {
    it('returns 403 for untrusted IP', async () => {
      const res = await request(buildUntrustedApp()).get('/health/details');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Forbidden' });
    });

    it('returns full diagnostics for trusted (loopback) IP', async () => {
      // supertest connects over loopback → ::ffff:127.0.0.1 → trusted
      const res = await request(buildApp()).get('/health/details');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.checks.mongodb.latency).toBeDefined();
      expect(res.body.checks.redis.latency).toBeDefined();
      expect(res.body.system).toBeDefined();
      expect(res.body.system.cpus).toBeGreaterThan(0);
      expect(res.body.system.nodeVersion).toMatch(/^v/);
    });

    it('returns 503 with diagnostics when degraded (trusted IP)', async () => {
      (mongoose.connection as any).readyState = 0;

      const res = await request(buildApp()).get('/health/details');
      expect(res.status).toBe(503);
      expect(res.body.status).toBe('degraded');
      expect(res.body.checks.mongodb.status).toBe('error');
      expect(res.body.system).toBeDefined();
    });
  });
});
