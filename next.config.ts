import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // the repo sits inside a folder with other lockfiles; pin tracing to this app
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
