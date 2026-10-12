import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Lets a production build live next to a running dev server (used for local checks).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
