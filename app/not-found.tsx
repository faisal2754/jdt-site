import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/cta-footer'

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="flex min-h-[60vh] flex-col items-center justify-center px-6 pt-32 pb-20 text-center"
      >
        <p className="font-serif italic text-7xl text-silver-bright sm:text-8xl">
          404
        </p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Back to home
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
