"use client"

import { useEffect, useState, type RefObject } from "react"

export interface DragTarget {
  panBy(dx: number, dy: number): void
  setPressed(pressed: boolean): void
  // x/y in CSS pixels relative to the element top-left
  toggleHoverAt?(x: number, y: number): void
}

const MOUSE_SENSITIVITY = 0.003
const TOUCH_SENSITIVITY = 0.005
const DRAG_THRESHOLD_PX = 2

export function useDragControls(
  elementRef: RefObject<HTMLElement | null>,
  targetRef: RefObject<DragTarget | null>,
): { isPressed: boolean; hasDragged: boolean } {
  const [isPressed, setIsPressed] = useState(false)
  // latches on the first past-threshold drag; drives the hint pill fade-out
  const [hasDragged, setHasDragged] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    let pointerId: number | null = null
    let passedThreshold = false
    let sensitivity = MOUSE_SENSITIVITY
    let startX = 0
    let startY = 0
    let lastX = 0
    let lastY = 0

    const onPointerDown = (event: PointerEvent) => {
      if (pointerId !== null || (event.pointerType === "mouse" && event.button !== 0)) return
      pointerId = event.pointerId
      passedThreshold = false
      sensitivity = event.pointerType === "touch" ? TOUCH_SENSITIVITY : MOUSE_SENSITIVITY
      startX = lastX = event.clientX
      startY = lastY = event.clientY
      try {
        element.setPointerCapture(event.pointerId)
      } catch {
        // pointer already gone (e.g. released mid-dispatch) — drag still works uncaptured
      }
      targetRef.current?.setPressed(true)
      setIsPressed(true)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      if (!passedThreshold) {
        if (Math.hypot(event.clientX - startX, event.clientY - startY) < DRAG_THRESHOLD_PX) return
        // first pan below includes the pre-threshold movement (lastX/Y untouched)
        passedThreshold = true
        setHasDragged(true)
      }
      targetRef.current?.panBy((event.clientX - lastX) * sensitivity, (event.clientY - lastY) * sensitivity)
      lastX = event.clientX
      lastY = event.clientY
    }

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      pointerId = null
      targetRef.current?.setPressed(false)
      setIsPressed(false)
      // pre-threshold touch release = tap: toggle hover on the tapped cell
      // (mouse clicks do nothing — hover already tracks the cursor)
      if (!passedThreshold && event.pointerType === "touch" && event.type === "pointerup") {
        const rect = element.getBoundingClientRect()
        targetRef.current?.toggleHoverAt?.(event.clientX - rect.left, event.clientY - rect.top)
      }
    }

    element.addEventListener("pointerdown", onPointerDown)
    element.addEventListener("pointermove", onPointerMove)
    element.addEventListener("pointerup", onPointerEnd)
    element.addEventListener("pointercancel", onPointerEnd)
    // capture can be stolen (element removal, browser gestures) without a
    // pointerup/cancel ever arriving; end the press so it can't get stuck
    // (onPointerEnd no-ops when pointerup already ran, and only pointerup
    // triggers the tap-toggle)
    element.addEventListener("lostpointercapture", onPointerEnd)

    return () => {
      element.removeEventListener("pointerdown", onPointerDown)
      element.removeEventListener("pointermove", onPointerMove)
      element.removeEventListener("pointerup", onPointerEnd)
      element.removeEventListener("pointercancel", onPointerEnd)
      element.removeEventListener("lostpointercapture", onPointerEnd)
      // no setPressed reset: cleanup only runs at unmount, where the renderer
      // is disposed by canvas-mount right after
      setIsPressed(false)
    }
  }, [elementRef, targetRef])

  return { isPressed, hasDragged }
}
