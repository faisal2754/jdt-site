"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Brand } from "@/lib/db/schema";

const SPEED = 30; // px per second — constant regardless of row length

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

  useEffect(() => {
    const measure = () => {
      const unit = unitRef.current?.offsetWidth ?? 0;
      const view = containerRef.current?.offsetWidth ?? 0;
      if (unit <= 0) return;
      setUnitWidth(unit);
      // Enough copies that (copies - 1) units always overfill the viewport,
      // so there's never empty space at either end of the loop.
      setCopies(Math.max(2, Math.ceil(view / unit) + 1));
    };
    measure();
    window.addEventListener("resize", measure);
    // Logos are variable-width <img>s that arrive asynchronously, so the first
    // measure() can run before they have laid out. Re-measure whenever the
    // measured unit's box changes (each logo load grows it) so unitWidth and
    // the copy count settle to the correct values with no gaps in the loop.
    const unit = unitRef.current;
    const observer =
      unit && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    if (unit) observer?.observe(unit);
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [brands]);

  const animate =
    shouldReduceMotion || unitWidth === 0
      ? undefined
      : { x: direction === "left" ? [0, -unitWidth] : [-unitWidth, 0] };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
    >
      <motion.div
        className="flex w-max items-center"
        animate={animate}
        transition={{
          duration: unitWidth / SPEED,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        {Array.from({ length: copies }).map((_, c) => (
          <div
            key={c}
            ref={c === 0 ? unitRef : undefined}
            aria-hidden={c > 0}
            // gap and pr-* MUST stay equal so the seam between repeated units
            // keeps the same rhythm as items within a unit (seamless loop).
            className="flex items-center gap-12 pr-12 md:gap-16 md:pr-16"
          >
            {brands.map((brand, i) =>
              brand.logoUrl ? (
                // Plain <img>: logos are fixed-height / variable-width, and we
                // have no per-logo intrinsic dimensions, so next/image (which
                // wants width+height or fill) would either letterbox to a fixed
                // box or need a positioned wrapper. h-* + w-auto + object-contain
                // lets the browser size width from the file's own ratio.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={brand.logoUrl}
                  alt={c === 0 ? brand.name : ""}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="h-7 w-auto select-none object-contain opacity-60 transition-opacity duration-300 ease-smooth hover:opacity-100 md:h-8"
                />
              ) : (
                <span
                  key={i}
                  className="whitespace-nowrap font-serif text-2xl italic text-silver transition-colors duration-300 ease-smooth hover:text-foreground"
                >
                  {brand.name}
                </span>
              ),
            )}
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
