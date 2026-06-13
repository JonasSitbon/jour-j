const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ESLint disponible via `npm run lint`, mais ne bloque PAS le build/déploiement
  // (le codebase n'est pas encore entièrement lint-clean). À passer à false une
  // fois les avertissements traités.
  eslint: { ignoreDuringBuilds: true },

  // Better image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "is1-ssl.mzstatic.com" }, // iTunes artwork
    ],
  },

  // Compress responses
  compress: true,

  // Production source maps disabled for smaller bundles
  productionBrowserSourceMaps: false,

  // Active le hook instrumentation.ts (Sentry) — stable en Next 15, expérimental en 14.2
  experimental: {
    instrumentationHook: true,
    // Package import optimizations — tree-shake large libs
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
};

// withSentryConfig n'a d'effet de reporting qu'avec NEXT_PUBLIC_SENTRY_DSN défini ;
// l'upload de source maps ne s'active qu'avec SENTRY_AUTH_TOKEN (sinon ignoré).
module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,
});
