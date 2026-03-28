import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo: prefer this app’s folder over the repo root when multiple lockfiles exist.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
