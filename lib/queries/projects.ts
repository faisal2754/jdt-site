import { revalidateTag, unstable_cache } from 'next/cache'
import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  projects,
  type Project,
  type NewProject,
} from '@/lib/db/schema'

// ---------------------------------------------------------------------------
// Cache tags
// ---------------------------------------------------------------------------

const ENTITY_TAG = 'projects'
const slugTag = (slug: string) => `project:${slug}`

// ---------------------------------------------------------------------------
// Public reads (cached + tagged)
// ---------------------------------------------------------------------------

/** Published projects, ordered by `sortOrder`. */
export const getProjects = unstable_cache(
  async (): Promise<Project[]> =>
    db
      .select()
      .from(projects)
      .where(eq(projects.published, true))
      .orderBy(asc(projects.sortOrder)),
  ['projects:list'],
  { tags: [ENTITY_TAG] },
)

/**
 * Featured published projects. If fewer than 3 are flagged `featured`, fall
 * back to the first 3 published projects by `sortOrder`.
 */
export const getFeaturedProjects = unstable_cache(
  async (): Promise<Project[]> => {
    const featured = await db
      .select()
      .from(projects)
      .where(and(eq(projects.published, true), eq(projects.featured, true)))
      .orderBy(asc(projects.sortOrder))

    if (featured.length >= 3) return featured

    return db
      .select()
      .from(projects)
      .where(eq(projects.published, true))
      .orderBy(asc(projects.sortOrder))
      .limit(3)
  },
  ['projects:featured'],
  { tags: [ENTITY_TAG] },
)

export const getProjectBySlug = (slug: string): Promise<Project | undefined> =>
  unstable_cache(
    async () => {
      const [row] = await db
        .select()
        .from(projects)
        .where(eq(projects.slug, slug))
        .limit(1)
      return row
    },
    ['projects:by-slug', slug],
    { tags: [ENTITY_TAG, slugTag(slug)] },
  )()

// ---------------------------------------------------------------------------
// Admin read (uncached direct DB read — reflects writes immediately)
// ---------------------------------------------------------------------------

/** Every project (published or not), ordered by `sortOrder`. Not cached. */
export async function getProjectsForAdmin(): Promise<Project[]> {
  return db.select().from(projects).orderBy(asc(projects.sortOrder))
}

/** A single project by id for the admin edit form. Uncached direct DB read. */
export async function getProjectByIdForAdmin(
  id: string,
): Promise<Project | undefined> {
  const [row] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1)
  return row
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createProject(data: NewProject): Promise<Project> {
  const [row] = await db.insert(projects).values(data).returning()
  revalidateTag(ENTITY_TAG, 'max')
  revalidateTag(slugTag(row.slug), 'max')
  return row
}

export async function updateProject(
  id: string,
  data: Partial<NewProject>,
): Promise<Project> {
  const [row] = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning()
  revalidateTag(ENTITY_TAG, 'max')
  revalidateTag(slugTag(row.slug), 'max')
  return row
}

export async function deleteProject(id: string): Promise<void> {
  const [row] = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning({ slug: projects.slug })
  revalidateTag(ENTITY_TAG, 'max')
  if (row) revalidateTag(slugTag(row.slug), 'max')
}

export async function togglePublishedProject(
  id: string,
  published: boolean,
): Promise<Project> {
  const [row] = await db
    .update(projects)
    .set({ published, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning()
  revalidateTag(ENTITY_TAG, 'max')
  revalidateTag(slugTag(row.slug), 'max')
  return row
}

/** Apply a new ordering. Accepts ids in display order. */
export async function reorderProjects(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(projects)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(projects.id, id)),
    ),
  )
  revalidateTag(ENTITY_TAG, 'max')
}
