import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["z-ai-web-dev-sdk"],
  allowedDevOrigins: [
    "preview-chat-7fef10c8-0747-4ccc-bc90-d8946fc5ed50.space-z.ai",
    "*.space-z.ai",
    "localhost:81",
    "localhost:3000",
  ],
};

export default nextConfig;
