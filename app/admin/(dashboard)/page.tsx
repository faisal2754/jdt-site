import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, FolderKanban, LayoutGrid, BadgeCheck, ArrowUpRight, Sparkles } from 'lucide-react'

import { getCreatorsForAdmin } from '@/lib/queries/creators'
import { getProjectsForAdmin } from '@/lib/queries/projects'
import { getServicesForAdmin } from '@/lib/queries/services'
import { getBrandsForAdmin } from '@/lib/queries/brands'

import { StatCard, type StatIconKey } from './_components/stat-card'

export const metadata: Metadata = {
  title: 'Dashboard',
}

// Always reflect the live DB — the dashboard is a control surface, not a cached page.
export const dynamic = 'force-dynamic'

function pluralMeta(published: number, total: number) {
  const drafts = total - published
  if (drafts <= 0) return `${published} published`
  return `${published} published · ${drafts} draft${drafts === 1 ? '' : 's'}`
}

export default async function AdminDashboardPage() {
  const [creators, projects, services, brands] = await Promise.all([
    getCreatorsForAdmin(),
    getProjectsForAdmin(),
    getServicesForAdmin(),
    getBrandsForAdmin(),
  ])

  const publishedCreators = creators.filter((c) => c.published).length
  const publishedProjects = projects.filter((p) => p.published).length
  const featuredProjects = projects.filter((p) => p.featured).length

  const cards: {
    label: string
    count: number
    icon: StatIconKey
    component: typeof Users
    href: string
    newHref: string
    meta: string
  }[] = [
    {
      label: 'Talent',
      count: creators.length,
      icon: 'talent',
      component: Users,
      href: '/admin/talent',
      newHref: '/admin/talent/new',
      meta: pluralMeta(publishedCreators, creators.length),
    },
    {
      label: 'Projects',
      count: projects.length,
      icon: 'projects',
      component: FolderKanban,
      href: '/admin/projects',
      newHref: '/admin/projects/new',
      meta: `${pluralMeta(publishedProjects, projects.length)} · ${featuredProjects} featured`,
    },
    {
      label: 'Services',
      count: services.length,
      icon: 'services',
      component: LayoutGrid,
      href: '/admin/services',
      newHref: '/admin/services/new',
      meta: 'Service categories',
    },
    {
      label: 'Brands',
      count: brands.length,
      icon: 'brands',
      component: BadgeCheck,
      href: '/admin/brands',
      newHref: '/admin/brands/new',
      meta: 'Trusted-by logos',
    },
  ]

  const totalRecords =
    creators.length + projects.length + services.length + brands.length

  return (
    <div className="flex flex-col gap-10">
      {/* Greeting / page header */}
      <header className="flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground shadow-card">
          <Sparkles className="size-3" aria-hidden />
          Content control
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Welcome to the{' '}
          <span className="font-serif font-normal italic text-silver-bright">
            studio console
          </span>
        </h1>
        <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Manage everything the public site renders: {totalRecords} live records
          across talent, projects, services, and brands. Edits publish to the
          marketing site after saving.
        </p>
      </header>

      {/* Summary cards */}
      <section aria-label="Content summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <StatCard
              key={card.label}
              index={i}
              label={card.label}
              count={card.count}
              icon={card.icon}
              href={card.href}
              newHref={card.newHref}
              meta={card.meta}
            />
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section aria-label="Quick actions" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Jump back in
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.component
            return (
              <Link
                key={card.label}
                href={card.href}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-4 shadow-card transition-[transform,background-color,box-shadow] duration-200 ease-smooth hover:-translate-y-0.5 hover:bg-card hover:shadow-elevated active:scale-[0.99]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-foreground/90 transition-colors duration-200 group-hover:bg-secondary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium text-foreground">
                    Manage {card.label.toLowerCase()}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {card.count} record{card.count === 1 ? '' : 's'} · open list
                  </span>
                </span>
                <ArrowUpRight
                  className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 ease-smooth group-hover:translate-x-0 group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
