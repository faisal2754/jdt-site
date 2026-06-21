import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session'

/**
 * Defense-in-depth session guard.
 *
 * Call at the top of every admin Server Component AND every admin Server Action
 * (mutations must never trust the middleware alone). Reads the `jdt_admin`
 * cookie, verifies its signature + expiry, and redirects to the login page if
 * it is missing or invalid.
 *
 * `cookies()` is async in Next 16.
 */
export async function requireSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!(await verifySessionToken(token))) {
    redirect('/admin/login')
  }
}
