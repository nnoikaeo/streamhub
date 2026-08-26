import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { isFirestoreMode, getAdminDb } from '../../server/utils/firestoreAdmin'
import { isFirebaseAdminAvailable } from '../../server/utils/firebaseAdmin'
import { findById } from '../../server/utils/jsonDatabase'
import { sendUnauthorized, sendForbidden } from '../../server/utils/apiResponse'
import { getAuth } from 'firebase-admin/auth'
import { getApps } from 'firebase-admin/app'
import type { H3Event } from 'h3'
import type { Auth } from 'firebase-admin/auth'
import type { App } from 'firebase-admin/app'
import type { Firestore } from 'firebase-admin/firestore'
import type { HealthResponse } from '../../server/api/health.get'

/**
 * Unit tests for server/api/health.get.ts
 *
 * Strategy: import the handler directly (Nitro globals shimmed in tests/setup.ts)
 * and call it with a minimal fake H3Event. All external dependencies are vi.mock()'d
 * so each check can be exercised in isolation.
 *
 * Vue component tests (app/pages/admin/health.vue) require @vue/test-utils +
 * happy-dom — not yet installed. Add vitest-environment-happy-dom and
 * @vue/test-utils to unlock mounting-based tests.
 */

// ── Mock dependencies before importing handler ──────────────────────────────

vi.mock('../../server/utils/firestoreAdmin', () => ({
  isFirestoreMode: vi.fn(),
  getAdminDb: vi.fn(),
}))

vi.mock('../../server/utils/firebaseAdmin', () => ({
  isFirebaseAdminAvailable: vi.fn(),
}))

vi.mock('../../server/utils/jsonDatabase', () => ({
  findById: vi.fn(),
}))

vi.mock('../../server/utils/apiResponse', () => ({
  sendUnauthorized: vi.fn((_event: unknown, msg: string) => ({ error: 'Unauthorized', message: msg })),
  sendForbidden: vi.fn((_event: unknown, msg: string) => ({ error: 'Forbidden', message: msg })),
}))

// firebase-admin/auth and firebase-admin/app are dynamic imports inside the handler
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(),
}))

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(),
}))

// Import handler after all mocks are registered
const { default: healthHandler } = await import('../../server/api/health.get')

// ── Helpers ─────────────────────────────────────────────────────────────────

// The handler only reads `context.auth`, so the stub is deliberately partial and
// asserted through `unknown` rather than `any`.
function makeEvent(uid?: string): H3Event {
  return {
    context: {
      auth: uid ? { uid } : undefined,
    },
  } as unknown as H3Event
}

/**
 * The handler returns either an auth-failure envelope or the health payload.
 * Tests that read a health field have already arranged a permitted call, so
 * anything else is a broken test setup and should say so instead of reading
 * `undefined` off the error envelope and quietly passing.
 */
function expectHealth(result: Awaited<ReturnType<typeof healthHandler>>): HealthResponse {
  if (!('checks' in result)) {
    throw new Error(`expected a health payload, got ${JSON.stringify(result)}`)
  }
  return result
}

/** A stored user row as the JSON store holds it — the role guard reads `role`. */
function storedUser(role: string, uid = 'uid-1') {
  return { uid, role }
}

