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
  LayoutGrid,
} from 'lucide-react'

import type { ServiceCategory } from '@/lib/db/schema'
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

import { deleteServiceAction, reorderServicesAction } from '../actions'

const EASE = [0.22, 1, 0.36, 1] as const

interface PendingDelete {
  id: string
  label: string
}

export function ServicesTable({
  services,
}: {
  services: ServiceCategory[]
}) {
  const reduce = useReducedMotion()
  // Local order mirrors the server so reorder feels instant; the action then
  // persists and revalidatePath refreshes the source of truth.
  const [rows, setRows] = useState(services)
  const [pending, startTransition] = useTransition()
  const [toDelete, setToDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Keep local order in sync when the server sends fresh data (after revalidate).
  const lastServer = useRef(services)
  useEffect(() => {
    if (lastServer.current !== services) {
      lastServer.current = services
      setRows(services)
    }
  }, [services])

  function handleMove(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= rows.length) return

    const next = [...rows]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    const prev = rows
    setRows(next)

    startTransition(async () => {
      const res = await reorderServicesAction(next.map((r) => r.id))
      if (!res.ok) {
        setRows(prev)
        toast.error(res.error ?? 'Could not reorder.')
      }
    })
  }

  function confirmDelete() {
    if (!toDelete) return
    const { id, label } = toDelete
    setDeleting(true)
    startTransition(async () => {
      const res = await deleteServiceAction(id)
      setDeleting(false)
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id))
        setToDelete(null)
        toast.success(`Deleted ${label}`)
      } else {
        toast.error(res.error ?? 'Could not delete.')
      }
    })
  }

  if (rows.length === 0) {
    return <EmptyState />
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
                Service
              </TableHead>
              <TableHead className="hidden text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground lg:table-cell">
                Tagline
              </TableHead>
              <TableHead className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                Items
              </TableHead>
              <TableHead className="pr-4 text-right text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence initial={false}>
              {rows.map((service, index) => (
                <motion.tr
                  key={service.id}
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
                        aria-label={`Move ${service.label} up`}
                        className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-90 disabled:pointer-events-none disabled:opacity-25"
                      >
                        <ChevronUp className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === rows.length - 1 || pending}
                        aria-label={`Move ${service.label} down`}
                        className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-90 disabled:pointer-events-none disabled:opacity-25"
                      >
                        <ChevronDown className="size-4" aria-hidden />
                      </button>
                    </div>
                  </TableCell>

                  {/* Identity */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="relative grid h-11 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted shadow-card">
                        {service.imageUrl ? (
                          <Image
                            src={service.imageUrl}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
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
                          {service.label}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          /{service.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Tagline */}
                  <TableCell className="hidden max-w-xs lg:table-cell">
                    <span className="line-clamp-1 text-sm text-muted-foreground">
                      {service.tagline}
                    </span>
                  </TableCell>

                  {/* Item count */}
                  <TableCell>
                    <Badge variant="outline" className="font-normal tabular-nums">
                      {service.services.length} item
                      {service.services.length === 1 ? '' : 's'}
                    </Badge>
                  </TableCell>

                  {/* Row actions */}
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/services/${service.id}/edit`}
                        aria-label={`Edit ${service.label}`}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-background/60 text-muted-foreground shadow-card transition-[color,background-color,transform,box-shadow] duration-200 ease-smooth hover:bg-muted hover:text-foreground hover:shadow-elevated active:scale-95"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setToDelete({ id: service.id, label: service.label })
                        }
                        aria-label={`Delete ${service.label}`}
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
            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `“${toDelete.label}” and its service items will be permanently removed, including the public /services/${toDelete.label} page. This cannot be undone.`
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
        <LayoutGrid className="size-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          No services yet
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add your first service category and it’ll get its own public page.
        </p>
      </div>
      <Link
        href="/admin/services/new"
        className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-[transform,box-shadow] duration-200 ease-smooth hover:shadow-elevated active:scale-[0.98]"
      >
        <Plus className="size-4" aria-hidden />
        New service
      </Link>
    </motion.div>
  )
}
