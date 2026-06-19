"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { creators } from "@/lib/creators"

export function CreatorCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const pausedRef = useRef(false)
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false })
  // Track the scroll position as a float. Browsers round scrollLeft to an
  // integer, so adding a sub-pixel amount each frame would otherwise truncate
  // to zero and the strip would never move. We accumulate here instead.
  const posRef = useRef(0)

  // Duplicate the roster so the strip can loop seamlessly.
  const loop = [...creators, ...creators]

  useEffect(() => {
    if (shouldReduceMotion) return
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    let last = performance.now()
    posRef.current = el.scrollLeft
    // Match the "Brands that trust us" marquee velocity: ~40px per second.
    // Timestamp-based so the pace is framerate-independent.
    const PX_PER_SECOND = 40
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const half = el.scrollWidth / 2
      if (!pausedRef.current && !drag.current.active && half > 0) {
        posRef.current += PX_PER_SECOND * dt
        if (posRef.current >= half) posRef.current -= half
        el.scrollLeft = posRef.current
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [shouldReduceMotion])

  // Keep the float accumulator in sync after any manual scroll/drag.
  const syncPos = () => {
    if (scrollRef.current) posRef.current = scrollRef.current.scrollLeft
  }

  const pause = () => {
    pausedRef.current = true
  }
  const resume = () => {
    pausedRef.current = false
  }
  const pauseTemporarily = () => {
    pausedRef.current = true
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false
    }, 1800)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    if (!el) return
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false }
    el.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    const el = scrollRef.current
    if (!el) return
    const dx = e.clientX - drag.current.startX
    if (Math.abs(dx) > 6) drag.current.moved = true
    el.scrollLeft = drag.current.startScroll - dx
    syncPos()
  }
  const onPointerUp = () => {
    drag.current.active = false
    syncPos()
    pauseTemporarily()
  }
  // Block the click navigation if the pointer was dragging.
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div className="py-12 lg:py-16">
      <div
        ref={scrollRef}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={() => {
          syncPos()
          pauseTemporarily()
        }}
        onScroll={() => {
          if (drag.current.active) syncPos()
        }}
        onTouchStart={pause}
        onTouchEnd={() => {
          syncPos()
          pauseTemporarily()
        }}
        onClickCapture={onClickCapture}
        className="flex cursor-grab gap-5 overflow-x-auto px-6 pb-4 select-none active:cursor-grabbing [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loop.map((c, i) => (
          <Link
            key={`${c.slug}-${i}`}
            href={`/creators/${c.slug}`}
            draggable={false}
            aria-label={`${c.name} — ${c.category}`}
            className="group w-56 shrink-0 sm:w-64"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card">
              <Image
                src={c.image || "/placeholder.svg"}
                alt={c.name}
                fill
                draggable={false}
                sizes="(max-width: 640px) 224px, 256px"
                className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-silver-bright">
                  {c.category}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-sans text-base font-semibold tracking-tight text-foreground">{c.name}</h3>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.location}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl justify-center px-6">
        <Link
          href="/talent"
          className="group inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-silver hover:text-foreground"
        >
          View our full roster
          <ArrowRight className="size-4 -translate-x-0.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
