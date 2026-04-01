/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuration pour Capacitor (apps mobiles natives)
  // Decommentez la ligne ci-dessous pour generer un build statique pour mobile
  // output: 'export',
  
  // Images optimisees pour le web et mobile
  images: {
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },
}

export default nextConfig
