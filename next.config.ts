import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "offlineCache",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
    ],
  },
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  experimental: {},
  // Acknowledge turbopack presence so Next.js 16 doesn't error when
  // next-pwa injects a webpack config alongside it.
  turbopack: {},
  images: {
    remotePatterns: [],
  },
};

export default withPWA(nextConfig);
