"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    title: "Tell us what you need",
    description: "Share your brief, deadline and budget. We'll come back the same day with a clear plan and quote.",
  },
  {
    number: "02",
    title: "We assemble the team",
    description:
      "Designers, printers, talent or developers — the right specialists are matched to your project instantly.",
  },
  {
    number: "03",
    title: "Review and refine",
    description: "You get drafts fast and unlimited revisions until it's exactly right. No surprises, no jargon.",
  },
  {
    number: "04",
    title: "Launch and grow",
    description:
      "We deliver, you launch. Then we stick around for reprints, new campaigns and whatever comes next.",
  },
]

export function Process() {
  return (
    <section id="process" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-4 lg:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">How it works</p>
          <h2 className="max-w-3xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            From brief to delivery in{" "}
            <span className="font-serif italic font-normal text-silver-bright">four simple steps</span>
          </h2>
        </div>

        <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col gap-4 bg-card p-8"
            >
              <span className="font-serif text-4xl italic text-silver" aria-hidden="true">
                {step.number}
              </span>
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
