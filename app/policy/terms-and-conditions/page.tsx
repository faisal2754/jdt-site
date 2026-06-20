import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/cta-footer"
import { PageHero } from "@/components/page-hero"
import { PolicyContent } from "@/components/policy-content"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbSchema } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms and conditions governing the use of JDT Promotions' website and services.",
  alternates: { canonical: "/policy/terms-and-conditions" },
}

const sections = [
  {
    heading: "1. Introduction",
    body: [
      "These Terms and Conditions govern your use of the JDT Promotions website and the services we provide, including printing and design, talent management, and AI and development services. By accessing our website or engaging our services, you agree to be bound by these terms.",
      "If you do not agree with any part of these terms, please do not use our website or services.",
    ],
  },
  {
    heading: "2. Services",
    body: [
      "JDT Promotions provides creative and marketing services including but not limited to: print production, graphic design, brand identity, talent and creator management, brand partnerships, web and application development, and AI-powered solutions.",
      "All services are subject to a written quotation or proposal. Quotations are valid for 30 days from the date of issue unless otherwise stated. Work commences once a quotation has been accepted in writing and any agreed deposit has been received.",
    ],
  },
  {
    heading: "3. Quotations and Payment",
    body: [
      "Prices quoted are based on the scope of work described at the time of quotation. Changes to the scope may result in revised pricing, which will be communicated and agreed before additional work begins.",
      "Unless otherwise agreed in writing, invoices are payable within 30 days of the invoice date. We reserve the right to suspend work on accounts with overdue balances.",
    ],
  },
  {
    heading: "4. Intellectual Property",
    body: [
      "Upon full payment, ownership of final approved deliverables transfers to the client, unless otherwise agreed in writing. JDT Promotions retains ownership of all working files, drafts, concepts, and rejected proposals.",
      "We reserve the right to display completed work in our portfolio and marketing materials unless the client requests otherwise in writing.",
      "All trademarks, logos, and content on this website are the property of JDT Promotions or their respective owners and may not be reproduced without permission.",
    ],
  },
  {
    heading: "5. Talent Management",
    body: [
      "Talent represented by JDT Promotions are engaged under separate representation agreements. Brands wishing to engage our talent must do so through JDT Promotions. Direct engagement of represented talent that circumvents our agency may result in legal action.",
      "Campaign deliverables, usage rights, and exclusivity terms for talent partnerships are defined per engagement in a written agreement.",
    ],
  },
  {
    heading: "6. Revisions and Approvals",
    body: [
      "Project quotations include the number of revision rounds specified in the proposal. Additional revisions beyond the agreed scope may be billed at our standard hourly rate.",
      "The client is responsible for final proofing and approval of all deliverables before production or publication. JDT Promotions is not liable for errors approved by the client.",
    ],
  },
  {
    heading: "7. Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, JDT Promotions shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or services. Our total liability for any claim shall not exceed the amount paid by the client for the specific service giving rise to the claim.",
    ],
  },
  {
    heading: "8. Termination",
    body: [
      "Either party may terminate an engagement with written notice. The client remains responsible for payment of all work completed up to the date of termination, including any non-refundable third-party costs already incurred.",
    ],
  },
  {
    heading: "9. Changes to These Terms",
    body: [
      "We may update these Terms and Conditions from time to time. The latest version will always be available on this page, and continued use of our website or services constitutes acceptance of the updated terms.",
    ],
  },
  {
    heading: "10. Contact",
    body: [
      "If you have any questions about these Terms and Conditions, please contact us at hello@jdtpromotions.com.",
    ],
  },
]

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Terms & Conditions", path: "/policy/terms-and-conditions" },
        ])}
      />
      <SiteHeader />
      <PageHero
        eyebrow="Legal"
        title="Terms &"
        accent="conditions."
        tagline="The terms governing the use of our website and services. Last updated January 2026."
      />
      <PolicyContent sections={sections} />
      <SiteFooter />
    </>
  )
}
