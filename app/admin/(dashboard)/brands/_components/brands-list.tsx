'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Plus,
  BadgeCheck,
} from 'lucide-react'

import type { Brand } from '@/lib/db/schema'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { deleteBrandAction, reorderBrandsAction } from '../actions'
import { BrandDialog } from './brand-dialog'

const EASE = [0.22, 1, 0.36, 1] as const

interface PendingDelete {
  id: string
  name: string
}

export function BrandsList({ brands }: { brands: Brand[] }) {
  const reduce = useReducedMotion()
  // Local order mirrors the server so reorder feels instant; the action then
  // persists and revalidatePath refreshes the source of truth.
  const [rows, setRows] = useState(brands)
  const [pending, startTransition] = useTransition()
  const [toDelete, setToDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Dialog state: `null` = closed, `'create'` = new, otherwise the brand to edit.
  const [editing, setEditing] = useState<Brand | null>(null)
  const [creating, setCreating] = useState(false)

  // Keep local order in sync when the server sends fresh data (after revalidate).
  const lastServer = useRef(brands)
  useEffect(() => {
    if (lastServer.current !== brands) {
      lastServer.current = brands
      setRows(brands)
    }
  }, [brands])

  const nextSortOrder =
    rows.length > 0 ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0

  function handleMove(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= rows.length) return

    const next = [...rows]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    const prev = rows
    setRows(next)

    startTransition(async () => {
      const res = await reorderBrandsAction(next.map((r) => r.id))
      if (!res.ok) {
        setRows(prev)
        toast.error(res.error ?? 'Could not reorder.')
      }
    })
  }

  function confirmDelete() {
    if (!toDelete) return
    const { id, name } = toDelete
    setDeleting(true)
    startTransition(async () => {
      const res = await deleteBrandAction(id)
      setDeleting(false)
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id))
        setToDelete(null)
        toast.success(`Deleted ${name}`)
      } else {
        toast.error(res.error ?? 'Could not delete.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {rows.length} brand{rows.length === 1 ? '' : 's'} in the marquee.
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-[transform,box-shadow] duration-200 ease-smooth hover:shadow-elevated active:scale-[0.98]"
        >
          <Plus
            className="size-4 transition-transform duration-200 ease-smooth group-hover:rotate-90"
            aria-hidden
          />
          New brand
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <motion.ul
          initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, ease: EASE }}
          className="flex flex-col gap-2 rounded-3xl border border-border bg-card/40 p-2 shadow-card"
        >
          <AnimatePresence initial={false}>
            {rows.map((brand, index) => (
              <motion.li
                key={brand.id}
                layout={!reduce}
                initial={false}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: EASE }}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/50 p-2.5 shadow-card transition-colors duration-150 hover:bg-muted/40"
              >
                {/* Reorder */}
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0 || pending}
                    aria-label={`Move ${brand.name} up`}
                    className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-90 disabled:pointer-events-none disabled:opacity-25"
                  >
                    <ChevronUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={index === rows.length - 1 || pending}
                    aria-label={`Move ${brand.name} down`}
                    className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-90 disabled:pointer-events-none disabled:opacity-25"
                  >
                    <ChevronDown className="size-4" aria-hidden />
                  </button>
                </div>

                {/* Logo / fallback */}
                <span className="relative grid h-11 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted shadow-card">
                  {brand.logoUrl ? (
                    <Image
                      src={brand.logoUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-contain p-1.5"
                    />
                  ) : (
                    <BadgeCheck
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                </span>

                {/* Name */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-foreground">
                    {brand.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {brand.logoUrl ? 'Logo set' : 'Name only'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(brand)}
                    aria-label={`Edit ${brand.name}`}
                    className="grid size-8 place-items-center rounded-lg border border-border bg-background/60 text-muted-foreground shadow-card transition-[color,background-color,transform,box-shadow] duration-200 ease-smooth hover:bg-muted hover:text-foreground hover:shadow-elevated active:scale-95"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setToDelete({ id: brand.id, name: brand.name })
                    }
                    aria-label={`Delete ${brand.name}`}
                    className="grid size-8 place-items-center rounded-lg border border-border bg-background/60 text-muted-foreground shadow-card transition-[color,background-color,transform,box-shadow] duration-200 ease-smooth hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive active:scale-95"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {/* Create dialog */}
      <BrandDialog
        open={creating}
        onOpenChange={setCreating}
        defaultSortOrder={nextSortOrder}
        onSaved={() => setCreating(false)}
      />

      {/* Edit dialog */}
      <BrandDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        brand={editing ?? undefined}
        onSaved={() => setEditing(null)}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this brand?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `“${toDelete.name}” will be removed from the homepage marquee. This cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.42, ease: EASE }}
      className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card/30 px-6 py-16 text-center"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground shadow-card">
        <BadgeCheck className="size-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">No brands yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add a trusted-by brand and it’ll scroll in the homepage marquee.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-[transform,box-shadow] duration-200 ease-smooth hover:shadow-elevated active:scale-[0.98]"
      >
        <Plus className="size-4" aria-hidden />
        New brand
      </button>
    </motion.div>
  )
}
