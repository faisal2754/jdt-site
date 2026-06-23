import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/cta-footer"
import { AboutContent } from "@/components/about-content"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbSchema } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "About",
  description:
    "Before JDT was a studio, we were the brand searching for designers, printers and talent who could keep up with our imagination. So we built the partner we always wished we had. Print, talent and dev work under one roof.",
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
