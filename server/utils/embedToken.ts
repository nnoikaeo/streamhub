import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/**
 * Stateless embed tokens (BUG-031).
 *
 * The previous implementation kept tokens in a per-instance `Map`. Cloud
 * Functions run as `gcfv2` with no `minInstances`, so `POST /api/embed/request`
 * and the iframe's `GET /api/embed/{token}` are two separate requests that can
 * land on two different instances — the second one looking into an empty Map
 * and answering 403. Carrying the payload inside the token means any instance
 * can read it, retries stop failing, and the TTL lives in the token rather than
 * in a delete timer.
 *
 * The payload is encrypted, not merely signed: the Looker URL must stay opaque
 * to the client, which a signed-but-readable token would not keep. AES-256-GCM
 * authenticates as well as encrypts, so a tampered token fails to decrypt.
 */

/** How long a minted token stays valid. */
export const TOKEN_TTL_SECONDS = 300

const IV_BYTES = 12
const TAG_BYTES = 16

export interface EmbedTokenPayload {
  /** The Looker URL the proxy redirects to. */
  embedUrl: string
  /** The uid the token was minted for — sealed, so it cannot be swapped. */
  uid: string
  /** Expiry, seconds since epoch. */
  exp: number
}

/** AES-256 needs exactly 32 bytes; the configured secret is any length. */
function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest()
}

/**
 * Mint a token for `embedUrl` on behalf of `uid`.
 * Throws when no secret is configured — a token nobody can read is worse than a
 * clear failure at request time.
 */
export function createEmbedToken(embedUrl: string, uid: string, secret: string): string {
  if (!secret) {
    throw new Error('EMBED_TOKEN_SECRET is not configured')
  }

  const payload: EmbedTokenPayload = {
    embedUrl,
    uid,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  }

  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv)
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ])

  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url')
}

/**
 * Open a token and return its payload, or `null` when the token is malformed,
 * was sealed with a different secret, was tampered with, or has expired.
 */
export function verifyEmbedToken(token: string, secret: string): EmbedTokenPayload | null {
  if (!secret || !token) return null

  const raw = Buffer.from(token, 'base64url')
  if (raw.length <= IV_BYTES + TAG_BYTES) return null

  let payload: EmbedTokenPayload
  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      deriveKey(secret),
      raw.subarray(0, IV_BYTES)
    )
    decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES))

    const plaintext = Buffer.concat([
      decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)),
      decipher.final(),
    ]).toString('utf8')

    payload = JSON.parse(plaintext) as EmbedTokenPayload
  } catch {
    // Wrong secret, tampered ciphertext, or a body that is not our JSON.
    return null
  }

  if (typeof payload?.embedUrl !== 'string' || !payload.embedUrl) return null
  if (typeof payload?.uid !== 'string' || !payload.uid) return null
  if (typeof payload?.exp !== 'number') return null
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null

  return payload
}
