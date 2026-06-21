# Admin Portal & DB-Backed CMS — Design

**Date:** 2026-06-21
**Status:** Approved (pending spec review)

## Summary

Turn the JDT site's static content files into a Postgres-backed CMS with a
password-protected admin portal. Content currently lives in `lib/creators.ts`,
`lib/projects.ts`, and `lib/services.ts` and is imported directly by the public
pages. After this work, that content lives in **Neon Postgres**, images live in
**Cloudflare R2**, and a `/admin` area lets the team manage it. The public site
keeps rendering the same content — now read from the DB through a cached query
layer — and stays as fast as it is today.

## Goals

- A `/admin` area, gated by a single shared password, to manage **talent
  (creators)**, **projects (work)**, **services**, and **brands** (the trusted-
  brand marquee).
- Content stored in Neon Postgres via Drizzle ORM; images stored in Cloudflare R2.
- Public pages read content from the DB through a cached query layer, with
  near-instant updates after an admin edit (tag-based revalidation).
- A seed step so the live site is pixel-identical immediately after cutover.

## Non-goals

- Per-user accounts, roles, or an audit trail (single shared password only).
- A managed auth provider (Clerk/Auth.js).
- Editing the category constants (`creatorCategories`, `projectCategories`) from
  the admin — they stay as code constants.
- Migrating existing `/public/images/...` assets to R2 in bulk. New uploads go to
  R2; existing local paths keep working and are replaced gradually via the admin.
- A test runner / CI test suite (none exists in the repo today). Verification is a
  manual checklist, with one optional unit test for the auth token.

## Decisions (from brainstorming)

| Decision | Choice |
| --- | --- |
| Scope | Talent + Projects + Services + Brands |
| Auth | Single shared password (signed HTTP-only session cookie) |
| DB layer | Drizzle ORM over the Neon serverless (`neon-http`) driver |
| Storage | Cloudflare R2 (S3-compatible), **public** bucket |
| Public rendering | Cached server reads + on-demand tag revalidation (Approach A) |

### Rendering approach (why A)

Approach A (cached server reads + `revalidateTag`) preserves the site's current
static-like speed and keeps Neon costs near zero (reads are cached), while edits
propagate within seconds. Rejected alternatives: **B — fully dynamic SSR** (every
visitor hits Neon, slower TTFB, loses static performance) and **C — regenerate
static files + redeploy on each edit** (heavy build pipeline, edits not instant).

## Architecture

```
lib/db/
  index.ts        # Drizzle client over @neondatabase/serverless (neon-http)
  schema.ts       # table definitions (creators, projects, service_categories, brands)
lib/queries/
  creators.ts     # cached reads + write functions
  projects.ts
  services.ts
  brands.ts
lib/auth/
  session.ts      # sign/verify HMAC session token (Web Crypto)
  password.ts     # scrypt hash + constant-time verify (Node crypto)
  guard.ts        # requireSession() helper for server actions
lib/storage/
  r2.ts           # S3 client + presigned PUT helper
middleware.ts     # guards /admin/* (except /admin/login)
app/admin/        # login, dashboard, CRUD screens (shadcn/ui + server actions)
scripts/
  hash-password.ts
  seed.ts
```

Public pages become thin Server Components that call `lib/queries` and pass data
as props to the existing (client) display components.

## Data model

Drizzle / Postgres. IDs are `uuid` primary keys; `slug` remains the public-facing
unique identifier. Display-only nested ordered lists (bio paragraphs, stats,
socials, service items) are stored as typed `jsonb` arrays rather than child
tables — they are always edited and rendered as a unit, which keeps both the
schema and the admin forms simple and consistent. All tables get
`created_at` / `updated_at` timestamps.

### `creators`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `slug` | text unique | public identifier |
| `name` | text | |
| `category` | text | validated against `creatorCategories` |
| `location` | text | |
| `image_url` | text | `/images/...` (legacy) or R2 URL |
| `bio` | jsonb | `string[]` paragraphs |
| `stats` | jsonb | `{ value: string; label: string }[]` |
| `socials` | jsonb | `{ label: string; href: string; handle?: string }[]` |
| `sort_order` | int | default 0 |
| `published` | boolean | default true |

### `projects`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `slug` | text unique | |
| `title` | text | |
| `client` | text | |
| `category` | text | validated against `projectCategories` |
| `industry` | text | |
| `year` | text | e.g. "2024" |
| `image_url` | text | |
| `summary` | text | |
| `featured` | boolean | replaces `projects.slice(0, 3)` on the homepage |
| `sort_order` | int | default 0 |
| `published` | boolean | default true |

### `service_categories`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `slug` | text unique | |
| `label` | text | |
| `tagline` | text | |
| `description` | text | |
| `image_url` | text | |
| `services` | jsonb | `{ name: string; description: string }[]` |
| `sort_order` | int | default 0 |

### `brands`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `name` | text | |
| `logo_url` | text null | renders the name when null; allows logos later |
| `sort_order` | int | default 0 |

### Types

The public `Creator` / `Project` / `ServiceCategory` types are re-derived from the
Drizzle schema (`InferSelectModel`) so there is one source of truth. The category
constants (`creatorCategories`, `projectCategories`) stay as TS constants used for
dropdowns and filters. No auth table.

## Storage (Cloudflare R2)

- R2 is S3-compatible — use `@aws-sdk/client-s3` and
  `@aws-sdk/s3-request-presigner`.
