"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { Creator } from "@/lib/creators"
import { creators } from "@/lib/creators"
import { ContactButton } from "@/components/contact-button"

export function CreatorProfile({ creator }: { creator: Creator }) {
  const others = creators.filter((c) => c.slug !== creator.slug).slice(0, 6)

  return (
    <main id="main" className="pt-16 md:pt-20">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:py-16">
        <Link
          href="/services/talent-management#roster"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-[transform,color] duration-150 ease-smooth hover:text-foreground active:scale-[0.98]"
        >
          <ArrowLeft className="size-4" />
          All creators
        </Link>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-card shadow-card"
          >
            <Image
              src={creator.image || "/placeholder.svg"}
              alt={creator.name}
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
              priority
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            <h1 className="font-sans text-4xl font-bold uppercase tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {creator.name}
            </h1>
            <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {creator.category} &middot; {creator.location}
            </p>

            {/* Stats */}
            <div className="mt-8 flex flex-col gap-3">
              {creator.stats.map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-3">
                  <span className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {stat.value}
                  </span>
                  <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div className="mt-8 flex flex-wrap gap-3">
              {creator.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="group flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-sm text-foreground shadow-card transition-[transform,box-shadow,background-color] duration-200 ease-smooth hover:bg-secondary hover:shadow-elevated active:scale-[0.98]"
                >
                  <span className="font-medium">{social.label}</span>
                  {social.handle && <span className="text-muted-foreground">{social.handle}</span>}
                  <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </a>
              ))}
            </div>

            {/* Bio */}
            <div className="mt-8 flex flex-col gap-4">
              {creator.bio.map((para, i) => (
                <p key={i} className="text-pretty leading-relaxed text-muted-foreground">
                  {para}
                </p>
              ))}
            </div>

            <ContactButton size="lg" className="mt-8 w-fit" />
          </motion.div>
        </div>
      </div>

      {/* Other creators */}
      <section className="border-t border-border bg-card py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-end justify-between gap-4">
            <h2 className="font-sans text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
              Other <span className="text-muted-foreground">creators</span>
            </h2>
            <Link
              href="/services/talent-management#roster"
              className="shrink-0 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 ease-smooth hover:bg-secondary active:scale-[0.98]"
            >
              See all creators
            </Link>
          </div>

          <div className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4">
            {others.map((c) => (
              <Link
                key={c.slug}
                href={`/creators/${c.slug}`}
                className="group w-64 shrink-0 snap-start transition-transform duration-150 ease-smooth active:scale-[0.98] sm:w-72"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-background shadow-card transition-shadow duration-300 ease-smooth group-hover:shadow-elevated">
                  <Image
                    src={c.image || "/placeholder.svg"}
                    alt={c.name}
                    fill
                    sizes="288px"
                    className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  />
                </div>
                <h3 className="mt-3 font-sans text-lg font-semibold tracking-tight text-foreground">{c.name}</h3>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.category}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
