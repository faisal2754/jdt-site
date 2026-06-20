"use client"

import type React from "react"
import { useRef, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { Mail, ArrowUpRight, Check } from "lucide-react"
import { sendContactMessage } from "@/lib/contact"

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.516 5.26l-.999 3.648 3.972-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const channels = [
  {
    label: "Email",
    value: "hello@jdtpromotions.com",
    href: "mailto:hello@jdtpromotions.com",
    icon: Mail,
    description: "Best for detailed briefs and documents.",
  },
  {
    label: "WhatsApp",
    // TODO(owner): replace placeholder phone number with the real WhatsApp number (value + href).
    value: "+27 82 123 4567",
    href: "https://wa.me/27821234567",
    icon: WhatsAppIcon,
    description: "Quick questions and fast turnarounds.",
  },
  {
    label: "Facebook",
    // TODO(owner): replace placeholder Facebook handle/URL with the real account.
    value: "/jdtpromotions",
    href: "https://facebook.com/jdtpromotions",
    icon: FacebookIcon,
    description: "Follow our latest projects and news.",
  },
  {
    label: "LinkedIn",
    // TODO(owner): replace placeholder LinkedIn handle/URL with the real company page.
    value: "JDT Promotions",
    href: "https://linkedin.com/company/jdtpromotions",
    icon: LinkedinIcon,
    description: "Connect with the team professionally.",
  },
]

const services = ["Printing & Design", "Talent Management", "AI & Development", "Not sure yet"]

const serviceSlugMap: Record<string, string> = {
  "printing-and-design": "Printing & Design",
  "talent-management": "Talent Management",
  "ai-and-development": "AI & Development",
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""

export function ContactContent() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState("")
  const turnstileRef = useRef<TurnstileInstance | null>(null)
  // Seed the selected service from the ?service= query param via a lazy
  // initializer rather than a setState-in-effect (avoids cascading renders).
  // `window` is undefined during SSR, so this safely defaults to "" there.
  const [service, setService] = useState(() => {
    if (typeof window === "undefined") return ""
    const param = new URLSearchParams(window.location.search).get("service")
    return param && serviceSlugMap[param] ? serviceSlugMap[param] : ""
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!token) {
      setError("Please complete the verification below.")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      // Pass ALL fields through the submission seam, including the selected
      // service pill (React state, not a form input) which was previously dropped.
      await sendContactMessage(
        {
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          company: String(formData.get("company") ?? ""),
          service,
          message: String(formData.get("message") ?? ""),
        },
        token,
      )

      setSubmitted(true)
    } catch (err) {
      // Turnstile tokens are single-use — reset the widget so the visitor can
      // get a fresh one and retry.
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setToken("")
      turnstileRef.current?.reset()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
      {/* Channels */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Reach us directly</p>
          <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
            Prefer to talk on your terms? Pick whichever channel suits you — we usually reply the same day.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {channels.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-card transition-shadow duration-300 ease-smooth hover:bg-muted hover:shadow-elevated active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground">
                  <channel.icon className="size-5" />
                </span>
                <ArrowUpRight className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">{channel.label}</span>
                <span className="text-sm text-foreground/80">{channel.value}</span>
                <span className="mt-1 text-xs leading-relaxed text-muted-foreground">{channel.description}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 lg:p-10">
        {submitted ? (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, scale: 0.96, filter: "blur(2px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-4 text-center"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-7" />
            </span>
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground">Message sent</h2>
            <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
              Thanks for reaching out — your message is on its way to our team and we usually reply the same day. Prefer
              another channel? Email us at{" "}
              <a href="mailto:hello@jdtpromotions.com" className="font-medium text-foreground underline">
                hello@jdtpromotions.com
              </a>{" "}
              or reach us on WhatsApp.
            </p>
            <Link
              href="/"
              className="mt-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Back to home
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground">Send us a message</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your name" htmlFor="name">
                <input
                  id="name"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-silver focus-visible:border-silver focus-visible:ring-2 focus-visible:ring-silver"
                />
              </Field>
              <Field label="Email address" htmlFor="email">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="jane@company.com"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-silver focus-visible:border-silver focus-visible:ring-2 focus-visible:ring-silver"
                />
              </Field>
            </div>

            <Field label="Company (optional)" htmlFor="company">
              <input
                id="company"
                name="company"
                autoComplete="organization"
                placeholder="Company name"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-silver focus-visible:border-silver focus-visible:ring-2 focus-visible:ring-silver"
              />
            </Field>

            <Field label="What can we help with?" htmlFor="service">
              <div role="radiogroup" aria-label="What can we help with?" className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <button
                    type="button"
                    key={s}
                    role="radio"
                    aria-checked={service === s}
                    onClick={() => setService(s)}
                    className={`rounded-full border px-4 py-2 text-sm transition-[transform,color,background-color,border-color] duration-200 ease-smooth active:scale-[0.98] ${
                      service === s
                        ? "border-silver bg-secondary text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Your message" htmlFor="message">
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                placeholder="Tell us about your project, timeline and goals."
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-silver focus-visible:border-silver focus-visible:ring-2 focus-visible:ring-silver"
              />
            </Field>

            {TURNSTILE_SITE_KEY ? (
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setToken}
                onExpire={() => setToken("")}
                onError={() => setToken("")}
                options={{ theme: "auto" }}
              />
            ) : null}

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !token}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-[transform,opacity] duration-200 ease-smooth hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="animate-pulse">Sending…</span>
              ) : (
                <>
                  Send message
                  <ArrowUpRight className="size-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
