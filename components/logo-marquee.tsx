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
    return () => window.removeEventListener("resize", measure);
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
            className="flex items-center gap-16 pr-16"
          >
            {brands.map((brand, i) => (
              <span
                key={i}
                className="whitespace-nowrap font-serif text-2xl italic text-silver transition-colors hover:text-foreground"
              >
                {brand.name}
              </span>
            ))}
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
      <div className="flex flex-col gap-6">
        <MarqueeRow brands={topRow} direction="right" />
        <MarqueeRow brands={bottomRow} direction="left" />
      </div>
    </section>
  );
}
