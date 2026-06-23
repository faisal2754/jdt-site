'use client'

import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

/**
 * Shared admin-form layout primitives.
 *
 * These establish the form vocabulary every entity reuses (8b mirrors them for
 * Projects / Services / Brands): a two-column responsive page, grouped section
 * cards, a labelled field with inline error + optional hint, and a sticky action
 * bar. All motion uses the house `ease-smooth` blur-rise entrance.
 */

const EASE = [0.22, 1, 0.36, 1] as const

/** A grouped card of related fields with a heading + blurb. */
export function FormSection({
  title,
  description,
  index = 0,
  children,
  className,
}: {
  title: string
  description?: string
  index?: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.4, delay: 0.04 * index, ease: EASE }}
      className={cn(
        'flex flex-col gap-5 rounded-3xl border border-border bg-card/40 p-5 shadow-card sm:p-6',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </motion.section>
  )
}

/** A labelled field with a required marker, hint, and inline error slot. */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  id?: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label
          htmlFor={id}
          className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
        >
          {label}
          {required ? (
            <span className="text-destructive" aria-hidden>
              *
            </span>
          ) : null}
        </Label>
        {hint ? (
          <span className="whitespace-nowrap text-[0.7rem] text-muted-foreground/80">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Sticky bottom action bar holding Cancel + the submit button. */
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 mt-2 flex items-center justify-end gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3 shadow-elevated backdrop-blur-md">
      {children}
    </div>
  )
}
