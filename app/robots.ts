import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://jdtpromotions.com/sitemap.xml',
    host: 'https://jdtpromotions.com',
  }
}
