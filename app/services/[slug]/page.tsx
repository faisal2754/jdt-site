import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { ServicePageContent } from "@/components/service-page-content"
import { CtaFooter } from "@/components/cta-footer"
import { JsonLd } from "@/components/json-ld"
import { serviceSchema, breadcrumbSchema } from "@/lib/structured-data"
import { getServices, getServiceBySlug } from "@/lib/queries/services"
import { getCreators } from "@/lib/queries/creators"

export async function generateStaticParams() {
  const services = await getServices()
  return services.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getServiceBySlug(slug)
  if (!category) return { title: "Service not found" }
  return {
    title: category.label,
    description: category.description,
    alternates: { canonical: `/services/${slug}` },
  }
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [category, services, creators] = await Promise.all([
    getServiceBySlug(slug),
    getServices(),
    getCreators(),
  ])
  if (!category) notFound()

  return (
    <>
      <JsonLd
        data={[
          serviceSchema(category),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: category.label, path: `/services/${category.slug}` },
          ]),
        ]}
      />
      <SiteHeader />
      <ServicePageContent
        category={category}
        services={services}
        creators={creators}
      />
      <CtaFooter />
    </>
  )
}
