'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ServiceCategory } from '@/lib/services'
import { useSafeMenu } from '@/lib/use-safe-menu'
import { ContactButton } from '@/components/contact-button'

export function SiteHeaderClient({
  serviceCategories,
}: {
  serviceCategories: ServiceCategory[]
}) {
  const {
    open: servicesOpen,
    openMenu: openServices,
    closeMenu: closeServices,
    triggerRef: servicesTriggerRef,
    contentRef: servicesContentRef,
  } = useSafeMenu()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const isServicesActive = pathname.startsWith('/services')
  const isWorkActive = pathname === '/work'
  const isArtworkActive = pathname === '/artwork'
  const isAboutActive = pathname === '/about'

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
            ref={servicesTriggerRef}
            onMouseEnter={openServices}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeServices()
            }}
          >
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm transition active:scale-[0.98] duration-150 ease-smooth ${
                isServicesActive ? 'bg-muted text-foreground' : 'text-foreground/90 hover:bg-muted'
              }`}
              aria-expanded={servicesOpen}
              aria-haspopup="true"
              aria-current={isServicesActive ? 'page' : undefined}
              onClick={() => (servicesOpen ? closeServices() : openServices())}
            >
              Services
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {servicesOpen && (
                <motion.div
                  ref={servicesContentRef}
                  initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-x-0 top-full border-b border-border bg-popover shadow-elevated"
                >
                  <div className="mx-auto grid max-w-7xl grid-cols-3 gap-6 px-8 py-10">
                    {serviceCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/services/${cat.slug}`}
                        onClick={closeServices}
                        className="group flex flex-col gap-2 rounded-2xl bg-card p-6 shadow-card transition-shadow duration-300 ease-smooth hover:bg-muted hover:shadow-elevated"
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

          <Link
            href="/work"
            aria-current={isWorkActive ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-sm transition active:scale-[0.98] duration-150 ease-smooth ${
              isWorkActive ? 'bg-muted text-foreground' : 'text-foreground/90 hover:bg-muted'
            }`}
          >
            Our work
          </Link>
          <Link
            href="/artwork"
            aria-current={isArtworkActive ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-sm transition active:scale-[0.98] duration-150 ease-smooth ${
              isArtworkActive ? 'bg-muted text-foreground' : 'text-foreground/90 hover:bg-muted'
            }`}
          >
            Artwork
          </Link>
          <Link
            href="/about"
            aria-current={isAboutActive ? 'page' : undefined}
            className={`rounded-full px-4 py-2 text-sm transition active:scale-[0.98] duration-150 ease-smooth ${
              isAboutActive ? 'bg-muted text-foreground' : 'text-foreground/90 hover:bg-muted'
            }`}
          >
            About
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ContactButton size="xs" />
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-full text-foreground transition-transform duration-150 ease-smooth active:scale-[0.98] lg:hidden"
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
              {serviceCategories.map((cat) => {
                const catActive = pathname === `/services/${cat.slug}`
                return (
                  <Link
                    key={cat.id}
                    href={`/services/${cat.slug}`}
                    onClick={() => setMobileOpen(false)}
                    aria-current={catActive ? 'page' : undefined}
                    className={`flex items-center justify-between border-b border-border px-2 py-3 text-base transition-transform duration-150 ease-smooth active:scale-[0.98] ${
                      catActive ? 'rounded-md bg-muted text-foreground' : 'text-foreground'
                    }`}
                  >
                    {cat.label}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                )
              })}

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/work"
                  onClick={() => setMobileOpen(false)}
                  aria-current={isWorkActive ? 'page' : undefined}
                  className={`rounded-md px-2 py-3 text-base transition-transform duration-150 ease-smooth active:scale-[0.98] ${
                    isWorkActive ? 'bg-muted text-foreground' : 'text-foreground'
                  }`}
                >
                  Our work
                </Link>
                <Link
                  href="/artwork"
                  onClick={() => setMobileOpen(false)}
                  aria-current={isArtworkActive ? 'page' : undefined}
                  className={`rounded-md px-2 py-3 text-base transition-transform duration-150 ease-smooth active:scale-[0.98] ${
                    isArtworkActive ? 'bg-muted text-foreground' : 'text-foreground'
                  }`}
                >
                  Artwork
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileOpen(false)}
                  aria-current={isAboutActive ? 'page' : undefined}
                  className={`rounded-md px-2 py-3 text-base transition-transform duration-150 ease-smooth active:scale-[0.98] ${
                    isAboutActive ? 'bg-muted text-foreground' : 'text-foreground'
                  }`}
                >
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
