import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Cloudflare R2 storage helper (S3-compatible).
 *
 * Env is read LAZILY (inside getClient/getConfig, memoized) rather than at
 * module top-level. This keeps the module import-safe for standalone tsx
 * scripts that load `.env.local` via dotenv *after* importing modules — the
 * env-ordering pitfall that bit earlier phases. In the Next.js runtime env is
 * always present, so the lazy read costs nothing.
 */

/** Entities whose uploads live under their own R2 key prefix. */
export type StorageEntity =
  | 'creators'
  | 'projects'
  | 'services'
  | 'brands'
  | (string & {})

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBaseUrl: string
}

let cachedConfig: R2Config | null = null
let cachedClient: S3Client | null = null

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required R2 environment variable: ${name}`)
  }
  return value
}

function getConfig(): R2Config {
  if (!cachedConfig) {
    cachedConfig = {
      accountId: requireEnv('R2_ACCOUNT_ID'),
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
      bucket: requireEnv('R2_BUCKET'),
      // Trim any trailing slash so URL joins are clean.
      publicBaseUrl: requireEnv('R2_PUBLIC_BASE_URL').replace(/\/+$/, ''),
    }
  }
  return cachedConfig
}

function getClient(): S3Client {
  if (!cachedClient) {
    const config = getConfig()
    cachedClient = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }
  return cachedClient
}

/**
 * Normalize a filename to url-safe characters, preserving the extension.
 * `My Photo (1).PNG` -> `my-photo-1.png`
 */
function sanitizeFileName(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  const hasExt = dot > 0 && dot < fileName.length - 1
  const base = hasExt ? fileName.slice(0, dot) : fileName
  const ext = hasExt ? fileName.slice(dot + 1) : ''

  const normalize = (s: string) =>
    s
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()

  const safeBase = normalize(base) || 'file'
  const safeExt = ext ? normalize(ext) : ''
  return safeExt ? `${safeBase}.${safeExt}` : safeBase
}

const UPLOAD_URL_TTL_SECONDS = 5 * 60

export interface PresignedUpload {
  /** Presigned PUT URL the browser uploads the file bytes to. Expires soon. */
  uploadUrl: string
  /** Public URL to store in the row and render via next/image. */
  publicUrl: string
  /** The R2 object key (path within the bucket). */
  key: string
}

/**
 * Build a presigned PUT URL for a direct browser->R2 upload, plus the public
 * URL the uploaded object will be served from.
 *
 * key = `${entity}/${uuid}-${safeName}`
 */
export async function getPresignedUploadUrl({
  entity,
  fileName,
  contentType,
}: {
  entity: StorageEntity
  fileName: string
  contentType: string
}): Promise<PresignedUpload> {
  const config = getConfig()
  const client = getClient()

  const safeName = sanitizeFileName(fileName)
  const key = `${entity}/${crypto.randomUUID()}-${safeName}`

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  )

  const publicUrl = `${config.publicBaseUrl}/${key}`

  return { uploadUrl, publicUrl, key }
}

/**
 * Upload bytes directly to R2 from the server (no presigning). Used by the
 * one-time `scripts/migrate-images-to-r2.ts` migration and reusable by the
 * admin for server-side uploads where creds are already available.
 *
 * Stays lazy-env like the rest of the module so standalone tsx scripts that
 * load `.env.local` after import keep working.
 */
export async function uploadObject({
  key,
  body,
  contentType,
  cacheControl,
}: {
  key: string
  body: Buffer | Uint8Array | string
  contentType: string
  cacheControl?: string
}): Promise<{ key: string; publicUrl: string }> {
  const config = getConfig()
  const client = getClient()

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(cacheControl ? { CacheControl: cacheControl } : {}),
    }),
  )

  const publicUrl = `${config.publicBaseUrl}/${key}`
  return { key, publicUrl }
}

/**
 * Delete an object from R2 by key. Used when an admin replaces/removes an
 * image (and by the Phase 5 smoke test to clean up).
 */
export async function deleteObject(key: string): Promise<void> {
  const config = getConfig()
  const client = getClient()
  await client.send(
    new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
  )
}
