# SEO Optimization Sweep — Design

**Date:** 2026-06-20
**Project:** jdt-site (JDT Promotions — Next.js 16 App Router, `jdtpromotions.com`)
**Status:** Approved design, ready for implementation plan

## Goal

A full sweep of SEO optimizations across technical on-page SEO, structured
data, local SEO (service-area model), per-page Open Graph, and a conservative
performance pass. Build the SEO scaffolding now so it is correct and complete
even though much of the site's content data is still placeholder.

## Scope decisions (locked)

- **Breadth:** Everything — technical + performance + content-structure + local SEO.
- **Local model:** Service-area Organization schema. **No** street address /
  LocalBusiness; use `areaServed` (South Africa / Gauteng) instead.
- **Content:** Structure-now, copy-later. Optimize SEO-bearing structure
  (metadata, headings, alt patterns, internal linking, structured data) but do
  **not** rewrite placeholder body copy that the owner will replace.
- **Architecture:** Centralized SEO module — single source of truth for
  business identity + typed JSON-LD builders.

## Current state (audit summary)

Already solid (do not redo):
- `metadataBase`, title template, default description, OpenGraph + Twitter card in `app/layout.tsx`.
- Per-page metadata on `/about`, `/work`, `/talent`, `/contact`, `/policy/*`;
  dynamic `generateMetadata` on `/services/[slug]` and `/creators/[slug]`.
- `app/robots.ts`, `app/sitemap.ts` (covers all routes), `app/manifest.ts`,
  root dynamic `app/opengraph-image.tsx`.
- Exactly one `<h1>` per page (homepage hero + `PageHero` both use `motion.h1`);
  clean h2/h3 hierarchy.
- All images use `next/image` with `alt` text.
- Skip link, `lang="en"`, semantic `<main id="main">`, Vercel Analytics.

Gaps this sweep closes:
1. No structured data (JSON-LD) anywhere.
2. No canonical URLs (`alternates.canonical`) on any route.
3. No local-SEO entity signals (areaServed, contactPoint, sameAs).
4. Only the root OG image; no per-page OG for creators/services.
5. No rich-result robots directives (`max-image-preview:large`, etc.).
6. Performance: 3 font families (likely an unused mono), LCP image priority and
   framer-motion bundle unverified.

## Architecture

Three new modules form the centralized core. Everything else reads from them.

### `lib/site.ts` — single source of truth for business identity

Plain typed object exporting the canonical business facts:

```ts
export const site = {
  name: 'JDT Promotions',
  url: 'https://jdtpromotions.com',
  description: '<canonical default description>',
  email: 'hello@jdtpromotions.com',
  phone: '+27 82 123 4567',          // TODO(owner): placeholder
  whatsapp: 'https://wa.me/27821234567', // TODO(owner): placeholder
  logo: '/images/jdt-logo.png',
  socials: {
    facebook: 'https://facebook.com/jdtpromotions',   // TODO(owner)
    linkedin: 'https://linkedin.com/company/jdtpromotions', // TODO(owner)
  },
  areaServed: { country: 'ZA', region: 'Gauteng' },
} as const
```

Refactor `components/cta-footer.tsx` and `components/contact-content.tsx` to
read their shared identity values (email, WhatsApp/phone, social URLs) from
`site.ts`. This collapses the duplicated `TODO(owner)` placeholder constants
into one file. Surgical change — only the shared identity values move; layout,
markup, and icon components stay put.

### `lib/structured-data.ts` — typed JSON-LD builders

Each function returns a plain JSON-LD object (no rendering). Org and WebSite use
stable `@id` anchors (`${site.url}#organization`, `${site.url}#website`) so other
nodes can reference them via `@id`.

- `organizationSchema()` → `Organization`
  - `@id`, `name`, `url`, `logo`, `description`
  - `sameAs`: [facebook, linkedin]
  - `contactPoint`: ContactPoint with `email`, `telephone`, `contactType: 'customer service'`, `areaServed: 'ZA'`, `availableLanguage: 'English'`
  - `areaServed`: Country "South Africa" (+ Gauteng region)
- `websiteSchema()` → `WebSite` with `@id`, `url`, `name`, `publisher` → org `@id`.
  No `SearchAction` (site has no internal search).
- `breadcrumbSchema(items: {name, path}[])` → `BreadcrumbList` of `ListItem`s
  with absolute URLs built from `site.url`.
