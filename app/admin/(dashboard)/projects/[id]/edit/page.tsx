import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { requireSession } from '@/lib/auth/guard'
import { getProjectByIdForAdmin } from '@/lib/queries/projects'
import { projectCategoryValues } from '@/lib/validation/projects'
import { ProjectForm } from '@/components/admin/project-form'
import { AdminPageHeader } from '@/components/admin/page-header'

import { updateProjectAction } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit project',
}

// The edit form must reflect the live row, including unpublished drafts.
export const dynamic = 'force-dynamic'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSession()

  const { id } = await params
  const project = await getProjectByIdForAdmin(id)
  if (!project) notFound()

  // Pre-bind the record id so the form posts to update, not create.
  const action = updateProjectAction.bind(null, project.id)

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Projects"
        title={`Edit ${project.title}`}
        description="Changes publish to the public site after saving."
        backHref="/admin/projects"
        backLabel="All projects"
      />
      <ProjectForm
        mode="edit"
        action={action}
        categories={projectCategoryValues}
        defaultValues={{
          title: project.title,
          slug: project.slug,
          client: project.client,
          category: project.category,
          industry: project.industry,
          year: project.year,
          imageUrl: project.imageUrl,
          summary: project.summary,
          featured: project.featured,
          sortOrder: project.sortOrder,
          published: project.published,
        }}
      />
    </div>
  )
}