function makeDb(pingResult: 'ok' | 'error' = 'ok'): Firestore {
  return {
    collection: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        get: pingResult === 'ok'
          ? vi.fn().mockResolvedValue({})
          : vi.fn().mockRejectedValue(new Error('Firestore unreachable')),
      }),
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'admin' }) }),
      }),
    }),
  } as unknown as Firestore
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  // Default env: production-like, with resend key configured
  process.env.NUXT_APP_URL = 'https://app.example.com'
  process.env.NUXT_RESEND_API_KEY = 're_live_abc123'
  process.env.NODE_ENV = 'production'
  // Default: Firestore mode off (JSON mode)
  vi.mocked(isFirestoreMode).mockReturnValue(false)
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  // ── Auth & Role Guard ────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when no auth context is present', async () => {
      const result = await healthHandler(makeEvent())

      expect(sendUnauthorized).toHaveBeenCalledOnce()
      expect(result).toMatchObject({ error: 'Unauthorized' })
    })

    it('does not run any health check when unauthenticated', async () => {
      await healthHandler(makeEvent())

      expect(getAdminDb).not.toHaveBeenCalled()
    })
  })

  describe('admin role guard — JSON mode', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)
    })

    it('returns 403 when user is not found in JSON store', async () => {
      vi.mocked(findById).mockResolvedValue(null)

      const result = await healthHandler(makeEvent('uid-1'))

      expect(sendForbidden).toHaveBeenCalledOnce()
      expect(result).toMatchObject({ error: 'Forbidden' })
    })

    it('returns 403 when user role is not admin', async () => {
      vi.mocked(findById).mockResolvedValue(storedUser('user', 'uid-1'))

      await healthHandler(makeEvent('uid-1'))

      expect(sendForbidden).toHaveBeenCalledOnce()
    })

    it('proceeds past role guard when user is admin', async () => {
      vi.mocked(findById).mockResolvedValue(storedUser('admin', 'uid-1'))
      vi.mocked(getAdminDb).mockReturnValue(makeDb())
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]', options: {} } satisfies App])
      vi.mocked(getAuth).mockReturnValue({} as unknown as Auth)

      const result = await healthHandler(makeEvent('uid-1'))

      expect(result).toHaveProperty('status')
    })
  })

  describe('admin role guard — Firestore mode', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(true)
    })

    it('returns 403 when Firestore user doc does not exist', async () => {
      const db = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: false }),
          }),
          limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({}) }),
        }),
      } as unknown as Firestore
      vi.mocked(getAdminDb).mockReturnValue(db)

      await healthHandler(makeEvent('uid-1'))

      expect(sendForbidden).toHaveBeenCalledOnce()
    })

    it('returns 403 when Firestore user role is not admin', async () => {
      const db = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'viewer' }) }),
          }),
          limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({}) }),
        }),
      } as unknown as Firestore
      vi.mocked(getAdminDb).mockReturnValue(db)

      await healthHandler(makeEvent('uid-1'))

      expect(sendForbidden).toHaveBeenCalledOnce()
    })

    it('returns 403 (not throws) when Firestore is unavailable during role check', async () => {
      vi.mocked(getAdminDb).mockReturnValue(null)

      const result = await healthHandler(makeEvent('uid-1'))

      expect(sendForbidden).toHaveBeenCalledOnce()
      expect(result).toMatchObject({ error: 'Forbidden' })
    })
  })

  // ── Health Checks ────────────────────────────────────────────────────────

  describe('health checks — all passing', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)
      vi.mocked(findById).mockResolvedValue(storedUser('admin', 'admin'))
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]', options: {} } satisfies App])
      vi.mocked(getAuth).mockReturnValue({} as unknown as Auth)
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))
    })

    it('returns status ok when all checks pass', async () => {
      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.status).toBe('ok')
    })

    it('returns firestoreConnection ok when Firestore ping succeeds', async () => {
      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.checks.firestoreConnection).toBe('ok')
    })

    it('returns firebaseAuth ok when Admin SDK is available', async () => {
      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.checks.firebaseAuth).toBe('ok')
    })

    it('returns emailService ok when NUXT_RESEND_API_KEY is set and not a placeholder', async () => {
      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.checks.emailService).toBe('ok')
    })

    it('includes timestamp as ISO string', async () => {
      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    // Regression: the version came from process.env.npm_package_version, which npm
    // only sets when npm starts the process. The deployed function is started by the
    // Functions runtime, so /admin/health reported 'unknown' on every deploy.
    it('reports the version baked into runtime config, not the npm env var', async () => {
      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.version).toBe('test-version')
      expect(result.version).not.toBe('unknown')
    })
  })

  describe('health checks — independent failure isolation', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)
      vi.mocked(findById).mockResolvedValue(storedUser('admin', 'admin'))
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]', options: {} } satisfies App])
      vi.mocked(getAuth).mockReturnValue({} as unknown as Auth)
    })

    it('firestoreConnection is error when getAdminDb returns null', async () => {
      vi.mocked(getAdminDb).mockReturnValue(null)

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.checks.firestoreConnection).toBe('error')
    })

    it('firestoreConnection is error when Firestore ping throws', async () => {
      vi.mocked(getAdminDb).mockReturnValue(makeDb('error'))

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.checks.firestoreConnection).toBe('error')
    })

    it('firebaseAuth is error when isFirebaseAdminAvailable returns false', async () => {
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(false)
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.checks.firebaseAuth).toBe('error')
    })

    it('firebaseAuth is error when no Admin apps are initialized', async () => {
      vi.mocked(getApps).mockReturnValue([])
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.checks.firebaseAuth).toBe('error')
    })

    it('emailService is error when NUXT_RESEND_API_KEY is absent', async () => {
      delete process.env.NUXT_RESEND_API_KEY
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.checks.emailService).toBe('error')
    })

    it('emailService is error when NUXT_RESEND_API_KEY is a placeholder', async () => {
      process.env.NUXT_RESEND_API_KEY = 're_placeholder_key'
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.checks.emailService).toBe('error')
    })

    it('one failing check does not prevent other checks from running', async () => {
      // Firestore fails, but Auth and Email checks should still complete
      vi.mocked(getAdminDb).mockReturnValue(makeDb('error'))

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.checks.firestoreConnection).toBe('error')
      expect(result.checks.firebaseAuth).toBe('ok')
      expect(result.checks.emailService).toBe('ok')
    })
  })

  // ── Overall Status ───────────────────────────────────────────────────────

  describe('overall status', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)
      vi.mocked(findById).mockResolvedValue(storedUser('admin', 'admin'))
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]', options: {} } satisfies App])
      vi.mocked(getAuth).mockReturnValue({} as unknown as Auth)
    })

    it('status is degraded when any check is error', async () => {
      vi.mocked(getAdminDb).mockReturnValue(makeDb('error')) // firestoreConnection fails

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.status).toBe('degraded')
    })

    it('status is ok when all checks pass', async () => {
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.status).toBe('ok')
    })
  })

  // ── Environment Info ─────────────────────────────────────────────────────

  describe('environment info', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)
      vi.mocked(findById).mockResolvedValue(storedUser('admin', 'admin'))
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]', options: {} } satisfies App])
      vi.mocked(getAuth).mockReturnValue({} as unknown as Auth)
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))
    })

    it('masks localhost appUrl as [localhost]', async () => {
      process.env.NUXT_APP_URL = 'http://localhost:3000'

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.environment.appUrl).toBe('[localhost]')
    })

    it('passes through non-localhost appUrl as-is', async () => {
      process.env.NUXT_APP_URL = 'https://app.example.com'

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.environment.appUrl).toBe('https://app.example.com')
    })

    it('includes useFirestore from isFirestoreMode()', async () => {
      vi.mocked(isFirestoreMode).mockReturnValue(true)
      // Firestore mode: user lookup via Firestore
      const db = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'admin' }) }),
          }),
          limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({}) }),
        }),
      } as unknown as Firestore
      vi.mocked(getAdminDb).mockReturnValue(db)

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.environment.useFirestore).toBe(true)
    })

    it('reports resendConfigured false when key is absent', async () => {
      delete process.env.NUXT_RESEND_API_KEY

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.environment.resendConfigured).toBe(false)
    })

    it('reports resendConfigured true when key is a real value', async () => {
      process.env.NUXT_RESEND_API_KEY = 're_live_abc123'

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.environment.resendConfigured).toBe(true)
    })
  })

  // ── Warnings ─────────────────────────────────────────────────────────────

  describe('warnings', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)
      vi.mocked(findById).mockResolvedValue(storedUser('admin', 'admin'))
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]', options: {} } satisfies App])
      vi.mocked(getAuth).mockReturnValue({} as unknown as Auth)
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))
    })

    it('adds APP_URL is localhost warning when NUXT_APP_URL contains localhost', async () => {
      process.env.NUXT_APP_URL = 'http://localhost:3000'

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.warnings).toContain('APP_URL is localhost')
    })

    it('adds NUXT_APP_URL not set warning when env var is missing', async () => {
      delete process.env.NUXT_APP_URL

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.warnings).toContain('NUXT_APP_URL is not set')
    })

    it('adds JSON mock mode warning when useFirestore is false', async () => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.warnings).toContain('Running in JSON mock mode — not suitable for production')
    })

    it('returns empty warnings array for a fully configured production setup', async () => {
      vi.mocked(isFirestoreMode).mockReturnValue(true)
      const db = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'admin' }) }),
          }),
          limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({}) }),
        }),
      } as unknown as Firestore
      vi.mocked(getAdminDb).mockReturnValue(db)
      process.env.NUXT_APP_URL = 'https://app.example.com'

      const result = expectHealth(await healthHandler(makeEvent('admin')))

      expect(result.warnings).toHaveLength(0)
    })
  })
})
