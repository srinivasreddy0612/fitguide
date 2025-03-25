import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['placekitten.com'],
  },
  // Add the experimental server components flag if you're using those
  experimental: {
    serverComponentsExternalPackages: ['@groq/groq-sdk'],
    // Enable more detailed logging for debugging
    // logging: {
    //   fetches: {
    //     fullUrl: true,
    //   },
    // },
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
};

export default nextConfig;