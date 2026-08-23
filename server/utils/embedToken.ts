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
 * Payloads are encrypted, not merely signed: the Looker URL must stay opaque
 * to the client, which a signed-but-readable token would not keep. AES-256-GCM
 * authenticates as well as encrypts, so a tampered value fails to open.
 */

/** How long a minted token stays valid. */
export const TOKEN_TTL_SECONDS = 300

/**
 * How long the session cookie that a token is bound to stays valid. Only has
 * to outlive a token, and every mint reissues it behind a fresh ID-token check,
 * so it is pinned to the Firebase ID token lifetime rather than stretched.
 */
export const SESSION_TTL_SECONDS = 3600

/** The one cookie name Firebase Hosting forwards to Cloud Functions. */
export const SESSION_COOKIE_NAME = '__session'

const IV_BYTES = 12
const TAG_BYTES = 16

export interface EmbedTokenPayload {
  /** The Looker URL the proxy redirects to. */
  embedUrl: string
  /** The uid the token was minted for. Redeeming checks it against the cookie. */
  uid: string
  /** Expiry, seconds since epoch. */
  exp: number
}

export interface EmbedSessionPayload {
  /** The uid this browser proved it was, at mint time. */
  uid: string
  /** Expiry, seconds since epoch. */
  exp: number
}

/**
 * Resolve the signing secret.
 *
 * Nitro only overrides `runtimeConfig` from environment variables that carry
 * the `NUXT_` prefix, but Secret Manager injects the secret under its own bare
 * name — so the value baked in at build time stays empty in production and the
 * live one is only ever visible through `process.env`. `emailService` reads
 * `RESEND_API_KEY` the same way for the same reason.
 */
export function resolveEmbedSecret(fromRuntimeConfig: string | undefined): string {
  return fromRuntimeConfig
    || process.env.NUXT_EMBED_TOKEN_SECRET
    || process.env.EMBED_TOKEN_SECRET
    || ''
}

/** AES-256 needs exactly 32 bytes; the configured secret is any length. */
function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest()
}

function seal(payload: object, secret: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv)
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ])

  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url')
}

/** Returns the sealed object, or `null` for anything that will not open. */
function open<T>(value: string, secret: string): T | null {
  const raw = Buffer.from(value, 'base64url')
  if (raw.length <= IV_BYTES + TAG_BYTES) return null

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

    return JSON.parse(plaintext) as T
  } catch {
    // Wrong secret, tampered ciphertext, or a body that is not our JSON.
    return null
  }
}

function isLive(exp: unknown): boolean {
  return typeof exp === 'number' && exp > Math.floor(Date.now() / 1000)
}

/**
 * Mint a token for `embedUrl` on behalf of `uid`.
 * Throws when no secret is configured — a token nobody can open is worse than
 * a clear failure at request time.
 */
export function createEmbedToken(embedUrl: string, uid: string, secret: string): string {
  if (!secret) {
    throw new Error('EMBED_TOKEN_SECRET is not configured')
  }

  return seal(
    { embedUrl, uid, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS },
    secret
  )
}

/**
 * Open a token and return its payload, or `null` when the token is malformed,
 * was sealed with a different secret, was tampered with, or has expired.
 */
export function verifyEmbedToken(token: string, secret: string): EmbedTokenPayload | null {
  if (!secret || !token) return null

  const payload = open<EmbedTokenPayload>(token, secret)
  if (!payload) return null

  if (typeof payload.embedUrl !== 'string' || !payload.embedUrl) return null
  if (typeof payload.uid !== 'string' || !payload.uid) return null
  if (!isLive(payload.exp)) return null

  return payload
}

/**
 * Mint the session-cookie value that binds tokens to this browser.
 *
 * Sealed rather than a plain uid: the cookie sits in a jar the caller controls,
 * so a readable one could just be set to the victim's uid. Sealed with the same
 * secret, only the server can produce a value that opens.
 *
 * The value is per-user, not per-token, so a second dashboard opened in another
 * tab reissues an identical cookie instead of invalidating the first tab.
 */
export function createEmbedSession(uid: string, secret: string): string {
  if (!secret) {
    throw new Error('EMBED_TOKEN_SECRET is not configured')
  }

  return seal({ uid, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }, secret)
}

/** Open a session cookie, or `null` when it is absent, foreign, or expired. */
export function verifyEmbedSession(value: string | undefined, secret: string): EmbedSessionPayload | null {
  if (!secret || !value) return null

  const payload = open<EmbedSessionPayload>(value, secret)
  if (!payload) return null

  if (typeof payload.uid !== 'string' || !payload.uid) return null
  if (!isLive(payload.exp)) return null

  return payload
}
