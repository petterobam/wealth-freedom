import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: require('path').resolve(__dirname),
  },
};

export default nextConfig;
