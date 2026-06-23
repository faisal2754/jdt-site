import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { CtaFooter } from "@/components/cta-footer"
import { PageHero } from "@/components/page-hero"
import { WorkPortfolio } from "@/components/work-portfolio"
import { WorkDivider } from "@/components/work-divider"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbSchema } from "@/lib/structured-data"
import { getProjects } from "@/lib/queries/projects"

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "A few of the projects we're proudest of, across design, print, talent and development. Just a taste of what JDT Promotions is capable of.",
  alternates: { canonical: "/work" },
}

export default async function WorkPage() {
  const projects = await getProjects()

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Our Work", path: "/work" },
        ])}
      />
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="Our work"
          title="Projects we're"
          accent="proud of"
          tagline="A few of the projects we're proudest of, across design, print, talent and development. Just a taste of what we're capable of."
        />
        <WorkPortfolio projects={projects} />
        <WorkDivider />
      </main>
      <CtaFooter />
    </>
  )
}
