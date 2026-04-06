import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useRuntimeConfig at module scope
let mockConfig = { public: { useFirestore: false, useJsonMock: true } }
vi.stubGlobal('useRuntimeConfig', () => mockConfig)

import { useServiceMode } from '../../app/composables/useServiceMode'

function setConfig(overrides: Record<string, any>) {
  mockConfig = { public: { useFirestore: false, useJsonMock: true, ...overrides } }
}

beforeEach(() => {
  setConfig({})
})

describe('useServiceMode', () => {
  // --- isFirestore / isMock ---

  it('useFirestore=true (boolean) → isFirestore=true, isMock=false', () => {
    setConfig({ useFirestore: true })
    const { isFirestore, isMock } = useServiceMode()
    expect(isFirestore).toBe(true)
    expect(isMock).toBe(false)
  })

  it('useFirestore="true" (string) → isFirestore=true', () => {
    setConfig({ useFirestore: 'true' })
    const { isFirestore } = useServiceMode()
    expect(isFirestore).toBe(true)
  })

  it('useFirestore=false → isFirestore=false, isMock=true', () => {
    setConfig({ useFirestore: false })
    const { isFirestore, isMock } = useServiceMode()
    expect(isFirestore).toBe(false)
    expect(isMock).toBe(true)
  })

  it('useFirestore="false" → isFirestore=false, isMock=true', () => {
    setConfig({ useFirestore: 'false' })
    const { isFirestore, isMock } = useServiceMode()
    expect(isFirestore).toBe(false)
    expect(isMock).toBe(true)
  })

  it('useFirestore=undefined → isFirestore=false, isMock=true', () => {
    setConfig({ useFirestore: undefined })
    const { isFirestore, isMock } = useServiceMode()
    expect(isFirestore).toBe(false)
    expect(isMock).toBe(true)
  })

  // --- apiBase ---

  it('apiBase returns /api/{resource} in Firestore mode', () => {
    setConfig({ useFirestore: true })
    const { apiBase } = useServiceMode()
    expect(apiBase('invitations')).toBe('/api/invitations')
  })

  it('apiBase returns /api/mock/{resource} in mock mode', () => {
    setConfig({ useFirestore: false })
    const { apiBase } = useServiceMode()
    expect(apiBase('invitations')).toBe('/api/mock/invitations')
  })
})
