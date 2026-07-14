import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // z-ai-web-dev-sdk uses Node.js built-ins (fs/promises) that Turbopack
  // can't bundle. Mark it as a server external so it runs natively on the server.
  serverExternalPackages: ["z-ai-web-dev-sdk"],
  // Allow the preview iframe domain to access the dev server without
  // triggering cross-origin redirect loops.
  allowedDevOrigins: [
    "*.space-z.ai",
    "preview-chat-*.space-z.ai",
  ],
};

export default nextConfig;
