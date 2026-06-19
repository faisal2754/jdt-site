"use client"

import { motion } from "framer-motion"
import { Search, FileSignature, CalendarCheck } from "lucide-react"

const steps = [
  {
    icon: Search,
    title: "We source & vet",
    description:
      "Tell us the brief and we match you with the right talent from our roster — every creator is vetted for reliability, quality and fit before they ever reach you.",
  },
  {
    icon: FileSignature,
    title: "We handle the paperwork",
    description:
      "Contracts, rates, rights and usage are all managed on your behalf. One agreement, one point of contact, zero back-and-forth.",
  },
  {
    icon: CalendarCheck,
    title: "We manage delivery",
    description:
      "From booking to final assets, we keep the project on schedule so you only deal with results — not logistics.",
  },
]

export function TalentRepresentation() {
  return (
    <section className="border-t border-border bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-4 lg:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">How it works</p>
          <h2 className="max-w-3xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Talent, <span className="font-serif italic font-normal text-silver-bright">fully managed.</span>
          </h2>
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            Found someone you like? Booking them through JDT means none of the usual hassle. Here&apos;s how we take it
            from first look to finished campaign.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 transition-colors hover:border-silver"
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-border bg-secondary">
                <step.icon className="size-5 text-silver-bright" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
