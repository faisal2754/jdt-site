// Service data now lives in the database. This module keeps only the public
// `ServiceCategory` row type (re-exported from the Drizzle schema so there is a
// single source of truth). Reads go through `lib/queries/services.ts` (e.g.
// `getServices`, `getServiceBySlug` / `getCategoryBySlug`). The raw service and
// brand data used for seeding lives in `scripts/seed.ts`.
export type { ServiceCategory, ServiceItem, ServiceAudience } from './db/schema'

import type { ServiceAudience, ServiceItem } from './db/schema'

/**
 * Ordered audience columns. The `title` is the noun rendered after "For …" on
 * the public site (e.g. "For Brands"). The order here is the column order.
 */
export const SERVICE_AUDIENCES = [
  { key: 'brands', title: 'Brands' },
  { key: 'influencers', title: 'Influencers' },
] as const satisfies readonly { key: ServiceAudience; title: string }[]

export type ServiceAudienceGroup = {
  key: ServiceAudience
  title: string
  items: ServiceItem[]
}

/**
 * Split a category's service items into "For Brands" / "For Influencers"
 * columns.
 *
 * Returns the ordered, non-empty groups only when *every* item carries an
 * `audience` tag; otherwise returns `null` so callers fall back to the existing
 * flat single-list layout. Requiring all-or-nothing means a partially-tagged
 * category can never silently drop its untagged items.
 */
export function groupServicesByAudience(
  services: ServiceItem[],
): ServiceAudienceGroup[] | null {
  if (services.length === 0 || !services.every((s) => s.audience)) return null
  return SERVICE_AUDIENCES.map(({ key, title }) => ({
    key,
    title,
    items: services.filter((s) => s.audience === key),
  })).filter((group) => group.items.length > 0)
}
