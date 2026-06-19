"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { creators, creatorCategories } from "@/lib/creators"

export function TalentRoster() {
  const [filter, setFilter] = useState<(typeof creatorCategories)[number]>("All")
  const filtered = filter === "All" ? creators : creators.filter((c) => c.category === filter)

  // Only offer disciplines that actually have talent (plus "All").
  const available = creatorCategories.filter(
    (cat) => cat === "All" || creators.some((c) => c.category === cat),
  )
  const countFor = (cat: (typeof creatorCategories)[number]) =>
    cat === "All" ? creators.length : creators.filter((c) => c.category === cat).length

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-20">
        {/* Controls */}
        <div className="mb-10 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "creator" : "creators"}
            {filter !== "All" ? ` in ${filter}` : " on our roster"}
          </p>
          <div className="relative w-full sm:w-72">
            <label htmlFor="discipline-filter" className="sr-only">
              Filter talent by discipline
            </label>
            <select
              id="discipline-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as (typeof creatorCategories)[number])}
              className="w-full cursor-pointer appearance-none rounded-full border border-border bg-card px-5 py-3 pr-12 text-sm font-medium text-foreground transition-colors hover:border-silver focus:border-silver focus:outline-none"
            >
              {available.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All disciplines" : cat} ({countFor(cat)})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((creator, i) => (
              <motion.div
                key={creator.slug}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              >
                <Link href={`/creators/${creator.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card">
                    <Image
                      src={creator.image || "/placeholder.svg"}
                      alt={creator.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-sans text-lg font-semibold tracking-tight text-foreground">{creator.name}</h3>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      {creator.category} &middot; {creator.location}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
