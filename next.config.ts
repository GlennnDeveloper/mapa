import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  // Use the repo name as basePath for GitHub Pages
  basePath: isProd ? '/mapa' : '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

console.log('Building with basePath:', nextConfig.basePath);

export default nextConfig;
