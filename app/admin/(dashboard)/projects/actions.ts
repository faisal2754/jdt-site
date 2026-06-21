'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireSession } from '@/lib/auth/guard'
import {
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  togglePublishedProject,
} from '@/lib/queries/projects'
import {
  projectCreateSchema,
  projectUpdateSchema,
} from '@/lib/validation/projects'

// ---------------------------------------------------------------------------
// Shared form-state contract (consumed by ProjectForm via useActionState)
// ---------------------------------------------------------------------------

export interface ProjectFormState {
  /** Per-field validation messages, keyed by the form field name. */
  fieldErrors?: Record<string, string>
  /** Form-level error (e.g. duplicate slug, unexpected failure). */
  formError?: string
  /** True after a successful save without redirect (unused here — we redirect). */
  ok?: boolean
}

/** Collapse Zod issues into a flat `{ field: firstMessage }` map. */
function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

/** Shape the raw formData into the object the Zod schema expects. */
function readProjectPayload(formData: FormData) {
  const str = (k: string) => {
    const v = formData.get(k)
    return typeof v === 'string' ? v.trim() : ''
  }

  const sortOrderRaw = str('sortOrder')
  const sortOrder =
    sortOrderRaw === '' ? 0 : Number.parseInt(sortOrderRaw, 10)

  return {
    title: str('title'),
    slug: str('slug'),
    client: str('client'),
    category: str('category'),
    industry: str('industry'),
    year: str('year'),
    imageUrl: str('imageUrl'),
    summary: str('summary'),
    featured: formData.get('featured') === 'on',
    sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
    published: formData.get('published') === 'on',
  }
}

/** Surface a unique-constraint hit on `slug` as a friendly field error. */
function slugConflict(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /unique|duplicate|slug/i.test(message)
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireSession()

  const parsed = projectCreateSchema.safeParse(readProjectPayload(formData))
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await createProject(parsed.data)
  } catch (err) {
    if (slugConflict(err)) {
      return { fieldErrors: { slug: 'That slug is already taken.' } }
    }
    return { formError: 'Could not create project. Please try again.' }
  }

  redirect('/admin/projects?status=created')
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateProjectAction(
  id: string,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireSession()

  if (!id) return { formError: 'Missing record id.' }

  const parsed = projectUpdateSchema.safeParse(readProjectPayload(formData))
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await updateProject(id, parsed.data)
  } catch (err) {
    if (slugConflict(err)) {
      return { fieldErrors: { slug: 'That slug is already taken.' } }
    }
    return { formError: 'Could not save changes. Please try again.' }
  }

  redirect('/admin/projects?status=updated')
}

// ---------------------------------------------------------------------------
// Row actions (list page) — thin, validated wrappers over the query layer.
// Each re-checks the session and revalidates the admin list path.
// ---------------------------------------------------------------------------

export interface ActionResult {
  ok: boolean
  error?: string
}

const idSchema = z.string().uuid()

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  await requireSession()
  if (!idSchema.safeParse(id).success) {
    return { ok: false, error: 'Invalid id.' }
  }
  try {
    await deleteProject(id)
    revalidatePath('/admin/projects')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not delete project.' }
  }
}

export async function toggleProjectPublishedAction(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  await requireSession()
  if (!idSchema.safeParse(id).success) {
    return { ok: false, error: 'Invalid id.' }
  }
  if (typeof published !== 'boolean') {
    return { ok: false, error: 'Invalid value.' }
  }
  try {
    await togglePublishedProject(id, published)
    revalidatePath('/admin/projects')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update publish state.' }
  }
}

export async function toggleProjectFeaturedAction(
  id: string,
  featured: boolean,
): Promise<ActionResult> {
  await requireSession()
  if (!idSchema.safeParse(id).success) {
    return { ok: false, error: 'Invalid id.' }
  }
  if (typeof featured !== 'boolean') {
    return { ok: false, error: 'Invalid value.' }
  }
  try {
    await updateProject(id, { featured })
    revalidatePath('/admin/projects')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update featured state.' }
  }
}

export async function reorderProjectsAction(
  orderedIds: string[],
): Promise<ActionResult> {
  await requireSession()
  const parsed = z.array(idSchema).min(1).safeParse(orderedIds)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid ordering.' }
  }
  try {
    await reorderProjects(parsed.data)
    revalidatePath('/admin/projects')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not save the new order.' }
  }
}
