# Admin Portal & DB-Backed CMS — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-06-21-admin-portal-cms-design.md`
**Branch:** `admin-portal-cms`
**Date:** 2026-06-21

Phases are ordered so each builds on the last and is independently verifiable.
Phases 0–4 move the public site onto the DB (the site is fully DB-driven and
verifiable for parity at the end of Phase 4). Phases 5–8 layer the admin portal
on top. Run `pnpm build` after each phase as a smoke test.

## Inputs required before DB-touching phases

- `DATABASE_URL` — Neon connection string (needed from Phase 1's migrate step on).
- R2 credentials + bucket + public base URL (needed from Phase 5).
- Admin password → run through `scripts/hash-password.ts` to get
  `ADMIN_PASSWORD_HASH` (needed from Phase 6).

Phases that only write code (no migrate/seed/upload) can be completed without
these; the verify steps note where a live credential is required.

---

## Phase 0 — Dependencies, env, config

**Add deps (pnpm):**
- runtime: `drizzle-orm`, `@neondatabase/serverless`, `@aws-sdk/client-s3`,
  `@aws-sdk/s3-request-presigner`, `zod`
- dev: `drizzle-kit`, `tsx`

**`drizzle.config.ts`** (root): `dialect: 'postgresql'`, `schema:
'./lib/db/schema.ts'`, `out: './drizzle'`, `dbCredentials: { url: DATABASE_URL }`.

**`.env.local`** — add placeholders; also create **`.env.example`** documenting:
`DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`.

**`next.config.mjs`** — add `images.remotePatterns` for the R2 public host
(hostname of `R2_PUBLIC_BASE_URL`); keep the existing `formats`.

**`package.json` scripts:** `db:generate` (drizzle-kit generate), `db:migrate`
(drizzle-kit migrate), `db:seed` (tsx scripts/seed.ts), `hash-password`
(tsx scripts/hash-password.ts).

**Verify:** `pnpm install` clean; `pnpm build` clean (nothing wired up yet).

## Phase 1 — Schema + first migration

**`lib/db/schema.ts`** — `pgTable` definitions per spec: `creators`,
`projects`, `service_categories`, `brands`. jsonb columns typed with
`.$type<...>()`. Define shared jsonb shapes (`Stat`, `Social`, `ServiceItem`,
`bio: string[]`). Export `InferSelectModel` row types and `InferInsertModel`
insert types.

**`lib/db/index.ts`** — drizzle client via `drizzle-orm/neon-http` +
`neon(process.env.DATABASE_URL!)`.

**Generate + apply:** `pnpm db:generate` → SQL in `./drizzle`; `pnpm db:migrate`
(requires `DATABASE_URL`).

**Verify:** migration SQL generated and committed; `pnpm db:migrate` succeeds
against Neon; the four tables exist (Neon console or a one-off `select` script).

## Phase 2 — Query layer (reads + writes) + validation

**`lib/queries/creators.ts`, `projects.ts`, `services.ts`, `brands.ts`:**
- **Reads** wrapped in `unstable_cache`, tagged per entity (`creators`,
  `projects`, `services`, `brands`) plus a per-slug tag:
  - creators: `getCreators()` (published, by `sort_order`), `getCreatorBySlug(slug)`
  - projects: `getProjects()`, `getFeaturedProjects()` (`featured` true → fallback
    first 3 by `sort_order`)
  - services: `getServices()`, `getServiceBySlug(slug)`
  - brands: `getBrands()`
  - admin variants returning unpublished too: `get*ForAdmin()`
- **Writes** (`create*`, `update*`, `delete*`, `reorder*`, `togglePublished*`):
  perform the DB op then `revalidateTag(...)` for the entity (and per-slug tag).

**`lib/validation/*.ts`** — Zod schemas per entity (shared by the admin actions),
including slug format and category-membership checks against the TS constants.

**Verify:** `pnpm build` clean (types resolve end-to-end).

## Phase 3 — Seed for parity

**`scripts/seed.ts`** (run with tsx) — import the current arrays from
`lib/creators.ts`, `lib/projects.ts`, `lib/services.ts`, and `trustedBrands`;
map to rows: `image_url` = existing `/images/...` path, bio/stats/socials/services
copied as-is, `sort_order` = array index, `featured` = first 3 projects,
`published` = true. Idempotent: delete-all-then-insert per table.

**Run:** `pnpm db:seed`.

**Verify:** counts match — 12 creators, 8 projects, 3 services, 12 brands; spot
check one creator's jsonb (bio/stats/socials) round-trips intact.

## Phase 4 — Migrate public site to the query layer

Convert each data-consuming **client** component to receive its data via props;
its parent **Server Component** page does the cached read.

**Pages (fetch + pass props):**
- `app/page.tsx` — feed `creator-carousel`, `work-showcase`
  (`getFeaturedProjects()`), `services-tabs` (`getServices()`), `logo-marquee`
  (`getBrands()`).
- `app/talent/page.tsx` — `talent-roster` ← `getCreators()`.
- `app/work/page.tsx` — `work-portfolio` ← `getProjects()`.
- `app/creators/[slug]/page.tsx` — `getCreatorBySlug` (async);
  `generateStaticParams` ← `getCreators()`; pass the creators list to
  `creator-profile` (used for prev/next nav).
- `app/services/[slug]/page.tsx` — `getServiceBySlug` (async);
  `generateStaticParams` ← `getServices()`; `service-page-content` ← props.
- `app/sitemap.ts`, `app/creators/[slug]/opengraph-image.tsx`,
  `app/services/[slug]/opengraph-image.tsx` — switch to query functions.

**Components (drop direct data imports → props):** `talent-roster`,
`creator-carousel`, `creator-profile`, `work-portfolio`, `work-showcase`,
`services-tabs`, `service-page-content`, `logo-marquee`. Category constants
(`creatorCategories`, `projectCategories`) keep coming from `lib/creators.ts` /
`lib/projects.ts`.

**Thin out `lib/*.ts`:** remove the data arrays; keep the category constants and
re-export the row types from the schema so existing `import type { Creator }`
sites keep working. `getCreatorBySlug`/`getCategoryBySlug` now live in
`lib/queries`.

**Verify:** `pnpm build` clean; `pnpm dev` — every public page renders identically
to the pre-migration site (home, talent, work, each creator/service detail, OG
images, sitemap). Build log shows `generateStaticParams` producing the seeded
slugs.

## Phase 5 — R2 storage layer

**`lib/storage/r2.ts`** — `S3Client` for R2 (`endpoint:
https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, `region: 'auto'`, creds).
`getPresignedUploadUrl({ key, contentType })` → `{ uploadUrl, publicUrl }` where
`publicUrl = ${R2_PUBLIC_BASE_URL}/${key}` and `key = ${entity}/${uuid}-${safeName}`.

**Verify:** `pnpm build` clean; a one-off script obtains a presigned URL, PUTs a
test file, and the returned `publicUrl` loads in a browser (requires R2 creds).
Full in-admin flow is verified in Phase 8.

## Phase 6 — Auth (single shared password)

- **`lib/auth/password.ts`** — scrypt hash + constant-time verify (Node `crypto`).
- **`scripts/hash-password.ts`** — print a hash for a given password → set
  `ADMIN_PASSWORD_HASH`.
- **`lib/auth/session.ts`** — `createSessionToken(expiry)` / `verifySessionToken`
  using Web Crypto HMAC + `SESSION_SECRET`; cookie `jdt_admin`, HTTP-only, Secure,
  SameSite=Lax.
- **`lib/auth/guard.ts`** — `requireSession()` for admin server actions + server
  components.
- **`app/admin/login/page.tsx`** + login server action (verify password → set
  cookie → redirect `/admin`; generic error + small fixed delay on failure) +
  signout action.
- **`middleware.ts`** — matcher `/admin/:path*`; allow `/admin/login`; verify
  cookie else redirect to login.

**Verify:** unauthenticated `/admin` → redirect to login; correct password →
access granted; wrong password → generic error; signout clears the cookie.
Optional: unit test for the session sign/verify roundtrip.

## Phase 7 — Admin shell

- Install shadcn components: `button input textarea label table switch select
  sonner dialog` (`pnpm dlx shadcn@latest add ...`).
- **`app/admin/layout.tsx`** — server component (calls `requireSession`), sidebar
  nav (Talent · Projects · Services · Brands) + signout.
- **`app/admin/page.tsx`** — dashboard: per-entity counts (from `get*ForAdmin`) +
  quick links.

**Verify:** `/admin` shows correct counts; nav routes work; signout returns to
login.

## Phase 8 — Admin CRUD per entity

**Reusable client components:**
- `components/admin/repeatable-list.tsx` — add/remove/reorder rows; reused for bio
  (`string[]`), stats (`{value,label}[]`), socials (`{label,href,handle?}[]`),
  service items (`{name,description}[]`).
- `components/admin/image-upload-field.tsx` — request presigned URL → PUT to R2 →
  preview → write `publicUrl` into a hidden input.

**Per entity — list / new / edit pages + server actions** (each
`requireSession` → Zod validate → write → `revalidateTag`):
- **Talent:** name, slug (auto from name, editable), category select, location,
  image, bio list, stats list, socials list, `featured`-style `published` toggle,
  `sort_order`.
- **Projects:** title, slug, client, category select, industry, year, image,
  summary, `featured`, `published`, `sort_order`.
- **Services:** label, slug, tagline, description, image, services list,
  `sort_order`.
- **Brands:** lightweight list with inline create — name, optional logo upload,
  `sort_order`.

**Verify:** full CRUD round-trip per entity (create → edit → reorder → toggle
publish → delete); image upload reaches R2 and renders via `next/image` on the
public page; a public page reflects an admin edit after revalidation.

## Phase 9 — Cleanup + final verification

- Confirm no remaining imports of the old static data arrays; `lib/*.ts` hold only
  types + category constants.
- Run the spec's manual verification checklist end to end.
- `pnpm build` and `pnpm lint` clean.

## Risks / watch-points

- **Client→Server refactor (Phase 4)** is the largest surface; do it page-by-page
  and diff each rendered page against the current site before moving on.
- **Server-action body limit** — never upload image bytes through an action; always
  presigned PUT direct to R2 (Phase 5/8).
- **`remotePatterns`** must include the R2 host or `next/image` will reject new
  uploads (Phase 0).
- **Cache staleness** — every write path must `revalidateTag`; missing a tag means
  stale public pages.
