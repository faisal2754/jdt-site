/** @type {import('next').NextConfig} */

// R2_PUBLIC_BASE_URL is a public CDN URL (not a secret); read its hostname so
// next/image can optimize R2-hosted images via remotePatterns.
let r2Host
try {
  if (process.env.R2_PUBLIC_BASE_URL) {
    r2Host = new URL(process.env.R2_PUBLIC_BASE_URL).hostname
  }
} catch {
  r2Host = undefined
}

const remotePatterns = [
  // Fallback for default *.r2.dev public bucket URLs.
  { protocol: 'https', hostname: '**.r2.dev' },
]

if (r2Host && r2Host !== '**.r2.dev' && !r2Host.endsWith('.r2.dev')) {
  remotePatterns.unshift({ protocol: 'https', hostname: r2Host })
}

const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns,
  },
  async redirects() {
    // Service slugs were rebranded; 308-redirect the old URLs so existing
    // links, bookmarks and SEO keep working. (Any `#roster` hash is reattached
    // by the browser after the redirect.)
    return [
      {
        source: '/services/talent-management',
        destination: '/services/influencer-marketing',
        permanent: true,
      },
      {
        source: '/services/ai-and-development',
        destination: '/services/software-development',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
