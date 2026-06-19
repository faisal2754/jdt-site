"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { featuredProjects } from "@/lib/projects"

export function WorkShowcase() {
  return (
    <section id="work" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-4 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Our work</p>
            <h2 className="max-w-2xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Work that <span className="font-serif italic font-normal text-silver-bright">speaks</span> for itself
            </h2>
          </motion.div>
          <Link
            href="/work"
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-[transform,color,background-color] duration-200 ease-smooth active:scale-[0.98] hover:bg-secondary"
          >
            View full portfolio
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project, i) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
            >
              <Link href="/work" className="group block transition-transform duration-150 ease-smooth active:scale-[0.98]">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-card transition-shadow duration-300 ease-smooth group-hover:shadow-elevated">
                  <Image
                    src={project.image || "/placeholder.svg"}
                    alt={project.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <span className="text-sm font-semibold text-foreground">{project.title}</span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{project.category}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
