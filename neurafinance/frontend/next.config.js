/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: true, // Faster image loading
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@ethersproject', 'ethers'],
  },
  // Enable static optimization where possible
  output: 'standalone',
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          ethers: {
            test: /[\\/]node_modules[\\/]ethers[\\/]/,
            name: 'ethers',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }
    return config;
  },
  env: {
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
