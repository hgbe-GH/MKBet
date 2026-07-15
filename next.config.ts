import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.MK_BET_E2E === "1" ? ".next-e2e" : ".next",
  experimental: {
    serverActions: {
      // The action still rejects files over 10 MiB; this envelope covers the
      // multipart form encoding required to reach that domain validation.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
