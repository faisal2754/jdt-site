/**
 * Contact submission seam.
 *
 * This module is the SINGLE point of contact between the contact form UI and
 * however messages are actually delivered. Today there is no backend, so the
 * interim implementation opens the visitor's email client with a prefilled
 * message (mailto:). The form UI never needs to know this.
 *
 * -------------------------------------------------------------------------
 * FUTURE SWAP — change ONLY this file when the real email path is ready:
 *
 *   When the Cloudflare email path (a Cloudflare Worker, or an
 *   `app/api/contact` route) exists, replace the mailto body below with a
 *   `fetch` POST, e.g.:
 *
 *     const res = await fetch("/api/contact", {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify(data),
 *     })
 *     if (!res.ok) throw new Error("Failed to send message")
 *
 *   Keep the `sendContactMessage(data)` signature and the `ContactPayload`
 *   type stable so the form UI (components/contact-content.tsx) stays
 *   untouched. The only knock-on change would be the success copy in the UI,
 *   which can then honestly say the message was sent.
 * -------------------------------------------------------------------------
 */

/** Where contact-form submissions are routed in the interim mailto flow. */
const CONTACT_EMAIL = "hello@jdtpromotions.com"

/**
 * The full contact-form payload. Field names mirror the form inputs in
 * components/contact-content.tsx exactly.
 */
export type ContactPayload = {
  /** Visitor's name (required input). */
  name: string
  /** Visitor's email address (required input). */
  email: string
  /** Company name (optional input — may be empty). */
  company: string
  /**
   * The selected service pill (e.g. "Printing & Design"). May be empty if the
   * visitor did not pick one. NOTE: this field was previously dropped on
   * submit; it is now included end-to-end.
   */
  service: string
  /** The message body (required textarea). */
  message: string
}

/**
 * Submit a contact message.
 *
 * Interim implementation: builds a prefilled `mailto:` URL containing every
 * field (including the selected service) and opens the visitor's email client.
 * Guarded for SSR — does nothing meaningful if `window` is unavailable.
 *
 * @returns a Promise so the call site can `await` it; the future fetch-based
 * implementation will be naturally async without changing the signature.
 */
export async function sendContactMessage(data: ContactPayload): Promise<void> {
  // SSR / non-browser guard: a mailto can only be triggered client-side.
  if (typeof window === "undefined") return

  const service = data.service.trim() || "General enquiry"

  const subject = `Website enquiry: ${service}`

  const bodyLines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Company: ${data.company.trim() || "—"}`,
    `Service: ${service}`,
    "",
    "Message:",
    data.message,
  ]
  const body = bodyLines.join("\n")

  const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`

  window.location.href = mailtoUrl
}
