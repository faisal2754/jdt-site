'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, ArrowUpRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { site } from '@/lib/site'

import { adminNavItems } from './nav-items'
import { SignOutButton } from './sign-out-button'

/** A nav row is active when the path equals it or sits under it. */
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Wordmark() {
  return (
    <Link
      href="/admin"
      className="group flex items-center gap-3 rounded-2xl px-1 py-1 transition-transform duration-200 ease-smooth active:scale-[0.98]"
      aria-label={`${site.name} admin home`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card transition-shadow duration-200 ease-smooth group-hover:shadow-elevated">
        <span className="font-serif text-base italic leading-none">J</span>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {site.name}
        </span>
        <span className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">
          Studio Console
        </span>
      </span>
    </Link>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1" aria-label="Admin sections">
      {adminNavItems.map((item, i) => {
        const active = isActive(pathname, item.href)
        const Icon = item.icon
        return (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -8, filter: 'blur(2px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.32, delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
                'transition-[color,background-color,transform] duration-200 ease-smooth active:scale-[0.985]',
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-nav-active"
                  className="absolute inset-0 -z-10 rounded-xl bg-card shadow-card"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <span
                aria-hidden
                className={cn(
                  'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-foreground transition-opacity duration-200',
                  active ? 'opacity-100' : 'opacity-0',
                )}
              />
              <Icon
                className={cn(
                  'size-4 shrink-0 transition-colors duration-200',
                  active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              <span className="font-medium">{item.label}</span>
              <ArrowUpRight
                className={cn(
                  'ml-auto size-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 ease-smooth',
                  'group-hover:translate-x-0 group-hover:opacity-100',
                  active && 'opacity-0',
                )}
                aria-hidden
              />
            </Link>
          </motion.div>
        )
      })}
    </nav>
  )
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-8 px-4 py-6">
      <Wordmark />
      <div className="px-1">
        <p className="mb-2 px-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Manage
        </p>
        <NavList onNavigate={onNavigate} />
      </div>
      <div className="mt-auto flex flex-col gap-3 border-t border-border/70 pt-5">
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          onClick={onNavigate}
          className="group flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors duration-200 ease-smooth hover:bg-muted/60 hover:text-foreground"
        >
          <ArrowUpRight className="size-4 transition-transform duration-200 ease-smooth group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          View live site
        </Link>
        <SignOutButton className="justify-center" />
      </div>
    </div>
  )
}

/**
 * Admin sidebar. Persistent rail on desktop (≥lg); a slide-over drawer on
 * smaller screens triggered by a fixed menu button. Active-state styling uses a
 * shared-layout pill (framer-motion `layoutId`) so the highlight glides between
 * sections.
 */
export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  // Auto-close the drawer on navigation by deriving from the path during render
  // (React's "adjust state while rendering" pattern — no effect needed).
  const [openedAt, setOpenedAt] = useState(pathname)
  if (mobileOpen && openedAt !== pathname) {
    setMobileOpen(false)
  }

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 border-r border-border bg-gradient-to-b from-card/40 to-background lg:block">
        <SidebarBody />
      </aside>

      {/* Mobile menu trigger */}
      <button
        type="button"
        onClick={() => {
          setOpenedAt(pathname)
          setMobileOpen(true)
        }}
        aria-label="Open admin menu"
        aria-expanded={mobileOpen}
        className="fixed left-4 top-4 z-40 grid size-11 place-items-center rounded-full border border-border bg-card/80 text-foreground shadow-card backdrop-blur-md transition-transform duration-200 ease-smooth active:scale-[0.96] lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              aria-hidden
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-border bg-background shadow-elevated"
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close admin menu"
                className="absolute right-3 top-5 z-10 grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:scale-[0.96]"
              >
                <X className="size-5" aria-hidden />
              </button>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
