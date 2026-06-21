import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Plus } from 'lucide-react'

import { requireSession } from '@/lib/auth/guard'
import { getServicesForAdmin } from '@/lib/queries/services'
import { AdminPageHeader } from '@/components/admin/page-header'

import { ServicesTable } from './_components/services-table'
import { StatusToast } from './_components/status-toast'

export const metadata: Metadata = {
  title: 'Services',
}

// Reflect the live DB on every visit — this is a control surface.
export const dynamic = 'force-dynamic'

export default async function ServicesListPage() {
  await requireSession()

  const services = await getServicesForAdmin()
  const totalItems = services.reduce((sum, s) => sum + s.services.length, 0)

  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={null}>
        <StatusToast />
      </Suspense>

      <AdminPageHeader
        eyebrow="Manage"
        title="Services"
        description={
          services.length > 0
            ? `${services.length} categor${services.length === 1 ? 'y' : 'ies'} · ${totalItems} service item${totalItems === 1 ? '' : 's'}.`
            : 'Your service categories live here.'
        }
        actions={
          <Link
            href="/admin/services/new"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-[transform,box-shadow] duration-200 ease-smooth hover:shadow-elevated active:scale-[0.98]"
          >
            <Plus
              className="size-4 transition-transform duration-200 ease-smooth group-hover:rotate-90"
              aria-hidden
            />
            New service
          </Link>
        }
      />

      <ServicesTable services={services} />
    </div>
  )
}
