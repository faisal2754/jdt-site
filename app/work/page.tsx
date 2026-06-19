import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { CtaFooter } from "@/components/cta-footer"
import { PageHero } from "@/components/page-hero"
import { WorkPortfolio } from "@/components/work-portfolio"
import { WorkDivider } from "@/components/work-divider"

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Explore the JDT Promotions portfolio — printing and design, talent management, and AI and development projects delivered for brands across industries.",
}

export default function WorkPage() {
  return (
    <>
      <SiteHeader />
      <PageHero
        eyebrow="Our work"
        title="Selected"
        accent="projects."
        tagline="A growing portfolio across printing and design, talent management, and AI and development — every project delivered on brand and on time."
      />
      <WorkPortfolio />
      <WorkDivider />
      <CtaFooter />
    </>
  )
}
