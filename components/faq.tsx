"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "How fast can you turn a project around?",
    answer:
      "Most print jobs are quoted the same day and delivered within 2-5 working days. Talent bookings can be confirmed within 48 hours, and development timelines are agreed upfront before any work begins — no open-ended projects.",
  },
  {
    question: "Do I need a big budget to work with you?",
    answer:
      "No. We scope every project to your budget, not the other way around. Whether you need a single flyer run or a full brand campaign with talent and a website, we'll tell you exactly what's achievable for your spend before you commit to anything.",
  },
  {
    question: "Can you handle everything under one brief?",
    answer:
      "Yes — that's exactly what we're built for. One brief can cover your print materials, brand ambassadors for the launch event, and the website or app behind it. One point of contact, one invoice, zero agency juggling.",
  },
  {
    question: "What if I'm not happy with the first draft?",
    answer:
      "Revisions are part of the process, not an extra cost. We refine until you sign it off. You'll also see drafts early and often, so there are never surprises at delivery.",
  },
  {
    question: "Do you work with small businesses or only big brands?",
    answer:
      "Both. Our roster spans startups, local businesses and established brands. The process is the same: a clear quote upfront, honest timelines, and work that makes you look bigger than you are.",
  },
  {
    question: "How do I get a quote?",
    answer:
      "Send us a message through the contact page, or reach us directly on WhatsApp or email. Tell us what you need and your deadline — we usually respond with a plan and quote the same day.",
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="border-t border-border bg-background py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div className="flex flex-col items-start gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">FAQ</p>
          <h2 className="text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Questions, <span className="font-serif italic font-normal text-silver-bright">answered</span>
          </h2>
          <p className="max-w-sm text-pretty text-base leading-relaxed text-muted-foreground">
            Everything you need to know before starting a project. Still unsure? Reach out any time — we reply the same
            day.
          </p>
        </div>

        <div className="flex flex-col">
          {faqs.map((faq, i) => (
            <div key={faq.question} className="border-b border-border">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
              >
                <span className="text-base font-semibold text-foreground">{faq.question}</span>
                <ChevronDown
                  className={`size-5 shrink-0 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
