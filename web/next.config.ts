import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workaround: Turbopack panics on Chinese characters in path
  // Use webpack by default (Turbopack is default in Next.js 16 for dev)
  // For build, this is handled via NEXT_PRIVATE_DISABLE_TURBOPACK env var
};

export default nextConfig;