- `personSchema(creator)` → `Person`
  - `name`, `jobTitle` (creator.category), `image`, `description` (creator.bio[0])
  - `sameAs`: creator social hrefs
  - `worksFor`: org `@id`
  - `homeLocation`/`address`: creator.location (city string)
- `serviceSchema(category)` → `Service`
  - `name` (category.label), `description`, `serviceType`
  - `provider`: org `@id`
  - `areaServed`: South Africa
  - `hasOfferCatalog`: `OfferCatalog` whose `itemListElement` are `Offer`s wrapping
    each sub-service `{ name, description }`.

### `components/json-ld.tsx` — renderer

```tsx
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

Server component. Accepts one object or an array (page-level pages can pass
`[breadcrumb, person]` in a single tag or multiple tags — implementation may use
one `<JsonLd>` per schema for clarity).

## Schema placement

| Location | Schemas |
|---|---|
| `app/layout.tsx` (sitewide) | Organization, WebSite |
| `app/services/[slug]/page.tsx` | Service, BreadcrumbList |
| `app/creators/[slug]/page.tsx` | Person, BreadcrumbList |
| `app/about`, `/work`, `/talent`, `/contact`, `/policy/*` | BreadcrumbList |

Breadcrumb trails:
- `Home > Services > <label>` for service pages
- `Home > Talent > <name>` for creator pages (creators are reached via `/talent`)
- `Home > <Page>` for the flat pages; `Home > Policy > <Page>` for policy pages

## Metadata enhancements (every route)

1. **Canonicals** — add `alternates: { canonical: '<relative-path>' }` to each
   page's metadata; dynamic routes use the resolved slug path
   (`/creators/${slug}`, `/services/${slug}`). Root page gets `canonical: '/'`.
   `metadataBase` resolves relatives to absolute URLs.
2. **Rich-result robots directives** — add to `app/layout.tsx` metadata:
   ```ts
   robots: {
     index: true, follow: true,
     googleBot: {
       index: true, follow: true,
       'max-image-preview': 'large',
       'max-snippet': -1,
       'max-video-preview': -1,
     },
   }
   ```
3. **Per-page OG images** — new dynamic routes:
   - `app/creators/[slug]/opengraph-image.tsx` — creator name + category on the
     existing dark brand background; reuses root OG visual language.
   - `app/services/[slug]/opengraph-image.tsx` — service label + tagline.
   - All other pages continue inheriting the root `app/opengraph-image.tsx`.

## Local SEO

Service-area Organization (no physical address):
- `areaServed`: South Africa (Country) + Gauteng (region) via the schema above.
- `contactPoint`: email + WhatsApp/phone from `site.ts`.
- `sameAs`: Facebook + LinkedIn from `site.ts`.

This gives Google the entity signals (name, contact, service area, social
profiles) that underpin a future Google Business Profile without claiming a
walk-in location.

## Performance / Core Web Vitals (conservative)

- **Fonts:** audit usage of `--font-geist-mono`. If nothing references it, drop
  the `Geist_Mono` import from `app/layout.tsx` (one fewer font fetch). Keep
  `next/font` defaults (`display: swap`, preload on by default).
- **LCP:** ensure the homepage hero's LCP image has `priority` and an accurate
  `sizes` attribute; confirm it is not lazy-loaded.
- **framer-motion:** confirm `components/motion-provider.tsx` uses `LazyMotion`
  with `domAnimation` features so the heavy animation bundle is trimmed. Keep
  framer-motion — no rip-out, measured trimming only.

## Out of scope

- Rewriting placeholder body copy, taglines, or service/creator descriptions.
- LocalBusiness schema with street address / `geo` coordinates.
- FAQPage schema (no FAQ content exists yet).
- Adding a site search / `SearchAction`.
- Replacing framer-motion or changing the animation design.

## Verification

- `pnpm build` (Next.js) completes with no type or build errors.
- Inspect rendered `<head>` locally (dev server / view-source) for:
  - one canonical `<link>` per page,
  - `ld+json` script(s) with the expected schema per route,
  - robots directives.
- Post-deploy manual checks (noted, not blocking): Google Rich Results Test and
  the schema.org validator against a representative service and creator URL.

## Risks & notes

- Placeholder values (phone, socials) flow into structured data. Centralizing in
  `site.ts` means a single edit corrects every consumer (schema, footer, contact)
  when real values land. `TODO(owner)` markers stay on the placeholder fields.
- JSON-LD is injected via `dangerouslySetInnerHTML` with `JSON.stringify`, which
  escapes content safely for `<script>`; all data is first-party/static.
