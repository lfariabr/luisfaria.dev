import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../services/redis';
import os from 'os';

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

async function runChecks(): Promise<{ healthy: boolean; checks: Record<string, CheckResult> }> {
  const checks: Record<string, CheckResult> = {};
  let healthy = true;

  // MongoDB check
  try {
    const start = Date.now();
    const mongoState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoState === 1) {
      const db = mongoose.connection.db;
      if (db) {
        await withTimeout(db.admin().ping(), PING_TIMEOUT_MS, 'MongoDB ping');
        checks.mongodb = { status: 'ok', latency: `${Date.now() - start}ms` };
      } else {
        checks.mongodb = { status: 'error', detail: 'db is undefined' };
        healthy = false;
      }
    } else {
      checks.mongodb = { status: 'error', detail: `readyState=${mongoState}` };
      healthy = false;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    checks.mongodb = { status: 'error', detail: message };
    healthy = false;
  }

  // Redis check
  try {
    const start = Date.now();
    const redis = getRedisClient();
    const pong = await withTimeout(redis.ping(), PING_TIMEOUT_MS, 'Redis ping');
    if (pong === 'PONG') {
      checks.redis = { status: 'ok', latency: `${Date.now() - start}ms` };
    } else {
      checks.redis = { status: 'error', detail: `unexpected response: ${pong}` };
      healthy = false;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    checks.redis = { status: 'error', detail: message };
    healthy = false;
  }

  return { healthy, checks };
}

function getSystemInfo() {
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
router.get('/health/ready', async (_req: Request, res: Response) => {
  const { healthy, checks } = await runChecks();

  // Strip latency and detail — expose only coarse status per dependency
  const coarseChecks: Record<string, { status: string }> = {};
  for (const [key, val] of Object.entries(checks)) {
    coarseChecks[key] = { status: val.status };
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

  const statusCode = healthy ? 200 : 503;
  res.status(statusCode).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    system,
  });
});

export default router;
