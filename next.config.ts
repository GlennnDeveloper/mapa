import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/mapa', // Comenta esto si usas un dominio personalizado
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
