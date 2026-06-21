/**
 * Signed session token for the single shared-password admin.
 *
 * The token is created in the Node runtime (login Server Action) but VERIFIED
 * in the middleware runtime, so everything here uses the Web Crypto API
 * (`crypto.subtle`) rather than Node's `crypto`. Web Crypto is available in
 * both the Node and Edge/middleware runtimes, keeping a single code path.
 *
 * Token format: `base64url(payloadJson).base64url(hmacSignature)`
 *   payload  = { exp: <epoch seconds> }
 *   signature = HMAC-SHA256(payloadJson, SESSION_SECRET)
 */

/** Cookie name for the admin session. */
export const SESSION_COOKIE_NAME = 'jdt_admin'

/** Default session lifetime: 7 days. */
export const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

interface SessionPayload {
  /** Expiry as epoch seconds. */
  exp: number
}

// ---------------------------------------------------------------------------
// base64url helpers (no padding) over Uint8Array / string
// ---------------------------------------------------------------------------

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function stringToBase64Url(value: string): string {
  return bytesToBase64Url(encoder.encode(value))
}

function base64UrlToString(value: string): string {
  return decoder.decode(base64UrlToBytes(value))
}

// ---------------------------------------------------------------------------
// HMAC key (cached per process)
// ---------------------------------------------------------------------------

let cachedKey: Promise<CryptoKey> | null = null

function getKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    const secret = process.env.SESSION_SECRET
    if (!secret) {
      throw new Error('Missing required environment variable: SESSION_SECRET')
    }
    cachedKey = crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    )
  }
  return cachedKey
}

async function sign(payloadJson: string): Promise<Uint8Array> {
  const key = await getKey()
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadJson),
  )
  return new Uint8Array(signature)
}

/** Length-independent constant-time byte comparison. */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a signed session token that expires `ttlSeconds` from now.
 * `payload.signature`, both base64url-encoded.
 */
export async function createSessionToken(
  ttlSeconds: number = DEFAULT_SESSION_TTL_SECONDS,
): Promise<string> {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const payloadJson = JSON.stringify(payload)
  const signature = await sign(payloadJson)
  return `${stringToBase64Url(payloadJson)}.${bytesToBase64Url(signature)}`
}

/**
 * Verify a session token: recompute the HMAC, constant-time compare it against
 * the supplied signature, then check the expiry. Returns false on ANY malformed
 * input — never throws.
 */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false

  try {
    const dot = token.indexOf('.')
    if (dot <= 0 || dot === token.length - 1) return false

    const encodedPayload = token.slice(0, dot)
    const encodedSignature = token.slice(dot + 1)

    const payloadJson = base64UrlToString(encodedPayload)
    const expectedSignature = await sign(payloadJson)
    const providedSignature = base64UrlToBytes(encodedSignature)

    if (!constantTimeEqual(expectedSignature, providedSignature)) return false

    const payload = JSON.parse(payloadJson) as unknown
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof (payload as SessionPayload).exp !== 'number'
    ) {
      return false
    }

    const { exp } = payload as SessionPayload
    if (exp < Math.floor(Date.now() / 1000)) return false

    return true
  } catch {
    return false
  }
}

/**
 * Cookie options for the session cookie. `maxAge` matches the token TTL so the
 * browser drops the cookie around the same time the token expires.
 */
export function sessionCookieOptions(
  ttlSeconds: number = DEFAULT_SESSION_TTL_SECONDS,
) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ttlSeconds,
  }
}
