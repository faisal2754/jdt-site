# SEO Optimization Sweep — Implementation Plan

**Spec:** `docs/superpowers/specs/2026-06-20-seo-optimization-sweep-design.md`
**Branch:** `seo-optimization-sweep`
**Date:** 2026-06-20

Phases are ordered so each builds on the last and is independently verifiable.
Phases 1–5 are the core SEO sweep; Phase 6 is a conservative perf pass (6c is
optional). Run `pnpm build` after each phase as a smoke test.

## Audit corrections (from code recon)

- `Geist_Mono` **is used** (`font-mono` in `components/policy-content.tsx` via
  `--font-mono` in `app/globals.css`). **Keep it** — do not drop the import.
- `components/motion-provider.tsx` uses `MotionConfig` (full framer-motion
  import), **not** `LazyMotion`. Bundle-trim is a real refactor → Phase 6c.
- `components/hero.tsx` `Image` already supports `priority` + eager loading;
  confirm the homepage call site passes `priority`.

---

## Phase 1 — Centralized business identity

**Create `lib/site.ts`** exporting a typed `site` object: `name`, `url`,
`description`, `email`, `phone`, `whatsapp`, `logo`, `socials.{facebook,linkedin}`,
`areaServed.{country:'ZA', region:'Gauteng'}`. Carry `TODO(owner)` markers on the
placeholder phone/whatsapp/social values.

**Refactor consumers to read from `site.ts`:**
- `components/cta-footer.tsx` — WhatsApp href, social links, email.
- `components/contact-content.tsx` — email value/href, WhatsApp value/href,
  Facebook/LinkedIn hrefs. Keep the local `FacebookIcon`/`LinkedinIcon`
  components and all markup; only the constant values move.

**Verify:** `pnpm build` clean; footer + contact render identical hrefs/text
(diff the rendered values mentally — same strings, now sourced centrally).

## Phase 2 — Structured-data builders + renderer

**Create `lib/structured-data.ts`** with pure builder functions returning
JSON-LD objects, all reading from `site`:
- `organizationSchema()` — `Organization`, `@id: ${site.url}#organization`,
  `name/url/logo/description`, `sameAs` (socials), `contactPoint`
  (email + telephone, `contactType:'customer service'`, `areaServed:'ZA'`,
  `availableLanguage:'English'`), `areaServed` (Country South Africa).
- `websiteSchema()` — `WebSite`, `@id: ${site.url}#website`, `url/name`,
  `publisher` → `{ '@id': org id }`. No SearchAction.
- `breadcrumbSchema(items: {name,path}[])` — `BreadcrumbList` with absolute
  `item` URLs from `site.url`.
- `personSchema(creator)` — `Person`: `name`, `jobTitle` (category), `image`
  (absolute), `description` (bio[0]), `sameAs` (creator socials), `worksFor`
  → org id, `address`/`homeLocation` (location string).
- `serviceSchema(category)` — `Service`: `name/description`, `serviceType`,
  `provider` → org id, `areaServed` South Africa, `hasOfferCatalog` →
  `OfferCatalog` with one `Offer`(`itemOffered: Service{name}`) per sub-service.

**Create `components/json-ld.tsx`** — server component rendering
`<script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(data)}}/>`;
accepts `object | object[]`.

**Verify:** `pnpm build` clean; builders are pure/typed (no runtime use yet).

## Phase 3 — Sitewide schema, robots, root canonical

