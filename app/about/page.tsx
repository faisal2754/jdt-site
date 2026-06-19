import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/cta-footer"
import { AboutContent } from "@/components/about-content"

export const metadata: Metadata = {
  title: "About",
  description:
    "JDT Promotions was built by dreamers who were tired of searching for partners who could execute the impossible — so we became that partner. Print, talent and technology under one roof.",
}

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <AboutContent />
      </main>
      <SiteFooter />
    </>
  )
}
