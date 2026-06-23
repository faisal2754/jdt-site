"use client"

import { motion } from "framer-motion"
import { Layers, Zap, Users, Sparkles } from "lucide-react"

const reasons = [
  {
    icon: Layers,
    title: "One partner, everything handled",
    description:
      "Print, people and pixels all working together. One team that keeps your brand consistent everywhere.",
  },
  {
    icon: Zap,
    title: "Impossible turnarounds",
    description:
      "Tight deadline? That's our specialty. No cutting corners. If it's not possible, we will make it possible.",
  },
  {
    icon: Users,
    title: "Real talent, fully managed",
    description:
      "From influencers to event staff, we source, vet, contract and manage talent so you only deal with results.",
  },
  {
    icon: Sparkles,
    title: "Human perfection",
    description:
      "We are AI experts, but we believe in genuine human touch. Unless requested, we will NOT use AI for any brief.",
  },
]

export function WhyUs() {
  return (
    <section id="why-us" className="border-t border-border bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-4 lg:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
          >
            Why JDT
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-3xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Not another <span className="font-serif italic font-normal text-silver-bright">agency.</span>
          </motion.h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 24, filter: "blur(2px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col gap-4 rounded-2xl bg-background p-6 shadow-card transition-shadow duration-300 ease-smooth hover:shadow-elevated"
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-border bg-secondary">
                <reason.icon className="size-5 text-silver-bright" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-foreground">{reason.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
