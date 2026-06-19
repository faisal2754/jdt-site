'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, Menu, X, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { serviceCategories } from '@/lib/services'
import { ContactButton } from '@/components/contact-button'

export function SiteHeader() {
  const [servicesOpen, setServicesOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="JDT Promotions home">
          <Image
            src="/images/jdt-logo.png"
            alt="JDT Promotions"
            width={150}
            height={36}
            className="h-7 w-auto md:h-8"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <div
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted"
              aria-expanded={servicesOpen}
              aria-haspopup="true"
              onClick={() => setServicesOpen((o) => !o)}
            >
              Services
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {servicesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute inset-x-0 top-full border-b border-border bg-popover shadow-2xl"
                >
                  <div className="mx-auto grid max-w-7xl grid-cols-3 gap-6 px-8 py-10">
                    {serviceCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/services/${cat.slug}`}
                        onClick={() => setServicesOpen(false)}
                        className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-silver hover:bg-muted"
                      >
                        <span className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                          {cat.label}
                          <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">{cat.tagline}</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/work" className="rounded-full px-4 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted">
            Our work
          </Link>
          <Link href="/about" className="rounded-full px-4 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted">
            About
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ContactButton size="xs" />
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full text-foreground lg:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-border bg-background lg:hidden"
          >
            <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-6">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Services
              </p>
              {serviceCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/services/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between border-b border-border px-2 py-3 text-base text-foreground"
                >
                  {cat.label}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}

              <div className="mt-4 flex flex-col gap-2">
                <Link href="/work" onClick={() => setMobileOpen(false)} className="px-2 py-3 text-base text-foreground">
                  Our work
                </Link>
                <Link href="/about" onClick={() => setMobileOpen(false)} className="px-2 py-3 text-base text-foreground">
                  About
                </Link>
                <ContactButton size="md" fullWidth className="mt-2" onClick={() => setMobileOpen(false)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
