"use client"

import dynamic from "next/dynamic"
import type { ArtworkManifest } from "./layout"

const CanvasMount = dynamic(() => import("./canvas-mount"), { ssr: false })

export function InfiniteCanvas({ manifest }: { manifest: ArtworkManifest }) {
  return <CanvasMount manifest={manifest} />
}
