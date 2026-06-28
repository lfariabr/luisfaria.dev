import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface RelationshipHome {
    label: string;
    lat: number;
    lng: number;
}

interface Config {
    port: number;
    nodeEnv: string;
    mongodbUri: string;
    jwtSecret: string;
    redisUrl: string;
    rateLimitWindow: number;
    rateLimitMaxRequests: number;
    rateLimitAnonymousRequests: number;
    openaiApiKey: string;
    resendApiKey: string;
    nasaApiKey: string;
    frontendUrl: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    stripeCoffeePriceId: string;
    stripeMeetingPriceId: string;
    turnstileSecretKey: string;
    geocodingApiKey: string;
    relationshipHome: RelationshipHome | null;
}

export function parseRelationshipHome(env: NodeJS.ProcessEnv = process.env): RelationshipHome | null {
    const rawLat = env.RELATIONSHIP_HOME_LAT?.trim();
    const rawLng = env.RELATIONSHIP_HOME_LNG?.trim();
    // Whitespace-only values behave as missing (after trim, they become empty strings).
    if (!rawLat && !rawLng) return null;
    if (!rawLat || !rawLng) {
        console.warn('[config] RELATIONSHIP_HOME_LAT and RELATIONSHIP_HOME_LNG must both be set; ignoring home marker.');
        return null;
    }
    // Number() (unlike parseFloat) rejects trailing garbage like "1.23abc" by returning NaN.
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        console.warn('[config] RELATIONSHIP_HOME_LAT is invalid; ignoring home marker.');
        return null;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        console.warn('[config] RELATIONSHIP_HOME_LNG is invalid; ignoring home marker.');
        return null;
    }
    const label = env.RELATIONSHIP_HOME_LABEL?.trim() || 'Home base';
    return { label, lat, lng };
}

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_SECRET',
  'REDIS_URL',
  'OPENAI_API_KEY',
  'RATE_LIMIT_WINDOW',
  'RATE_LIMIT_MAX_REQUESTS',
  'RATE_LIMIT_ANONYMOUS_REQUESTS',
  'RESEND_API_KEY',
  'NASA_API_KEY',
];
if (process.env.NODE_ENV !== 'test') {
  requiredEnvVars.push('TURNSTILE_SECRET_KEY');
}
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Fail fast on a weak/placeholder JWT secret. A short or empty secret silently
// invalidates every issued token (mass logout) and is trivially brute-forceable.
// Skipped under tests, which use a deterministic short secret.
if (process.env.NODE_ENV !== 'test') {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (secret.length < 32) {
    throw new Error(
      'JWT_SECRET is too weak: provide a random secret of at least 32 characters.'
    );
  }
}

const config: Config = {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI || '',
    jwtSecret: process.env.JWT_SECRET || '',
    redisUrl: process.env.REDIS_URL || '',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10),
    rateLimitAnonymousRequests: parseInt(process.env.RATE_LIMIT_ANONYMOUS_REQUESTS || '5', 10),
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    nasaApiKey: process.env.NASA_API_KEY || '',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripeCoffeePriceId: process.env.STRIPE_COFFEE_PRICE_ID || '',
    stripeMeetingPriceId: process.env.STRIPE_MEETING_PRICE_ID || '',
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '',
    geocodingApiKey: process.env.GEOCODING_API_KEY || '',
    relationshipHome: parseRelationshipHome(),
  };

export default config;
