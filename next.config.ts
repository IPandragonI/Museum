import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static, client-side game: no server, no API, hostable on any static host.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
