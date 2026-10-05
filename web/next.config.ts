import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    loader: "custom",
    loaderFile: "./lib/sanity/imageLoader.ts",
    deviceSizes: [480, 768, 1200, 1800],
    imageSizes: [240],
  },
  // pnpm workspace: zależności leżą w node_modules korzenia repo.
  turbopack: { root: path.join(__dirname, "..") },
};

export default nextConfig;
