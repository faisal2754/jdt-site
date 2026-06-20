import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { ServicePageContent } from "@/components/service-page-content"
import { CtaFooter } from "@/components/cta-footer"
import { JsonLd } from "@/components/json-ld"
import { serviceSchema, breadcrumbSchema } from "@/lib/structured-data"
import { serviceCategories, getCategoryBySlug } from "@/lib/services"

export function generateStaticParams() {
  return serviceCategories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
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
  const category = getCategoryBySlug(slug)
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
      <ServicePageContent category={category} />
      <CtaFooter />
    </>
  )
}
