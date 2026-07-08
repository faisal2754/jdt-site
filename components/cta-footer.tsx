"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ContactButton } from "@/components/contact-button"
import { site } from "@/lib/site"

export function CtaFooter() {
  return (
    <>
      <section id="contact" className="bg-background py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 32, filter: "blur(2px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-8 rounded-3xl bg-card px-6 py-16 text-center shadow-card sm:px-12 lg:py-24"
          >
            <h2 className="max-w-3xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Got a project everyone else called{" "}
              <span className="font-serif italic font-normal text-silver-bright">impossible?</span>
            </h2>
            <div className="flex flex-col items-center gap-3">
              <ContactButton size="lg" />
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-muted-foreground underline-offset-4 transition-[transform,color] duration-150 ease-smooth active:scale-[0.98] hover:text-foreground hover:underline"
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
  { label: "Influencer Marketing", href: "/services/influencer-marketing" },
  { label: "Software Development", href: "/services/software-development" },
  { label: "Work", href: "/work" },
  { label: "Contact", href: "/contact" },
]

const socialLinks = [
  { label: "WhatsApp", href: site.whatsapp },
  { label: "Facebook", href: site.socials.facebook },
  { label: "LinkedIn", href: site.socials.linkedin },
]

const legalLinks = [
  { label: "Terms & Conditions", href: "/policy/terms-and-conditions" },
  { label: "Privacy Policy", href: "/policy/privacy" },
]

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-card">
      <div aria-hidden="true" className="footer-pattern pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 py-16 lg:flex-row lg:justify-between">
        <div className="flex flex-wrap gap-16">
          <nav aria-label="Sitemap" className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-foreground">Sitemap</p>
            <ul className="flex flex-col gap-2.5">
              {sitemapLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-block text-sm text-muted-foreground transition-[transform,color] duration-150 ease-smooth active:scale-[0.98] hover:text-foreground"
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
                    className="inline-block text-sm text-muted-foreground transition-[transform,color] duration-150 ease-smooth active:scale-[0.98] hover:text-foreground"
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
                    className="inline-block text-sm text-muted-foreground transition-[transform,color] duration-150 ease-smooth active:scale-[0.98] hover:text-foreground"
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
            href={`mailto:${site.email}`}
            className="inline-block text-sm text-muted-foreground transition-[transform,color] duration-150 ease-smooth active:scale-[0.98] hover:text-foreground"
          >
            {site.email}
          </a>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pb-8">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} JDT Promotions. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
