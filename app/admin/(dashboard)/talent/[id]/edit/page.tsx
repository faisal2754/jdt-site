import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { requireSession } from '@/lib/auth/guard'
import { getCreatorByIdForAdmin } from '@/lib/queries/creators'
import { creatorCategoryValues } from '@/lib/validation/creators'
import { CreatorForm } from '@/components/admin/creator-form'
import { AdminPageHeader } from '@/components/admin/page-header'

import { updateCreatorAction } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit talent',
}

// The edit form must reflect the live row, including unpublished drafts.
export const dynamic = 'force-dynamic'

export default async function EditTalentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSession()

  const { id } = await params
  const creator = await getCreatorByIdForAdmin(id)
  if (!creator) notFound()

  // Pre-bind the record id so the form posts to update, not create.
  const action = updateCreatorAction.bind(null, creator.id)

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Talent"
        title={`Edit ${creator.name}`}
        description="Changes publish to the public site after saving."
        backHref="/admin/talent"
        backLabel="All talent"
      />
      <CreatorForm
        mode="edit"
        action={action}
        categories={creatorCategoryValues}
        defaultValues={{
          name: creator.name,
          slug: creator.slug,
          category: creator.category,
          location: creator.location,
          imageUrl: creator.imageUrl,
          bio: creator.bio,
          stats: creator.stats,
          socials: creator.socials,
          sortOrder: creator.sortOrder,
          published: creator.published,
        }}
      />
    </div>
  )
}
