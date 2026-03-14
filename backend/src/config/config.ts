import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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
  'NASA_API_KEY'
];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
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
  };
  
export default config;
