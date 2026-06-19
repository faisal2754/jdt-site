"use client"

import { motion } from "framer-motion"

export function PageHero({
  eyebrow,
  title,
  accent,
  tagline,
}: {
  eyebrow?: string
  title: string
  accent?: string
  tagline?: string
}) {
  return (
    <section className="border-b border-border bg-background pt-32 pb-16 lg:pt-44 lg:pb-24">
      <div className="mx-auto max-w-7xl px-6">
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
          >
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="max-w-4xl text-balance font-sans text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
        >
          {title}
          {accent && <span className="font-serif italic font-normal text-silver-bright"> {accent}</span>}
        </motion.h1>
        {tagline && (
          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground lg:text-lg"
          >
            {tagline}
          </motion.p>
        )}
      </div>
    </section>
  )
}
