import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/cta-footer"
import { PageHero } from "@/components/page-hero"
import { ContactContent } from "@/components/contact-content"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbSchema } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Let's create something worth remembering. Get in touch with JDT Promotions by email, WhatsApp, Facebook or LinkedIn, or send us a message and we'll reply the same day.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="Contact"
          title="Let's create something worth"
          accent="remembering"
          tagline="Tell us about your project and we'll come back with a plan and quote."
        />
        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <ContactContent />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
