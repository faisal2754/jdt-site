"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import type { Brand } from "@/lib/db/schema";

const SPEED = 30; // px per second — constant regardless of row length
const BRAND_LOGO_DIMENSIONS: Record<
  string,
  { width: number; height: number }
> = {
  amd: { width: 430, height: 104 },
  arbitrum: { width: 430, height: 111 },
  asus: { width: 430, height: 86 },
  audi: { width: 430, height: 268 },
  capitec: { width: 430, height: 64 },
  celestia: { width: 430, height: 111 },
  comiccon: { width: 430, height: 162 },
  coolermaster: { width: 430, height: 342 },
  dyson: { width: 430, height: 163 },
  feastables: { width: 430, height: 143 },
  fractal: { width: 430, height: 139 },
  gate: { width: 430, height: 98 },
  godmode: { width: 430, height: 72 },
  hollywoodbets: { width: 430, height: 155 },
  intel: { width: 430, height: 170 },
  kalshi: { width: 430, height: 112 },
  kaspersky: { width: 430, height: 82 },
  layerzero: { width: 430, height: 116 },
  lenovo: { width: 430, height: 142 },
  lg: { width: 430, height: 66 },
  logitech: { width: 430, height: 131 },
  microsoft: { width: 430, height: 92 },
  mrbeast: { width: 430, height: 92 },
  mtn: { width: 430, height: 216 },
  nvidia: { width: 430, height: 80 },
  origin: { width: 430, height: 100 },
  polymarket: { width: 430, height: 98 },
  predator: { width: 430, height: 130 },
  rage: { width: 430, height: 213 },
  rainbet: { width: 430, height: 147 },
  razer: { width: 430, height: 100 },
  rode: { width: 430, height: 230 },
  spotify: { width: 430, height: 130 },
  stake: { width: 430, height: 214 },
  tang: { width: 430, height: 150 },
  usn: { width: 430, height: 102 },
  verbatim: { width: 430, height: 81 },
};

function logoDimensionsFor(logoUrl: string) {
  const fileName = logoUrl.split("?")[0]?.split("/").at(-1);
  const slug = fileName?.replace(/\.webp$/i, "");
  return slug ? BRAND_LOGO_DIMENSIONS[slug] : undefined;
}

function MarqueeRow({
  brands,
  direction,
}: {
  brands: Brand[];
  direction: "left" | "right";
}) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const [unitWidth, setUnitWidth] = useState(0);
  const [isMeasured, setIsMeasured] = useState(false);

  useEffect(() => {
    const measure = () => {
      const unit = unitRef.current?.offsetWidth ?? 0;
      const view = containerRef.current?.offsetWidth ?? 0;
      if (unit <= 0) return;
      setUnitWidth(unit);
      setIsMeasured(true);
      // Enough copies that (copies - 1) units always overfill the viewport,
      // so there's never empty space at either end of the loop.
      setCopies(Math.max(2, Math.ceil(view / unit) + 1));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [brands]);

  const xAnimation =
    shouldReduceMotion || unitWidth === 0
      ? undefined
      : direction === "left"
        ? [0, -unitWidth]
        : [-unitWidth, 0];

  const animate = xAnimation
    ? { opacity: isMeasured ? 1 : 0, x: xAnimation }
    : { opacity: isMeasured ? 1 : 0 };

  const transition: Transition = xAnimation
    ? {
        opacity: { duration: 0.22, ease: "easeOut" },
        x: {
          duration: unitWidth / SPEED,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        },
      }
    : { opacity: { duration: 0.22, ease: "easeOut" } };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
    >
      <motion.div
        className="flex w-max items-center"
        initial={{ opacity: 0 }}
        animate={animate}
        transition={transition}
      >
        {Array.from({ length: copies }).map((_, c) => (
          <div
            key={c}
            ref={c === 0 ? unitRef : undefined}
            aria-hidden={c > 0}
            // gap and pr-* MUST stay equal so the seam between repeated units
            // keeps the same rhythm as items within a unit (seamless loop).
            className="flex items-center gap-11 pr-11 md:gap-14 md:pr-14"
          >
            {brands.map((brand, i) => {
              const dimensions = brand.logoUrl
                ? logoDimensionsFor(brand.logoUrl)
                : undefined;

              return brand.logoUrl ? (
                // Width/height reserve each logo's natural footprint before
                // bytes arrive, while CSS keeps the visual height consistent.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={brand.logoUrl}
                  alt={c === 0 ? brand.name : ""}
                  width={dimensions?.width}
                  height={dimensions?.height}
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  className="h-6 w-auto shrink-0 select-none object-contain opacity-60 transition-opacity duration-300 ease-smooth hover:opacity-100 md:h-7"
                />
              ) : (
                <span
                  key={i}
                  className="shrink-0 whitespace-nowrap font-serif text-2xl italic text-silver transition-colors duration-300 ease-smooth hover:text-foreground"
                >
                  {brand.name}
                </span>
              );
            })}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function LogoMarquee({ brands }: { brands: Brand[] }) {
  const mid = Math.ceil(brands.length / 2);
  const topRow = brands.slice(0, mid);
  const bottomRow = brands.slice(mid);
  return (
    <section
      aria-label="Brands that have built with us"
      className="border-y border-border bg-card py-12"
    >
      <div className="mx-auto max-w-7xl px-6">
        <motion.p
          initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
        >
          Brands that have built with us
        </motion.p>
      </div>
      <div className="flex flex-col gap-8">
        <MarqueeRow brands={topRow} direction="right" />
        <MarqueeRow brands={bottomRow} direction="left" />
      </div>
    </section>
  );
}
