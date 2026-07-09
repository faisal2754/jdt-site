import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  VideoTexture,
  WebGLRenderer,
  type IUniform,
} from "three"
import { buildLayout, columnCountFor, LAYOUT_WIDTH, type ArtworkManifest, type GalleryLayout } from "./layout"
import { createFragmentShader, vertexShader } from "./shaders"

export type { ArtworkManifest, ArtworkManifestItem } from "./layout"

export interface GalleryRendererOptions {
  atlasUrl?: string
  blurAtlasUrl?: string
  // fired when both the primary atlas and the jpg fallback fail to load
  onError?: () => void
}

const DEFAULT_ATLAS_URL = "/artwork/atlas.webp"
// 1/2-scale atlas (512px cells) for Safari, coarse pointers and small GPUs
const HALF_ATLAS_URL = "/artwork/atlas-half.webp"
const FALLBACK_ATLAS_URL = "/artwork/atlas.jpg"
const DEFAULT_BLUR_ATLAS_URL = "/artwork/atlas-blur.webp"
const MAX_PIXEL_RATIO = 1.5

// per-rAF-frame ease factor shared by every animated uniform (reference feel);
// Safari gets a faster lerp + fewer blur samples, matching the reference's fallback
const EASE = 0.1
const SAFARI_EASE = 0.18
const BLUR_SAMPLES = 8
const SAFARI_BLUR_SAMPLES = 4
const INTRO_DURATION_MS = 2000
const PRESS_DISTORTION = 0.08
// resting zoom sits slightly out (cells render smaller = sharper); the press
// target scales proportionally so a press still visibly zooms out from rest
const REST_ZOOM = 1.12
const PRESS_ZOOM = 1.4
const PRESS_BLUR = 1.3
// hover picking mirrors the shader's grid math (see sampleGrid in shaders.ts)
const COLUMN_WIDTH = 1.0
const CELL_GAP = 0.06
const SHINE_DURATION_MS = 420

interface PickedCell {
  col: number
  cell: number
  imageIndex: number
  isVideo: boolean
}

function lerp(current: number, target: number, t: number): number {
  return current + (target - current) * t
}

// mipmaps on the main atlases fix minification shimmer when zoomed out
// (WebGL2 handles NPOT mipmaps); the blur atlas stays plain linear
function prepareAtlasTexture(texture: Texture, mipmaps = false): void {
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = mipmaps ? LinearMipmapLinearFilter : LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = mipmaps
  texture.needsUpdate = true
}

function blackPixelTexture(): DataTexture {
  const texture = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
  texture.needsUpdate = true
  return texture
}

// canvases with a live renderer; consulted by dispose's deferred
// forceContextLoss so a dispose→recreate on the same canvas (React
// StrictMode's dev double-mount) doesn't hand the new renderer a dead context
const activeCanvases = new WeakMap<HTMLCanvasElement, GalleryRenderer>()

export class GalleryRenderer {
  readonly uniforms: Record<string, IUniform>

  private readonly manifest: ArtworkManifest
  private readonly renderer: WebGLRenderer
  private readonly scene: Scene
  private readonly camera: OrthographicCamera
  private readonly geometry: PlaneGeometry
  private readonly material: ShaderMaterial
  private readonly placeholder: DataTexture
  private readonly videoPlaceholder: DataTexture
  private readonly offsetTarget = new Vector2(0, 0)
  private readonly pointer = new Vector2(0, 0)
  private readonly canvas: HTMLCanvasElement
  private readonly ease: number
  private readonly motionQuery: MediaQueryList
  private reducedMotion = false
  private hasPointer = false
  private stickyHover = false
  private pressed = false
  private dragging = false
  private shineStart = 0
  private video: HTMLVideoElement | null = null
  private videoTexture: VideoTexture | null = null
  private videoSrc: string | null = null
  private videoReady = false
  // cell hovered while its video is still loading; activated on 'loadeddata'
  private pendingVideoCell: { col: number; cell: number } | null = null
  private layout: GalleryLayout | null = null
  private atlas: Texture | null = null
  private blurAtlas: Texture | null = null
  private atlasReady = false
  private introStarted = false
  private introStart = -1 // anchored on the first ticked frame after a texture lands
  private rafId = 0
  private hidden = false
  private contextLost = false
  private rafActive = true
  private pausedAt = 0
  private disposed = false
  private readonly onError?: () => void

