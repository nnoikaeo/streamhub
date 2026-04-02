import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firebase-admin/app before importing firestoreAdmin
vi.mock('firebase-admin/app', () => ({
  getApps: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
}))

// Mock firebaseAdmin to control ensureAdminInitialized
vi.mock('../../server/utils/firebaseAdmin', () => ({
  ensureAdminInitialized: vi.fn(),
}))

import { getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureAdminInitialized } from '../../server/utils/firebaseAdmin'
import { getAdminDb } from '../../server/utils/firestoreAdmin'

describe('getAdminDb', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls ensureAdminInitialized before checking apps (regression: cold-start 503)', () => {
    // Simulate Firebase Admin not yet initialized
    vi.mocked(getApps).mockReturnValue([])
    vi.mocked(ensureAdminInitialized).mockReturnValue(false)

    getAdminDb()

    // ensureAdminInitialized MUST be called before getApps
    expect(ensureAdminInitialized).toHaveBeenCalledOnce()
  })

  it('returns null when no Firebase Admin apps are initialized', () => {
    vi.mocked(getApps).mockReturnValue([])
    vi.mocked(ensureAdminInitialized).mockReturnValue(false)

    const result = getAdminDb()

    expect(result).toBeNull()
  })

  it('returns a Firestore instance when Firebase Admin is initialized', () => {
    const fakeApp = { name: '[DEFAULT]' } as any
    const fakeDb = { collection: vi.fn() } as any

    vi.mocked(getApps).mockReturnValue([fakeApp])
    vi.mocked(ensureAdminInitialized).mockReturnValue(true)
    vi.mocked(getFirestore).mockReturnValue(fakeDb)

    const result = getAdminDb()

    expect(result).toBe(fakeDb)
    expect(getFirestore).toHaveBeenCalledWith(fakeApp)
  })
})
