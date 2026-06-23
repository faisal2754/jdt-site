import { NextResponse } from "next/server"
import { Resend } from "resend"

/**
 * Contact-form backend.
 *
 * Flow: validate fields → verify the Cloudflare Turnstile token (server-side,
 * non-negotiable — the client token alone proves nothing) → send the message
 * via Resend to the team inbox, with the visitor set as reply-to.
 *
 * All identities/secrets come from env (.env.local locally, project env vars in
 * production). See .env.local for the required keys.
 */

const resend = new Resend(process.env.RESEND_API_KEY)

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

type ContactBody = {
  name?: string
  email?: string
  company?: string
  service?: string
  message?: string
  turnstileToken?: string
}

export async function POST(req: Request) {
  let body: ContactBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const name = (body.name ?? "").trim()
  const email = (body.email ?? "").trim()
  const company = (body.company ?? "").trim()
  const service = (body.service ?? "").trim() || "General enquiry"
  const message = (body.message ?? "").trim()
  const turnstileToken = body.turnstileToken ?? ""

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Please fill in your name, email and message." },
      { status: 400 },
    )
  }

  // ── Verify Turnstile ───────────────────────────────────────────────────────
  if (!turnstileToken) {
    return NextResponse.json(
      { error: "Please complete the verification." },
      { status: 400 },
    )
  }

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ""

  const verifyParams = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY ?? "",
    response: turnstileToken,
  })
  if (ip) verifyParams.set("remoteip", ip)

  try {
    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyParams,
    })
    const verify = (await verifyRes.json()) as { success: boolean }
    if (!verify.success) {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 400 },
      )
    }
  } catch {
    return NextResponse.json(
      { error: "Could not verify your request. Please try again." },
      { status: 502 },
    )
  }

  // ── Send via Resend ─────────────────────────────────────────────────────────
  const text = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || "N/A"}`,
    `Service: ${service}`,
    "",
    "Message:",
    message,
  ].join("\n")

  try {
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL!,
      to: process.env.CONTACT_TO_EMAIL!,
      replyTo: email,
      subject: `Website enquiry: ${service}`,
      text,
    })
    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 502 },
      )
    }
  } catch (err) {
    console.error("Resend threw:", err)
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
