"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import type { ServiceCategory } from "@/lib/services"
import { groupServicesByAudience } from "@/lib/services"

export function ServicesTabs({ serviceCategories }: { serviceCategories: ServiceCategory[] }) {
  const [active, setActive] = useState(serviceCategories[0].id)
  const category = serviceCategories.find((c) => c.id === active) ?? serviceCategories[0]
  const audienceGroups = groupServicesByAudience(category.services)

  return (
    <section id="services" className="border-t border-border bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col gap-4 lg:mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">What we do</p>
          <h2 className="max-w-3xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Every service your brand needs,{" "}
            <span className="font-serif italic font-normal text-silver-bright">under one roof</span>
          </h2>
        </motion.div>

        {/* Tabs */}
        <div role="tablist" aria-label="Service categories" className="mb-10 flex flex-wrap gap-2">
          {serviceCategories.map((cat) => (
            <button
              key={cat.id}
              role="tab"
              id={`tab-${cat.id}`}
              aria-selected={active === cat.id}
              aria-controls={`panel-${cat.id}`}
              onClick={() => setActive(cat.id)}
              className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-[transform,color,background-color,border-color] duration-200 ease-smooth active:scale-[0.98] ${
                active === cat.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:border-silver hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={category.id}
            id={`panel-${category.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${category.id}`}
            initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
            transition={{ duration: 0.3 }}
            className="grid gap-10 lg:grid-cols-5 lg:gap-16"
          >
            {/* Image */}
            <div className="lg:col-span-2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card">
                <Image
                  src={category.imageUrl || "/placeholder.svg"}
                  alt={`${category.label} showcase`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover"
                />
              </div>
              <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground">{category.tagline}</p>
            </div>

            {/* Service list — two audience columns when tagged, else a flat list */}
            {audienceGroups ? (
              <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:col-span-3">
                {audienceGroups.map((group, gi) => (
                  <div key={group.key} className="flex flex-col">
                    <h3 className="mb-4 border-b border-border pb-3 font-sans text-2xl font-semibold tracking-tight text-foreground">
                      For{" "}
                      <span className="font-serif italic font-normal text-silver-bright">{group.title}</span>
                    </h3>
                    <ul className="flex flex-col">
                      {group.items.map((service, i) => (
                        <motion.li
                          key={service.name}
                          initial={{ opacity: 0, x: 12, filter: "blur(2px)" }}
                          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                          transition={{ duration: 0.3, delay: (gi * group.items.length + i) * 0.03 }}
                          className="border-b border-border py-4 last:border-b-0"
                        >
                          <p className="text-sm font-semibold text-foreground">{service.name}</p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="grid gap-x-8 sm:grid-cols-2 lg:col-span-3">
                {category.services.map((service, i) => (
                  <motion.li
                    key={service.name}
                    initial={{ opacity: 0, x: 12, filter: "blur(2px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="border-b border-border py-4"
                  >
                    <p className="text-sm font-semibold text-foreground">{service.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
