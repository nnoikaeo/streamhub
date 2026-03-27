interface TokenEntry {
  embedUrl: string
  userId: string
  expiresAt: number
}

const store = new Map<string, TokenEntry>()

const TTL_MS = 30_000 // 30 seconds

// Cleanup expired tokens every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [token, entry] of store) {
    if (entry.expiresAt <= now) {
      store.delete(token)
    }
  }
}, 60_000)

export function createToken(embedUrl: string, userId: string): string {
  const token = crypto.randomUUID()
  store.set(token, {
    embedUrl,
    userId,
    expiresAt: Date.now() + TTL_MS,
  })
  return token
}

export function consumeToken(token: string): string | null {
  const entry = store.get(token)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    store.delete(token)
    return null
  }
  store.delete(token)
  return entry.embedUrl
}
