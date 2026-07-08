/**
 * Build-time asset pipeline for the /artwork infinite canvas.
 * See docs/artwork-infinite-canvas-plan.md, section 3.
 *
 * - Scans artwork/ (sorted filenames, minus scripts/artwork-exclude.json)
 * - Squishes each image into a 1024x1024 atlas cell (fit: 'fill'; the shader
 *   un-squishes using the true aspect stored in the manifest)
 * - Composites a ceil(sqrt(N)) x ceil(sqrt(N)) atlas ->
 *   public/artwork/atlas.webp + atlas.jpg fallback + 1/2-scale atlas-half.webp
 *   (Safari/mobile/low-end) + 1/8-scale atlas-blur.webp
 * - Emits public/artwork/manifest.json (before the ffmpeg step, so a missing
 *   ffmpeg can't leave fresh atlases with a stale manifest)
 * - Converts the one GIF to public/artwork/aasim.mp4 via ffmpeg (skipped when
 *   the mp4 is already newer than the GIF)
 *
 * Run with: pnpm build:artwork
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";

const ROOT = path.resolve(__dirname, "..");
const ARTWORK_DIR = path.join(ROOT, "artwork");
const OUT_DIR = path.join(ROOT, "public", "artwork");
const EXCLUDE_PATH = path.join(__dirname, "artwork-exclude.json");

const CELL_SIZE = 1024;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const GIF_VIDEO_URL = "/artwork/aasim.mp4";
// Candidate webp qualities, tried in order until the atlas lands under the
// size budget. Deterministic given the same inputs.
const WEBP_QUALITY_CANDIDATES = [92, 88, 82, 75, 68, 60, 52, 45];
const ATLAS_SIZE_BUDGET_BYTES = 9 * 1024 * 1024; // full-res atlas (~9MB)
const HALF_ATLAS_SIZE_BUDGET_BYTES = 3 * 1024 * 1024; // 1/2-scale atlas (~3MB)

// mirrors ArtworkManifestItem in components/artwork/layout.ts; source
// filenames stay out of the emitted JSON (the manifest ships to the client)
interface ManifestItem {
  index: number;
  aspect: number;
  isVideo: boolean;
  video?: string;
}

interface Manifest {
  atlasSize: number;
  cellSize: number;
  items: ManifestItem[];
}

function loadExcludeList(): Set<string> {
  const raw = fs.readFileSync(EXCLUDE_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.some((f) => typeof f !== "string")) {
    throw new Error(`${EXCLUDE_PATH} must be a JSON array of filenames`);
  }
  return new Set(parsed);
}

function listSourceFiles(exclude: Set<string>): string[] {
  const all = fs
    .readdirSync(ARTWORK_DIR)
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en-US")); // deterministic ordering

  const unknownExcludes = [...exclude].filter((f) => !all.includes(f));
  if (unknownExcludes.length > 0) {
    console.warn(
      `Warning: exclude list entries not found in artwork/: ${unknownExcludes.join(", ")}`
    );
  }

  return all.filter((f) => !exclude.has(f));
}

async function buildCell(
  filePath: string
): Promise<{ aspect: number; cell: Buffer }> {
  // pages: 1 -> first frame only for the animated GIF.
  const image = sharp(filePath, { pages: 1 });
  const meta = await image.metadata();
  if (!meta.width || !meta.height) {
    throw new Error("could not read dimensions");
  }

  // EXIF orientations 5-8 are 90deg rotations; swap reported dimensions.
  const rotated = (meta.orientation ?? 1) >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;
  const aspect = Number((height / width).toFixed(6));

  const cell = await image
    .rotate() // apply EXIF orientation before squishing
    .resize(CELL_SIZE, CELL_SIZE, { fit: "fill" })
    .removeAlpha()
    .flatten({ background: "#000000" })
    .png()
    .toBuffer();

  return { aspect, cell };
}

async function encodeAtlasWebp(
  atlasPng: Buffer,
  budgetBytes: number
): Promise<{
  buffer: Buffer;
  quality: number;
}> {
  let last: { buffer: Buffer; quality: number } | null = null;
  for (const quality of WEBP_QUALITY_CANDIDATES) {
    const buffer = await sharp(atlasPng).webp({ quality, effort: 6 }).toBuffer();
    last = { buffer, quality };
    if (buffer.byteLength <= budgetBytes) return last;
  }
  return last!;
}

function encodeGifToMp4(gifPath: string, mp4Path: string): "encoded" | "skipped" {
  if (fs.existsSync(mp4Path)) {
    const mp4Mtime = fs.statSync(mp4Path).mtimeMs;
    const gifMtime = fs.statSync(gifPath).mtimeMs;
    if (mp4Mtime > gifMtime) return "skipped";
  }
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      gifPath,
      "-movflags",
      "faststart",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-an",
      mp4Path,
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  return "encoded";
}

async function main() {
  const exclude = loadExcludeList();
  const files = listSourceFiles(exclude);
  if (files.length === 0) throw new Error("no artwork files to process");

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const items: ManifestItem[] = [];
  const composites: OverlayOptions[] = [];
  const failures: { file: string; error: string }[] = [];
  let gifSource: string | null = null; // source filename of the one GIF

  for (const file of files) {
    const filePath = path.join(ARTWORK_DIR, file);
    try {
      const { aspect, cell } = await buildCell(filePath);
      const index = items.length; // row-major cell index
      const isVideo = path.extname(file).toLowerCase() === ".gif";
      if (isVideo) gifSource ??= file;
      items.push({
        index,
        aspect,
        isVideo,
        ...(isVideo ? { video: GIF_VIDEO_URL } : {}),
      });
      composites.push({ input: cell, left: 0, top: 0 }); // positions set below
    } catch (err) {
      failures.push({ file, error: err instanceof Error ? err.message : String(err) });
      console.error(`FAILED  ${file}: ${err instanceof Error ? err.message : err}`);
    }
  }

  const n = items.length;
  const atlasSize = Math.ceil(Math.sqrt(n)); // cells per side
  const atlasPx = atlasSize * CELL_SIZE;

  composites.forEach((c, i) => {
    c.left = (i % atlasSize) * CELL_SIZE;
    c.top = Math.floor(i / atlasSize) * CELL_SIZE;
  });

  console.log(
    `Compositing ${n} cells into a ${atlasSize}x${atlasSize} atlas (${atlasPx}x${atlasPx}px)...`
  );

  const atlasPng = await sharp({
    create: {
      width: atlasPx,
      height: atlasPx,
      channels: 3,
      background: "#000000",
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  // atlas.webp — quality stepped down until it fits the ~9MB budget
  const { buffer: webpBuffer, quality: webpQuality } = await encodeAtlasWebp(
    atlasPng,
    ATLAS_SIZE_BUDGET_BYTES
  );
  fs.writeFileSync(path.join(OUT_DIR, "atlas.webp"), webpBuffer);
  console.log(
    `atlas.webp       ${(webpBuffer.byteLength / 1024 / 1024).toFixed(2)}MB (quality ${webpQuality})`
  );

  // atlas.jpg fallback (webp decode failures)
  const jpgBuffer = await sharp(atlasPng)
    .jpeg({ quality: 62, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, "atlas.jpg"), jpgBuffer);
  console.log(`atlas.jpg        ${(jpgBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

  // 1/2-scale atlas (512px cells) for Safari, coarse-pointer/mobile devices
  // and GPUs whose max texture size can't hold the full atlas
  const halfPx = Math.round(atlasPx / 2);
  const halfPng = await sharp(atlasPng)
    .resize(halfPx, halfPx, { fit: "fill" })
    .png()
    .toBuffer();
  const { buffer: halfBuffer, quality: halfQuality } = await encodeAtlasWebp(
    halfPng,
    HALF_ATLAS_SIZE_BUDGET_BYTES
  );
  fs.writeFileSync(path.join(OUT_DIR, "atlas-half.webp"), halfBuffer);
  console.log(
    `atlas-half.webp  ${(halfBuffer.byteLength / 1024 / 1024).toFixed(2)}MB (quality ${halfQuality})`
  );

  // 1/8-scale blur atlas for instant first paint
  const blurBuffer = await sharp(atlasPng)
    .resize(Math.round(atlasPx / 8), Math.round(atlasPx / 8), { fit: "fill" })
    .webp({ quality: 60, effort: 6 })
    .toBuffer();
  fs.writeFileSync(path.join(OUT_DIR, "atlas-blur.webp"), blurBuffer);
  console.log(`atlas-blur.webp  ${(blurBuffer.byteLength / 1024).toFixed(0)}KB`);

  // manifest.json — written right after the atlas images so a failure in the
  // ffmpeg step below can never leave fresh atlases paired with a stale manifest
  const manifest: Manifest = { atlasSize, cellSize: CELL_SIZE, items };
  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  console.log(`manifest.json    ${n} items`);

  // GIF -> MP4 (once; skipped when mp4 is newer than the gif)
  if (gifSource) {
    const gifPath = path.join(ARTWORK_DIR, gifSource);
    const mp4Path = path.join(OUT_DIR, "aasim.mp4");
    const result = encodeGifToMp4(gifPath, mp4Path);
    const mp4Size = fs.statSync(mp4Path).size;
    console.log(
      `aasim.mp4        ${(mp4Size / 1024 / 1024).toFixed(2)}MB (${result}, source ${gifSource})`
    );
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} file(s) failed to process:`);
    for (const f of failures) console.error(`  ${f.file}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
