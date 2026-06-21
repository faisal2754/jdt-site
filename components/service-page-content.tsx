"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Check } from "lucide-react"
import type { Creator } from "@/lib/creators"
import type { ServiceCategory } from "@/lib/services"
import { CreatorCarousel } from "@/components/creator-carousel"
import { ContactButton } from "@/components/contact-button"

export function ServicePageContent({
  category,
  services,
  creators,
}: {
  category: ServiceCategory
  services: ServiceCategory[]
  creators: Creator[]
}) {
  const others = services.filter((c) => c.id !== category.id)
  const isTalent = category.slug === "talent-management"

  return (
    <main id="main" className="pt-16 md:pt-20">
      {/* Hero */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Our services</p>
            <h1 className="text-balance font-sans text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              {category.label}
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground lg:text-lg">
              {category.description}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <ContactButton href={`/contact?service=${category.slug}`} />
              <Link
                href="#roster"
                className={`rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 ease-smooth hover:bg-secondary active:scale-[0.98] ${isTalent ? "" : "hidden"}`}
              >
                Meet our creators
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-card"
          >
            <Image
              src={category.imageUrl || "/placeholder.svg"}
              alt={`${category.label} showcase`}
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* Services list */}
      <section className="border-b border-border bg-card py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex flex-col gap-4">
            <h2 className="max-w-2xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              What we offer in{" "}
              <span className="font-serif italic font-normal text-silver-bright">{category.label}</span>
            </h2>
          </div>
          <div className="grid gap-x-10 gap-y-px sm:grid-cols-2">
            {category.services.map((service, i) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (i % 2) * 0.05 }}
                className="flex gap-4 border-b border-border py-5"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Check className="size-3.5 text-foreground" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{service.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-2xl bg-background p-8 shadow-card sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-foreground">Need something not listed here?</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We exist to turn ambitious ideas into reality. The impossible isn&apos;t the end, it&apos;s where we get started
              </p>
            </div>
            <ContactButton href={`/contact?service=${category.slug}`} size="sm" className="shrink-0" />
          </div>
        </div>
      </section>

      {/* Talent: creator roster */}
      {isTalent && (
        <section id="roster" className="scroll-mt-24 border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-6 pt-16 lg:pt-24">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">the company we keep</p>
              <h2 className="max-w-2xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Talent that brands{" "}
                <span className="font-serif italic font-normal text-silver-bright">trust</span>
              </h2>
            </div>
          </div>
          <CreatorCarousel creators={creators} />
        </section>
      )}

      {/* Other services */}
      <section className="bg-card py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Explore our other services
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {others.map((cat) => (
              <Link
                key={cat.id}
                href={`/services/${cat.slug}`}
                className="group flex flex-col gap-3 rounded-2xl bg-background p-8 shadow-card transition-[transform,box-shadow] duration-300 ease-smooth hover:shadow-elevated active:scale-[0.98]"
              >
                <span className="flex items-center gap-2 font-sans text-xl font-semibold tracking-tight text-foreground">
                  {cat.label}
                  <ArrowRight className="size-5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">{cat.tagline}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
