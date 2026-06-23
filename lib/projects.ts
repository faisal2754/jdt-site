// Project data now lives in the database. This module keeps only the public
// `Project` row type (re-exported from the Drizzle schema so there is a single
// source of truth) plus the category union/constant used by the work filters
// and validation. Reads go through `lib/queries/projects.ts` (e.g. `getProjects`,
// `getFeaturedProjects`, `getProjectBySlug`). The raw portfolio used for seeding
// lives in `scripts/seed.ts`.
export type { Project } from './db/schema'

export type ProjectCategory = "Printing & Design" | "Influencer Marketing" | "Software Development"

export const projectCategories: ProjectCategory[] = [
  "Printing & Design",
  "Influencer Marketing",
  "Software Development",
]
