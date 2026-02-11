import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'user-images.githubusercontent.com' },
      { protocol: 'https', hostname: 'unsplash.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'media.istockphoto.com' },
    ],
  },
  output: 'standalone', // Enable standalone output for Docker deployment

  // Disable ESLint in production builds
  eslint: {
    // Only run ESLint in development, not during builds
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript type checking during builds for faster builds
  typescript: {
    // Skip type checking during builds
    ignoreBuildErrors: true,
  },
};

// Wrap with Sentry only if DSN is configured
const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      // Suppress source map upload logs during build
      silent: true,
      // Upload a larger set of source maps for prettier stack traces
      widenClientFileUpload: true,
      // Hide source maps from generated client bundles
      hideSourceMaps: true,
      // Tree-shake Sentry logger statements for smaller bundles
      disableLogger: true,
    })
  : nextConfig;
