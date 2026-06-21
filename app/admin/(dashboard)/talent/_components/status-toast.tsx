'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

const MESSAGES: Record<string, string> = {
  created: 'Talent created',
  updated: 'Changes saved',
}

/**
 * Fires a success toast after a create/update redirect (`?status=...`) then
 * strips the query param so a refresh doesn't replay it. Renders nothing.
 */
export function StatusToast() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const fired = useRef(false)

  useEffect(() => {
    const status = params.get('status')
    if (!status || fired.current) return
    const message = MESSAGES[status]
    if (message) {
      fired.current = true
      toast.success(message)
      router.replace(pathname, { scroll: false })
    }
  }, [params, router, pathname])

  return null
}
