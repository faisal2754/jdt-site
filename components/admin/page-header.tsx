import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * Shared admin page header: an optional back link, an eyebrow, the title, and a
 * blurb, with a slot for primary actions on the right. Every entity list/form
 * page uses this so the chrome is identical across Talent / Projects / etc.
 */
export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-4">
      {backHref ? (
        <Link
          href={backHref}
          className="group inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 ease-smooth hover:text-foreground"
        >
          <ArrowLeft
            className="size-3.5 transition-transform duration-200 ease-smooth group-hover:-translate-x-0.5"
            aria-hidden
          />
          {backLabel ?? 'Back'}
        </Link>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
