/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['formidable']
  },
  async rewrites() {
    return [
      // Support *.eth subdomain routing
      {
        source: '/(.*)',
        destination: '/api/proxy?ens=:path*',
        has: [
          {
            type: 'host',
            value: '(?<ens>.*)\\.eth\\..+',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig