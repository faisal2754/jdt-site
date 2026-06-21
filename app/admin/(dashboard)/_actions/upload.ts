'use server'

import { requireSession } from '@/lib/auth/guard'
import {
  getPresignedUploadUrl,
  type PresignedUpload,
  type StorageEntity,
} from '@/lib/storage/r2'

/** Image MIME types the admin accepts for uploads. */
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
])

/** Entities that may receive uploads — keeps R2 keys namespaced and prevents
 *  a client from writing under an arbitrary prefix. */
const ALLOWED_ENTITIES = new Set<StorageEntity>([
  'creators',
  'projects',
  'services',
  'brands',
])

export interface CreateUploadInput {
  entity: StorageEntity
  fileName: string
  contentType: string
}

export type CreateUploadResult =
  | { ok: true; data: PresignedUpload }
  | { ok: false; error: string }

/**
 * Mint a presigned PUT URL for a direct browser → R2 upload.
 *
 * The file bytes NEVER pass through this action (Vercel caps action/request
 * bodies at a few MB) — the browser PUTs straight to R2 using the returned
 * `uploadUrl`, then stores the returned `publicUrl` in a hidden form input.
 *
 * Trust boundary: `requireSession()` first, then validate the entity prefix and
 * content type before signing anything.
 */
export async function createUpload(
  input: CreateUploadInput,
): Promise<CreateUploadResult> {
  await requireSession()

  const { entity, fileName, contentType } = input

  if (!ALLOWED_ENTITIES.has(entity)) {
    return { ok: false, error: 'Unknown upload target.' }
  }
  if (typeof fileName !== 'string' || fileName.trim().length === 0) {
    return { ok: false, error: 'A file name is required.' }
  }
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return { ok: false, error: 'That file type is not supported.' }
  }

  try {
    const data = await getPresignedUploadUrl({ entity, fileName, contentType })
    return { ok: true, data }
  } catch {
    // Never leak R2/config internals to the client.
    return { ok: false, error: 'Could not start the upload. Try again.' }
  }
}
