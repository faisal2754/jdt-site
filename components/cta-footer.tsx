"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ContactButton } from "@/components/contact-button"

export function CtaFooter() {
  return (
    <>
      <section id="contact" className="bg-background py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-8 rounded-3xl border border-border bg-card px-6 py-16 text-center sm:px-12 lg:py-24"
          >
            <h2 className="max-w-3xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Ready to make your brand{" "}
              <span className="font-serif italic font-normal text-silver-bright">impossible to ignore?</span>
            </h2>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
              Tell us about your project and we&apos;ll come back with a plan and quote — usually the same day.
            </p>
            <div className="flex flex-col items-center gap-3">
              <ContactButton size="lg" />
              <a
                href="https://wa.me/27821234567"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                or message us on WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}

const sitemapLinks = [
  { label: "Home", href: "/" },
  { label: "Printing & Design", href: "/services/printing-and-design" },
  { label: "Talent Management", href: "/services/talent-management" },
  { label: "AI & Development", href: "/services/ai-and-development" },
  { label: "Work", href: "/work" },
  { label: "Contact", href: "/contact" },
]

const socialLinks = [
  { label: "WhatsApp", href: "https://wa.me/27821234567" },
  { label: "Facebook", href: "https://facebook.com/jdtpromotions" },
  { label: "LinkedIn", href: "https://linkedin.com/company/jdtpromotions" },
]

const legalLinks = [
  { label: "Terms & Conditions", href: "/policy/terms-and-conditions" },
  { label: "Privacy Policy", href: "/policy/privacy" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-16 lg:flex-row lg:justify-between">
        <div className="flex flex-wrap gap-16">
          <nav aria-label="Sitemap" className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-foreground">Sitemap</p>
            <ul className="flex flex-col gap-2.5">
              {sitemapLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Socials" className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-foreground">Socials</p>
            <ul className="flex flex-col gap-2.5">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal" className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-foreground">Legal</p>
            <ul className="flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <Image src="/images/jdt-logo.png" alt="JDT Promotions" width={150} height={36} className="h-8 w-auto" />
          <a
            href="mailto:hello@jdtpromotions.com"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            hello@jdtpromotions.com
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-8">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} JDT Promotions. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
