/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://kitatur-production.up.railway.app/api/:path*',
      },
      {
        source: '/m/:slug',
        destination: '/school/:slug/monitor',
      },
    ]
  },
}

export default nextConfig
