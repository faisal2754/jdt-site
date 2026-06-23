"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    title: "Tell us what you need",
    description:
      "Send the brief, the deadline and the budget. Within 24 hours, you will have a clear plan and a quote back, no chasing needed.",
  },
  {
    number: "02",
    title: "We assemble the team",
    description:
      "Designers, printers, talent and developers, we line up exactly the right people for your brief, fast.",
  },
  {
    number: "03",
    title: "Review and refine",
    description:
      "Drafts land asap, with unlimited revisions until it's exactly right. No surprises. No misunderstandings.",
  },
  {
    number: "04",
    title: "Launch and grow",
    description:
      "We deliver, you launch. Then we stick around for the next campaign, and anything you dream up after that.",
  },
]

export function Process() {
  return (
    <section id="process" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-4 lg:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-3xl font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            From concept to completion,{" "}
            <span className="whitespace-nowrap">
              in <span className="font-serif italic font-normal text-silver-bright">four simple steps</span>
            </span>
          </motion.h2>
        </div>

        <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 24, filter: "blur(2px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
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
