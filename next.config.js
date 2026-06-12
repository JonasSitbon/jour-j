/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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

  // Package import optimizations — tree-shake large libs
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
};

module.exports = nextConfig;
