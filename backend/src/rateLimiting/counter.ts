import { getRedisClient } from '../services/redis';

// KEYS[1] = counter key, ARGV[1] = limit, ARGV[2] = window seconds
// Returns {allowed (0|1), remaining, ttl}
const HIT_SCRIPT = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])

  local current = tonumber(redis.call('GET', key) or '0')

  if current >= limit then
    local ttl = redis.call('TTL', key)
    if ttl < 0 then
      ttl = window
    end
    return {0, 0, ttl}
  end

  local count = redis.call('INCR', key)
  if count == 1 then
    redis.call('EXPIRE', key, window)
  end

  return {1, limit - count, redis.call('TTL', key)}
`;

export interface HitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

/** Atomically counts one request against `key`. Throws when Redis cannot be reached. */
export async function hit(key: string, limit: number, windowSeconds: number): Promise<HitResult> {
  const [allowed, remaining, ttl] = (await getRedisClient().eval(HIT_SCRIPT, {
    keys: [key],
    arguments: [String(limit), String(windowSeconds)],
  })) as number[];

  return {
    allowed: allowed === 1,
    remaining,
    resetTime: new Date(Date.now() + ttl * 1000),
  };
}