- **Upload flow:** the admin image field requests a **presigned PUT URL** from a
  Server Action; the browser uploads the file directly to R2 (sidesteps Vercel's
  ~4.5 MB server-action body limit); the resulting **public URL** is stored in the
  row's `image_url`.
- **Serving:** a **public** R2 bucket fronted by a custom domain (e.g.
  `cdn.jdtpromotions.com`) or `*.r2.dev` to start. That hostname is added to
  `next.config.mjs` `images.remotePatterns` so `next/image` keeps optimizing.
- **Migration nicety:** `image_url` accepts both existing `/images/...` public
  paths and new R2 URLs, so the seeded site is identical on day one and assets are
  swapped to R2 gradually via the admin.

### Environment variables (added)

```
DATABASE_URL              # Neon connection string (user-provided)
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_BASE_URL        # e.g. https://cdn.jdtpromotions.com
ADMIN_PASSWORD_HASH       # scrypt hash from scripts/hash-password.ts
SESSION_SECRET            # HMAC signing secret for the session cookie
```

## Auth (single shared password)

- **Secret:** `ADMIN_PASSWORD_HASH` holds a scrypt hash (Node built-in `crypto`,
  no extra dependency, no plaintext password in env). `scripts/hash-password.ts`
  generates it.
- **Login:** `app/admin/login` — password field → Server Action verifies with a
  constant-time compare → on success sets a signed, **HTTP-only, Secure,
  SameSite=Lax** session cookie. The token is an HMAC-signed payload with an
  expiry, signed with `SESSION_SECRET` via **Web Crypto** so it verifies in any
  runtime (incl. middleware). Failures return a generic message after a small
  fixed delay to blunt brute-forcing.
- **Guard:** `middleware.ts` protects everything under `/admin/*` except
  `/admin/login`; it verifies the cookie signature + expiry and redirects to login
  otherwise. **Defense in depth:** `requireSession()` is also called at the top of
  every admin Server Action, so mutations never rely on middleware alone.
- **Sign out:** a Server Action that clears the cookie.

## Admin UI (`app/admin/`, shadcn/ui)

- `app/admin/layout.tsx` — sidebar nav (Talent · Projects · Services · Brands) +
  sign-out; wraps all admin pages.
- `app/admin/page.tsx` — dashboard: per-entity counts + quick links.
- Per entity (`talent`, `projects`, `services`, `brands`): a **list** page (table
  with edit/delete, `sort_order` control, published toggle) plus **new** and
  **[id]/edit** form pages.
- **Forms** are Server Components posting to **Server Actions** (create / update /
  delete). **Zod** validation runs before any DB write; field errors are returned
  to the form. Small client components handle interactivity:
  - **Repeatable-list field** — one reusable component for bio paragraphs, stats,
    socials, and service items (add / remove / reorder rows).
  - **Image upload field** — requests a presigned URL, uploads to R2, shows a
    preview, writes the URL into a hidden input.
- After a successful mutation the action calls `revalidateTag(...)` for the
  affected entity so the public site refreshes.

## Public-site migration

- `lib/queries/*.ts` provide cached reads (`unstable_cache`, tagged `creators` /
  `projects` / `services` / `brands`) replacing the static arrays;
  `getCreatorBySlug` / `getCategoryBySlug` become async DB queries.
- The 8 client components that currently import data directly —
  `talent-roster`, `creator-carousel`, `creator-profile`, `work-portfolio`,
  `work-showcase`, `services-tabs`, `service-page-content`, `logo-marquee` —
  stay client but **lose their direct data imports**; their parent Server
  Component pages fetch and pass data via props.
- `generateStaticParams` (creators/services `[slug]`), `app/sitemap.ts`, and the
  OG-image routes switch to DB queries.
- `lib/creators.ts`, `lib/projects.ts`, `lib/services.ts` are reduced to the
  shared types + category constants; the data leaves them.
- **Seed script** (`scripts/seed.ts`, run with `tsx`) inserts today's static
  records — including the existing `/images/...` paths — so the live site is
  identical immediately after cutover.

## Error handling

- DB/R2 failures on **public** reads degrade gracefully (serve cached last-good
  where possible; a transient read must never crash a marketing page).
- **Admin** surfaces inline Zod/field errors and a clear failure toast on a failed
  action; successful actions confirm and revalidate.

## Testing / verification

No test runner exists in the repo, so verification is a manual checklist:

1. Login succeeds with the right password; wrong password is rejected; `/admin/*`
   redirects to login when unauthenticated; sign-out works.
2. Full CRUD round-trip per entity (create → edit → reorder → publish toggle →
   delete).
3. Image upload reaches R2 and the public URL renders via `next/image`.
4. A public page reflects an admin edit after revalidation.
5. Seed produces parity with the current static site.

Optional: a lightweight unit test for the session token sign/verify roundtrip.

## Rollout

1. Add deps (`drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`,
   `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `zod`, `tsx`), env vars,
   and `next.config.mjs` `remotePatterns`.
2. Define schema, generate + run the first Drizzle migration against Neon.
3. Build the query/auth/storage layers.
4. Seed the DB from the current static data.
5. Build the admin portal.
6. Migrate public pages to the query layer; remove data from the `lib/*.ts` files.
7. Verify against the checklist; deploy.

## Open inputs needed from the user

- Neon `DATABASE_URL`.
- R2 credentials + bucket + public base URL (custom domain recommended).
- The admin password (run through `scripts/hash-password.ts` to produce
  `ADMIN_PASSWORD_HASH`).
