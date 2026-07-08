"use client"

import { useEffect, useRef, useState } from "react"
import { Move } from "lucide-react"
import { GalleryRenderer, type ArtworkManifest } from "./gallery-renderer"
import { useDragControls } from "./use-drag-controls"

// world units per arrow-key press: ~80px of drag at mouse sensitivity (0.003)
const KEYBOARD_PAN_STEP = 80 * 0.003

export default function CanvasMount({ manifest }: { manifest: ArtworkManifest }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<GalleryRenderer | null>(null)
  const [failed, setFailed] = useState(false)
  // gates the hint pill's delayed entrance so it transitions in after mount
  const [mounted, setMounted] = useState(false)

  const { isPressed, hasDragged } = useDragControls(containerRef, rendererRef)

  useEffect(() => {
    // rAF so the pill's hidden state paints first and the entrance transitions
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    let renderer: GalleryRenderer
    try {
      renderer = new GalleryRenderer(canvas, manifest, { onError: () => setFailed(true) })
    } catch {
      // WebGL unavailable — leave the black canvas and show the fallback note
      const id = requestAnimationFrame(() => setFailed(true))
      return () => cancelAnimationFrame(id)
    }
    rendererRef.current = renderer
    renderer.setSize(container.clientWidth, container.clientHeight)

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (rect) renderer.setSize(rect.width, rect.height)
    })
    observer.observe(container)

    return () => {
      observer.disconnect()
      rendererRef.current = null
      renderer.dispose()
    }
  }, [manifest])

  const showHint = mounted && !hasDragged && !failed

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Artwork canvas, use arrow keys to pan"
      // -outline-offset-2 pulls the global :focus-visible ring inside this
      // full-bleed container so it stays visible at the viewport edges
      tabIndex={0}
      className={`absolute inset-0 touch-none select-none focus-visible:-outline-offset-2 ${isPressed ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        rendererRef.current?.setPointer(event.clientX - rect.left, event.clientY - rect.top)
      }}
      onPointerLeave={() => rendererRef.current?.clearPointer()}
      onKeyDown={(event) => {
        let dx = 0
        let dy = 0
        // panBy follows drag conventions (positive delta reveals content on
        // the opposite side), so arrow direction maps to a negative delta
        if (event.key === "ArrowLeft") dx = KEYBOARD_PAN_STEP
        else if (event.key === "ArrowRight") dx = -KEYBOARD_PAN_STEP
        else if (event.key === "ArrowUp") dy = KEYBOARD_PAN_STEP
        else if (event.key === "ArrowDown") dy = -KEYBOARD_PAN_STEP
        else return
        event.preventDefault()
        rendererRef.current?.panBy(dx, dy)
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />

      {failed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="max-w-sm px-6 text-center text-sm leading-relaxed text-muted-foreground">
            This gallery is drawn with WebGL, which your browser has disabled or doesn&apos;t
            support. The rest of the site works fine without it.
          </p>
        </div>
      )}

      {/* "Drag to explore" hint — blurs in after the intro settles, fades out
          for good on the first real drag; purely decorative, never interactive */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] flex justify-center transition-[opacity,transform,filter] duration-500 ease-smooth ${
          showHint ? "translate-y-0 opacity-100 blur-none delay-[2200ms]" : "translate-y-1.5 opacity-0 blur-[2px]"
        }`}
      >
        <span className="flex items-center gap-2 rounded-full bg-background/70 px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground shadow-card backdrop-blur-md">
          <Move className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          Drag to explore
        </span>
      </div>
    </div>
  )
}