In `app/layout.tsx`:
- Render `<JsonLd data={[organizationSchema(), websiteSchema()]} />` inside
  `<body>` (top is fine; it's a non-visual script).
- Add to `metadata`: `robots: { index:true, follow:true, googleBot: { index:true,
  follow:true, 'max-image-preview':'large', 'max-snippet':-1,
  'max-video-preview':-1 } }`.

In `app/page.tsx` — add `export const metadata = { alternates: { canonical: '/' } }`
(homepage currently has no per-page metadata).

**Verify:** `pnpm build`; view-source of `/` shows Organization + WebSite JSON-LD,
canonical link, robots meta.

## Phase 4 — Per-page canonicals + breadcrumbs

For each page, add `alternates: { canonical: '<path>' }` to its metadata and
render the appropriate `<JsonLd>` in the page body.

- `app/about/page.tsx` — canonical `/about`; breadcrumb `Home › About`.
- `app/work/page.tsx` — canonical `/work`; breadcrumb `Home › Work`.
- `app/talent/page.tsx` — canonical `/talent`; breadcrumb `Home › Talent`.
- `app/contact/page.tsx` — canonical `/contact`; breadcrumb `Home › Contact`.
- `app/policy/privacy/page.tsx` — canonical `/policy/privacy`;
  breadcrumb `Home › Privacy Policy`.
- `app/policy/terms-and-conditions/page.tsx` — canonical
  `/policy/terms-and-conditions`; breadcrumb `Home › Terms & Conditions`.
- `app/services/[slug]/page.tsx` — in `generateMetadata` add
  `alternates.canonical: /services/${slug}`; in the page render
  `<JsonLd data={[serviceSchema(category), breadcrumbSchema([Home, Services, label])]} />`.
- `app/creators/[slug]/page.tsx` — `alternates.canonical: /creators/${slug}`;
  render `<JsonLd data={[personSchema(creator), breadcrumbSchema([Home, Talent, name])]} />`.

**Verify:** `pnpm build`; spot-check view-source on `/about`, a service URL, and a
creator URL for canonical + correct JSON-LD.

## Phase 5 — Per-page OG images

- **`app/creators/[slug]/opengraph-image.tsx`** — dynamic `ImageResponse`
  (1200×630), dark brand bg matching root OG; renders creator `name` + `category`.
  `generateImageMetadata` or read params; `alt = ${name} — ${category} | JDT`.
- **`app/services/[slug]/opengraph-image.tsx`** — same pattern; renders service
  `label` + `tagline`; `alt = ${label} | JDT Promotions`.
- Reuse the root OG's layout/colors for visual consistency. Resolve the slug via
  the existing `creators`/`serviceCategories` lookups; fall back gracefully.

**Verify:** `pnpm build`; hit `/creators/<slug>/opengraph-image` and
`/services/<slug>/opengraph-image` in dev — PNG renders with correct text.

## Phase 6 — Performance pass (conservative)

**6a — LCP image.** Confirm `app/page.tsx` / `components/hero.tsx` call site passes
`priority` to the hero collage so the first image is eager (it already supports
the prop). If not wired, pass `priority`.

**6b — Fonts.** Keep `Geist_Mono` (it is used). No change beyond confirming
`next/font` defaults (swap + preload) are intact.

**6c — framer-motion bundle (OPTIONAL, bounded).** Wrap `MotionProvider` children
in `<LazyMotion features={domAnimation}>` and switch `motion.*` → `m.*` in the
client components that animate (`hero`, `page-hero`, `why-us`, `process`, and any
other `motion.*` users). Use non-strict mode first to avoid breakage. If this
balloons or risks visual regressions, stop and leave as a follow-up note — the
rest of the sweep stands alone.

**Verify:** `pnpm build`; homepage animations still play; reduced-motion still
respected; bundle for the home route is no larger (ideally smaller if 6c done).

## Phase 7 — Final verification

- `pnpm build` clean (no type/lint/build errors).
- View-source sweep across `/`, `/about`, `/work`, `/talent`, `/contact`,
  `/policy/*`, one `/services/<slug>`, one `/creators/<slug>`:
  - exactly one canonical link each,
  - expected JSON-LD per the placement table,
  - robots directives present.
- Note (manual, post-deploy, non-blocking): run Google Rich Results Test on a
  service URL and a creator URL; run schema.org validator on the homepage.
- Commit per phase or as a cohesive set on `seo-optimization-sweep`.

## Done criteria

All routes carry canonicals; Organization + WebSite sitewide; Service/Person/
Breadcrumb on the right routes; creators & services have dynamic OG; local
service-area signals present; LCP image prioritized; build green.
