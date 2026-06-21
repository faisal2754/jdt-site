import { revalidateTag, unstable_cache } from 'next/cache'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { brands, type Brand, type NewBrand } from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Cache tags
//
// NOTE: `brands` has no `published` column and no slug, so public reads return
// every row ordered by `sortOrder` and there is no per-slug tag.
// ---------------------------------------------------------------------------

const ENTITY_TAG = 'brands'

// ---------------------------------------------------------------------------
// Public read (cached + tagged)
// ---------------------------------------------------------------------------

/** All brands, ordered by `sortOrder`. */
export const getBrands = unstable_cache(
  async (): Promise<Brand[]> =>
    db.select().from(brands).orderBy(asc(brands.sortOrder)),
  ['brands:list'],
  { tags: [ENTITY_TAG] },
)

// ---------------------------------------------------------------------------
// Admin read (uncached direct DB read — reflects writes immediately)
//
// No `published` column, so this matches the public read but uncached.
// ---------------------------------------------------------------------------

export async function getBrandsForAdmin(): Promise<Brand[]> {
  return db.select().from(brands).orderBy(asc(brands.sortOrder))
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createBrand(data: NewBrand): Promise<Brand> {
  const [row] = await db.insert(brands).values(data).returning()
  revalidateTag(ENTITY_TAG, 'max')
  return row
}

export async function updateBrand(
  id: string,
  data: Partial<NewBrand>,
): Promise<Brand> {
  const [row] = await db
    .update(brands)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(brands.id, id))
    .returning()
  revalidateTag(ENTITY_TAG, 'max')
  return row
}

export async function deleteBrand(id: string): Promise<void> {
  await db.delete(brands).where(eq(brands.id, id))
  revalidateTag(ENTITY_TAG, 'max')
}

/** Apply a new ordering. Accepts ids in display order. */
export async function reorderBrands(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(brands)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(brands.id, id)),
    ),
  )
  revalidateTag(ENTITY_TAG, 'max')
}
