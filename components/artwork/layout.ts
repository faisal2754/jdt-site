import { DataTexture, FloatType, NearestFilter, RGBAFormat } from "three"

export interface ArtworkManifestItem {
  index: number
  aspect: number
  isVideo: boolean
  video?: string
}

export interface ArtworkManifest {
  atlasSize: number
  cellSize: number
  items: ArtworkManifestItem[]
}

export interface GalleryLayout {
  texture: DataTexture
  numColumns: number
  rows: number
}

export const LAYOUT_WIDTH = 64
const SHUFFLE_SEED = 1337
const COLUMN_STAGGER = [0, 0.3, 0.15]

export function columnCountFor(width: number, height: number): number {
  // capped at LAYOUT_WIDTH: column metadata lives in row 0 of the 64-wide
  // layout texture, so more columns than texels would write past the row
  return Math.min(Math.max(3, Math.ceil(2 * (width / height) * 1.25) + 2), LAYOUT_WIDTH)
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items]
  const random = mulberry32(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function buildLayout(items: ArtworkManifestItem[], numColumns: number): GalleryLayout {
  if (items.length === 0) {
    throw new Error("buildLayout requires at least one manifest item")
  }

  const shuffled = seededShuffle(items, SHUFFLE_SEED)
  const columns: ArtworkManifestItem[][] = Array.from({ length: numColumns }, () => [])
  const heights = new Array<number>(numColumns).fill(0)

  for (const item of shuffled) {
    let target = -1
    for (let c = 0; c < numColumns; c++) {
      if (columns[c].length >= LAYOUT_WIDTH) continue
      if (target === -1 || heights[c] < heights[target]) target = c
    }
    if (target === -1) break
    columns[target].push(item)
    heights[target] += item.aspect
  }

  const rows = numColumns + 1
  const data = new Float32Array(LAYOUT_WIDTH * rows * 4)

  columns.forEach((column, c) => {
    let y = 0
    column.forEach((item, i) => {
      const offset = ((c + 1) * LAYOUT_WIDTH + i) * 4
      data[offset] = y
      data[offset + 1] = item.aspect
      data[offset + 2] = item.index
      data[offset + 3] = item.isVideo ? 1 : 0
      y += item.aspect
    })
    const meta = c * 4
    data[meta] = Math.max(y, 1e-6)
    data[meta + 1] = COLUMN_STAGGER[c % COLUMN_STAGGER.length]
    data[meta + 2] = column.length
  })

  const texture = new DataTexture(data, LAYOUT_WIDTH, rows, RGBAFormat, FloatType)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true

  return { texture, numColumns, rows }
}
