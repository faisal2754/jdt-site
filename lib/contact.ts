/**
 * Contact submission seam.
 *
 * This module is the SINGLE point of contact between the contact form UI and
 * however messages are actually delivered. Submissions are POSTed to the
 * `app/api/contact` route, which verifies a Cloudflare Turnstile token and then
 * sends the message via Resend. The form UI only needs the payload + token.
 */

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
   * visitor did not pick one.
   */
  service: string
  /** The message body (required textarea). */
  message: string
}

/**
 * Submit a contact message.
 *
 * POSTs the payload plus the Turnstile token to the contact API route. Throws
 * with a user-presentable message if delivery fails, so the form UI can surface
 * it. The Turnstile token is verified server-side — it is required.
 */
export async function sendContactMessage(
  data: ContactPayload,
  turnstileToken: string,
): Promise<void> {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, turnstileToken }),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? "Failed to send message. Please try again.")
  }
}
