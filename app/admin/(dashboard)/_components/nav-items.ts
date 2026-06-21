import { Users, FolderKanban, LayoutGrid, BadgeCheck, type LucideIcon } from 'lucide-react'

/**
 * Single source of truth for the admin sidebar destinations.
 *
 * The entity list routes (`/admin/talent`, etc.) land in Phase 8 — the links
 * exist now and will 404 until then, which is expected.
 */
export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Short description shown in the mobile drawer for extra scent of information. */
  blurb: string
}

export const adminNavItems: AdminNavItem[] = [
  { label: 'Talent', href: '/admin/talent', icon: Users, blurb: 'Creators & roster' },
  { label: 'Projects', href: '/admin/projects', icon: FolderKanban, blurb: 'Portfolio work' },
  { label: 'Services', href: '/admin/services', icon: LayoutGrid, blurb: 'Service categories' },
  { label: 'Brands', href: '/admin/brands', icon: BadgeCheck, blurb: 'Trusted-by logos' },
]
