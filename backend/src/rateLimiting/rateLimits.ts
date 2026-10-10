export type SubjectKind = 'user' | 'email' | 'ip';

interface BaseDefinition {
  limits: Partial<Record<SubjectKind, number>>;
  windowSeconds: number;
  failure: 'open' | 'closed';
}

export type RateLimitDefinition =
  | (BaseDefinition & { visibility: 'visible' })
  | (BaseDefinition & { visibility: 'silent'; message: string });

const HOUR = 3600;
const DAY = 24 * HOUR;
const REGISTER_MESSAGE = 'Too many registration attempts. Please try again later.';

export const rateLimits = {
  chatbot: { limits: { user: 5 }, windowSeconds: HOUR, visibility: 'visible', failure: 'closed' },
  apod: { limits: { user: 10, ip: 5 }, windowSeconds: HOUR, visibility: 'visible', failure: 'open' },
  goggins: { limits: { email: 2 }, windowSeconds: DAY, visibility: 'visible', failure: 'closed' },
  registerByIp: { limits: { ip: 5 }, windowSeconds: HOUR, visibility: 'silent', message: REGISTER_MESSAGE, failure: 'closed' },
  registerByEmail: { limits: { email: 3 }, windowSeconds: HOUR, visibility: 'silent', message: REGISTER_MESSAGE, failure: 'closed' },
  healthReady: { limits: { ip: 30 }, windowSeconds: 60, visibility: 'silent', message: 'Too Many Requests', failure: 'open' },
} as const satisfies Record<string, RateLimitDefinition>;

export type RateLimitName = keyof typeof rateLimits;
export type SubjectKindOf<N extends RateLimitName> = keyof (typeof rateLimits)[N]['limits'] & SubjectKind;
