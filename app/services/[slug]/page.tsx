import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { ServicePageContent } from "@/components/service-page-content"
import { CtaFooter } from "@/components/cta-footer"
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
      <SiteHeader />
      <ServicePageContent category={category} />
      <CtaFooter />
    </>
  )
}
