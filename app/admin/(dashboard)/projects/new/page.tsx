import type { Metadata } from 'next'

import { requireSession } from '@/lib/auth/guard'
import { projectCategoryValues } from '@/lib/validation/projects'
import { ProjectForm } from '@/components/admin/project-form'
import { AdminPageHeader } from '@/components/admin/page-header'

import { createProjectAction } from '../actions'

export const metadata: Metadata = {
  title: 'New project',
}

export default async function NewProjectPage() {
  await requireSession()

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Projects"
        title="New project"
        description="Add a project to the portfolio. It appears on the public work grid once published."
        backHref="/admin/projects"
        backLabel="All projects"
      />
      <ProjectForm
        mode="create"
        action={createProjectAction}
        categories={projectCategoryValues}
        defaultValues={{ published: true, featured: false, sortOrder: 0 }}
      />
    </div>
  )
}
