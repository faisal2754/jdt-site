import type { Metadata } from 'next'
import Link from 'next/link'

import { site } from '@/lib/site'

import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
}

/**
 * Same-origin admin-path sanitizer for the `?next=` target (open-redirect
 * protection). Mirrors `safeNext` in the login action so the value rendered
 * into the form is already safe; the action re-validates as the trust boundary.
 */
function safeNext(next: string | undefined): string {
  const fallback = '/admin'
  if (!next) return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return fallback
  }
  if (next !== '/admin' && !next.startsWith('/admin/')) return fallback
  if (next === '/admin/login' || next.startsWith('/admin/login')) return fallback
  return next
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const params = await searchParams
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next
  const next = safeNext(rawNext)

  return (
    <main
      id="main"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 py-16"
    >
      {/* Ambient depth: a soft radial glow + faint hairline grid, no flat fill. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_50%_0%,oklch(0.22_0_0/0.6),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]"
      />

      <div className="relative w-full max-w-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <div className="flex flex-col items-center text-center">
          {/* Brand mark — mirrors the console wordmark. */}
          <Link
            href="/"
            className="group grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elevated transition-transform duration-200 ease-smooth active:scale-[0.97]"
            aria-label={`${site.name} home`}
          >
            <span className="font-serif text-xl italic leading-none">J</span>
          </Link>
          <p className="mt-5 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {site.name} · Studio Console
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Enter the admin password to manage the live site.
          </p>
        </div>

        {/* Card surface holding the form. */}
        <div className="mt-7 rounded-3xl border border-border bg-card/70 p-6 shadow-elevated backdrop-blur-sm sm:p-7">
          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link
            href="/"
            className="underline-offset-4 transition-colors duration-200 hover:text-foreground hover:underline"
          >
            ← Back to {site.name}
          </Link>
        </p>
      </div>
    </main>
  )
}
