# JDT Site — Cleanup & Production Polish

**Date:** 2026-06-19
**Status:** Approved design, pending implementation plan
**Context:** Marketing site for JDT Promotions (creative + talent + AI agency), generated in Vercel v0 and moved into a local repo. Next.js 16 / React 19 / Tailwind v4. Goal: remove transfer cruft and v0 leftovers, fix production footguns, and polish for a production launch on Vercel.

## Goals

- Remove all transfer cruft and v0 leftovers so the repo is clean.
- Eliminate dead code and unused dependencies.
- Fix configuration footguns that hide errors or hurt production quality.
- Make the contact form honest and functional today, with a clean seam for a future Cloudflare email integration.
- Ship a real favicon and a working lint setup.

## Non-goals (out of scope)

- Real email backend — deferred; the future path is Cloudflare (Worker / Email Routing).
- Redesign or architectural restructuring — the App Router structure is sound (clean routes, `generateStaticParams` + `notFound` on `[slug]` routes, `next/image` throughout, per-page metadata, oklch theme).
- Reducing client-component / framer-motion usage — works fine; not worth the regression risk for launch.
- Inventing real business content (phone, socials, roster) — these are flagged for the owner to replace.

## Hosting & ownership context

- Site deploys to **Vercel** (where v0 originated). This is why image optimization is re-enabled.
- Client access (handled outside this code change, documented here for reference): code should live in a **GitHub repo** as source of truth; the Vercel **project** should live in a **Pro Team** (Hobby can't add collaborators). Best ownership model is to create the project in the client's Vercel team connected to their GitHub repo and add the developer as a Member, or build now and use Vercel **Transfer Project** later. Future Cloudflare email keys go in that project's Environment Variables.

## Work items

### 1. Cruft removal (no behavior change)

- Delete all `*:Zone.Identifier` files (~85) — Windows mark-of-the-web artifacts, one shadowing every file.
- Add `*:Zone.Identifier` to `.gitignore` so they are never tracked again.
- Delete the stray `--full-page` screenshot in repo root (and `--full-page:Zone.Identifier`).
- Delete unused v0 placeholder assets: `public/placeholder.jpg`, `public/placeholder-logo.svg`, `public/placeholder-logo.png`, `public/placeholder-user.jpg`.
- **Keep** `public/placeholder.svg` — used as a real `|| "/placeholder.svg"` fallback in 9 components.

### 2. Dead code & dependencies

- Delete `components/faq.tsx` — zero references anywhere.
- Delete `components/ui/button.tsx` — never imported; the site uses raw `<button>`/`<a>` with Tailwind.
- Remove dependencies `@base-ui/react` and `class-variance-authority` — only the deleted button consumed them.
- **Keep** `shadcn` — required at build by `@import 'shadcn/tailwind.css'` in `app/globals.css`. Add a one-line comment near that import noting the dependency so it doesn't look stray.
- Rename `package.json` `name` from `"my-project"` to `"jdt-site"`.

### 3. Lint setup

- Replace the broken `"lint": "eslint ."` (eslint isn't installed) with a real setup: add `eslint` + `eslint-config-next` (+ the flat-config peer deps it requires) as devDependencies and a minimal flat config (`eslint.config.mjs`) extending Next.js defaults. Keep the script as `"lint": "eslint ."` (do **not** use `next lint` — it is removed in Next 16; lint runs through eslint directly with the flat config).
- Verify `pnpm lint` runs clean (fix offending code, or scope rule adjustments narrowly — no blanket disables).

### 4. Config footguns

- `next.config.mjs`: remove `typescript.ignoreBuildErrors: true`. Then install deps and run a real typecheck/build; fix any type errors that surface (do not re-suppress).
- `next.config.mjs`: remove `images.unoptimized: true` so Vercel optimizes images.
- `app/layout.tsx`: remove `generator: 'v0.app'` from metadata.

### 5. Favicon / icons

- Wire the existing icon assets for the App Router:
  - Move `public/icon.svg` → `app/icon.svg` and `public/apple-icon.png` → `app/apple-icon.png` (Next auto-detects these as favicon and Apple touch icon).
  - For `icon-dark-32x32.png` / `icon-light-32x32.png`: if light/dark variants are wanted, declare them via `metadata.icons`; otherwise delete them.
- Verify the rendered `<head>` includes the icon links after the change.

### 6. Contact form — honest interim + Cloudflare-ready seam

- Add `lib/contact.ts` exporting `sendContactMessage(data)` as the single submission seam.
- **Interim implementation (no backend):** build a prefilled `mailto:hello@jdtpromotions.com` from all form fields, **including the selected service pill** (currently the service selection is dropped). Trigger it from the form submit.
- **UX honesty:** the success state must not falsely claim "Message sent." Update copy to reflect the mailto behavior (e.g. "Opening your email app…") and only show confirmation appropriate to launching the mail client.
- **Future swap:** `sendContactMessage` is the only thing that changes when Cloudflare email is ready (POST to a Worker / `app/api/contact` route); the form UI stays untouched.
- Keep the direct channels (email card, WhatsApp) as the always-reliable primary path.

### 7. Theme & content tidy

- Remove unused `--sidebar-*` and `--chart-*` token sets from `app/globals.css` (no sidebar, no charts in the app). Verify nothing references them after removal.
- Flag (do not invent) placeholder business data for the owner to replace: contact phone `+27 82 123 4567`, social handles in `components/contact-content.tsx`, and demo records in `lib/creators.ts`, `lib/projects.ts`, `lib/services.ts`. Mark clearly (e.g. a comment) so they are easy to find.

## Verification

- `pnpm install` succeeds with the trimmed dependency list.
- `pnpm lint` runs and passes.
- `pnpm build` succeeds with `ignoreBuildErrors` removed and images optimized (no type errors).
- The site renders a favicon/apple icon in `<head>`.
- Submitting the contact form opens a prefilled email including the selected service; no false "sent" claim.
- `grep` confirms zero `:Zone.Identifier` files, no references to deleted components, and no references to removed theme tokens.

## Risks / notes

- Removing `ignoreBuildErrors` may surface latent type errors that were hidden; these must be fixed, not re-suppressed. (node_modules is not currently installed, so the typecheck has not yet been run.)
- Enabling image optimization assumes Vercel hosting; if the host ever changes to a static export or non-Vercel platform, revisit `images.unoptimized` / add a loader.
- mailto depends on the visitor having a configured mail client; this is the accepted interim trade-off until the Cloudflare path lands. Direct channels mitigate it.
