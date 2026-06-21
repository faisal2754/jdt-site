import { NextResponse, type NextRequest } from 'next/server'

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session'

/**
 * Admin auth gate.
 *
 * Runs on every `/admin/*` request. `/admin/login` (and its Server Action POST)
 * is always allowed through unauthenticated; everything else requires a valid
 * `jdt_admin` session cookie, else we redirect to the login page with a
 * sanitized `?next=` so the user returns where they were headed.
 *
 * Verification uses the Web Crypto HMAC in `lib/auth/session.ts`, so it runs in
 * the proxy runtime. `requireSession()` repeats this check inside admin
 * Server Components/Actions as defense in depth.
 *
 * Next 16 renamed `middleware.ts` → `proxy.ts` (exported `proxy` function); the
 * matcher + verify behavior is unchanged.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow the login page and its form submission through unauthenticated.
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (await verifySessionToken(token)) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/admin/login', request.url)
  // Preserve the intended destination; the login page/action re-validate it.
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
