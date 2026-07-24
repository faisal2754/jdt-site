import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/cta-footer"
import { PageHero } from "@/components/page-hero"
import { PolicyContent } from "@/components/policy-content"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbSchema } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How JDT Promotions collects, uses, and protects your personal information.",
  alternates: { canonical: "/policy/privacy" },
}

const sections = [
  {
    heading: "1. Overview",
    body: [
      "JDT Promotions respects your privacy and is committed to protecting your personal information. This policy explains what information we collect, how we use it, and the choices you have.",
      "This policy applies to information collected through our website, contact forms, email, WhatsApp, and social media channels.",
    ],
  },
  {
    heading: "2. Information We Collect",
    body: [
      "When you contact us or request a quote, we collect the information you provide: your name, email address, company name, the service you are interested in, and the details of your message.",
      "We may also collect standard technical information when you browse our website, such as browser type, device type, and pages visited, to help us improve the site experience.",
    ],
  },
  {
    heading: "3. How We Use Your Information",
    body: [
      "We use your information to respond to enquiries, prepare quotations, deliver our services, and communicate about projects. We may occasionally share relevant updates about our services if you have engaged with us.",
      "We do not sell, rent, or trade your personal information to third parties for marketing purposes.",
    ],
  },
  {
    heading: "4. Sharing of Information",
    body: [
      "We only share personal information with third parties where necessary to deliver our services, for example with print production partners or development infrastructure providers, and only to the extent required.",
      "We may disclose information where required by law or to protect our legal rights.",
    ],
  },
  {
    heading: "5. Data Retention",
    body: [
      "We retain enquiry and project information for as long as needed to provide our services and meet legal and accounting obligations. You may request deletion of your personal information at any time, subject to those obligations.",
    ],
  },
  {
    heading: "6. Security",
    body: [
      "We take reasonable technical and organisational measures to protect your personal information against loss, misuse, and unauthorised access. However, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "7. Your Rights",
    body: [
      "You have the right to request access to the personal information we hold about you, to ask for corrections, and to request deletion. To exercise any of these rights, contact us at hello@jdtpromotions.com.",
    ],
  },
  {
    heading: "8. Third-Party Links",
    body: [
      "Our website may contain links to external platforms such as WhatsApp. Those platforms operate under their own privacy policies, and we encourage you to review them.",
    ],
  },
  {
    heading: "9. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. The latest version will always be available on this page.",
    ],
  },
  {
    heading: "10. Contact",
    body: [
      "If you have any questions about this Privacy Policy or how we handle your information, please contact us at hello@jdtpromotions.com.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/policy/privacy" },
        ])}
      />
      <SiteHeader />
      <PageHero
        eyebrow="Legal"
        title="Privacy"
        accent="policy."
        tagline="How we collect, use, and protect your personal information. Last updated January 2026."
      />
      <PolicyContent sections={sections} />
      <SiteFooter />
    </>
  )
}
