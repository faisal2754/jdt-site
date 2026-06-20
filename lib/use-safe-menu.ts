'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Point = { x: number; y: number }

/**
 * Slack (px) added around the panel's near edge so the safe triangle is a
 * little forgiving of imprecise mouse paths.
 */
const EDGE_BUFFER = 12

function sign(p: Point, a: Point, b: Point) {
  return (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y)
}

/** Standard barycentric-sign point-in-triangle test. */
function pointInTriangle(p: Point, a: Point, b: Point, c: Point) {
  const d1 = sign(p, a, b)
  const d2 = sign(p, b, c)
  const d3 = sign(p, c, a)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

/**
 * Hover-menu state with a "safe triangle" (a.k.a. menu-aim) close behavior.
 *
 * When the cursor leaves the trigger/panel, the menu doesn't close instantly.
 * Instead it stays open while the cursor keeps travelling *toward* the panel —
 * i.e. while it remains inside the triangle drawn from the point it left at to
 * the panel edge it's approaching. Veer away and it closes after `closeDelay`.
 *
 * Wire `triggerRef` to the element wrapping the trigger + panel, and
 * `contentRef` to the panel itself.
 */
export function useSafeMenu({ closeDelay = 100 }: { closeDelay?: number } = {}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Last cursor position known to be safely inside the trigger/panel — the
  // apex the triangle is anchored to once the cursor steps outside.
  const lastInside = useRef<Point | null>(null)

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const openMenu = useCallback(() => {
    clearCloseTimer()
    setOpen(true)
  }, [clearCloseTimer])

  const closeMenu = useCallback(() => {
    clearCloseTimer()
    setOpen(false)
  }, [clearCloseTimer])

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay)
  }, [clearCloseTimer, closeDelay])

  useEffect(() => {
    if (!open) return

    function handleMove(e: MouseEvent) {
      const trigger = triggerRef.current
      const content = contentRef.current
      if (!trigger || !content) return

      const target = e.target as Node
      const point: Point = { x: e.clientX, y: e.clientY }

      // Over the trigger or the panel → safely open; remember the position.
      if (trigger.contains(target) || content.contains(target)) {
        clearCloseTimer()
        lastInside.current = point
        return
      }

      // Outside both. Build the triangle from the last safe point to whichever
      // panel edge the cursor is heading for, and keep open only while inside.
      const rect = content.getBoundingClientRect()
      const apex = lastInside.current ?? point

      let b: Point
      let c: Point
      if (point.y <= rect.top) {
        b = { x: rect.left - EDGE_BUFFER, y: rect.top }
        c = { x: rect.right + EDGE_BUFFER, y: rect.top }
      } else if (point.y >= rect.bottom) {
        b = { x: rect.left - EDGE_BUFFER, y: rect.bottom }
        c = { x: rect.right + EDGE_BUFFER, y: rect.bottom }
      } else if (point.x <= rect.left) {
        b = { x: rect.left, y: rect.top - EDGE_BUFFER }
        c = { x: rect.left, y: rect.bottom + EDGE_BUFFER }
      } else {
        b = { x: rect.right, y: rect.top - EDGE_BUFFER }
        c = { x: rect.right, y: rect.bottom + EDGE_BUFFER }
      }

      if (pointInTriangle(point, apex, b, c)) {
        clearCloseTimer() // still aiming at the panel — keep it open
      } else {
        scheduleClose() // veered away — let it close
      }
    }

    document.addEventListener('mousemove', handleMove)
    return () => document.removeEventListener('mousemove', handleMove)
  }, [open, clearCloseTimer, scheduleClose])

  // Drop any pending timer on unmount.
  useEffect(() => clearCloseTimer, [clearCloseTimer])

  return { open, setOpen, openMenu, closeMenu, triggerRef, contentRef }
}
