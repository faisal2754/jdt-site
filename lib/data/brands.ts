// ---------------------------------------------------------------------------
// Canonical brand list — single source of truth for the logo marquee.
//
// The array ORDER below is the display / sort order: it is split into two
// marquee rows on the public site and persisted to the `brands` table with
// `sortOrder = index` by both scripts/seed.ts and scripts/sync-brands.ts.
//
// `logoUrl` points at the committed, normalized white-on-transparent webp
// assets in public/images/brands/<slug>.webp. (scripts/migrate-images-to-r2.ts
// later rewrites these local paths to CDN URLs in the DB; the files here stay
// as the source of truth.)
//
// This module is PURE DATA — it must never import anything that touches
// lib/db, so the seed/sync scripts can import it normally without tripping the
// neon() module-load env quirk those scripts guard against.
// ---------------------------------------------------------------------------

export const seedBrands: { name: string; logoUrl: string }[] = [
  { name: 'AMD', logoUrl: '/images/brands/amd.webp' },
  { name: 'ASUS', logoUrl: '/images/brands/asus.webp' },
  { name: 'Arbitrum', logoUrl: '/images/brands/arbitrum.webp' },
  { name: 'Audi', logoUrl: '/images/brands/audi.webp' },
  { name: 'Capitec', logoUrl: '/images/brands/capitec.webp' },
  { name: 'Celestia', logoUrl: '/images/brands/celestia.webp' },
  { name: 'Comic-Con', logoUrl: '/images/brands/comiccon.webp' },
  { name: 'Cooler Master', logoUrl: '/images/brands/coolermaster.webp' },
  { name: 'Dyson', logoUrl: '/images/brands/dyson.webp' },
  { name: 'Feastables', logoUrl: '/images/brands/feastables.webp' },
  { name: 'Fractal', logoUrl: '/images/brands/fractal.webp' },
  { name: 'Gate', logoUrl: '/images/brands/gate.webp' },
  { name: 'Godmode', logoUrl: '/images/brands/godmode.webp' },
  { name: 'Hollywoodbets', logoUrl: '/images/brands/hollywoodbets.webp' },
  { name: 'Intel', logoUrl: '/images/brands/intel.webp' },
  { name: 'Kalshi', logoUrl: '/images/brands/kalshi.webp' },
  { name: 'Kaspersky', logoUrl: '/images/brands/kaspersky.webp' },
  { name: 'LG', logoUrl: '/images/brands/lg.webp' },
  { name: 'LayerZero', logoUrl: '/images/brands/layerzero.webp' },
  { name: 'Lenovo', logoUrl: '/images/brands/lenovo.webp' },
  { name: 'Logitech', logoUrl: '/images/brands/logitech.webp' },
  { name: 'MTN', logoUrl: '/images/brands/mtn.webp' },
  { name: 'Microsoft', logoUrl: '/images/brands/microsoft.webp' },
  { name: 'MrBeast', logoUrl: '/images/brands/mrbeast.webp' },
  { name: 'Nvidia', logoUrl: '/images/brands/nvidia.webp' },
  { name: 'Origin', logoUrl: '/images/brands/origin.webp' },
  { name: 'Polymarket', logoUrl: '/images/brands/polymarket.webp' },
  { name: 'Predator', logoUrl: '/images/brands/predator.webp' },
  { name: 'Rage', logoUrl: '/images/brands/rage.webp' },
  { name: 'Rainbet', logoUrl: '/images/brands/rainbet.webp' },
  { name: 'Razer', logoUrl: '/images/brands/razer.webp' },
  { name: 'Røde', logoUrl: '/images/brands/rode.webp' },
  { name: 'Spotify', logoUrl: '/images/brands/spotify.webp' },
  { name: 'Stake', logoUrl: '/images/brands/stake.webp' },
  { name: 'Tang', logoUrl: '/images/brands/tang.webp' },
  { name: 'USN', logoUrl: '/images/brands/usn.webp' },
  { name: 'Verbatim', logoUrl: '/images/brands/verbatim.webp' },
]
