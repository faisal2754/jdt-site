import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/cta-footer"
import { AboutContent } from "@/components/about-content"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbSchema } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "About",
  description:
    "JDT Promotions was built by dreamers who were tired of searching for partners who could execute the impossible — so we became that partner. Print, talent and technology under one roof.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <SiteHeader />
      <main id="main">
        <AboutContent />
      </main>
      <SiteFooter />
    </>
  )
}
