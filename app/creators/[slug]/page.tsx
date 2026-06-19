import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { CreatorProfile } from "@/components/creator-profile"
import { CtaFooter } from "@/components/cta-footer"
import { creators, getCreatorBySlug } from "@/lib/creators"

export function generateStaticParams() {
  return creators.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const creator = getCreatorBySlug(slug)
  if (!creator) return { title: "Creator not found" }
  return {
    title: `${creator.name} — Creator`,
    description: creator.bio[0],
  }
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const creator = getCreatorBySlug(slug)
  if (!creator) notFound()

  return (
    <>
      <SiteHeader />
      <CreatorProfile creator={creator} />
      <CtaFooter />
    </>
  )
}
