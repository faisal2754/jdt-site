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
  Star,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Project } from '@/lib/db/schema'
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
  deleteProjectAction,
  reorderProjectsAction,
  toggleProjectPublishedAction,
  toggleProjectFeaturedAction,
} from '../actions'

const EASE = [0.22, 1, 0.36, 1] as const

interface PendingDelete {
  id: string
  title: string
}

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const reduce = useReducedMotion()
  // Local order mirrors the server so reorder feels instant; the action then
  // persists and revalidatePath refreshes the source of truth.
  const [rows, setRows] = useState(projects)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [featBusyId, setFeatBusyId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<PendingDelete | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Keep local order in sync when the server sends fresh data (after revalidate).
  const lastServer = useRef(projects)
  useEffect(() => {
    if (lastServer.current !== projects) {
      lastServer.current = projects
      setRows(projects)
    }
  }, [projects])

  function handleTogglePublished(id: string, next: boolean) {
    setBusyId(id)
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, published: next } : r)),
    )
    startTransition(async () => {
      const res = await toggleProjectPublishedAction(id, next)
      setBusyId(null)
      if (res.ok) {
        toast.success(next ? 'Published' : 'Moved to drafts')
      } else {
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, published: !next } : r)),
        )
        toast.error(res.error ?? 'Could not update.')
      }
    })
  }

  function handleToggleFeatured(id: string, next: boolean) {
    setFeatBusyId(id)
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, featured: next } : r)),
    )
    startTransition(async () => {
      const res = await toggleProjectFeaturedAction(id, next)
      setFeatBusyId(null)
      if (res.ok) {
        toast.success(next ? 'Featured on homepage' : 'Removed from featured')
      } else {
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, featured: !next } : r)),
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
      const res = await reorderProjectsAction(next.map((r) => r.id))
      if (!res.ok) {
        setRows(prev)
        toast.error(res.error ?? 'Could not reorder.')
      }
    })
  }

  function confirmDelete() {
    if (!toDelete) return
    const { id, title } = toDelete
    setDeleting(true)
    startTransition(async () => {
      const res = await deleteProjectAction(id)
      setDeleting(false)
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id))
        setToDelete(null)
        toast.success(`Deleted ${title}`)
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
                Project
              </TableHead>
              <TableHead className="hidden text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground lg:table-cell">
                Client
              </TableHead>
              <TableHead className="hidden text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground sm:table-cell">
                Category
              </TableHead>
              <TableHead className="hidden text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground xl:table-cell">
                Industry
              </TableHead>
              <TableHead className="hidden text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground md:table-cell">
                Year
              </TableHead>
              <TableHead className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                Featured
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
              {rows.map((project, index) => (
                <motion.tr
                  key={project.id}
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
                        aria-label={`Move ${project.title} up`}
                        className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-90 disabled:pointer-events-none disabled:opacity-25"
                      >
                        <ChevronUp className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === rows.length - 1 || pending}
                        aria-label={`Move ${project.title} down`}
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
                        {project.imageUrl ? (
                          <Image
                            src={project.imageUrl}
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
                          {project.title}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          /{project.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Client */}
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {project.client}
                    </span>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="font-normal">
                      {project.category}
                    </Badge>
                  </TableCell>

                  {/* Industry */}
                  <TableCell className="hidden xl:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {project.industry}
                    </span>
                  </TableCell>

                  {/* Year */}
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {project.year}
                    </span>
                  </TableCell>

                  {/* Featured toggle */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={project.featured}
                        onCheckedChange={(v) =>
                          handleToggleFeatured(project.id, Boolean(v))
                        }
                        disabled={featBusyId === project.id}
                        aria-label={`Toggle featured for ${project.title}`}
                      />
                      <span
                        className={cn(
                          'inline-flex items-center text-xs font-medium transition-colors',
                          project.featured
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {featBusyId === project.id ? (
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden
                          />
                        ) : project.featured ? (
                          <Star
                            className="size-3.5 fill-current"
                            aria-hidden
                          />
                        ) : (
                          <Star className="size-3.5" aria-hidden />
                        )}
                      </span>
                    </div>
                  </TableCell>

                  {/* Published toggle */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={project.published}
                        onCheckedChange={(v) =>
                          handleTogglePublished(project.id, Boolean(v))
                        }
                        disabled={busyId === project.id}
                        aria-label={`Toggle published for ${project.title}`}
                      />
                      <span
                        className={cn(
                          'text-xs font-medium transition-colors',
                          project.published
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {busyId === project.id ? (
                          <Loader2
                            className="size-3.5 animate-spin"
                            aria-hidden
                          />
                        ) : project.published ? (
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
                        href={`/admin/projects/${project.id}/edit`}
                        aria-label={`Edit ${project.title}`}
                        className="grid size-8 place-items-center rounded-lg border border-border bg-background/60 text-muted-foreground shadow-card transition-[color,background-color,transform,box-shadow] duration-200 ease-smooth hover:bg-muted hover:text-foreground hover:shadow-elevated active:scale-95"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setToDelete({ id: project.id, title: project.title })
                        }
                        aria-label={`Delete ${project.title}`}
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
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `“${toDelete.title}” will be permanently removed from the portfolio and the public site. This cannot be undone.`
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
        <h2 className="text-lg font-semibold text-foreground">No projects yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add your first project and it’ll appear on the public work grid once
          published.
        </p>
      </div>
      <Link
        href="/admin/projects/new"
        className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-[transform,box-shadow] duration-200 ease-smooth hover:shadow-elevated active:scale-[0.98]"
      >
        <Plus className="size-4" aria-hidden />
        New project
      </Link>
    </motion.div>
  )
}
