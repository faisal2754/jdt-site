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
  // TODO(owner): replace placeholder phone number with the real WhatsApp number (display + href).
  phone: "+27 82 123 4567",
  whatsapp: "https://wa.me/27821234567",
  logo: "/images/jdt-logo.png",
  socials: {
    // TODO(owner): replace placeholder Facebook URL with the real account.
    facebook: "https://facebook.com/jdtpromotions",
    // TODO(owner): replace placeholder LinkedIn URL with the real company page.
    linkedin: "https://linkedin.com/company/jdtpromotions",
  },
  areaServed: { country: "ZA", region: "Gauteng" },
} as const
