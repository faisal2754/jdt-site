"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

const testimonials = [
  {
    quote:
      "JDT handled our entire product launch: packaging, event staff and the website. One brief, three services, zero stress. We'll never go back to juggling agencies.",
    name: "Sarah Mitchell",
    role: "Marketing Director, Atlas Fitness",
  },
  {
    quote:
      "The turnaround on our print campaign was unbelievable. Concepts on Monday, finished banners in our hands by Wednesday. The quality blew us away.",
    name: "David Okafor",
    role: "Founder, Harbour Lane",
  },
  {
    quote:
      "Their talent team found us brand ambassadors who genuinely understood our audience. Engagement on our activation was triple what we projected.",
    name: "Priya Sharma",
    role: "Brand Manager, Mara Beauty",
  },
  {
    quote:
      "The AI chatbot they built answers 80% of our customer queries automatically. It paid for itself in the first month.",
    name: "James Whitfield",
    role: "Operations Lead, Pinnacle Realty",
  },
]

export function Testimonials() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const pauseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pauseBriefly = () => {
    setPaused(true)
    if (pauseTimeout.current) clearTimeout(pauseTimeout.current)
    pauseTimeout.current = setTimeout(() => setPaused(false), 12000)
  }

  const next = () => setIndex((i) => (i + 1) % testimonials.length)
  const prev = () => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)
  const current = testimonials[index]

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 6000)
    return () => clearInterval(timer)
  }, [paused])

  useEffect(() => {
    return () => {
      if (pauseTimeout.current) clearTimeout(pauseTimeout.current)
    }
  }, [])

  return (
    <section className="border-t border-border bg-card py-20 lg:py-28">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
        >
          What clients say
        </motion.p>

        <div className="relative min-h-[200px] w-full sm:min-h-[170px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.35 } }}
              exit={{ opacity: 0, y: -16, filter: "blur(2px)", transition: { duration: 0.22 } }}
              className="flex flex-col items-center gap-6"
            >
              <span className="flex items-center gap-1.5" aria-label="5 star review">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="size-4 text-silver-bright" aria-hidden="true">
                    <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.74.99-5.79-4.21-4.1 5.82-.85L10 1.5z" />
                  </svg>
                ))}
              </span>
              <p className="text-balance font-serif text-xl italic leading-relaxed text-foreground sm:text-2xl">
                {`"${current.quote}"`}
              </p>
              <footer className="flex flex-col gap-1">
                <cite className="text-sm font-semibold not-italic text-foreground">{current.name}</cite>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{current.role}</span>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              pauseBriefly()
              prev()
            }}
            aria-label="Previous testimonial"
            className="flex size-11 items-center justify-center rounded-full text-foreground shadow-card transition-[transform,box-shadow,color,background-color] duration-300 ease-smooth active:scale-[0.98] hover:bg-secondary hover:shadow-elevated"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center" role="group" aria-label="Testimonials">
            {testimonials.map((t, i) => (
              <button
                key={t.name}
                type="button"
                aria-label={`Show testimonial ${i + 1}`}
                aria-current={i === index}
                onClick={() => {
                  pauseBriefly()
                  setIndex(i)
                }}
                className="box-border flex items-center justify-center p-2.5 transition-transform duration-150 ease-smooth active:scale-[0.98]"
              >
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full transition-colors duration-200 ease-smooth ${i === index ? "bg-foreground" : "bg-border"}`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              pauseBriefly()
              next()
            }}
            aria-label="Next testimonial"
            className="flex size-11 items-center justify-center rounded-full text-foreground shadow-card transition-[transform,box-shadow,color,background-color] duration-300 ease-smooth active:scale-[0.98] hover:bg-secondary hover:shadow-elevated"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
