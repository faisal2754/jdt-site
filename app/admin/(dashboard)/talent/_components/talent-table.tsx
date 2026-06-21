'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  ImageOff,
  Plus,
  MapPin,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Creator } from '@/lib/db/schema'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

import {
  deleteCreatorAction,
  reorderCreatorsAction,
  toggleCreatorPublishedAction,
} from '../actions'

const EASE = [0.22, 1, 0.36, 1] as const

interface PendingDelete {
  id: string
  name: string
}

export function TalentTable({ creators }: { creators: Creator[] }) {
  const reduce = useReducedMotion()
  // Local order mirrors the server so reorder feels instant; the action then
  // persists and revalidatePath refreshes the source of truth.
  const [rows, setRows] = useState(creators)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Keep local order in sync when the server sends fresh data (after revalidate).
  const lastServer = useRef(creators)
  useEffect(() => {
    if (lastServer.current !== creators) {
      lastServer.current = creators
      setRows(creators)
    }
  }, [creators])

  function handleToggle(id: string, next: boolean) {
    setBusyId(id)
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, published: next } : r)),
    )
    startTransition(async () => {
      const res = await toggleCreatorPublishedAction(id, next)
      setBusyId(null)
      if (res.ok) {
        toast.success(next ? 'Published' : 'Moved to drafts')
      } else {
        // Roll back optimistic flip.
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, published: !next } : r)),
        )
        toast.error(res.error ?? 'Could not update.')
      }
    })
  }

  function handleMove(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= rows.length) return

    const next = [...rows]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    const prev = rows
    setRows(next)

    startTransition(async () => {
      const res = await reorderCreatorsAction(next.map((r) => r.id))
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
      const res = await deleteCreatorAction(id)
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

  if (rows.length === 0) {
    return (
      <EmptyState />
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4, ease: EASE }}
        className="overflow-hidden rounded-3xl border border-border bg-card/40 shadow-card"
      >
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-14 pl-4 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                Order
              </TableHead>
              <TableHead className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                Talent
              </TableHead>
              <TableHead className="hidden text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground sm:table-cell">
                Category
              </TableHead>
              <TableHead className="hidden text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground md:table-cell">
                Location
              </TableHead>
              <TableHead className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                Published
              </TableHead>
              <TableHead className="pr-4 text-right text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence initial={false}>
              {rows.map((creator, index) => (
                <motion.tr
                  key={creator.id}
                  layout={!reduce}
                  initial={false}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  data-slot="table-row"
                  className="border-b border-border/70 transition-colors duration-150 last:border-0 hover:bg-muted/40"
                >
                  {/* Reorder */}
                  <TableCell className="pl-4">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0 || pending}
                        aria-label={`Move ${creator.name} up`}
                        className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-90 disabled:pointer-events-none disabled:opacity-25"
                      >
                        <ChevronUp className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === rows.length - 1 || pending}
                        aria-label={`Move ${creator.name} down`}
                        className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-90 disabled:pointer-events-none disabled:opacity-25"
                      >
                        <ChevronDown className="size-4" aria-hidden />
                      </button>
                    </div>
                  </TableCell>

                  {/* Identity */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted shadow-card">
                        {creator.imageUrl ? (
                          <Image
                            src={creator.imageUrl}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover grayscale"
                          />
                        ) : (
                          <ImageOff
                            className="size-4 text-muted-foreground"
                            aria-hidden
                          />
                        )}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground">
                          {creator.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          /{creator.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="font-normal">
                      {creator.category}
                    </Badge>
                  </TableCell>

                  {/* Location */}
                  <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden />
                      {creator.location}
                    </span>
                  </TableCell>

                  {/* Published toggle */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={creator.published}
                        onCheckedChange={(v) =>
                          handleToggle(creator.id, Boolean(v))
                        }
                        disabled={busyId === creator.id}
                        aria-label={`Toggle published for ${creator.name}`}
                      />
                      <span
                        className={cn(
                          'text-xs font-medium transition-colors',
                          creator.published
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {busyId === creator.id ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : creator.published ? (
                          'Live'
                        ) : (
                          'Draft'
                        )}
                      </span>
                    </div>
                  </TableCell>

                  {/* Row actions */}
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/talent/${creator.id}/edit`}
                        aria-label={`Edit ${creator.name}`}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-background/60 text-muted-foreground shadow-card transition-[color,background-color,transform,box-shadow] duration-200 ease-smooth hover:bg-muted hover:text-foreground hover:shadow-elevated active:scale-95"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setToDelete({ id: creator.id, name: creator.name })
                        }
                        aria-label={`Delete ${creator.name}`}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-background/60 text-muted-foreground shadow-card transition-[color,background-color,transform,box-shadow] duration-200 ease-smooth hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive active:scale-95"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </motion.div>

      {/* Delete confirmation */}
      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this talent?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `“${toDelete.name}” will be permanently removed from the roster and the public site. This cannot be undone.`
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
    </>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.42, ease: EASE }}
      className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card/30 px-6 py-16 text-center"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground shadow-card">
        <ImageOff className="size-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">No talent yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add your first creator and they’ll appear on the public roster once
          published.
        </p>
      </div>
      <Link
        href="/admin/talent/new"
        className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-[transform,box-shadow] duration-200 ease-smooth hover:shadow-elevated active:scale-[0.98]"
      >
        <Plus className="size-4" aria-hidden />
        New talent
      </Link>
    </motion.div>
  )
}
