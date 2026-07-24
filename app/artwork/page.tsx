import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { InfiniteCanvas } from "@/components/artwork/infinite-canvas"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbSchema } from "@/lib/structured-data"
import type { ArtworkManifest } from "@/components/artwork/layout"
// static import: bundled at build time, so ISR regeneration never depends on
// the deployed filesystem the way a runtime fs.readFile would
import manifestJson from "@/public/artwork/manifest.json"

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "An infinite canvas of artwork, design and illustration from the JDT Promotions studio. Drag to explore.",
  alternates: { canonical: "/artwork" },
}

const manifest = manifestJson as ArtworkManifest

export default function ArtworkPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Portfolio", path: "/artwork" },
        ])}
      />
      <SiteHeader />
      <main id="main" className="relative h-dvh w-full overflow-hidden bg-black">
        <h1 className="sr-only">Portfolio</h1>
        <p className="sr-only">
          An infinite canvas of artwork, design and illustration from the JDT Promotions studio.
        </p>
        <InfiniteCanvas manifest={manifest} />
      </main>
    </>
  )
}
