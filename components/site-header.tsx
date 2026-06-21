import { getServices } from '@/lib/queries/services'
import { SiteHeaderClient } from '@/components/site-header-client'

// Server wrapper: fetches the service categories for the nav from the DB query
// layer, then renders the interactive client header. Keeping the same
// `SiteHeader` export with no props means every render site stays unchanged.
export async function SiteHeader() {
  const serviceCategories = await getServices()
  return <SiteHeaderClient serviceCategories={serviceCategories} />
}
