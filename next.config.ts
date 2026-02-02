import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep server-only packages out of client bundle; API routes use these
  serverExternalPackages: ["openai", "exa-js", "get-image-colors"],
};

export default nextConfig;
