import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { CtaFooter } from "@/components/cta-footer"
import { PageHero } from "@/components/page-hero"
import { TalentRoster } from "@/components/talent-roster"
import { TalentRepresentation } from "@/components/talent-representation"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbSchema } from "@/lib/structured-data"
import { getCreators } from "@/lib/queries/creators"

export const metadata: Metadata = {
  title: "Friends of JDT",
  description:
    "Talent we know and love: streamers, videographers, photographers, animators, illustrators, copywriters and more. Some officially ours, some simply friends. Browse by discipline to find the right face for your campaign.",
  alternates: { canonical: "/talent" },
}

export default async function TalentPage() {
  const creators = await getCreators()

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Talent", path: "/talent" },
        ])}
      />
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="Friends of JDT"
          title="Talent we"
          accent="know and love"
          tagline="Some are officially ours, some are simply friends, every one of them good at what they do. Browse by discipline to find the right face for your campaign."
        />
        <TalentRoster creators={creators} />
        <TalentRepresentation />
      </main>
      <CtaFooter />
    </>
  )
}
