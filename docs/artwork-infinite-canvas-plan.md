# Artwork Infinite Canvas — Implementation Plan

Goal: a papercrowns.com/lost-art–style "eternal canvas" page rendering everything in `artwork/`,
with a **shine sweep on hover** and the reference's **fisheye + zoom-out + edge-blur drag feel**.

---

## 1. How the reference actually works (reverse-engineered)

The lost-art page is **not** a DOM grid with WebGL sprinkled on top. It is a single Three.js
scene containing exactly one fullscreen quad (`PlaneGeometry(2,2)`, `OrthographicCamera`,
`ShaderMaterial`) — the **entire infinite grid is drawn by one fragment shader**. No meshes per
image, no scrolling DOM.

### Rendering pipeline
- **Image atlas**: every image is drawn into one big square canvas atlas
  (`ceil(sqrt(N))` × `ceil(sqrt(N))` cells, 1024px per cell, 512px on Safari). Images are
  squished into square atlas cells; the shader un-squishes them because each grid cell keeps the
  image's true aspect ratio. Uploaded once as a single texture (`uImageAtlas`).
- **Layout texture**: a 64×(numColumns+1) float `DataTexture`. Row 0 stores per-column metadata
  (total height, y-offset, cell count); row *c+1* stores that column's cells
  (y, height, imageIndex, isVideo). The fragment shader **binary-searches** this texture (≤7
  steps) to find which cell contains the current pixel.
- **Infinite tiling**: world space is wrapped with `mod()` horizontally over
  `numColumns × columnWidth` and vertically per-column over that column's total height. Columns
  get staggered y-offsets `[0, 0.3, 0.15]` so seams never align.
- **Per-pixel math** in the shader, in order:
  1. screen UV → barrel distortion: `uv *= (1.0 - uDistortion * r²)`
  2. aspect correction → `* uZoom` → `+ uOffset` (the drag position)
  3. column/cell lookup via layout texture, gap inset (`cellGap: 0.06`)
  4. atlas sample (or `uActiveVideoTexture` for the one playing video)
  5. hover treatment (see below), intro animation, radial blur, vignette

### Drag behavior (the "clicked and dragged" look)
Per rAF frame, everything eases with `lerp(current, target, 0.1)`:
- `offset` chases the drag target (`delta × 0.003/px`, `0.005` touch) → soft momentum glide
  that keeps settling after release.
- While mouse is down: `uDistortion → 0.08` (fisheye bulge), `uZoom → 1.25`
  (zooms **out**, revealing more grid), `uRadialBlurIntensity → 1.3` (8-sample directional blur
  that only affects the frame edges, beyond `vignetteRadius − 0.3`). On release all three ease
  back to 0/1/0. This combination is the entire "lens" feel.
- Click vs drag disambiguated with a 2px movement threshold.
- Permanent vignette (`intensity 0.7, radius 1.3, softness 0.5`) + hard fade to black past
  r=1.2–1.8 so the fisheye edge never shows raw geometry.

### Hover behavior
- No raycasting — CPU inverts the same distortion/zoom/offset math to map mouse → world → cell id.
- `uHoveredCell` + `uHoverIntensity` (eased 0→1 at 0.1/frame), plus a `uPrevHoveredCell` /
  `uPrevHoverIntensity` pair so the outgoing cell fades while the incoming one grows.
- Effect on the reference: image insets ~1%, exposing a white surround (frame flash), a bottom
  black gradient + caption text (from a separate pre-rendered text atlas) fades in, play icon
  fades out, and **video cells start playing on hover** (`uActiveVideoTexture` swaps in).
- Intro: 2s radial stagger from the origin — cells scale from 1.25→1 and fade in, delayed by
  distance from center, ease-out-quint.

### Renderer settings
`antialias: false`, `alpha: false`, `depth: false`, `powerPreference: high-performance`,
`pixelRatio ≤ 1.5`. Safari fallbacks: smaller atlas (512), fewer blur samples (4), faster lerp.

---

## 2. What we build (differences from the reference)

| Aspect | Reference | Ours |
|---|---|---|
| Hover effect | White frame + caption + video play | **Shine sweep** (user request) + subtle inset; no captions (files are untitled) |
| Atlas | Built at runtime from ~50 network fetches | **Prebuilt at build time** into one static atlas image + JSON manifest |
| Videos | Vimeo-hosted MP4s as texture | One GIF (`Aasim Gif V3.gif`) → convert to MP4, play on hover (same `uActiveVideoTexture` slot); everything else static |
| Framework | Vue | Next.js 16 App Router client component, `next/dynamic` `ssr: false` |

### The shine shader (new)
On hover, a diagonal specular band sweeps across the image once, driven by hover intensity:

```glsl
// inside the hovered-cell branch
float sweep = cellHoverProgress;                 // 0→1 eased on hover-in
float band  = imageUV.x + imageUV.y * 0.6;       // diagonal axis
float pos   = mix(-0.6, 1.6, sweep);             // travels past both edges
float shine = smoothstep(0.25, 0.0, abs(band - pos))   // soft band
            * (1.0 - sweep * sweep);                     // fades as it exits
color += shine * 0.45 * vec3(1.0);               // additive white, soft
```

Two hover timelines: `uHoverIntensity` (in/out ease, drives inset + shine amplitude) and a
one-shot `uShineProgress` that restarts on each hover-enter so the sweep plays once per entry
rather than oscillating. Both passed per hovered/prev cell as in the reference.

---

## 3. Asset pipeline (build-time script)

