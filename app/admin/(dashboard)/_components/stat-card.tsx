'use client'

import Link from 'next/link'
import { animate, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Plus, Users, FolderKanban, LayoutGrid, BadgeCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * Icons are resolved here by a string key. Lucide components are functions and
 * cannot be passed from a Server Component into this Client Component, so the
 * dashboard hands us a serializable key instead.
 */
const ICONS = {
  talent: Users,
  projects: FolderKanban,
  services: LayoutGrid,
  brands: BadgeCheck,
} as const

export type StatIconKey = keyof typeof ICONS

/** Roll a number from 0 → value on mount (honours reduced motion). */
function useCountUp(value: number, delay = 0) {
  const reduce = useReducedMotion()
  // Start at the final value; the effect only rewinds-and-animates when motion
  // is allowed. This keeps reduced-motion users (and SSR) on the real number
  // without a synchronous setState in the effect body.
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (reduce) return
    const controls = animate(0, value, {
      duration: 0.9,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, delay, reduce])

  return display
}

export interface StatCardProps {
  label: string
  count: number
  icon: StatIconKey
  /** Route to the entity list (lands in Phase 8). */
  href: string
  /** Route to the entity "new" form (lands in Phase 8). */
  newHref: string
  /** Tiny supporting metric, e.g. "10 published · 2 drafts". */
  meta?: string
  index?: number
}

export function StatCard({
  label,
  count,
  icon,
  href,
  newHref,
  meta,
  index = 0,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const Icon = ICONS[icon]
  const display = useCountUp(count, 0.15 + index * 0.06)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.42, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <Link
        href={href}
        className={cn(
          'relative flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-card',
          'transition-[transform,box-shadow,border-color] duration-300 ease-smooth',
          'hover:-translate-y-0.5 hover:border-border hover:shadow-elevated active:scale-[0.99]',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground/90 transition-colors duration-200 group-hover:bg-secondary">
            <Icon className="size-5" aria-hidden />
          </span>
          <ArrowUpRight
            className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 ease-smooth group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-serif text-4xl leading-none tracking-tight text-foreground tabular-nums">
            {display}
          </span>
          <span className="text-sm font-medium text-foreground">{label}</span>
          {meta ? (
            <span className="text-xs text-muted-foreground">{meta}</span>
          ) : null}
        </div>
      </Link>

      {/* New-entity quick action, layered above the card link. */}
      <Link
        href={newHref}
        aria-label={`Add new ${label.toLowerCase()}`}
        className={cn(
          'absolute bottom-4 right-4 z-10 grid size-8 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-card',
          'opacity-0 transition-[opacity,transform,background-color,color] duration-200 ease-smooth',
          'hover:bg-foreground hover:text-background active:scale-95',
          'group-hover:opacity-100 focus-visible:opacity-100',
        )}
      >
        <Plus className="size-4" aria-hidden />
      </Link>
    </motion.div>
  )
}
