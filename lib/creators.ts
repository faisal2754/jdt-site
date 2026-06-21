// Creator data now lives in the database. This module keeps only the public
// `Creator` row type (re-exported from the Drizzle schema so there is a single
// source of truth) and the discipline filter constant used by the talent UI.
//
// Reads go through `lib/queries/creators.ts` (e.g. `getCreators`,
// `getCreatorBySlug`). The raw roster used for seeding lives in `scripts/seed.ts`.
export type { Creator } from './db/schema'

export const creatorCategories = [
  "All",
  "Streamers",
  "Short Form",
  "Long Form",
  "Videographers",
  "Photographers",
  "Animators",
  "Illustrators",
  "Copywriters",
  "Models",
  "Athletes",
  "Hosts",
] as const
