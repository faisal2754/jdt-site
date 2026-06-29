// Targeted, idempotent sync of ONLY the `brands` table.
//
// Re-running the full `db:seed` wipes creators/projects/services too, which is
// undesirable once those tables hold real edits. This script touches nothing
// but `brands`: it deletes every row, then re-inserts the canonical list from
// lib/data/brands with sortOrder = array index. Safe to run repeatedly.
//
// Env-ordering (mirrors scripts/seed.ts exactly): the neon() client in lib/db
// reads process.env.DATABASE_URL at module-load time. ESM hoists `import`
// above top-level code, so we (a) load .env.local with an explicit config()
// call here, and (b) import anything that touches lib/db LAZILY via dynamic
// import() inside the async function, which runs after config() has populated
// process.env. seedBrands is pure data, so a normal static import is safe.
import { config } from 'dotenv'
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

// Type-only import: erased at compile time, so it does NOT run lib/db's
// module side-effects (the neon() client).
import type { NewBrand } from '../lib/db/schema'

// Pure data (no lib/db side-effects), so a normal static import is safe here.
import { seedBrands } from '../lib/data/brands'

async function syncBrands() {
  // Lazy imports: env is guaranteed loaded by the time these run.
  const { db } = await import('../lib/db')
  const { brands } = await import('../lib/db/schema')

  const brandRows: NewBrand[] = seedBrands.map((b, i) => ({
    name: b.name,
    logoUrl: b.logoUrl,
    sortOrder: i,
  }))

  // Idempotent: delete-all-then-insert, scoped to `brands` only.
  const deleted = await db.delete(brands).returning({ id: brands.id })
  const inserted = await db
    .insert(brands)
    .values(brandRows)
    .returning({ id: brands.id })

  console.log('Brand sync complete.')
  console.log(`  deleted:  ${deleted.length}`)
  console.log(`  inserted: ${inserted.length} (source ${seedBrands.length})`)
}

syncBrands()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Brand sync failed:', err)
    process.exit(1)
  })
