import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { LogoMarquee } from "@/components/logo-marquee"
import { Stats } from "@/components/stats"
import { ServicesTabs } from "@/components/services-tabs"
import { WorkShowcase } from "@/components/work-showcase"
import { WhyUs } from "@/components/why-us"
import { Process } from "@/components/process"
import { Testimonials } from "@/components/testimonials"
import { CtaFooter } from "@/components/cta-footer"

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <LogoMarquee />
        <Stats />
        <ServicesTabs />
        <WorkShowcase />
        <WhyUs />
        <Process />
        <Testimonials />
        <CtaFooter />
      </main>
    </>
  )
}
