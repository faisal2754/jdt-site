'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireSession } from '@/lib/auth/guard'
import {
  createBrand,
  updateBrand,
  deleteBrand,
  reorderBrands,
} from '@/lib/queries/brands'
import { brandCreateSchema, brandUpdateSchema } from '@/lib/validation/brands'

// ---------------------------------------------------------------------------
// Form-state contract (consumed by the inline create/edit dialogs)
// ---------------------------------------------------------------------------

export interface BrandFormState {
  /** Per-field validation messages, keyed by the form field name. */
  fieldErrors?: Record<string, string>
  /** Form-level error (e.g. unexpected failure). */
  formError?: string
  /** True after a successful save — the dialog closes and the list refreshes. */
  ok?: boolean
}

const idSchema = z.string().uuid()

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
function readBrandPayload(formData: FormData) {
  const str = (k: string) => {
    const v = formData.get(k)
    return typeof v === 'string' ? v.trim() : ''
  }

  const sortOrderRaw = str('sortOrder')
  const sortOrder =
    sortOrderRaw === '' ? 0 : Number.parseInt(sortOrderRaw, 10)

  const logoUrl = str('logoUrl')

  return {
    name: str('name'),
    // Empty string → null so the schema's nullable `logoUrl` is respected and the
    // public marquee renders the name when there's no logo.
    logoUrl: logoUrl === '' ? null : logoUrl,
    sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createBrandAction(
  _prev: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  await requireSession()

  const parsed = brandCreateSchema.safeParse(readBrandPayload(formData))
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await createBrand(parsed.data)
    revalidatePath('/admin/brands')
    return { ok: true }
  } catch {
    return { formError: 'Could not create brand. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateBrandAction(
  id: string,
  _prev: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  await requireSession()

  if (!idSchema.safeParse(id).success) {
    return { formError: 'Invalid id.' }
  }

  const parsed = brandUpdateSchema.safeParse(readBrandPayload(formData))
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error) }
  }

  try {
    await updateBrand(id, parsed.data)
    revalidatePath('/admin/brands')
    return { ok: true }
  } catch {
    return { formError: 'Could not save changes. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// Row actions — thin, validated wrappers over the query layer.
// ---------------------------------------------------------------------------

export interface ActionResult {
  ok: boolean
  error?: string
}

export async function deleteBrandAction(id: string): Promise<ActionResult> {
  await requireSession()
  if (!idSchema.safeParse(id).success) {
    return { ok: false, error: 'Invalid id.' }
  }
  try {
    await deleteBrand(id)
    revalidatePath('/admin/brands')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not delete brand.' }
  }
}

export async function reorderBrandsAction(
  orderedIds: string[],
): Promise<ActionResult> {
  await requireSession()
  const parsed = z.array(idSchema).min(1).safeParse(orderedIds)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid ordering.' }
  }
  try {
    await reorderBrands(parsed.data)
    revalidatePath('/admin/brands')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not save the new order.' }
  }
}
