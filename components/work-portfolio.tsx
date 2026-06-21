"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import type { Project } from "@/lib/projects"
import { projectCategories } from "@/lib/projects"

export function WorkPortfolio({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<string>("All")

  const filtered = useMemo(
    () => (filter === "All" ? projects : projects.filter((p) => p.category === filter)),
    [filter, projects],
  )

  const filters = ["All", ...projectCategories]

  return (
    <section className="bg-background py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* Filter bar — Paper Crowns "PROJECTS [count]" pattern */}
        <div className="mb-10 flex flex-col gap-6 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <motion.h2
              initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="font-sans text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl"
            >
              Projects
            </motion.h2>
            <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
              {filtered.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-4 py-2 text-sm transition-[color,transform] duration-150 ease-smooth active:scale-[0.98] ${
                  filter === f
                    ? "border-silver bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((project) => (
              <motion.figure
                key={project.slug}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
                className="group"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card transition-shadow duration-300 ease-smooth group-hover:shadow-elevated">
                  <Image
                    src={project.imageUrl || "/placeholder.svg"}
                    alt={project.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-xs uppercase tracking-widest text-silver-bright">{project.category}</p>
                    <p className="mt-1 text-pretty text-sm leading-relaxed text-white/90">{project.summary}</p>
                  </div>
                </div>
                <figcaption className="mt-4 flex items-baseline justify-between gap-4">
                  <span className="text-sm font-semibold text-foreground">{project.title}</span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{project.year}</span>
                </figcaption>
                <p className="mt-1 text-xs text-muted-foreground">
                  {project.client} · {project.industry}
                </p>
              </motion.figure>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
