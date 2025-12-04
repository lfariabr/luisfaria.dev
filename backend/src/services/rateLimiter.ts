import redisClient from './redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
}

export class RateLimiter {
  private luaScript: string;

  constructor(
    private prefix: string = 'rate-limit:',
    private defaultExpiry: number = 3600 // 1 hour in seconds
  ) {
    // Lua script for atomic rate limiting
    // KEYS[1] = redis key
    // ARGV[1] = limit
    // ARGV[2] = expiry
    // Returns: {success (0|1), remaining, ttl}
    this.luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local expiry = tonumber(ARGV[2])
      
      local current = tonumber(redis.call('GET', key) or '0')
      
      if current >= limit then
        local ttl = redis.call('TTL', key)
          if ttl < 0 then
            ttl = expiry
          end
        return {0, 0, ttl}
      end
      
      local newCount = redis.call('INCR', key)
      
      if newCount == 1 then
        redis.call('EXPIRE', key, expiry)
      end
      
      local ttl = redis.call('TTL', key)
      local remaining = limit - newCount
      
      return {1, remaining, ttl}
    `;
  }

  /**
   * Atomic rate limit check using Lua script
   * @param key The unique key to check (e.g., userId or IP)
   * @param limit Maximum number of requests allowed in the time window
   * @param expiry Time window in seconds
   * @returns Result of rate limit check
   */
  async limit(
    key: string,
    limit: number = 1,
    expiry: number = this.defaultExpiry
  ): Promise<RateLimitResult> {
    const redisKey = `${this.prefix}${key}`;
    
    try {
      // Execute Lua script atomically
      const result = await redisClient.eval(this.luaScript, {
        keys: [redisKey],
        arguments: [limit.toString(), expiry.toString()],
      }) as number[];

      const [success, remaining, ttl] = result;
      const resetTime = new Date(Date.now() + ttl * 1000);

      return {
        success: success === 1,
        limit,
        remaining,
        resetTime,
      };
    }
    catch (error) {
      // Fallback in case of Lua script error
      console.error('Rate limit check failed:', error);
      return {
        success: true,
        limit,
        remaining: limit,
        resetTime: new Date(Date.now() + expiry * 1000),
      };
    }
  }

  /**
   * Reset rate limit for a key
   * @param key The unique key to reset
   */
  async reset(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    await redisClient.del(redisKey);
  }
}

// Rate limit for Goggins Mode (24h window by default)
export const gogginsRateLimiter = new RateLimiter('goggins:', 86400);

// Create a singleton instance
export const rateLimiter = new RateLimiter();