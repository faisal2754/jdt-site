import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Plus } from 'lucide-react'

import { requireSession } from '@/lib/auth/guard'
import { getCreatorsForAdmin } from '@/lib/queries/creators'
import { AdminPageHeader } from '@/components/admin/page-header'

import { TalentTable } from './_components/talent-table'
import { StatusToast } from './_components/status-toast'

export const metadata: Metadata = {
  title: 'Talent',
}

// Reflect the live DB on every visit — this is a control surface.
export const dynamic = 'force-dynamic'

export default async function TalentListPage() {
  await requireSession()

  const creators = await getCreatorsForAdmin()
  const published = creators.filter((c) => c.published).length
  const drafts = creators.length - published

  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={null}>
        <StatusToast />
      </Suspense>

      <AdminPageHeader
        eyebrow="Manage"
        title="Talent"
        description={
          creators.length > 0
            ? `${creators.length} creator${creators.length === 1 ? '' : 's'} · ${published} live · ${drafts} draft${drafts === 1 ? '' : 's'}.`
            : 'Your creator roster lives here.'
        }
        actions={
          <Link
            href="/admin/talent/new"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-[transform,box-shadow] duration-200 ease-smooth hover:shadow-elevated active:scale-[0.98]"
          >
            <Plus
              className="size-4 transition-transform duration-200 ease-smooth group-hover:rotate-90"
              aria-hidden
            />
            New talent
          </Link>
        }
      />

      <TalentTable creators={creators} />
    </div>
  )
}
