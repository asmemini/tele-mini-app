import os from "node:os";
import type { NextConfig } from "next";

const supabaseHost = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : "mrzmhtirmxqnnoqppnyf.supabase.co";

function localDevOrigins(): string[] {
  const hosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const item of addresses ?? []) {
      const family = String(item.family);
      if ((family === "IPv4" || family === "4") && item.address) {
        hosts.add(item.address);
      }
    }
  }
  return [...hosts];
}

const nextConfig: NextConfig = {
  allowedDevOrigins: localDevOrigins(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;