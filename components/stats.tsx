"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

const stats = [
  { value: 150, suffix: "+", label: "Projects delivered" },
  { value: 50, suffix: "+", label: "Talent on our roster" },
  { value: 100, suffix: "%", label: "Client satisfaction" },
  { value: 24, suffix: "hr", label: "Quotes" },
]

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const [count, setCount] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!inView || shouldReduceMotion) return
    const duration = 1600
    const start = performance.now()
    let frame: number
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, target, shouldReduceMotion])

  const display = shouldReduceMotion ? target : count

  return (
    <span ref={ref} className="font-sans text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
      {display}
      <span className="text-silver">{suffix}</span>
    </span>
  )
}

export function Stats() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24, filter: "blur(2px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-start gap-2"
            >
              <Counter target={stat.value} suffix={stat.suffix} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
