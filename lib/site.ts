/**
 * Single source of truth for JDT Promotions' business identity.
 *
 * Every consumer (footer, contact form, structured data, metadata) should read
 * its identity values from here rather than hardcoding them. When the real
 * values land, a single edit in this file updates every consumer.
 *
 * Placeholder fields are marked with `TODO(owner)` — replace them before launch.
 */
export const site = {
  name: "JDT Promotions",
  url: "https://jdtpromotions.com",
  description:
    "JDT Promotions delivers world-class printing and design, talent management, and AI-powered development. One team for everything your brand needs.",
  email: "hello@jdtpromotions.com",
  // The phone has two representations: a human-readable display value and a
  // wa.me href. Consumers pick whichever they need.
  phone: "+27 76 897 4866",
  whatsapp: "https://wa.me/27768974866",
  logo: "/images/jdt-logo.png",
  areaServed: { country: "ZA", region: "Gauteng" },
} as const
