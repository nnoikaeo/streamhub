import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

import { useAdminResource, ValidationError } from '../../app/composables/useAdminResource'

// --- Stub the Nuxt auto-imports that useAdminResource touches at setup and
//     inside create()/update() up to the assertUnique guard. The guard runs
//     BEFORE any Firestore/mock call, so no auth/$fetch stubs are needed for
//     the clash cases exercised here. ---
const stateStore = new Map<string, any>()
vi.stubGlobal('useState', (key: string, init?: () => any) => {
  if (!stateStore.has(key)) stateStore.set(key, ref(init ? init() : undefined))
  return stateStore.get(key)
})
vi.stubGlobal('useServiceMode', () => ({ isFirestore: false, isMock: true }))

interface Group {
  id: string
  name: string
}

function makeGroups(seed: Group[]) {
  stateStore.clear()
  // Pre-seed the shared useState ref so the composable picks it up (items is
  // exposed read-only, so we can't assign to it after construction).
  stateStore.set('admin-resource-groups', ref(seed))
  return useAdminResource<Group>({
    resourceName: 'groups',
    idKey: 'id',
    displayKey: 'name',
    uniqueFields: [{ field: 'id', message: 'รหัสกลุ่มซ้ำ' }],
  })
}

beforeEach(() => stateStore.clear())

describe('useAdminResource — uniqueFields guard', () => {
  it('create with a duplicate id throws ValidationError with the configured message', async () => {
    const resource = makeGroups([{ id: 'MKT', name: 'Marketing' }])
    await expect(resource.create({ id: 'MKT', name: 'Marketing 2' })).rejects.toThrow(ValidationError)
    await expect(resource.create({ id: 'MKT', name: 'Marketing 2' })).rejects.toThrow('รหัสกลุ่มซ้ำ')
  })

  it('duplicate check is case-insensitive and trims whitespace', async () => {
    const resource = makeGroups([{ id: 'MKT', name: 'Marketing' }])
    await expect(resource.create({ id: '  mkt ', name: 'x' })).rejects.toThrow('รหัสกลุ่มซ้ำ')
  })

  it('update to an id used by another item throws', async () => {
    const resource = makeGroups([{ id: 'MKT', name: 'Marketing' }, { id: 'SALES', name: 'Sales' }])
    await expect(resource.update('SALES', { id: 'MKT' })).rejects.toThrow('รหัสกลุ่มซ้ำ')
  })

  it('update that keeps the same id does not clash with itself (no ValidationError)', async () => {
    const resource = makeGroups([{ id: 'MKT', name: 'Marketing' }])
    // Passes the guard (excludes self). It then proceeds to the mock write path,
    // which may fail for other reasons here — we only assert the guard itself
    // did not reject with a ValidationError.
    let caught: unknown
    try {
      await resource.update('MKT', { id: 'MKT', name: 'Renamed' })
    } catch (e) {
      caught = e
    }
    expect(caught).not.toBeInstanceOf(ValidationError)
  })
})
