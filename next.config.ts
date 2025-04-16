import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['placekitten.com'],
  },
  experimental: {
    // Use updated key for server components external packages
    serverComponentsExternalPackages: ['@groq/groq-sdk'],
  },
  // Increase API response size limits
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
  // Configure for better error handling
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  // Add environment variables configuration
  env: {
    // MongoDB connection variables
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_PASSWORD: process.env.MONGODB_PASSWORD,
    // Auth and API keys
    NEXT_PUBLIC_GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    // Feature flags
    USE_FALLBACK: process.env.USE_FALLBACK,
  },
};

export default nextConfig;