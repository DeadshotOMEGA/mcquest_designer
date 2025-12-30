import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@mcquest/schema', '@mcquest/export'],
  experimental: {
    // Enable turbopack for faster development
    // turbo: {},
  },
}

export default nextConfig
