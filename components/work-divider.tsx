"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

const text = "Every project here started with a simple conversation."

export function WorkDivider() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.25"] })
  const words = text.split(" ")

  return (
    <section className="border-y border-border bg-background py-24 lg:py-36">
      <div className="mx-auto max-w-4xl px-6">
        <motion.p
          ref={ref}
          initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap font-sans text-3xl font-medium leading-snug tracking-tight sm:text-4xl lg:text-5xl"
        >
          {words.map((word, i) => {
            const start = i / words.length
            const end = start + 1 / words.length
            return <DividerWord key={i} progress={scrollYProgress} range={[start, end]} word={word} />
          })}
        </motion.p>
      </div>
    </section>
  )
}

function DividerWord({
  progress,
  range,
  word,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"]
  range: [number, number]
  word: string
}) {
  const opacity = useTransform(progress, range, [0.2, 1])
  const isAccent = word === "a" || word === "simple" || word === "conversation."
  return (
    <span className="mr-[0.25em] inline-block">
      <motion.span style={{ opacity }} className={isAccent ? "font-serif italic font-normal text-silver-bright" : "text-foreground"}>
        {word}
      </motion.span>
    </span>
  )
}
