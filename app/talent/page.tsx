import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { CtaFooter } from "@/components/cta-footer"
import { PageHero } from "@/components/page-hero"
import { TalentRoster } from "@/components/talent-roster"
import { TalentRepresentation } from "@/components/talent-representation"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbSchema } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Full Roster",
  description:
    "Browse the full JDT Promotions talent roster — streamers, videographers, photographers, animators, illustrators, copywriters and more. Filter by discipline to find the right creator for your brand.",
  alternates: { canonical: "/talent" },
}

export default function TalentPage() {
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
          eyebrow="The full roster"
          title="Every creator"
          accent="we represent."
          tagline="Browse the complete roster by discipline. Filter to find exactly the kind of talent your campaign needs."
        />
        <TalentRoster />
        <TalentRepresentation />
      </main>
      <CtaFooter />
    </>
  )
}
