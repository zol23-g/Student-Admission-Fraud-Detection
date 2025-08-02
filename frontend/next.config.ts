// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Enable standalone output for optimized deployment
  output: 'standalone',
  // Configure page extensions if using TypeScript
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Enable experimental features if needed
  experimental: {
    // appDir: true, // If using the new App Router
    serverComponentsExternalPackages: ['axios'], // If using server components
  },
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ],
      },
    ];
  },
  // Configure rewrites for your fraud analysis page
  async rewrites() {
    return [
      {
        source: '/fraud-analysis',
        destination: '/fraud-analysis',
      },
    ];
  },
  // Configure redirects if needed
  async redirects() {
    return [
      {
        source: '/old-fraud',
        destination: '/fraud-analysis',
        permanent: true,
      },
    ];
  },
  // Configure environment variables
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000',
  },
  // Configure images if needed
  images: {
    domains: ['your-image-domain.com'],
  },
};

export default nextConfig;