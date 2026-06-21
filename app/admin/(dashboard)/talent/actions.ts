'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireSession } from '@/lib/auth/guard'
import {
  createCreator,
  updateCreator,
  deleteCreator,
  reorderCreators,
  togglePublishedCreator,
} from '@/lib/queries/creators'
import {
  creatorCreateSchema,
  creatorUpdateSchema,
} from '@/lib/validation/creators'

// ---------------------------------------------------------------------------
// Shared form-state contract (consumed by CreatorForm via useActionState)
// ---------------------------------------------------------------------------

export interface CreatorFormState {
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

/** Parse a JSON form field (from RepeatableList / hidden inputs); [] on miss. */
function parseJson<T>(formData: FormData, key: string, fallback: T): T {
  const raw = formData.get(key)
  if (typeof raw !== 'string' || raw.length === 0) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Shape the raw formData into the object the Zod schema expects. */
function readCreatorPayload(formData: FormData) {
  const str = (k: string) => {
    const v = formData.get(k)
    return typeof v === 'string' ? v.trim() : ''
  }

  const sortOrderRaw = str('sortOrder')
  const sortOrder =
    sortOrderRaw === '' ? 0 : Number.parseInt(sortOrderRaw, 10)

  return {
    name: str('name'),
    slug: str('slug'),
    category: str('category'),
    location: str('location'),
    imageUrl: str('imageUrl'),
    bio: parseJson<string[]>(formData, 'bio', []),
    stats: parseJson<{ value: string; label: string }[]>(formData, 'stats', []),
    socials: parseJson<{ label: string; href: string; handle?: string }[]>(
      formData,
      'socials',
      [],
    ),
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

export async function createCreatorAction(
  _prev: CreatorFormState,
  formData: FormData,
): Promise<CreatorFormState> {
  await requireSession()

  const parsed = creatorCreateSchema.safeParse(readCreatorPayload(formData))
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await createCreator(parsed.data)
  } catch (err) {
    if (slugConflict(err)) {
      return { fieldErrors: { slug: 'That slug is already taken.' } }
    }
    return { formError: 'Could not create talent. Please try again.' }
  }

  redirect('/admin/talent?status=created')
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateCreatorAction(
  id: string,
  _prev: CreatorFormState,
  formData: FormData,
): Promise<CreatorFormState> {
  await requireSession()

  if (!id) return { formError: 'Missing record id.' }

  const parsed = creatorUpdateSchema.safeParse(readCreatorPayload(formData))
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await updateCreator(id, parsed.data)
  } catch (err) {
    if (slugConflict(err)) {
      return { fieldErrors: { slug: 'That slug is already taken.' } }
    }
    return { formError: 'Could not save changes. Please try again.' }
  }

  redirect('/admin/talent?status=updated')
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

export async function deleteCreatorAction(id: string): Promise<ActionResult> {
  await requireSession()
  if (!idSchema.safeParse(id).success) {
    return { ok: false, error: 'Invalid id.' }
  }
  try {
    await deleteCreator(id)
    revalidatePath('/admin/talent')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not delete talent.' }
  }
}

export async function toggleCreatorPublishedAction(
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
    await togglePublishedCreator(id, published)
    revalidatePath('/admin/talent')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not update publish state.' }
  }
}

export async function reorderCreatorsAction(
  orderedIds: string[],
): Promise<ActionResult> {
  await requireSession()
  const parsed = z.array(idSchema).min(1).safeParse(orderedIds)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid ordering.' }
  }
  try {
    await reorderCreators(parsed.data)
    revalidatePath('/admin/talent')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not save the new order.' }
  }
}
