/**
 * Typed JSON-LD builders for JDT Promotions.
 *
 * Each function returns a plain JSON-LD object (no rendering). All identity
 * values are read from `site` so a single edit in `lib/site.ts` propagates to
 * every schema. Organization and WebSite expose stable `@id` anchors
 * (`${site.url}#organization`, `${site.url}#website`) so other nodes can
 * cross-reference them via `@id`.
 */
import { site } from "@/lib/site"
import type { Creator } from "@/lib/creators"
import type { ServiceCategory } from "@/lib/services"

type JsonLd = Record<string, unknown>

/** Prefix root-relative paths with the site origin to make an absolute URL. */
function absolute(path: string) {
  return path.startsWith("/") ? `${site.url}${path}` : path
}

/**
 * Keep only absolute (http/https) hrefs for a `sameAs` array. Placeholder values
 * such as `"#"`, empty strings, or relative paths are dropped so we never emit
 * an invalid `sameAs` entry. Returns `{}` (spreadable, omits the key) when empty.
 */
function sameAs(hrefs: string[]): { sameAs?: string[] } {
  const valid = hrefs.filter((href) => href.startsWith("http"))
  return valid.length > 0 ? { sameAs: valid } : {}
}

export function organizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.url}#organization`,
    name: site.name,
    url: site.url,
    logo: `${site.url}${site.logo}`,
    description: site.description,
    ...sameAs([site.socials.facebook, site.socials.linkedin]),
    contactPoint: {
      "@type": "ContactPoint",
      email: site.email,
      telephone: site.phone,
      contactType: "customer service",
      areaServed: site.areaServed.country,
      availableLanguage: "English",
    },
    areaServed: {
      "@type": "Country",
      name: "South Africa",
    },
  }
}

export function websiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}#website`,
    url: site.url,
    name: site.name,
    publisher: {
      "@id": `${site.url}#organization`,
    },
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  }
}

export function personSchema(creator: Creator): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.name,
    jobTitle: creator.category,
    image: absolute(creator.imageUrl),
    description: creator.bio[0],
    ...sameAs(creator.socials.map((social) => social.href)),
    worksFor: {
      "@id": `${site.url}#organization`,
    },
    homeLocation: {
      "@type": "Place",
      name: creator.location,
    },
    address: creator.location,
  }
}

export function serviceSchema(category: ServiceCategory): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: category.label,
    description: category.description,
    serviceType: category.label,
    provider: {
      "@id": `${site.url}#organization`,
    },
    areaServed: {
      "@type": "Country",
      name: "South Africa",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: category.label,
      itemListElement: category.services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.description,
        },
      })),
    },
  }
}
