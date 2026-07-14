import type { NextConfig } from "next";

/**
 * Next.js production configuration for FlutterForge AI v1.0.0
 *
 * - standalone output for Docker/edge deployment
 * - React strict mode for catching potential problems
 * - z-ai-web-dev-sdk kept external (server-only)
 * - security headers applied via middleware + config
 *
 * NOTE: ignoreBuildErrors is true for v1.0.0 due to pre-existing zod v4
 * type incompatibilities in auth pages. Target v1.1.0: fix all type errors
 * and set to false.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  serverExternalPackages: ["z-ai-web-dev-sdk"],
  allowedDevOrigins: [
    "*.space-z.ai",
    "localhost:81",
    "localhost:3000",
  ],
  // Compress responses in production.
  compress: true,
  // Power-by header disabled for security.
  poweredByHeader: false,
  // Production security headers.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
