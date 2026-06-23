import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { CreatorProfile } from "@/components/creator-profile"
import { CtaFooter } from "@/components/cta-footer"
import { JsonLd } from "@/components/json-ld"
import { personSchema, breadcrumbSchema } from "@/lib/structured-data"
import { getCreators, getCreatorBySlug } from "@/lib/queries/creators"

export async function generateStaticParams() {
  const creators = await getCreators()
  return creators.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const creator = await getCreatorBySlug(slug)
  if (!creator) return { title: "Creator not found" }
  return {
    title: `${creator.name}, Creator`,
    description: creator.bio[0],
    alternates: { canonical: `/creators/${slug}` },
  }
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [creator, creators] = await Promise.all([
    getCreatorBySlug(slug),
    getCreators(),
  ])
  if (!creator) notFound()

  return (
    <>
      <JsonLd
        data={[
          personSchema(creator),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Talent", path: "/talent" },
            { name: creator.name, path: `/creators/${creator.slug}` },
          ]),
        ]}
      />
      <SiteHeader />
      <CreatorProfile creator={creator} creators={creators} />
      <CtaFooter />
    </>
  )
}
