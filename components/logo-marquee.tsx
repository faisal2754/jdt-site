"use client"

import { motion, useReducedMotion } from "framer-motion"
import { trustedBrands as brands } from "@/lib/services"

export function LogoMarquee() {
  const shouldReduceMotion = useReducedMotion()
  const doubled = [...brands, ...brands]
  return (
    <section aria-label="Brands that trust us" className="border-y border-border bg-card py-12">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Brands that trust us
        </p>
      </div>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <motion.div
          className="flex w-max items-center gap-16 pr-16"
          animate={shouldReduceMotion ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: 35, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          {doubled.map((brand, i) => (
            <span
              key={i}
              aria-hidden={i >= brands.length}
              className="whitespace-nowrap font-serif text-2xl italic text-silver transition-colors hover:text-foreground"
            >
              {brand}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