`scripts/build-artwork-atlas.ts` (run via `pnpm tsx`, add `sharp` as devDependency):

1. Scan `artwork/` (65 files, ~97MB — 4K PNGs, JPEGs, 1 GIF). Skip obvious non-art if desired.
2. For each file: read dimensions → record `aspect = h/w`; resize to fit 512×512 (squished
   square, matching the shader's atlas convention) — 512 keeps the full atlas at
   `ceil(sqrt(65)) = 9` cells → 4608×4608, safely under the 8192 GPU texture floor.
3. Composite all cells into one atlas, export **both** `public/artwork/atlas.webp` (~2–3MB) and
   a JPEG fallback. Also export a tiny 1/8-scale blur atlas for instant first paint (optional).
4. GIF: `ffmpeg -i "Aasim Gif V3.gif" -movflags faststart -pix_fmt yuv420p -vf scale=trunc(iw/2)*2:trunc(ih/2)*2 public/artwork/aasim.mp4`,
   drawn into the atlas as its first frame, flagged `isVideo` in the manifest.
5. Emit `public/artwork/manifest.json`: `{ atlasSize: 9, cellSize: 512, items: [{ index, aspect, isVideo, video? }] }`.
6. Deterministic ordering (sorted filenames) so rebuilds are stable; shuffle happens client-side
   with a fixed seed for visual variety.

Raw `artwork/` files never ship to the client; add the dir to `.vercelignore`/keep out of `public`.

## 4. Component architecture

```
app/artwork/page.tsx              — server component: metadata, loads manifest, renders shell
components/artwork/
  infinite-canvas.tsx             — 'use client', next/dynamic ssr:false wrapper
  gallery-renderer.ts             — plain TS class: Three scene, uniforms, rAF loop, dispose()
  gallery.frag.glsl / .vert.glsl  — shaders as template-literal strings (or raw-loader style consts)
  use-drag-controls.ts            — pointer events → target offset, click-vs-drag threshold
```

- Add `three` (+`@types/three`) via pnpm. We use ~5 classes (WebGLRenderer, OrthographicCamera,
  Scene, Mesh, PlaneGeometry, ShaderMaterial, Texture, DataTexture, VideoTexture) — tree-shakes
  to ~150KB gz, only loaded on this route.
- Renderer class is framework-agnostic; the React component just mounts/unmounts it
  (`useEffect` create → `dispose()` on cleanup, `ResizeObserver` for sizing).
- UI chrome stays DOM: site header overlays, a "Drag to explore" pill (fades out on first
  drag), `cursor-grab`/`cursor-grabbing` classes — matching the reference's layout.

## 5. Implementation phases

**Phase 1 — pipeline + static grid (the hard core)**
- Atlas script + manifest; layout builder (columns = `max(3, ceil(2·(w/h)·1.25) + 2)`,
  columnWidth = 1 world unit, cell height = aspect); layout DataTexture; fragment shader with
  infinite wrap + binary search + gaps + vignette. Static render, no interaction.
- Exit criteria: full-viewport seamless infinite grid of the artwork at 60fps.

**Phase 2 — drag**
- Pointer + touch handlers, lerped offset with momentum, `uDistortion→0.08` / `uZoom→1.25` /
  radial-blur ramp on press, ease-back on release, drag threshold, dragging cursor.
- Exit criteria: matches reference feel (fisheye + zoom-out + edge blur, glide on release).

**Phase 3 — hover shine + video**
- CPU inverse-mapping for hovered cell (must invert distortion since hover works mid-drag-decay);
  current/prev hover intensity pair; inset + shine sweep shader; GIF-as-video plays on hover via
  `uActiveVideoTexture`, pauses/rewinds on leave.
- Exit criteria: shine sweeps once per hover-enter, crossfades cleanly between adjacent cells.

**Phase 4 — polish + integration**
- Intro radial stagger (2s, ease-out-quint), `document.hidden` rAF pause, context-loss handler,
  `prefers-reduced-motion` → skip distortion/shine-sweep animation (instant hover state, no
  intro), mobile: touch-drag `.005` sensitivity + tap = hover-toggle, Safari fallbacks
  (blur samples 4, lerp 0.18), dispose audit, link the page into nav/work section.
- Exit criteria: Lighthouse clean on the route, no leaks on repeated mount/unmount, works on
  iOS Safari.

## 6. Performance & risk notes
- 4608² RGB texture ≈ 85MB VRAM — fine on desktop/mobile GPUs from the last decade; Safari/
  low-end path can load the half-scale atlas (2304²) chosen by `navigator.userAgent`/
  `MAX_TEXTURE_SIZE` probe.
- Radial blur re-runs the whole cell lookup per sample (8×) — it's edge-masked so most pixels
  take 1 sample; keep the `blurFactor < 0.01` early-out exactly like the reference.
- `pixelRatio` capped at 1.5, antialias off (the atlas sampling is the AA).
- No SSR for the canvas; the page still server-renders header/fallback content for SEO.

## 7. Decisions (confirmed with Faisal, 2026-07-08)
1. **Route**: `/artwork`, standalone page with its own nav entry.
2. **Curation**: prune obvious clutter — I propose an exclude list (process screenshots,
   WhatsApp duplicates) for approval before the atlas is built; the script takes it as config.
3. **Shine styling**: soft white sweep — diagonal additive band, ~45% opacity, one pass per
   hover-enter.
4. **Extras**: GIF converts to MP4 and plays on hover (reference-style video slot); no captions.
