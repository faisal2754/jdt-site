// Service data now lives in the database. This module keeps only the public
// `ServiceCategory` row type (re-exported from the Drizzle schema so there is a
// single source of truth). Reads go through `lib/queries/services.ts` (e.g.
// `getServices`, `getServiceBySlug` / `getCategoryBySlug`). The raw service and
// brand data used for seeding lives in `scripts/seed.ts`.
export type { ServiceCategory } from './db/schema'
