import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // pnpm workspace: zależności leżą w node_modules korzenia repo.
  turbopack: { root: path.join(__dirname, "..") },
};

export default nextConfig;
