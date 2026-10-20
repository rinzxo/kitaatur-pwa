/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@phosphor-icons/react', 'react-hot-toast', 'qrcode.react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|mp4|webm)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://apikitatur.rinzgroup.web.id/api/:path*',
      },
      {
        source: '/m/:slug',
        destination: '/school/:slug/monitor',
      },
    ]
  },
}

export default nextConfig

