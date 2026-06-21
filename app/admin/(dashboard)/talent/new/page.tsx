import type { Metadata } from 'next'

import { requireSession } from '@/lib/auth/guard'
import { creatorCategoryValues } from '@/lib/validation/creators'
import { CreatorForm } from '@/components/admin/creator-form'
import { AdminPageHeader } from '@/components/admin/page-header'

import { createCreatorAction } from '../actions'

export const metadata: Metadata = {
  title: 'New talent',
}

export default async function NewTalentPage() {
  await requireSession()

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Talent"
        title="New talent"
        description="Add a creator to the roster. They appear on the public site once published."
        backHref="/admin/talent"
        backLabel="All talent"
      />
      <CreatorForm
        mode="create"
        action={createCreatorAction}
        categories={creatorCategoryValues}
        defaultValues={{ published: true, sortOrder: 0 }}
      />
    </div>
  )
}
