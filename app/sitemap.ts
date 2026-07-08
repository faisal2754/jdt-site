import type { MetadataRoute } from 'next'
import { getCreators } from '@/lib/queries/creators'
import { getServices } from '@/lib/queries/services'

const baseUrl = 'https://jdtpromotions.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const [creators, serviceCategories] = await Promise.all([
    getCreators(),
    getServices(),
  ])

  const homepage: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]

  const primaryRoutes = [
    '/about',
    '/work',
    '/artwork',
    '/talent',
    '/contact',
    '/policy/privacy',
    '/policy/terms-and-conditions',
  ]

  const primaryPages: MetadataRoute.Sitemap = primaryRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const servicePages: MetadataRoute.Sitemap = serviceCategories.map(
    (category) => ({
      url: `${baseUrl}/services/${category.slug}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
  )

  const creatorPages: MetadataRoute.Sitemap = creators.map((creator) => ({
    url: `${baseUrl}/creators/${creator.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...homepage, ...primaryPages, ...servicePages, ...creatorPages]
}
