import { STRIPE_PRODUCT_KEYS, type StripeProductKey } from '@/lib/graphql/types/stripe.types';

// The only events /api/discord accepts. The route maps each to a fixed message, so no
// client-supplied text ever reaches the channel. Notifications that carry user data
// (register, Goggins) are sent by the backend where the action succeeds.
export type DiscordEvent =
  | { event: 'chatbot_message' }
  | { event: 'apod_fab_opened' }
  | { event: 'stripe_fab_opened' }
  | { event: 'stripe_option_selected'; productKey: StripeProductKey };

const FIXED_MESSAGES = {
  chatbot_message: 'Chatbot message submitted',
  apod_fab_opened: '🔭 APOD FAB clicked',
  stripe_fab_opened: '☕ Stripe FAB opened',
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStripeProductKey = (value: unknown): value is StripeProductKey =>
  typeof value === 'string' && (STRIPE_PRODUCT_KEYS as readonly string[]).includes(value);

/** Returns the fixed Discord message for a known event, or null for anything else. */
export function discordMessageFor(body: unknown): string | null {
  if (!isRecord(body) || typeof body.event !== 'string') return null;

  if (body.event === 'stripe_option_selected') {
    return isStripeProductKey(body.productKey) ? `💳 Stripe option selected: ${body.productKey}` : null;
  }

  return Object.prototype.hasOwnProperty.call(FIXED_MESSAGES, body.event)
    ? FIXED_MESSAGES[body.event as keyof typeof FIXED_MESSAGES]
    : null;
}
