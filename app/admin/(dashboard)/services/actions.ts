'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireSession } from '@/lib/auth/guard'
import {
  createService,
  updateService,
  deleteService,
  reorderServices,
} from '@/lib/queries/services'
import {
  serviceCreateSchema,
  serviceUpdateSchema,
} from '@/lib/validation/services'

// ---------------------------------------------------------------------------
// Shared form-state contract (consumed by ServiceForm via useActionState)
// ---------------------------------------------------------------------------

export interface ServiceFormState {
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
function readServicePayload(formData: FormData) {
  const str = (k: string) => {
    const v = formData.get(k)
    return typeof v === 'string' ? v.trim() : ''
  }

  const sortOrderRaw = str('sortOrder')
  const sortOrder =
    sortOrderRaw === '' ? 0 : Number.parseInt(sortOrderRaw, 10)

  return {
    label: str('label'),
    slug: str('slug'),
    tagline: str('tagline'),
    description: str('description'),
    imageUrl: str('imageUrl'),
    services: parseJson<
      { name: string; description: string; audience?: string }[]
    >(formData, 'services', []),
    sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
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

export async function createServiceAction(
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await requireSession()

  const parsed = serviceCreateSchema.safeParse(readServicePayload(formData))
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await createService(parsed.data)
  } catch (err) {
    if (slugConflict(err)) {
      return { fieldErrors: { slug: 'That slug is already taken.' } }
    }
    return { formError: 'Could not create service. Please try again.' }
  }

  redirect('/admin/services?status=created')
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateServiceAction(
  id: string,
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await requireSession()

  if (!id) return { formError: 'Missing record id.' }

  const parsed = serviceUpdateSchema.safeParse(readServicePayload(formData))
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await updateService(id, parsed.data)
  } catch (err) {
    if (slugConflict(err)) {
      return { fieldErrors: { slug: 'That slug is already taken.' } }
    }
    return { formError: 'Could not save changes. Please try again.' }
  }

  redirect('/admin/services?status=updated')
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

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  await requireSession()
  if (!idSchema.safeParse(id).success) {
    return { ok: false, error: 'Invalid id.' }
  }
  try {
    await deleteService(id)
    revalidatePath('/admin/services')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not delete service.' }
  }
}

export async function reorderServicesAction(
  orderedIds: string[],
): Promise<ActionResult> {
  await requireSession()
  const parsed = z.array(idSchema).min(1).safeParse(orderedIds)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid ordering.' }
  }
  try {
    await reorderServices(parsed.data)
    revalidatePath('/admin/services')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not save the new order.' }
  }
}
