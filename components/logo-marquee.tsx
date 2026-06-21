"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { Brand } from "@/lib/db/schema"

export function LogoMarquee({ brands }: { brands: Brand[] }) {
  const shouldReduceMotion = useReducedMotion()
  const doubled = [...brands, ...brands]
  return (
    <section aria-label="Brands that trust us" className="border-y border-border bg-card py-12">
      <div className="mx-auto max-w-7xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
        >
          Brands that trust us
        </motion.p>
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
              {brand.name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
