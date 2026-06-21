'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Eye, EyeOff, Loader2, Lock, ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'

import { login, type LoginState } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'group mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-card',
        'transition-[transform,box-shadow,opacity] duration-200 ease-smooth',
        'hover:shadow-elevated active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Signing in…
        </>
      ) : (
        <>
          Sign in
          <ArrowRight className="size-4 -translate-x-0.5 transition-transform duration-200 ease-smooth group-hover:translate-x-0" aria-hidden />
        </>
      )}
    </button>
  )
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {})
  const [show, setShow] = useState(false)

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-4 text-left">
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-2">
        <label
          htmlFor="admin-password"
          className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
        >
          Password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="admin-password"
            type={show ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            autoFocus
            required
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? 'login-error' : undefined}
            className={cn(
              'h-11 w-full rounded-xl border border-input bg-background/60 pl-10 pr-11 text-base text-foreground shadow-card outline-none',
              'transition-[border-color,box-shadow] duration-200 ease-smooth placeholder:text-muted-foreground/60',
              'focus-visible:border-silver focus-visible:ring-2 focus-visible:ring-silver/40',
              state.error && 'border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/30',
            )}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground active:scale-95"
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      {state.error ? (
        <p
          id="login-error"
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  )
}
