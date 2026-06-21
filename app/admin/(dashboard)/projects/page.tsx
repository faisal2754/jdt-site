import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Plus } from 'lucide-react'

import { requireSession } from '@/lib/auth/guard'
import { getProjectsForAdmin } from '@/lib/queries/projects'
import { AdminPageHeader } from '@/components/admin/page-header'

import { ProjectsTable } from './_components/projects-table'
import { StatusToast } from './_components/status-toast'

export const metadata: Metadata = {
  title: 'Projects',
}

// Reflect the live DB on every visit — this is a control surface.
export const dynamic = 'force-dynamic'

export default async function ProjectsListPage() {
  await requireSession()

  const projects = await getProjectsForAdmin()
  const published = projects.filter((p) => p.published).length
  const drafts = projects.length - published
  const featured = projects.filter((p) => p.featured).length

  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={null}>
        <StatusToast />
      </Suspense>

      <AdminPageHeader
        eyebrow="Manage"
        title="Projects"
        description={
          projects.length > 0
            ? `${projects.length} project${projects.length === 1 ? '' : 's'} · ${published} live · ${drafts} draft${drafts === 1 ? '' : 's'} · ${featured} featured.`
            : 'Your portfolio work lives here.'
        }
        actions={
          <Link
            href="/admin/projects/new"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-[transform,box-shadow] duration-200 ease-smooth hover:shadow-elevated active:scale-[0.98]"
          >
            <Plus
              className="size-4 transition-transform duration-200 ease-smooth group-hover:rotate-90"
              aria-hidden
            />
            New project
          </Link>
        }
      />

      <ProjectsTable projects={projects} />
    </div>
  )
}
