# Admin Portal & DB-Backed CMS — Handoff

**Date:** 2026-06-21
**Branch:** `admin-portal-cms`
**Spec:** `docs/superpowers/specs/2026-06-21-admin-portal-cms-design.md`
**Plan:** `docs/superpowers/plans/2026-06-21-admin-portal-cms-plan.md`

This document is the production-cutover guide for the JDT site's move from static
content files to a Postgres-backed CMS with a password-protected `/admin` portal.

---

## What was built (phase by phase)

- **Phase 0 — Deps, env, config.** Added `drizzle-orm`, `@neondatabase/serverless`,
  `@aws-sdk/client-s3` + `s3-request-presigner`, `zod` (runtime) and `drizzle-kit`,
  `tsx`, `dotenv` (dev). Added `drizzle.config.ts`, `.env.example`, `next.config.mjs`
  `images.remotePatterns` for the R2 host, and `db:generate` / `db:migrate` /
  `db:seed` scripts.
- **Phase 1 — Schema + migration.** `lib/db/schema.ts` (`creators`, `projects`,
  `service_categories`, `brands`; jsonb columns typed via `.$type<>()`) and
  `lib/db/index.ts` (Drizzle over `neon-http`). First migration in `drizzle/`,
  applied to Neon.
- **Phase 2 — Query layer + validation.** `lib/queries/*` cached reads
  (`unstable_cache`, tagged per entity + per slug) and write helpers that
  `revalidateTag` after each mutation; `lib/validation/*` Zod schemas (slug format,
  category membership).
- **Phase 3 — Seed for parity.** `scripts/seed.ts` (run with `tsx`) inserts the
  original static records — keeping the existing `/images/...` paths — so the live
  site is identical immediately after cutover. Idempotent (delete-all-then-insert).
- **Phase 4 — Public-site migration.** The 8 data-consuming client components lost
  their direct imports; their parent Server Component pages now fetch from the query
  layer and pass data via props. `generateStaticParams`, `app/sitemap.ts`, and the
  OG-image routes switched to DB queries. `lib/creators.ts` / `lib/projects.ts` /
  `lib/services.ts` were thinned to types + category constants only.
- **Phase 5 — R2 storage layer.** `lib/storage/r2.ts` — S3 client for R2,
  `getPresignedUploadUrl({ entity, fileName, contentType })` → `{ uploadUrl,
  publicUrl, key }` (key = `${entity}/${uuid}-${safeName}`), plus `deleteObject`.
  Env read lazily/memoized to stay import-safe for tsx scripts.
- **Phase 6 — Auth (single shared password).** `lib/auth/session.ts` (Web Crypto
  HMAC sign/verify, `jdt_admin` HTTP-only Secure SameSite=Lax cookie),
  `lib/auth/guard.ts` (`requireSession()`), `app/admin/login` + login/signout
  server actions (constant-time compare against `ADMIN_PASSWORD`, fixed delay on
  failure), and the `/admin/*` request gate.
- **Phase 7 — Admin shell.** shadcn/ui components; `app/admin/(dashboard)/layout.tsx`
  (server component, `requireSession`, sidebar nav + signout); dashboard with
  per-entity counts + quick links.
- **Phase 8 — Admin CRUD.** Reusable `repeatable-list.tsx` (bio/stats/socials/service
  items) and `image-upload-field.tsx` (presigned PUT → R2 → preview → hidden input).
  Per entity: list / new / edit pages + server actions (`requireSession` → Zod →
  write → `revalidateTag`) for Talent, Projects, Services, Brands.
- **Phase 9 — Cleanup + verification (this phase).** Confirmed no stale static-array
  imports remain; renamed `middleware.ts` → `proxy.ts` (Next 16 convention);
  verified env hygiene; ran the consolidated end-to-end smoke; `pnpm build` +
  `pnpm lint` clean.

---

## Required production environment variables (names only)

Seven app env vars plus the Neon connection string (eight total):

```
DATABASE_URL            # Neon connection string (neon-http driver)
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_BASE_URL      # e.g. https://cdn.jdtpromotions.com (not a secret; its host
                        # is added to next.config.mjs images.remotePatterns)
ADMIN_PASSWORD          # plaintext admin password — login does a constant-time
                        # compare against this value directly (no hashing)
SESSION_SECRET          # HMAC signing secret for the session cookie (separate secret)
```

**Auth model:** a single shared **plaintext** `ADMIN_PASSWORD`. There are no user
accounts, roles, or audit trail. `SESSION_SECRET` only signs the session cookie; it
is not the password. See `.env.example` for the documented template (placeholders
only — no real values are committed).

---

## Production rollout steps (the USER must do these)

