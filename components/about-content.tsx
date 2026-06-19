"use client"

import Image from "next/image"
import { Fragment, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Check, Compass, Flame, Infinity as InfinityIcon, X } from "lucide-react"
import { ContactButton } from "@/components/contact-button"

/* ---------------------------------------------------------------- */
/* 1. Origin hero — parallax image + staggered headline             */
/* ---------------------------------------------------------------- */

function OriginHero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"])
  const overlay = useTransform(scrollYProgress, [0, 1], [0.15, 0.6])

  const line1 = "We were on the".split(" ")
  const line2 = "other side first.".split(" ")

  return (
    <section ref={ref} className="relative overflow-hidden border-b border-border bg-background pt-32 pb-16 lg:pt-44 lg:pb-24">
      <motion.div style={{ y: imageY }} className="absolute inset-0 -z-10 scale-110">
        <Image
          src="/images/about-studio.png"
          alt="JDT Promotions studio at work"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <motion.div style={{ opacity: overlay }} className="absolute inset-0 -z-10 bg-background" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/40 to-transparent" />

      <div className="mx-auto w-full max-w-7xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6 }}
          className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
        >
          About JDT
        </motion.p>
        <h1 className="max-w-4xl font-sans text-5xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          <span className="block">
            {line1.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: "100%", filter: "blur(2px)" }}
                animate={{ opacity: 1, y: "0%", filter: "blur(0px)" }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="mr-[0.25em] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </span>
          <span className="block">
            {line2.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: "100%", filter: "blur(2px)" }}
                animate={{ opacity: 1, y: "0%", filter: "blur(0px)" }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="mr-[0.25em] inline-block font-serif italic font-normal text-silver-bright"
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground lg:text-lg"
        >
          Before JDT was a studio, we were the brand on the hunt — searching for designers, printers and talent who
          could keep up with our imagination. So we built the partner we always wished we had.
        </motion.p>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- */
/* 2. "The search" — side-by-side comparison of the struggle & JDT  */
/* ---------------------------------------------------------------- */

const comparisons = [
  {
    before: "Designers who played it safe and handed back the obvious.",
    after: "Concepts that push past the brief instead of shrinking to fit it.",
  },
  {
    before: "Printers who flinched at anything outside a standard size.",
    after: "Print, talent and technology under a single, accountable roof.",
  },
  {
    before: "Talent agencies that ghosted the moment things got ambitious.",
    after: "People who treat your impossible idea as the starting line.",
  },
  {
    before: "Five vendors, five timelines, and no one owning the vision.",
    after: "One partner, one timeline, fully owning the outcome.",
  },
] as const

function TheSearch() {
  return (
    <section className="border-t border-border bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Why we exist</p>
          <h2 className="max-w-2xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            We know the frustration <span className="font-serif italic font-normal text-silver-bright">firsthand</span>
          </h2>
          <p className="max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
            We spent years on your side of the table, hunting for people who could keep up. Here&apos;s what we kept
            running into — and what we built JDT to be instead.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-3xl border border-border sm:grid-cols-2">
          {/* Column header: the struggle */}
          <div className="flex items-center gap-2 border border-border bg-background px-6 py-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">The search</span>
          </div>
          {/* Column header: the answer */}
          <div className="flex items-center gap-2 border border-border bg-secondary px-6 py-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">Finding JDT</span>
          </div>

          {comparisons.map((row, i) => (
            <Fragment key={i}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex items-start gap-3 border border-border bg-background p-6"
              >
                <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-sm leading-relaxed text-muted-foreground">{row.before}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.05 + 0.05 }}
                className="flex items-start gap-3 border border-border bg-card p-6"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-silver-bright" />
                <p className="text-sm leading-relaxed text-foreground">{row.after}</p>
              </motion.div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- */
/* 3. Manifesto — scroll-linked word highlight                      */
/* ---------------------------------------------------------------- */

const manifesto =
  "We are dreamers, builders and boundary-pushers. We exist to do the things nobody else will attempt — and we do it for you."

function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.25"] })
  const words = manifesto.split(" ")

  return (
    <section className="bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-4xl px-6">
        <p ref={ref} className="flex flex-wrap font-sans text-3xl font-medium leading-snug tracking-tight sm:text-4xl lg:text-5xl">
          {words.map((word, i) => {
            const start = i / words.length
            const end = start + 1 / words.length
            return <ManifestoWord key={i} progress={scrollYProgress} range={[start, end]} word={word} />
          })}
        </p>
      </div>
    </section>
  )
}

function ManifestoWord({
  progress,
  range,
  word,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"]
  range: [number, number]
  word: string
}) {
  const opacity = useTransform(progress, range, [0.2, 1])
  const isAccent = word === "you." || word === "you"
  return (
    <span className="mr-[0.25em] inline-block">
      <motion.span style={{ opacity }} className={isAccent ? "font-serif italic font-normal text-silver-bright" : "text-foreground"}>
        {word}
      </motion.span>
    </span>
  )
}

/* ---------------------------------------------------------------- */
/* 4. Values                                                        */
/* ---------------------------------------------------------------- */

const values = [
  {
    icon: Compass,
    title: "Imagination first",
    body: "We start from what's possible, not what's easy. The brief is a floor, never a ceiling.",
  },
  {
    icon: Flame,
    title: "Built for the impossible",
    body: "The jobs other studios turn down are the ones we get excited about. Ambition is the entry fee.",
  },
  {
    icon: InfinityIcon,
    title: "We do it for you",
    body: "Your vision, fully owned end to end — print, people and technology under one relentless team.",
  },
]

function Values() {
  return (
    <section className="border-t border-border bg-card py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-12 max-w-2xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          What we <span className="font-serif italic font-normal text-silver-bright">stand for</span>
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {values.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group flex flex-col gap-4 rounded-3xl bg-background p-8 shadow-card transition-shadow duration-300 ease-smooth hover:shadow-elevated"
            >
              <span className="flex size-12 items-center justify-center rounded-full border border-border bg-secondary transition-transform group-hover:scale-110">
                <value.icon className="size-5 text-silver-bright" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold text-foreground">{value.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{value.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- */
/* 5. Closing CTA                                                   */
/* ---------------------------------------------------------------- */

function AboutCta() {
  return (
    <section className="bg-background py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8 rounded-3xl bg-card px-6 py-16 text-center shadow-card sm:px-12 lg:py-24"
        >
          <h2 className="max-w-3xl text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Bring us the idea everyone else{" "}
            <span className="font-serif italic font-normal text-silver-bright">said no to.</span>
          </h2>
          <ContactButton size="lg" />
        </motion.div>
      </div>
    </section>
  )
}

export function AboutContent() {
  return (
    <>
      <OriginHero />
      <TheSearch />
      <Manifesto />
      <Values />
      <AboutCta />
    </>
  )
}
