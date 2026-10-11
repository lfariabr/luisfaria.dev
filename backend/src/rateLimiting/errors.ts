import type { RateLimitName } from './rateLimits';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
}

export class RateLimitExceeded extends Error {
  constructor(
    readonly rateLimit: RateLimitName,
    readonly info: RateLimitInfo,
  ) {
    super(`Rate limit exceeded: ${rateLimit}`);
    this.name = 'RateLimitExceeded';
  }
}

export class RateLimitUnavailable extends Error {
  constructor(
    readonly rateLimit: RateLimitName,
    readonly cause: unknown,
  ) {
    super(`Rate limit unavailable: ${rateLimit}`);
    this.name = 'RateLimitUnavailable';
  }
}
