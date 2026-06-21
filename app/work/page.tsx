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
    "Explore the JDT Promotions portfolio — printing and design, talent management, and AI and development projects delivered for brands across industries.",
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
          title="Selected"
          accent="projects."
          tagline="A growing portfolio across printing and design, talent management, and AI and development — every project delivered on brand and on time."
        />
        <WorkPortfolio projects={projects} />
        <WorkDivider />
      </main>
      <CtaFooter />
    </>
  )
}
