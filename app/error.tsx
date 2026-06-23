"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  void error

  return (
    <main
      id="main"
      className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-6 pt-32 pb-20 text-center text-foreground"
    >
      <p className="font-serif italic text-6xl text-silver-bright sm:text-7xl">
        Oops
      </p>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
        Sorry, an unexpected error occurred on our end. Please try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </main>
  )
}
