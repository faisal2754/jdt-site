// One-time (re-runnable) asset migration: upload local content images to
// Cloudflare R2 and rewrite the DB image_url/logo_url columns from local
// `/images/...` paths to `https://cdn.jdtpromotions.com/...` CDN URLs.
//
// Env-ordering: the neon() client (lib/db) and the R2 S3 client read env at
// module-load time. ESM hoists `import` above top-level code, so we (a) load
// .env.local with an explicit config() call here, and (b) import everything
// that touches lib/db or lib/storage LAZILY via dynamic import() inside the
// async function, which runs after config() has populated process.env. This
// mirrors scripts/seed.ts exactly (the same quirk bit earlier phases).
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const envResult = config({ path: resolve(process.cwd(), '.env.local') })
if (envResult.error) {
  console.error('Failed to load .env.local:', envResult.error)
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing after loading .env.local')
  process.exit(1)
}

// Long-lived immutable cache: keys are content-addressed by their local path
// and re-runs overwrite the same key, so a year-long immutable TTL is safe.
const CACHE_CONTROL = 'public, max-age=31536000, immutable'

/** Map a file extension to a content-type. All current assets are PNG. */
function contentTypeFor(key: string): string {
  const ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase()
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'svg':
      return 'image/svg+xml'
    case 'avif':
      return 'image/avif'
    default:
      return 'application/octet-stream'
  }
}

interface TableSpec {
  /** Human label for logging. */
  label: string
  /** drizzle table reference (resolved lazily inside migrate). */
  table: PgTable
  /** The image column on this table. */
  column: PgColumn
  /** Column name on the row object (`imageUrl` | `logoUrl`). */
  field: 'imageUrl' | 'logoUrl'
}

async function migrate() {
  // Lazy imports: env is guaranteed loaded by the time these run.
  const { db } = await import('../lib/db')
  const { brands, creators, projects, serviceCategories } = await import(
    '../lib/db/schema'
  )
  const { uploadObject } = await import('../lib/storage/r2')
  const { eq } = await import('drizzle-orm')

  const baseUrl = (process.env.R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '')

  const specs: TableSpec[] = [
    {
      label: 'creators',
      table: creators,
      column: creators.imageUrl,
      field: 'imageUrl',
    },
    {
      label: 'projects',
      table: projects,
      column: projects.imageUrl,
      field: 'imageUrl',
    },
    {
      label: 'services',
      table: serviceCategories,
      column: serviceCategories.imageUrl,
      field: 'imageUrl',
    },
    {
      label: 'brands',
      table: brands,
      column: brands.logoUrl,
      field: 'logoUrl',
    },
  ]

  let grandUploaded = 0
  let grandUpdated = 0
  let grandSkipped = 0
  let grandBytes = 0
  const missing: string[] = []

  for (const spec of specs) {
    const rows = (await db.select().from(spec.table)) as Array<
      Record<string, unknown> & { id: string }
    >

    let uploaded = 0
    let updated = 0
    let skipped = 0
    let bytes = 0

    console.log(`\n[${spec.label}] ${rows.length} rows`)

    for (const row of rows) {
      const value = row[spec.field] as string | null

      if (!value) {
        skipped++
        continue // null logos etc.
      }
      if (/^https?:\/\//i.test(value)) {
        skipped++
        console.log(`  - skip (already remote): ${value}`)
        continue
      }
      if (!value.startsWith('/images/')) {
        skipped++
        console.log(`  - skip (not a local /images path): ${value}`)
        continue
      }

      // Key = path without leading slash → clean 1:1 mapping, idempotent.
      const key = value.replace(/^\/+/, '')
      const localPath = resolve(process.cwd(), 'public', key)

      let body: Buffer
      try {
        body = await readFile(localPath)
      } catch {
        missing.push(`${spec.label}: ${value} (looked at ${localPath})`)
        console.log(`  ! MISSING local file, skipping: ${localPath}`)
        skipped++
        continue
      }

      const contentType = contentTypeFor(key)
      const { publicUrl } = await uploadObject({
        key,
        body,
        contentType,
        cacheControl: CACHE_CONTROL,
      })
      uploaded++
      bytes += body.byteLength

      await db
        .update(spec.table as never)
        .set({ [spec.field]: publicUrl } as never)
        .where(eq(spec.column, value))
      updated++

      console.log(
        `  ✓ ${value} → ${publicUrl} (${body.byteLength.toLocaleString()} bytes)`,
      )
    }

    console.log(
      `  [${spec.label}] uploaded ${uploaded}, updated ${updated}, skipped ${skipped}, ${bytes.toLocaleString()} bytes`,
    )

    grandUploaded += uploaded
    grandUpdated += updated
    grandSkipped += skipped
    grandBytes += bytes
  }

  console.log('\n=== Migration summary ===')
  console.log(`  base URL:        ${baseUrl}`)
  console.log(`  files uploaded:  ${grandUploaded}`)
  console.log(`  rows updated:    ${grandUpdated}`)
  console.log(`  rows skipped:    ${grandSkipped}`)
  console.log(`  total bytes:     ${grandBytes.toLocaleString()}`)
  if (missing.length) {
    console.log(`  MISSING files (${missing.length}):`)
    for (const m of missing) console.log(`    - ${m}`)
  } else {
    console.log('  missing files:   none')
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
