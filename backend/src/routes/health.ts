import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../services/redis';
import os from 'os';
import { logger } from '../utils/logger';
import { rateLimiter } from '../services/rateLimiter';

const router = Router();

// Exact-match loopback addresses
const TRUSTED_EXACT = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// Prefix-match private/Docker ranges (10.x, 172.16–31.x)
const TRUSTED_PREFIXES = [
  '10.',
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.`),
  '::ffff:10.',
  ...Array.from({ length: 16 }, (_, i) => `::ffff:172.${16 + i}.`),
];

function isTrusted(req: Request): boolean {
  // req.ip honours Express 'trust proxy' — resolves real client IP from X-Forwarded-For
  // Future: handle IPV4-mapped 192.168.x ranges (if you ran this locally with Docker Desktop and hit /health/details, you'll get 403)
  const ip = req.ip || req.socket?.remoteAddress || '';
  if (TRUSTED_EXACT.has(ip)) return true;
  return TRUSTED_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Timeout helper — rejects if the promise doesn't resolve within `ms`
// ---------------------------------------------------------------------------
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

const PING_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// Shared dependency checks
// ---------------------------------------------------------------------------
interface CheckResult {
  status: string;
  latency?: string;
  detail?: string;
}

async function checkMongo(): Promise<CheckResult> {
  const start = Date.now();
  const mongoState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoState !== 1) {
    throw new Error(`readyState=${mongoState}`);
  }
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('db is undefined');
  }
  await withTimeout(db.admin().ping(), PING_TIMEOUT_MS, 'MongoDB ping');
  return { status: 'ok', latency: `${Date.now() - start}ms` };
}

async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();
  const redis = getRedisClient();
  const pong = await withTimeout(redis.ping(), PING_TIMEOUT_MS, 'Redis ping');
  if (pong !== 'PONG') {
    throw new Error(`unexpected response: ${pong}`);
  }
  return { status: 'ok', latency: `${Date.now() - start}ms` };
}

async function runChecks(): Promise<{ healthy: boolean; checks: Record<string, CheckResult> }> {
  const [mongoResult, redisResult] = await Promise.allSettled([
    checkMongo(),
    checkRedis(),
  ]);

  const checks: Record<string, CheckResult> = {
    mongodb: mongoResult.status === 'fulfilled'
      ? mongoResult.value
      : { status: 'error', detail: mongoResult.reason?.message },
    redis: redisResult.status === 'fulfilled'
      ? redisResult.value
      : { status: 'error', detail: redisResult.reason?.message },
  };

  const healthy = Object.values(checks).every(c => c.status === 'ok');
  return { healthy, checks };
}

function getSystemInfo() {
  // Future: this fn is synchronous but lives in an async handler. 
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMemPct = Math.round(((totalMem - freeMem) / totalMem) * 100);
  const loadAvg = os.loadavg();
  const uptime = process.uptime();

  return {
    memoryUsage: `${usedMemPct}%`,
    loadAvg1m: loadAvg[0].toFixed(2),
    loadAvg5m: loadAvg[1].toFixed(2),
    cpus: os.cpus().length,
    processUptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    nodeVersion: process.version,
  };
}

// ---------------------------------------------------------------------------
// Lightweight liveness probe — container is running
// ---------------------------------------------------------------------------
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Public readiness probe — coarse status only, no sensitive details
// Returns 200 when healthy, 503 when degraded.
// Pulsetic / uptime monitors should target this endpoint.
// ---------------------------------------------------------------------------
router.get('/health/ready', async (req: Request, res: Response) => {
  const rl = await rateLimiter.limit(`health:ready:${req.ip}`, 30, 60);
  if (!rl.success) {
    logger.warn('Health endpoint rate limited', { endpoint: '/health/ready', ip: req.ip });
    res.status(429).json({ error: 'Too Many Requests', resetTime: rl.resetTime });
    return;
  }

  const { healthy, checks } = await runChecks();

  // Strip latency and detail — expose only coarse status per dependency
  const coarseChecks: Record<string, { status: string }> = {};
  for (const [key, val] of Object.entries(checks)) {
    coarseChecks[key] = { status: val.status };
  }

  if (!healthy) {
    logger.warn('Health readiness check degraded', { endpoint: '/health/ready', checks: coarseChecks });
  }

  const statusCode = healthy ? 200 : 503;
  res.status(statusCode).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: coarseChecks,
  });
});

// ---------------------------------------------------------------------------
// Internal diagnostics — full checks + system info, trusted sources only
// CI pipeline and on-server tooling should target this endpoint.
// ---------------------------------------------------------------------------
router.get('/health/details', async (req: Request, res: Response) => {
  if (!isTrusted(req)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const { healthy, checks } = await runChecks();
  const system = getSystemInfo();

  if (!healthy) {
    logger.warn('Health details check degraded', { endpoint: '/health/details', checks });
  }

  const statusCode = healthy ? 200 : 503;
  res.status(statusCode).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    system,
  });
});

export default router;
