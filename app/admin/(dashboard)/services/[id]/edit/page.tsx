import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { requireSession } from '@/lib/auth/guard'
import { getServiceByIdForAdmin } from '@/lib/queries/services'
import { ServiceForm } from '@/components/admin/service-form'
import { AdminPageHeader } from '@/components/admin/page-header'

import { updateServiceAction } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit service',
}

// The edit form must reflect the live row immediately after a write.
export const dynamic = 'force-dynamic'

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSession()

  const { id } = await params
  const service = await getServiceByIdForAdmin(id)
  if (!service) notFound()

  // Pre-bind the record id so the form posts to update, not create.
  const action = updateServiceAction.bind(null, service.id)

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Services"
        title={`Edit ${service.label}`}
        description="Changes publish to the public site after saving."
        backHref="/admin/services"
        backLabel="All services"
      />
      <ServiceForm
        mode="edit"
        action={action}
        defaultValues={{
          label: service.label,
          slug: service.slug,
          tagline: service.tagline,
          description: service.description,
          imageUrl: service.imageUrl,
          services: service.services,
          sortOrder: service.sortOrder,
        }}
      />
    </div>
  )
}
