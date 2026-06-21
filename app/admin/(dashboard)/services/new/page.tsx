import type { Metadata } from 'next'

import { requireSession } from '@/lib/auth/guard'
import { ServiceForm } from '@/components/admin/service-form'
import { AdminPageHeader } from '@/components/admin/page-header'

import { createServiceAction } from '../actions'

export const metadata: Metadata = {
  title: 'New service',
}

export default async function NewServicePage() {
  await requireSession()

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Services"
        title="New service"
        description="Add a service category. It gets its own public page at /services/<slug>."
        backHref="/admin/services"
        backLabel="All services"
      />
      <ServiceForm
        mode="create"
        action={createServiceAction}
        defaultValues={{ sortOrder: 0 }}
      />
    </div>
  )
}
