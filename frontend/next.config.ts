import type { NextConfig } from "next";

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
  output: 'standalone',

  // Disable TypeScript type checking during builds for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Wrap with Sentry only if DSN is configured.
// Dynamic import prevents a broken @sentry/nextjs install from corrupting the config.
const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export default sentryEnabled
  ? await import('@sentry/nextjs').then(({ withSentryConfig }) =>
      withSentryConfig(nextConfig, {
        silent: true,
        sourcemaps: {
          deleteSourcemapsAfterUpload: true,
        },
        bundleSizeOptimizations: {
          excludeDebugStatements: true,
        },
      })
    )
  : nextConfig;
