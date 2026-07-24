"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ContactButton } from "@/components/contact-button";

const heroImages = [
  ...Array.from({ length: 11 }, (_, i) => ({
    src: `/images/hero/hero-${String(i + 1).padStart(2, "0")}.png`,
    alt: `JDT Promotions project work ${i + 1}`,
  })),
  ...Array.from({ length: 16 }, (_, i) => ({
    src: `/images/hero/hero-${String(i + 12).padStart(2, "0")}.jpg`,
    alt: `JDT Promotions project work ${i + 12}`,
  })),
];

const columnOne = heroImages.filter((_, i) => i % 2 === 0);
const columnTwo = heroImages.filter((_, i) => i % 2 === 1);

function ScrollColumn({
  images,
  duration,
  reverse = false,
  priority = false,
}: {
  images: { src: string; alt: string }[];
  duration: number;
  reverse?: boolean;
  priority?: boolean;
}) {
  const doubled = [...images, ...images];
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="relative h-full overflow-hidden">
      <motion.div
        className="flex flex-col gap-4"
        animate={
          shouldReduceMotion
            ? undefined
            : { y: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }
        }
        transition={{
          duration,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        {doubled.map((img, i) => (
          <div
            key={i}
            className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-xl border border-border/60"
          >
            <Image
              src={img.src || "/placeholder.svg"}
              alt={i < images.length ? img.alt : ""}
              fill
              sizes="(max-width: 768px) 40vw, 220px"
              quality={90}
              className="object-cover"
              priority={priority && i === 0}
              loading={priority && i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 pb-20 pt-28 md:pt-36 lg:flex-row lg:items-center lg:gap-8 lg:pb-28">
        {/* Copy */}
        <div className="flex max-w-2xl flex-col items-start gap-6 lg:flex-1">
          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground"
          >
            Design. Print. Talent. Development.
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-balance font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            One partner,{" "}
            <span className="font-serif italic font-normal text-silver-bright">
              unlimited
            </span>{" "}
            possibilities.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            JDT Promotions is a single point of execution for brands seeking
            next-level design, perfect print, influential talent, and new-gen
            tech solutions.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(2px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4"
          >
            <ContactButton />
            <Link
              href="#services"
              className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-200 ease-smooth hover:bg-secondary active:scale-[0.98]"
            >
              Explore services
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2"
          >
            <span
              className="flex items-center gap-1"
              aria-label="Rated 5 stars by clients"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-4 text-silver-bright"
                  aria-hidden="true"
                >
                  <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.74.99-5.79-4.21-4.1 5.82-.85L10 1.5z" />
                </svg>
              ))}
            </span>
            <span
              className="size-1 rounded-full bg-border"
              aria-hidden="true"
            />
            <span className="text-sm text-muted-foreground">
              150+ projects delivered
            </span>
            <span
              className="size-1 rounded-full bg-border"
              aria-hidden="true"
            />
            <span className="text-sm text-muted-foreground">
              Same-day quotes
            </span>
          </motion.div>
        </div>

        {/* Scrolling collage */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative flex h-[420px] w-full items-end gap-4 lg:h-[560px] lg:flex-1"
        >
          <div className="grid h-full flex-1 grid-cols-2 gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
            <ScrollColumn images={columnOne} duration={170} priority />
            <ScrollColumn images={columnTwo} duration={200} reverse />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
