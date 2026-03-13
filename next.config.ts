import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/mapa',
  assetPrefix: '/mapa',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
