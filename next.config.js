/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*"],
  },
}

module.exports = nextConfig
