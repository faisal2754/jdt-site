import { revalidateTag, unstable_cache } from 'next/cache'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  serviceCategories,
  type ServiceCategory,
  type NewServiceCategory,
} from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Cache tags
//
// NOTE: `service_categories` has no `published` column, so public reads return
// every row ordered by `sortOrder`.
// ---------------------------------------------------------------------------

const ENTITY_TAG = 'services'
const slugTag = (slug: string) => `service:${slug}`

// ---------------------------------------------------------------------------
// Public reads (cached + tagged)
// ---------------------------------------------------------------------------

/** All service categories, ordered by `sortOrder`. */
export const getServices = unstable_cache(
  async (): Promise<ServiceCategory[]> =>
    db.select().from(serviceCategories).orderBy(asc(serviceCategories.sortOrder)),
  ['services:list'],
  { tags: [ENTITY_TAG] },
)

export const getServiceBySlug = (
  slug: string,
): Promise<ServiceCategory | undefined> =>
  unstable_cache(
    async () => {
      const [row] = await db
        .select()
        .from(serviceCategories)
        .where(eq(serviceCategories.slug, slug))
        .limit(1)
      return row
    },
    ['services:by-slug', slug],
    { tags: [ENTITY_TAG, slugTag(slug)] },
  )()

/** Back-compat alias for the original public-site helper name. */
export const getCategoryBySlug = getServiceBySlug

// ---------------------------------------------------------------------------
// Admin read (uncached direct DB read — reflects writes immediately)
//
// No `published` column here, so this is the same query as the public read but
// uncached for an immediate-consistency admin API.
// ---------------------------------------------------------------------------

export async function getServicesForAdmin(): Promise<ServiceCategory[]> {
  return db
    .select()
    .from(serviceCategories)
    .orderBy(asc(serviceCategories.sortOrder))
}

/** A single service category by id for the admin edit form. Uncached direct DB read. */
export async function getServiceByIdForAdmin(
  id: string,
): Promise<ServiceCategory | undefined> {
  const [row] = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.id, id))
    .limit(1)
  return row
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createService(
  data: NewServiceCategory,
): Promise<ServiceCategory> {
  const [row] = await db.insert(serviceCategories).values(data).returning()
  revalidateTag(ENTITY_TAG, 'max')
  revalidateTag(slugTag(row.slug), 'max')
  return row
}

export async function updateService(
  id: string,
  data: Partial<NewServiceCategory>,
): Promise<ServiceCategory> {
  const [row] = await db
    .update(serviceCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(serviceCategories.id, id))
    .returning()
  revalidateTag(ENTITY_TAG, 'max')
  revalidateTag(slugTag(row.slug), 'max')
  return row
}

export async function deleteService(id: string): Promise<void> {
  const [row] = await db
    .delete(serviceCategories)
    .where(eq(serviceCategories.id, id))
    .returning({ slug: serviceCategories.slug })
  revalidateTag(ENTITY_TAG, 'max')
  if (row) revalidateTag(slugTag(row.slug), 'max')
}

/** Apply a new ordering. Accepts ids in display order. */
export async function reorderServices(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(serviceCategories)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(serviceCategories.id, id)),
    ),
  )
  revalidateTag(ENTITY_TAG, 'max')
}
