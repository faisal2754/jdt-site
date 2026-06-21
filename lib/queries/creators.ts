import { revalidateTag, unstable_cache } from 'next/cache'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  creators,
  type Creator,
  type NewCreator,
} from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Cache tags
// ---------------------------------------------------------------------------

const ENTITY_TAG = 'creators'
const slugTag = (slug: string) => `creator:${slug}`

// ---------------------------------------------------------------------------
// Public reads (cached + tagged)
// ---------------------------------------------------------------------------

/** Published creators, ordered by `sortOrder`. */
export const getCreators = unstable_cache(
  async (): Promise<Creator[]> =>
    db
      .select()
      .from(creators)
      .where(eq(creators.published, true))
      .orderBy(asc(creators.sortOrder)),
  ['creators:list'],
  { tags: [ENTITY_TAG] },
)

/** A single creator by slug (published or not — detail pages may preview). */
export const getCreatorBySlug = (slug: string): Promise<Creator | undefined> =>
  unstable_cache(
    async () => {
      const [row] = await db
        .select()
        .from(creators)
        .where(eq(creators.slug, slug))
        .limit(1)
      return row
    },
    ['creators:by-slug', slug],
    { tags: [ENTITY_TAG, slugTag(slug)] },
  )()

// ---------------------------------------------------------------------------
// Admin read (uncached direct DB read — reflects writes immediately)
// ---------------------------------------------------------------------------

/** Every creator (published or not), ordered by `sortOrder`. Not cached. */
export async function getCreatorsForAdmin(): Promise<Creator[]> {
  return db.select().from(creators).orderBy(asc(creators.sortOrder))
}

/** A single creator by id for the admin edit form. Uncached direct DB read. */
export async function getCreatorByIdForAdmin(
  id: string,
): Promise<Creator | undefined> {
  const [row] = await db
    .select()
    .from(creators)
    .where(eq(creators.id, id))
    .limit(1)
  return row
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createCreator(data: NewCreator): Promise<Creator> {
  const [row] = await db.insert(creators).values(data).returning()
  revalidateTag(ENTITY_TAG, 'max')
  revalidateTag(slugTag(row.slug), 'max')
  return row
}

export async function updateCreator(
  id: string,
  data: Partial<NewCreator>,
): Promise<Creator> {
  const [row] = await db
    .update(creators)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(creators.id, id))
    .returning()
  revalidateTag(ENTITY_TAG, 'max')
  revalidateTag(slugTag(row.slug), 'max')
  return row
}

export async function deleteCreator(id: string): Promise<void> {
  const [row] = await db
    .delete(creators)
    .where(eq(creators.id, id))
    .returning({ slug: creators.slug })
  revalidateTag(ENTITY_TAG, 'max')
  if (row) revalidateTag(slugTag(row.slug), 'max')
}

export async function togglePublishedCreator(
  id: string,
  published: boolean,
): Promise<Creator> {
  const [row] = await db
    .update(creators)
    .set({ published, updatedAt: new Date() })
    .where(eq(creators.id, id))
    .returning()
  revalidateTag(ENTITY_TAG, 'max')
  revalidateTag(slugTag(row.slug), 'max')
  return row
}

/** Apply a new ordering. Accepts ids in display order. */
export async function reorderCreators(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(creators)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(creators.id, id)),
    ),
  )
  revalidateTag(ENTITY_TAG, 'max')
}