1. **Set all env vars in Vercel** (Production scope) for the project:
   `DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
   `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`. Use a
   strong random `SESSION_SECRET` and a real `ADMIN_PASSWORD` (the local dev value
   is short — pick a stronger one for prod).
2. **Run the migration against the prod Neon DB:** `pnpm db:migrate` (drizzle-kit
   reads `DATABASE_URL`). If prod and the DB you migrated during the build are the
   **same** Neon database, this is already applied — just confirm the four tables
   exist (`creators`, `projects`, `service_categories`, `brands`).
3. **Seed if the prod DB is empty:** `pnpm db:seed` (loads the original 12 talent /
   9 projects / 3 services / 12 brands using existing `/images/...` paths). The seed
   is delete-all-then-insert, so do **not** re-run it against a DB the team has
   already edited via `/admin` — that would wipe their changes.
4. **Confirm R2 bucket CORS** allows browser PUT uploads from the production origin.
   Phase 8a added `http://localhost:3000` and `https://jdtpromotions.com`. Before
   go-live, confirm the CORS `AllowedOrigins` also covers **`https://www.jdtpromotions.com`**
   and the **actual production origin** (e.g. the Vercel `*.vercel.app` URL if the
   team will use the admin there before DNS cutover). Required: `AllowedMethods`
   includes `PUT`, `AllowedHeaders` includes `content-type` (or `*`).
5. **Confirm the `cdn.jdtpromotions.com` custom domain** is connected to the R2
   bucket and is the value of `R2_PUBLIC_BASE_URL`. Its hostname must resolve and
   serve objects publicly (next/image optimizes it via `remotePatterns`). If still
   on `*.r2.dev`, that hostname is already covered by the fallback pattern.
6. **Deploy** and run a quick prod smoke: `/admin` redirects to login; correct
   password reaches the dashboard with the expected counts; one image upload in the
   admin lands in R2 and renders on the public page via `next/image`.

---

## Known limitations / follow-ups

- **Single shared password, no roles/audit trail** — by design (non-goal). Anyone
  with `ADMIN_PASSWORD` has full edit rights; rotate it by changing the env var.
- **Deleted/replaced images may linger in Cloudflare's edge cache.** When an admin
  replaces an image, the new object has a new key (uuid-prefixed) so the public URL
  changes and `next/image` serves the new one. But the **old** object's URL can stay
  cached at Cloudflare's edge for its TTL even after `deleteObject` removes it from
  the bucket — purge the CDN cache (or rely on TTL expiry) if a stale image must
  disappear immediately.
- **Cache revalidation depends on tags.** Every write path calls `revalidateTag`;
  if a future code change adds a write that forgets the tag, the public page can go
  stale. Keep new mutations going through `lib/queries/*`.
- **Mobile drawer not screenshot-verifiable on this Linux box.** The mobile nav
  drawer (`site-header-client.tsx`) was code-reviewed but the small-viewport
  interaction was not visually screenshot-verified in this environment; verify on a
  real device/responsive view post-deploy.
- **Existing `/public/images/...` assets stay local** until swapped to R2 via the
  admin (intentional gradual migration; seeded paths keep working).
- **No automated test suite** — verification is the manual checklist in the spec.

---

## Managing content going forward (`/admin`)

1. Go to **`/admin`** on the production site → enter the shared `ADMIN_PASSWORD`.
2. The **dashboard** shows live counts and quick links. Use the sidebar to pick a
   section: **Talent · Projects · Services · Brands**.
3. Each section is a **list page** with create / edit / delete, a `sort_order`
   control, and a published toggle. **New** and **Edit** open a form.
4. **Images:** the image field uploads directly to R2 (presigned PUT) and stores the
   public URL — just pick a file and wait for the preview. Replacing an image creates
   a new object (see the edge-cache note above).
5. **Repeatable fields** (talent bio paragraphs, stats, socials; service items) use
   add / remove / reorder rows.
6. **`featured`** on a project controls the homepage showcase (first 3 / featured).
   **`published`** hides a record from the public site without deleting it.
7. Saving runs Zod validation, writes to Neon, and `revalidateTag`s the entity, so
   the public site reflects the change within seconds — no redeploy needed.
8. **Sign out** from the sidebar clears the session cookie.

> Category lists (`creatorCategories`, `projectCategories`) are **code constants**,
> not admin-editable (non-goal). Changing them is a code edit + deploy.

---

## Phase 9 verification results (recorded at handoff)

- **Stale-import sweep:** zero stale static-array imports outside `scripts/seed.ts`.
  `lib/creators.ts` = `Creator` type re-export + `creatorCategories`;
  `lib/projects.ts` = `Project` type re-export + `ProjectCategory` type +
  `projectCategories`; `lib/services.ts` = `ServiceCategory` type re-export only.
- **middleware → proxy:** renamed `middleware.ts` → `proxy.ts` (export `proxy`),
  same matcher + verify logic. Build registers `ƒ Proxy (Middleware)`; unauth
  `/admin` and `/admin/talent` still 307 → `/admin/login?next=...`. Behavior
  unchanged.
- **Env hygiene:** `.env.local` is gitignored; `.env.example` is committed
  (placeholders only); no `.env` files tracked; no secrets staged.
- **Consolidated smoke (live):** auth (unauth → login; correct password → dashboard;
  signout clears session) ✓; dashboard counts 12 talent / 9 projects / 3 services /
  12 brands ✓; all four admin list pages render with matching row counts ✓; public
  parity on `/`, `/talent`, `/work`, a creator detail, a service detail ✓.
- **Gates:** `pnpm build` clean (35 static pages; `/creators/[slug]` SSG ×12,
  `/services/[slug]` SSG ×3); `pnpm lint` clean (no warnings).
</content>
</invoke>
