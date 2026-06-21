'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { verifyPassword } from '@/lib/auth/password'
import {
  createSessionToken,
  DEFAULT_SESSION_TTL_SECONDS,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '@/lib/auth/session'

/** Fixed delay (ms) applied to failed logins to blunt brute-forcing. */
const FAILED_LOGIN_DELAY_MS = 500

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Sanitize a `?next=` redirect target. Only same-origin admin paths are
 * allowed, to prevent open-redirect abuse. Anything else falls back to
 * `/admin`.
 *
 * Accepts only values that:
 *   - start with a single `/admin` segment (`/admin` or `/admin/...`)
 *   - do NOT start with `//` or `/\` (protocol-relative URL smuggling)
 *   - do NOT route back to the login page itself (would loop)
 */
function safeNext(next: string | null | undefined): string {
  const fallback = '/admin'
  if (!next) return fallback
  // Reject protocol-relative and backslash-smuggled targets.
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return fallback
  }
  // Must be the admin area, but not the login page (avoid redirect loops).
  if (next !== '/admin' && !next.startsWith('/admin/')) return fallback
  if (next === '/admin/login' || next.startsWith('/admin/login')) return fallback
  return next
}

export interface LoginState {
  error?: string
}

/**
 * Login Server Action (Node runtime).
 *
 * On success: constant-time plaintext compare against `ADMIN_PASSWORD`, set the
 * signed `jdt_admin` cookie, then redirect to a sanitized `next` target.
 * On failure: a GENERIC message after a fixed delay; no cookie is set.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get('password')
  const next = safeNext(
    typeof formData.get('next') === 'string'
      ? (formData.get('next') as string)
      : null,
  )

  if (typeof password !== 'string' || !verifyPassword(password)) {
    // Fixed delay regardless of why it failed — reveal nothing specific.
    await delay(FAILED_LOGIN_DELAY_MS)
    return { error: 'Incorrect password' }
  }

  const token = await createSessionToken(DEFAULT_SESSION_TTL_SECONDS)
  const cookieStore = await cookies()
  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    sessionCookieOptions(DEFAULT_SESSION_TTL_SECONDS),
  )

  redirect(next)
}

/**
 * Signout Server Action: clear the session cookie and return to login.
 */
export async function signout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  redirect('/admin/login')
}
