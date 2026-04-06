import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
  sendUnauthorized: vi.fn((event: any, msg: string) => ({ error: 'Unauthorized', message: msg })),
  sendForbidden: vi.fn((event: any, msg: string) => ({ error: 'Forbidden', message: msg })),
}))

// firebase-admin/auth and firebase-admin/app are dynamic imports inside the handler
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(),
}))

vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(),
}))

import { isFirestoreMode, getAdminDb } from '../../server/utils/firestoreAdmin'
import { isFirebaseAdminAvailable } from '../../server/utils/firebaseAdmin'
import { findById } from '../../server/utils/jsonDatabase'
import { sendUnauthorized, sendForbidden } from '../../server/utils/apiResponse'
import { getAuth } from 'firebase-admin/auth'
import { getApps } from 'firebase-admin/app'

// Import handler after all mocks are registered
const { default: healthHandler } = await import('../../server/api/health.get')

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(uid?: string) {
  return {
    context: {
      auth: uid ? { uid } : undefined,
    },
  } as any
}

function makeDb(pingResult: 'ok' | 'error' = 'ok') {
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
  } as any
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
      vi.mocked(findById).mockResolvedValue({ uid: 'uid-1', role: 'user' } as any)

      const result = await healthHandler(makeEvent('uid-1'))

      expect(sendForbidden).toHaveBeenCalledOnce()
    })

    it('proceeds past role guard when user is admin', async () => {
      vi.mocked(findById).mockResolvedValue({ uid: 'uid-1', role: 'admin' } as any)
      vi.mocked(getAdminDb).mockReturnValue(makeDb())
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]' }] as any)
      vi.mocked(getAuth).mockReturnValue({} as any)

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
      } as any
      vi.mocked(getAdminDb).mockReturnValue(db)

      const result = await healthHandler(makeEvent('uid-1'))

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
      } as any
      vi.mocked(getAdminDb).mockReturnValue(db)

      const result = await healthHandler(makeEvent('uid-1'))

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
      vi.mocked(findById).mockResolvedValue({ uid: 'admin', role: 'admin' } as any)
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]' }] as any)
      vi.mocked(getAuth).mockReturnValue({} as any)
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))
    })

    it('returns status ok when all checks pass', async () => {
      const result = await healthHandler(makeEvent('admin'))

      expect(result.status).toBe('ok')
    })

    it('returns firestoreConnection ok when Firestore ping succeeds', async () => {
      const result = await healthHandler(makeEvent('admin'))

      expect(result.checks.firestoreConnection).toBe('ok')
    })

    it('returns firebaseAuth ok when Admin SDK is available', async () => {
      const result = await healthHandler(makeEvent('admin'))

      expect(result.checks.firebaseAuth).toBe('ok')
    })

    it('returns emailService ok when NUXT_RESEND_API_KEY is set and not a placeholder', async () => {
      const result = await healthHandler(makeEvent('admin'))

      expect(result.checks.emailService).toBe('ok')
    })

    it('includes timestamp as ISO string', async () => {
      const result = await healthHandler(makeEvent('admin'))

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  describe('health checks — independent failure isolation', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)
      vi.mocked(findById).mockResolvedValue({ uid: 'admin', role: 'admin' } as any)
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]' }] as any)
      vi.mocked(getAuth).mockReturnValue({} as any)
    })

    it('firestoreConnection is error when getAdminDb returns null', async () => {
      vi.mocked(getAdminDb).mockReturnValue(null)

      const result = await healthHandler(makeEvent('admin'))

      expect(result.checks.firestoreConnection).toBe('error')
    })

    it('firestoreConnection is error when Firestore ping throws', async () => {
      vi.mocked(getAdminDb).mockReturnValue(makeDb('error'))

      const result = await healthHandler(makeEvent('admin'))

      expect(result.checks.firestoreConnection).toBe('error')
    })

    it('firebaseAuth is error when isFirebaseAdminAvailable returns false', async () => {
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(false)
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))

      const result = await healthHandler(makeEvent('admin'))

      expect(result.checks.firebaseAuth).toBe('error')
    })

    it('firebaseAuth is error when no Admin apps are initialized', async () => {
      vi.mocked(getApps).mockReturnValue([])
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))

      const result = await healthHandler(makeEvent('admin'))

      expect(result.checks.firebaseAuth).toBe('error')
    })

    it('emailService is error when NUXT_RESEND_API_KEY is absent', async () => {
      delete process.env.NUXT_RESEND_API_KEY
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))

      const result = await healthHandler(makeEvent('admin'))

      expect(result.checks.emailService).toBe('error')
    })

    it('emailService is error when NUXT_RESEND_API_KEY is a placeholder', async () => {
      process.env.NUXT_RESEND_API_KEY = 're_placeholder_key'
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))

      const result = await healthHandler(makeEvent('admin'))

      expect(result.checks.emailService).toBe('error')
    })

    it('one failing check does not prevent other checks from running', async () => {
      // Firestore fails, but Auth and Email checks should still complete
      vi.mocked(getAdminDb).mockReturnValue(makeDb('error'))

      const result = await healthHandler(makeEvent('admin'))

      expect(result.checks.firestoreConnection).toBe('error')
      expect(result.checks.firebaseAuth).toBe('ok')
      expect(result.checks.emailService).toBe('ok')
    })
  })

  // ── Overall Status ───────────────────────────────────────────────────────

  describe('overall status', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)
      vi.mocked(findById).mockResolvedValue({ uid: 'admin', role: 'admin' } as any)
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]' }] as any)
      vi.mocked(getAuth).mockReturnValue({} as any)
    })

    it('status is degraded when any check is error', async () => {
      vi.mocked(getAdminDb).mockReturnValue(makeDb('error')) // firestoreConnection fails

      const result = await healthHandler(makeEvent('admin'))

      expect(result.status).toBe('degraded')
    })

    it('status is ok when all checks pass', async () => {
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))

      const result = await healthHandler(makeEvent('admin'))

      expect(result.status).toBe('ok')
    })
  })

  // ── Environment Info ─────────────────────────────────────────────────────

  describe('environment info', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)
      vi.mocked(findById).mockResolvedValue({ uid: 'admin', role: 'admin' } as any)
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]' }] as any)
      vi.mocked(getAuth).mockReturnValue({} as any)
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))
    })

    it('masks localhost appUrl as [localhost]', async () => {
      process.env.NUXT_APP_URL = 'http://localhost:3000'

      const result = await healthHandler(makeEvent('admin'))

      expect(result.environment.appUrl).toBe('[localhost]')
    })

    it('passes through non-localhost appUrl as-is', async () => {
      process.env.NUXT_APP_URL = 'https://app.example.com'

      const result = await healthHandler(makeEvent('admin'))

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
      } as any
      vi.mocked(getAdminDb).mockReturnValue(db)

      const result = await healthHandler(makeEvent('admin'))

      expect(result.environment.useFirestore).toBe(true)
    })

    it('reports resendConfigured false when key is absent', async () => {
      delete process.env.NUXT_RESEND_API_KEY

      const result = await healthHandler(makeEvent('admin'))

      expect(result.environment.resendConfigured).toBe(false)
    })

    it('reports resendConfigured true when key is a real value', async () => {
      process.env.NUXT_RESEND_API_KEY = 're_live_abc123'

      const result = await healthHandler(makeEvent('admin'))

      expect(result.environment.resendConfigured).toBe(true)
    })
  })

  // ── Warnings ─────────────────────────────────────────────────────────────

  describe('warnings', () => {
    beforeEach(() => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)
      vi.mocked(findById).mockResolvedValue({ uid: 'admin', role: 'admin' } as any)
      vi.mocked(isFirebaseAdminAvailable).mockReturnValue(true)
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]' }] as any)
      vi.mocked(getAuth).mockReturnValue({} as any)
      vi.mocked(getAdminDb).mockReturnValue(makeDb('ok'))
    })

    it('adds APP_URL is localhost warning when NUXT_APP_URL contains localhost', async () => {
      process.env.NUXT_APP_URL = 'http://localhost:3000'

      const result = await healthHandler(makeEvent('admin'))

      expect(result.warnings).toContain('APP_URL is localhost')
    })

    it('adds NUXT_APP_URL not set warning when env var is missing', async () => {
      delete process.env.NUXT_APP_URL

      const result = await healthHandler(makeEvent('admin'))

      expect(result.warnings).toContain('NUXT_APP_URL is not set')
    })

    it('adds JSON mock mode warning when useFirestore is false', async () => {
      vi.mocked(isFirestoreMode).mockReturnValue(false)

      const result = await healthHandler(makeEvent('admin'))

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
      } as any
      vi.mocked(getAdminDb).mockReturnValue(db)
      process.env.NUXT_APP_URL = 'https://app.example.com'

      const result = await healthHandler(makeEvent('admin'))

      expect(result.warnings).toHaveLength(0)
    })
  })
})
