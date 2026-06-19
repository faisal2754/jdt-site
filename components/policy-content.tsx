"use client"

import { motion } from "framer-motion"
import { ContactButton } from "@/components/contact-button"

export type PolicySection = {
  heading: string
  body: string[]
}

function slugify(heading: string) {
  return heading
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function stripNumber(heading: string) {
  return heading.replace(/^\d+\.\s*/, "")
}

export function PolicyContent({ sections }: { sections: PolicySection[] }) {
  return (
    <main className="bg-background pb-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[260px_1fr] lg:gap-20">
        {/* Table of contents */}
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-28 flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">On this page</p>
            <ol className="flex flex-col border-l border-border">
              {sections.map((section, i) => (
                <li key={section.heading}>
                  <a
                    href={`#${slugify(section.heading)}`}
                    className="group flex items-baseline gap-3 border-l-2 border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-silver hover:text-foreground"
                  >
                    <span className="font-mono text-xs text-muted-foreground/60 transition-colors group-hover:text-silver-bright">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {stripNumber(section.heading)}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Sections */}
        <div className="flex flex-col">
          {sections.map((section, i) => (
            <motion.section
              key={section.heading}
              id={slugify(section.heading)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45 }}
              className="scroll-mt-28 border-t border-border py-10 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
                <span
                  aria-hidden="true"
                  className="shrink-0 font-serif text-4xl italic leading-none text-silver/40 sm:w-16 sm:text-5xl"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-4">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {stripNumber(section.heading)}
                  </h2>
                  {section.body.map((paragraph, j) => (
                    <p key={j} className="text-pretty text-sm leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </motion.section>
          ))}

          {/* Closing contact card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
            className="mt-6 flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-card p-8 sm:flex-row sm:items-center"
          >
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-foreground">Questions about this policy?</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We&apos;re happy to clarify anything — just reach out.
              </p>
            </div>
            <ContactButton size="sm" className="shrink-0" />
          </motion.div>
        </div>
      </div>
    </main>
  )
}
