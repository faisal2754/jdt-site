import type { Metadata } from 'next'

import { requireSession } from '@/lib/auth/guard'
import { getBrandsForAdmin } from '@/lib/queries/brands'
import { AdminPageHeader } from '@/components/admin/page-header'

import { BrandsList } from './_components/brands-list'

export const metadata: Metadata = {
  title: 'Brands',
}

// Reflect the live DB on every visit — this is a control surface.
export const dynamic = 'force-dynamic'

export default async function BrandsListPage() {
  await requireSession()

  const brands = await getBrandsForAdmin()

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        eyebrow="Manage"
        title="Brands"
        description="The trusted-by logos that scroll across the homepage marquee. Create and edit them inline; a logo is optional."
      />

      <BrandsList brands={brands} />
    </div>
  )
}
