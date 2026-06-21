import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Plaintext admin-password verification.
 *
 * The admin password is stored as PLAINTEXT in `ADMIN_PASSWORD` (no scrypt, no
 * hashing at rest — this is a single shared password, by design). The login
 * Server Action runs in the Node runtime, so we use Node's `crypto` here.
 *
 * `crypto.timingSafeEqual` requires equal-length buffers and throws otherwise,
 * which would itself leak length information. To get a constant-time compare
 * that also tolerates unequal-length inputs, we hash BOTH sides to a fixed
 * 32-byte SHA-256 digest first and compare those digests. This both equalizes
 * the buffer lengths and avoids leaking the secret's length.
 */
function sha256(input: string): Buffer {
  return createHash('sha256').update(input, 'utf8').digest()
}

/**
 * Constant-time compare of `input` against the plaintext `ADMIN_PASSWORD` env
 * var. Returns false (never throws) if the env var is missing/empty.
 */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false

  // Both digests are always 32 bytes, so timingSafeEqual never throws and the
  // comparison cost is independent of the inputs' lengths.
  return timingSafeEqual(sha256(input), sha256(expected))
}
