/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
    cacheKey: Math.random().toString(),
  },
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*"],
  },
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