  constructor(canvas: HTMLCanvasElement, manifest: ArtworkManifest, options: GalleryRendererOptions = {}) {
    this.manifest = manifest
    this.canvas = canvas
    this.onError = options.onError

    const ua = navigator.userAgent
    const isSafari = ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("Chromium")
    this.ease = isSafari ? SAFARI_EASE : EASE

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    })
    activeCanvases.set(canvas, this)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))

    this.placeholder = blackPixelTexture()
    this.videoPlaceholder = blackPixelTexture()

    this.uniforms = {
      uImageAtlas: { value: this.placeholder },
      uLayout: { value: null },
      uActiveVideoTexture: { value: this.videoPlaceholder },
      uResolution: { value: new Vector2(1, 1) },
      uOffset: { value: new Vector2(0, 0) },
      uZoom: { value: REST_ZOOM },
      uDistortion: { value: 0.0 },
      uRadialBlurIntensity: { value: 0.0 },
      uAtlasSize: { value: manifest.atlasSize },
      uNumColumns: { value: 1 },
      uLayoutRows: { value: 1 },
      uHoveredCell: { value: new Vector2(-1, -1) },
      uHoverIntensity: { value: 0.0 },
      uPrevHoveredCell: { value: new Vector2(-1, -1) },
      uPrevHoverIntensity: { value: 0.0 },
      uShineProgress: { value: 0.0 },
      uActiveVideoCell: { value: new Vector2(-1, -1) },
      uIntroProgress: { value: 0.0 },
      uIntroCenter: { value: new Vector2(0, 0) },
    }

    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.geometry = new PlaneGeometry(2, 2)
    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader: createFragmentShader(isSafari ? SAFARI_BLUR_SAMPLES : BLUR_SAMPLES),
      depthTest: false,
      depthWrite: false,
    })
    this.scene = new Scene()
    this.scene.add(new Mesh(this.geometry, this.material))

    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    this.applyReducedMotion(this.motionQuery.matches)
    this.motionQuery.addEventListener("change", this.onMotionChange)
    document.addEventListener("visibilitychange", this.onVisibilityChange)
    // three's WebGLRenderer also handles these; ours pauses the loop and forces
    // texture re-upload so restoration never shows a broken frame
    canvas.addEventListener("webglcontextlost", this.onContextLost)
    canvas.addEventListener("webglcontextrestored", this.onContextRestored)

    this.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1)
    // full atlas is 7168px on a side; take the half-res one on Safari, on
    // coarse-pointer/mobile devices and on GPUs that can't hold the full size
    const useHalfAtlas =
      isSafari ||
      window.matchMedia("(pointer: coarse)").matches ||
      this.renderer.capabilities.maxTextureSize < 8192
    this.loadAtlases(
      options.atlasUrl ?? (useHalfAtlas ? HALF_ATLAS_URL : DEFAULT_ATLAS_URL),
      options.blurAtlasUrl ?? DEFAULT_BLUR_ATLAS_URL,
    )
    this.rafId = requestAnimationFrame(this.tick)
    this.onVisibilityChange() // honor a tab that is already hidden at mount
  }

  // dx/dy are pre-scaled world units from screen-pixel deltas; content follows
  // the cursor, so a positive (rightward/downward) drag decreases the offset
  panBy(dx: number, dy: number): void {
    this.offsetTarget.x -= dx
    this.offsetTarget.y -= dy
    // panBy only fires past the drag threshold, so this marks an actual drag;
    // hover is suppressed until release (but works during momentum decay)
    if (this.pressed) this.dragging = true
  }

  setPressed(pressed: boolean): void {
    this.pressed = pressed
    if (!pressed) this.dragging = false
  }

  // x/y in CSS pixels relative to the canvas top-left
  setPointer(x: number, y: number): void {
    this.pointer.set(x, y)
    this.hasPointer = true
    this.stickyHover = false
  }

  clearPointer(): void {
    // a sticky (tap-toggled) hover survives the pointerleave that touch
    // browsers fire right after pointerup; only a real pointer exit clears it
    if (this.stickyHover) return
    this.hasPointer = false
  }

  // mobile tap-as-hover-toggle: tap a cell to hover it (sticky), tap the same
  // cell or a gap to clear, tap another cell to move the hover there
  toggleHoverAt(x: number, y: number): void {
    this.pointer.set(x, y)
    this.hasPointer = true
    const pick = this.pickCell()
    const hovered = this.uniforms.uHoveredCell.value as Vector2
    if (!pick || (pick.col === hovered.x && pick.cell === hovered.y)) {
      this.stickyHover = false
      this.hasPointer = false
    } else {
      this.stickyHover = true
    }
  }

  setSize(width: number, height: number): void {
    if (this.disposed || width <= 0 || height <= 0) return

    // the window may have moved to a display with a different devicePixelRatio
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
    this.renderer.setSize(width, height, false)
    ;(this.uniforms.uResolution.value as Vector2).set(width, height)

    const numColumns = columnCountFor(width, height)
    if (!this.layout || this.layout.numColumns !== numColumns) {
      this.layout?.texture.dispose()
      this.layout = buildLayout(this.manifest.items, numColumns)
      this.uniforms.uLayout.value = this.layout.texture
      this.uniforms.uNumColumns.value = this.layout.numColumns
      this.uniforms.uLayoutRows.value = this.layout.rows
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    cancelAnimationFrame(this.rafId)
    this.motionQuery.removeEventListener("change", this.onMotionChange)
    document.removeEventListener("visibilitychange", this.onVisibilityChange)
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost)
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored)
    this.disposeVideo()
    this.layout?.texture.dispose()
    this.atlas?.dispose()
    this.blurAtlas?.dispose()
    this.placeholder.dispose()
    this.videoPlaceholder.dispose()
    this.geometry.dispose()
    this.material.dispose()
    this.renderer.dispose()
    if (activeCanvases.get(this.canvas) === this) activeCanvases.delete(this.canvas)
    // release the GL context eagerly so repeated mount/unmount cycles don't
    // accumulate live contexts until the browser starts evicting them; deferred
    // a microtask so an immediate recreate on the same canvas keeps its context
    if (!this.contextLost) {
      queueMicrotask(() => {
        if (activeCanvases.has(this.canvas)) return
        try {
          this.renderer.forceContextLoss()
        } catch {
          // context already lost or extension unavailable — nothing to release
        }
      })
    }
  }

  private disposeVideo(): void {
    this.videoTexture?.dispose()
    this.videoTexture = null
    this.videoSrc = null
    this.videoReady = false
    this.pendingVideoCell = null
    if (this.video) {
      this.video.pause()
      this.video.removeAttribute("src")
      this.video.load()
      this.video = null
    }
  }

  private readonly onMotionChange = (event: MediaQueryListEvent): void => {
    this.applyReducedMotion(event.matches)
  }

  private readonly onVisibilityChange = (): void => {
    this.hidden = document.hidden
    this.syncRunning()
  }

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault()
    this.contextLost = true
    this.syncRunning()
  }

  private readonly onContextRestored = (): void => {
    this.contextLost = false
    // GPU-side texture copies died with the context; force re-upload from the
    // images/data still held on the CPU side
    if (this.atlas) this.atlas.needsUpdate = true
    if (this.blurAtlas) this.blurAtlas.needsUpdate = true
    if (this.layout) this.layout.texture.needsUpdate = true
    this.placeholder.needsUpdate = true
    this.videoPlaceholder.needsUpdate = true
    this.syncRunning()
  }

  private applyReducedMotion(matches: boolean): void {
    this.reducedMotion = matches
    if (matches) {
      // skip the intro and the shine sweep entirely (uShineProgress 1 puts the
      // band past the far edge with zero amplitude); press distortion/zoom/blur
      // targets are neutralized in tick
      this.uniforms.uIntroProgress.value = 1
      this.uniforms.uShineProgress.value = 1
    }
  }

  // single pause/resume path shared by document.hidden and context loss; the
  // wall-clock anchors (intro, shine) shift by the paused duration so
  // one-shot animations resume where they left off instead of jumping
  private syncRunning(): void {
    const shouldRun = !this.hidden && !this.contextLost && !this.disposed
    if (shouldRun === this.rafActive) return
    this.rafActive = shouldRun
    if (shouldRun) {
      const delta = performance.now() - this.pausedAt
      this.shineStart += delta
      if (this.introStart >= 0) this.introStart += delta
      this.rafId = requestAnimationFrame(this.tick)
      if ((this.uniforms.uActiveVideoCell.value as Vector2).x >= 0) {
        this.video?.play().catch(() => {})
      }
    } else {
      this.pausedAt = performance.now()
      cancelAnimationFrame(this.rafId)
      this.video?.pause()
    }
  }

  private loadAtlases(atlasUrl: string, blurAtlasUrl: string): void {
    const loader = new TextureLoader()
    loader.load(blurAtlasUrl, (texture) => {
      if (this.disposed || this.atlasReady) {
        texture.dispose()
        return
      }
      prepareAtlasTexture(texture)
      this.blurAtlas = texture
      this.uniforms.uImageAtlas.value = texture
      this.introStarted = true // intro plays once, over whichever atlas paints first
    })
    const onAtlasLoaded = (texture: Texture): void => {
      if (this.disposed) {
        texture.dispose()
        return
      }
      prepareAtlasTexture(texture, true)
      this.atlas = texture
      this.atlasReady = true
      this.uniforms.uImageAtlas.value = texture
      this.blurAtlas?.dispose()
      this.blurAtlas = null
      this.introStarted = true
    }
    loader.load(atlasUrl, onAtlasLoaded, undefined, () => {
      if (this.disposed) return
      // webp atlas failed (decode support, transient network) — retry once
      // with the jpg fallback before declaring the gallery broken
      loader.load(FALLBACK_ATLAS_URL, onAtlasLoaded, undefined, () => {
        if (this.disposed) return
        this.onError?.()
      })
    })
  }

  // maps the pointer through the shader's screen→world transform (ndcToWorld,
  // evaluated with the LIVE eased uniforms so hover tracks mid-drag-decay),
  // then runs the same column/cell lookup as sampleGrid on the layout data
  private pickCell(): PickedCell | null {
    if (!this.layout) return null
    const resolution = this.uniforms.uResolution.value as Vector2
    if (resolution.x <= 0 || resolution.y <= 0) return null

    const ndcX = (this.pointer.x / resolution.x) * 2 - 1
    const ndcY = 1 - (this.pointer.y / resolution.y) * 2

    const zoom = this.uniforms.uZoom.value as number
    const distortion = this.uniforms.uDistortion.value as number
    const offset = this.uniforms.uOffset.value as Vector2
    const barrel = 1 - distortion * (ndcX * ndcX + ndcY * ndcY)
    const worldX = ndcX * barrel * (resolution.x / resolution.y) * zoom + offset.x
    const worldY = -ndcY * barrel * zoom + offset.y

    const data = this.layout.texture.image.data as unknown as Float32Array
    const numColumns = this.layout.numColumns
    const spanX = numColumns * COLUMN_WIDTH
    const wx = ((worldX % spanX) + spanX) % spanX
    const col = Math.min(Math.floor(wx / COLUMN_WIDTH), numColumns - 1)
    const localX = wx - col * COLUMN_WIDTH

    const meta = col * 4
    const columnHeight = data[meta]
    const cellCount = data[meta + 2]
    if (cellCount < 1) return null
    const staggered = worldY + data[meta + 1]
    const wy = ((staggered % columnHeight) + columnHeight) % columnHeight

    // last cell whose y <= wy, same result as the shader's binary search
    const rowOffset = (col + 1) * LAYOUT_WIDTH * 4
    let cell = 0
    for (let i = 1; i < cellCount; i++) {
      if (data[rowOffset + i * 4] > wy) break
      cell = i
    }

    const cellY = data[rowOffset + cell * 4]
    const cellH = data[rowOffset + cell * 4 + 1]
    const cellPosX = localX
    const cellPosY = wy - cellY
    const g = CELL_GAP * 0.5
    if (cellPosX < g || cellPosX > COLUMN_WIDTH - g || cellPosY < g || cellPosY > cellH - g) {
      return null // in the gap between cells
    }

    return {
      col,
      cell,
      imageIndex: data[rowOffset + cell * 4 + 2],
      isVideo: data[rowOffset + cell * 4 + 3] > 0.5,
    }
  }

  private updateHover(now: number): void {
    const hovered = this.uniforms.uHoveredCell.value as Vector2
    const prev = this.uniforms.uPrevHoveredCell.value as Vector2

    const pick = this.hasPointer && !this.dragging ? this.pickCell() : null
    const targetCol = pick ? pick.col : -1
    const targetCell = pick ? pick.cell : -1

    if (targetCol !== hovered.x || targetCell !== hovered.y) {
      // outgoing cell keeps fading as prev while the incoming one grows; if we
      // re-enter the cell that is still fading out, it resumes at its intensity
      const carried =
        pick && prev.x === targetCol && prev.y === targetCell
          ? (this.uniforms.uPrevHoverIntensity.value as number)
          : 0
      prev.copy(hovered)
      this.uniforms.uPrevHoverIntensity.value = this.uniforms.uHoverIntensity.value
      hovered.set(targetCol, targetCell)
      this.uniforms.uHoverIntensity.value = carried
      if (pick) this.shineStart = now // shine sweep replays once per hover-enter
      this.updateVideo(pick)
    }

    // reduced motion: hover states snap instead of easing, and the shine
    // sweep is pinned at 1 (band already past the far edge = no sweep)
    const hoverEase = this.reducedMotion ? 1 : this.ease
    const hoverActive = hovered.x >= 0
    this.uniforms.uHoverIntensity.value = lerp(
      this.uniforms.uHoverIntensity.value as number,
      hoverActive ? 1 : 0,
      hoverEase,
    )
    this.uniforms.uPrevHoverIntensity.value = lerp(this.uniforms.uPrevHoverIntensity.value as number, 0, hoverEase)
    if ((this.uniforms.uPrevHoverIntensity.value as number) < 0.001) {
      this.uniforms.uPrevHoverIntensity.value = 0
      prev.set(-1, -1)
    }
    if (hoverActive && !this.reducedMotion) {
      this.uniforms.uShineProgress.value = Math.min((now - this.shineStart) / SHINE_DURATION_MS, 1)
    }
  }

  private updateVideo(pick: PickedCell | null): void {
    const activeCell = this.uniforms.uActiveVideoCell.value as Vector2
    if (pick?.isVideo) {
      const item = this.manifest.items.find((entry) => entry.index === pick.imageIndex)
      if (!item?.video) return
      if (this.videoSrc !== item.video) {
        // cache is keyed by src: a different video item replaces the element
        this.disposeVideo()
        const video = document.createElement("video")
        video.muted = true
        video.loop = true
        video.playsInline = true
        video.preload = "auto"
        video.src = item.video
        this.video = video
        this.videoSrc = item.video
        this.videoTexture = new VideoTexture(video)
        this.videoTexture.colorSpace = SRGBColorSpace
        this.videoTexture.minFilter = LinearFilter
        this.videoTexture.magFilter = LinearFilter
        this.videoTexture.generateMipmaps = false
        video.addEventListener(
          "loadeddata",
          () => {
            if (this.disposed || this.video !== video) return
            this.videoReady = true
            // hover may still be parked on the cell that requested this video
            if (this.pendingVideoCell) {
              activeCell.set(this.pendingVideoCell.col, this.pendingVideoCell.cell)
              this.uniforms.uActiveVideoTexture.value = this.videoTexture
              this.pendingVideoCell = null
            }
          },
          { once: true },
        )
      }
      // never crossfade toward the texture before the first frame is decodable
      // (readyState >= HAVE_CURRENT_DATA), or slow networks mix toward black
      if (this.videoReady || this.video!.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        this.videoReady = true
        this.pendingVideoCell = null
        activeCell.set(pick.col, pick.cell)
        this.uniforms.uActiveVideoTexture.value = this.videoTexture
      } else {
        this.pendingVideoCell = { col: pick.col, cell: pick.cell }
      }
      this.video!.play().catch(() => {})
    } else if (activeCell.x >= 0 || this.pendingVideoCell) {
      this.pendingVideoCell = null
      activeCell.set(-1, -1)
      this.uniforms.uActiveVideoTexture.value = this.videoPlaceholder
      if (this.video) {
        this.video.pause()
        this.video.currentTime = 0
      }
    }
  }

  private tick = (): void => {
    if (this.disposed || !this.rafActive) return
    this.rafId = requestAnimationFrame(this.tick)
    const now = performance.now()

    // intro clock anchors on the first ticked frame after an atlas landed, so
    // texture decode/upload stalls never eat into the 2s window
    if (this.introStarted && (this.uniforms.uIntroProgress.value as number) < 1) {
      if (this.introStart < 0) {
        this.introStart = now
        ;(this.uniforms.uIntroCenter.value as Vector2).copy(this.uniforms.uOffset.value as Vector2)
      }
      this.uniforms.uIntroProgress.value = Math.min((now - this.introStart) / INTRO_DURATION_MS, 1)
    }

    // reduced motion keeps the drag itself (offset easing isn't vestibular-
    // triggering) but drops the fisheye/zoom/blur press effects
    const pressed = this.pressed && !this.reducedMotion
    const offset = this.uniforms.uOffset.value as Vector2
    offset.lerp(this.offsetTarget, this.ease)

    // keep uOffset.x bounded: once the drag settles, wrap offset and target
    // together by a whole horizontal span (the shader mods world.x by the same
    // span, so the jump is invisible; spanX is re-read each frame, which also
    // covers numColumns changing on resize)
    if (!this.pressed && this.layout && Math.abs(offset.x - this.offsetTarget.x) < 1e-3) {
      const spanX = this.layout.numColumns * COLUMN_WIDTH
      const wrappedTarget = ((this.offsetTarget.x % spanX) + spanX) % spanX
      const delta = wrappedTarget - this.offsetTarget.x // always a multiple of spanX
      if (delta !== 0) {
        this.offsetTarget.x = wrappedTarget
        offset.x += delta
      }
    }

    this.uniforms.uDistortion.value = lerp(
      this.uniforms.uDistortion.value as number,
      pressed ? PRESS_DISTORTION : 0,
      this.ease,
    )
    this.uniforms.uZoom.value = lerp(this.uniforms.uZoom.value as number, pressed ? PRESS_ZOOM : REST_ZOOM, this.ease)
    this.uniforms.uRadialBlurIntensity.value = lerp(
      this.uniforms.uRadialBlurIntensity.value as number,
      pressed ? PRESS_BLUR : 0,
      this.ease,
    )

    this.updateHover(now)

    if (this.layout) {
      this.renderer.render(this.scene, this.camera)
    }
  }
}
