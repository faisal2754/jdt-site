import type { Metadata } from 'next'

import { requireSession } from '@/lib/auth/guard'
import { Toaster } from '@/components/ui/sonner'

import { AdminSidebar } from './_components/admin-sidebar'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · JDT Admin' },
  robots: { index: false, follow: false },
}

/**
 * Authenticated admin shell.
 *
 * This layout lives in the `(dashboard)` route group, so it wraps `/admin` and
 * every future entity route (`/admin/talent`, …) but NOT `/admin/login`, which
 * sits outside the group and therefore renders with no sidebar chrome.
 *
 * `requireSession()` runs first as defense-in-depth (the middleware already
 * gates `/admin/*`); unauthenticated requests are redirected to the login page.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSession()

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" className="flex-1 px-5 pb-16 pt-20 sm:px-8 lg:px-10 lg:pt-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}
