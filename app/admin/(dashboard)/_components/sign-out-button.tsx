'use client'

import { useFormStatus } from 'react-dom'
import { LogOut, Loader2 } from 'lucide-react'

import { signout } from '@/app/admin/login/actions'
import { cn } from '@/lib/utils'

function SignOutInner({ className }: { className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Sign out of the admin portal"
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-2 text-sm font-medium text-muted-foreground shadow-card',
        'transition-[transform,background-color,color,box-shadow] duration-200 ease-smooth',
        'hover:bg-muted hover:text-foreground hover:shadow-elevated active:scale-[0.98] disabled:opacity-60',
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <LogOut
          className="size-4 transition-transform duration-200 ease-smooth group-hover:translate-x-0.5"
          aria-hidden
        />
      )}
      <span>{pending ? 'Signing out…' : 'Sign out'}</span>
    </button>
  )
}

/**
 * Sign-out control. Submits the `signout` Server Action (clears the session
 * cookie + redirects to /admin/login). Kept client-side only for the pending
 * state; the action itself is the trust boundary.
 */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signout} className="contents">
      <SignOutInner className={className} />
    </form>
  )
}
