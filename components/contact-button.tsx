"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

type ContactButtonProps = {
  variant?: "solid" | "outline"
  size?: "xs" | "sm" | "md" | "lg"
  href?: string
  className?: string
  onClick?: () => void
  fullWidth?: boolean
}

const sizeClasses = {
  xs: "px-5 py-2.5 text-sm",
  sm: "px-6 py-3 text-sm",
  md: "px-7 py-3.5 text-sm",
  lg: "px-8 py-4 text-sm",
}

const variantClasses = {
  solid:
    "bg-primary text-primary-foreground ring-1 ring-inset ring-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)]",
  outline: "border border-border bg-background text-foreground",
}

/**
 * Site-wide call-to-action. Reads "Contact us" and, on hover, the label rolls
 * up while a bold "JDT" wordmark rises in, accompanied by a silver sheen sweep.
 */
export function ContactButton({
  variant = "solid",
  size = "md",
  href = "/contact",
  className = "",
  onClick,
  fullWidth = false,
}: ContactButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full font-semibold transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {/* Sliding label stack */}
      <span className="relative block overflow-hidden">
        <span className="flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:-translate-y-[160%]">
          Contact us
          <ArrowUpRight className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex translate-y-[160%] items-center justify-center font-sans font-extrabold tracking-[0.2em] transition-transform duration-300 ease-out group-hover:translate-y-0"
        >
          JDT
        </span>
      </span>

      {/* Silver sheen sweep */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-silver-bright/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
    </Link>
  )
}
