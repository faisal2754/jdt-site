#!/usr/bin/env node
/**
 * process-brand-logos.mjs
 *
 * Recolors black-on-white brand logos into solid WHITE on a TRANSPARENT
 * background (anti-aliased edges preserved via the alpha channel) for use on
 * the site's near-black monochrome theme (#1a1a1a).
 *
 * Reusable + idempotent: reads the canonical manifest, processes every source
 * in brand-logos-png/, and writes public/images/brands/<slug>.webp. Safe to
 * re-run; existing outputs are overwritten.
 *
 * Pipeline per logo (sharp):
 *   1. flatten any existing alpha onto white
 *   2. trim the surrounding white margin (materialize ONCE to a PNG buffer)
 *   3. build alpha = inverted luminance of the trimmed image
 *   4. composite a solid-white RGB canvas with that alpha
 *   5. resize to a consistent display height for the marquee
 *   6. export lossless webp
 */

import { readFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// sharp is not hoisted under pnpm; require it via its exact resolved path.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const sharp = require(
  '/home/faisal/projects/personal/jdt-site/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js'
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const SOURCE_DIR = join(REPO_ROOT, 'brand-logos-png');
const OUTPUT_DIR = join(REPO_ROOT, 'public', 'images', 'brands');
const MANIFEST_PATH =
  '/tmp/claude-1000/-home-faisal-projects-personal-jdt-site/009ad6f8-69f4-42fe-a30a-0d45b503b49a/scratchpad/brands.manifest.json';

// Tunables
const TRIM_THRESHOLD = 12; // white-margin crop sensitivity
const DISPLAY_HEIGHT = 112; // normalized optical height for the marquee
const MAX_WIDTH = 440; // cap ultra-wide wordmarks
// Alpha levels adjustment (applied to alpha = 255 - luminance of the trimmed
// image). Two reasons this is needed:
//   * FLOOR: some sources have an OFF-white background (~#f5f5f5 or a faint
//     baked-in checkerboard). Anything at/below this alpha is background haze
//     and is clamped to fully transparent (removes the box/halo on dark).
//   * CEIL: the source "ink" is not pure black but a uniform charcoal (~#2d2d2d,
//     luminance ~45). Without a ceiling the logo body would only reach ~80%
//     alpha and render as gray. Anything at/above this alpha is treated as solid
//     fill and pushed to fully opaque WHITE. Tang is the lightest ink (~lum 55),
//     so CEIL stays below its alpha (~200) to keep it solid too.
// Partial alpha between FLOOR and CEIL is the anti-aliased edge => stays crisp.
// Done manually in JS rather than sharp's .linear(), since sharp reorders
// .linear() before .negate() internally.
const ALPHA_FLOOR = 32;
const ALPHA_CEIL = 190;
const ALPHA_SCALE = 255 / (ALPHA_CEIL - ALPHA_FLOOR);

/**
 * Recolor a single black-on-white logo to white-on-transparent.
 * @returns {Promise<{width:number,height:number}>} final output dimensions
 */
async function processLogo(srcPath, outPath) {
  // 1 + 2: flatten onto white, trim the white margin, materialize ONCE.
  const trimmedBuf = await sharp(srcPath)
    .flatten({ background: '#ffffff' })
    .trim({ background: '#ffffff', threshold: TRIM_THRESHOLD })
    .png()
    .toBuffer();

  // Derive size from the SAME buffer we build the alpha from (consistency).
  const { width, height } = await sharp(trimmedBuf).metadata();

  // 3: alpha = inverted luminance (dark ink -> opaque, white bg -> clear, gray
  //    AA edges -> partial alpha => crisp edges). Then apply the FLOOR/CEIL
  //    levels in JS: background haze (<= FLOOR) -> transparent, solid charcoal
  //    fill (>= CEIL) -> fully opaque white, the rest rescaled across 0..255.
  const lumBuf = await sharp(trimmedBuf)
    .grayscale()
    .toColourspace('b-w')
    .raw()
    .toBuffer();

  const alphaBuf = Buffer.allocUnsafe(lumBuf.length);
  for (let i = 0; i < lumBuf.length; i += 1) {
    const a = (255 - lumBuf[i] - ALPHA_FLOOR) * ALPHA_SCALE;
    alphaBuf[i] = a <= 0 ? 0 : a >= 255 ? 255 : Math.round(a);
  }

  // 4: solid-white RGB canvas + that alpha as a 4th channel.
  // Materialize the composite to a PNG buffer. (A single-pass
  // create+joinChannel+resize causes sharp to silently drop the resize, so we
  // split steps 4 and 5 into two passes to guarantee correct dimensions.)
  const compositeBuf = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .joinChannel(alphaBuf, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();

  // 5: resize to a consistent display height (fit inside, no enlargement).
  // 6: export lossless webp.
  const out = await sharp(compositeBuf)
    .resize({
      height: DISPLAY_HEIGHT,
      width: MAX_WIDTH,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ lossless: true, effort: 6, alphaQuality: 100 })
    .toFile(outPath);

  return { width: out.width, height: out.height };
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const brands = manifest.brands;

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Processing ${brands.length} brand logos ->\n  ${OUTPUT_DIR}\n`);

  let ok = 0;
  const failures = [];

  for (const brand of brands) {
    const srcPath = join(SOURCE_DIR, brand.source);
    const outPath = join(OUTPUT_DIR, `${brand.slug}.webp`);

    if (!existsSync(srcPath)) {
      failures.push({ slug: brand.slug, reason: `missing source ${brand.source}` });
      console.error(`  ✗ ${brand.slug.padEnd(16)} MISSING SOURCE ${brand.source}`);
      continue;
    }

    try {
      const { width, height } = await processLogo(srcPath, outPath);
      const bytes = statSync(outPath).size;
      ok += 1;
      console.log(
        `  ✓ ${brand.slug.padEnd(16)} ${String(width).padStart(3)}x${String(
          height
        ).padStart(3)}  ${(bytes / 1024).toFixed(1)} KB  (${brand.source})`
      );
    } catch (err) {
      failures.push({ slug: brand.slug, reason: err.message });
      console.error(`  ✗ ${brand.slug.padEnd(16)} ERROR: ${err.message}`);
    }
  }

  console.log(`\nDone. ${ok}/${brands.length} succeeded.`);
  if (failures.length) {
    console.log('Failures:');
    for (const f of failures) console.log(`  - ${f.slug}: ${f.reason}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
