/**
 * Tests for app/utils/effectiveAccess.ts
 *
 * One calculation now feeds both the "ผลลัพธ์รวม" bar and the picker badges.
 * If it drifts, the page contradicts itself — which is the bug class this
 * builder exists to close.
 */

import { describe, it, expect } from 'vitest'
import { buildAccessEntries, accessibleUsers, DIRECT_SOURCE } from '../../app/utils/effectiveAccess'
import { isExpired } from '../../shared/utils/dates'

const users = [
  { uid: 'survey', name: 'Survey', company: 'OAYT' },
  { uid: 'janine', name: 'Janine', company: 'STTH' },
  { uid: 'nattha', name: 'Nattha', company: 'STTH' },
]

const groups = [{ id: 'finance', name: 'การเงิน', members: ['nattha'] }]

const base = {
  users,
  groups,
  activeCompanyCodes: ['OAYT', 'STTH'],
  isExpiredFn: isExpired,
  now: new Date('2026-08-19T00:00:00.000Z'),
}

function permissions(over: Partial<{ public: boolean, users: string[], groups: string[], company: string[], revoke: string[], expiry: Record<string, unknown> }> = {}) {
  return {
    access: {
      public: over.public ?? false,
      direct: { users: over.users ?? [], groups: over.groups ?? [] },
      company: over.company ?? [],
    },
    restrictions: { revoke: over.revoke ?? [], expiry: over.expiry ?? {} },
  }
}

describe('buildAccessEntries — sources', () => {
  it('names a direct grant', () => {
    const entries = buildAccessEntries({ ...base, permissions: permissions({ users: ['survey'] }) })

    expect(entries).toHaveLength(1)
    expect(entries[0]?.sources).toEqual([DIRECT_SOURCE])
  })

  it('expands a company grant to its members', () => {
    const entries = buildAccessEntries({ ...base, permissions: permissions({ company: ['STTH'] }) })

    expect(entries.map((e) => e.uid).sort()).toEqual(['janine', 'nattha'])
    expect(entries[0]?.sources).toEqual(['บริษัท STTH'])
  })

  it('expands ทุกบริษัท to every active company', () => {
    const entries = buildAccessEntries({ ...base, permissions: permissions({ company: ['ALL'] }) })

    expect(entries).toHaveLength(3)
    expect(entries[0]?.sources).toEqual(['ทุกบริษัท'])
  })

  it('expands a group grant to its members', () => {
    const entries = buildAccessEntries({ ...base, permissions: permissions({ groups: ['finance'] }) })

    expect(entries.map((e) => e.uid)).toEqual(['nattha'])
    expect(entries[0]?.sources).toEqual(['กลุ่ม การเงิน'])
  })

  it('reaches everyone when the item is public', () => {
    const entries = buildAccessEntries({ ...base, permissions: permissions({ public: true }) })

    expect(entries).toHaveLength(3)
    expect(entries[0]?.sources).toEqual(['สาธารณะ'])
  })

  it('labels an inherited folder grant with the folder name', () => {
    const entries = buildAccessEntries({
      ...base,
      permissions: permissions(),
      inherited: [{
        name: 'Finance',
        access: { direct: { users: [], groups: [] }, company: ['STTH'] },
      }],
    })

    expect(entries.map((e) => e.uid).sort()).toEqual(['janine', 'nattha'])
    expect(entries[0]?.sources).toEqual(['📁 Finance · บริษัท STTH'])
  })

  it('collects every reason a user has access', () => {
    const entries = buildAccessEntries({
      ...base,
      permissions: permissions({ groups: ['finance'], company: ['STTH'] }),
    })
    const nattha = entries.find((e) => e.uid === 'nattha')

    expect(nattha?.sources).toEqual(['กลุ่ม การเงิน', 'บริษัท STTH'])
  })
})

describe('buildAccessEntries — restrictions', () => {
  it('flags an expired user instead of dropping them', () => {
    const entries = buildAccessEntries({
      ...base,
      permissions: permissions({
        company: ['STTH'],
        expiry: { nattha: new Date('2026-08-18T16:59:59.999Z') },
      }),
    })
    const nattha = entries.find((e) => e.uid === 'nattha')

    expect(nattha?.blockedBy).toBe('หมดอายุแล้ว')
    expect(nattha?.sources).toEqual(['บริษัท STTH'])
  })

  it('leaves a future expiry alone', () => {
    const entries = buildAccessEntries({
      ...base,
      permissions: permissions({
        company: ['STTH'],
        expiry: { nattha: new Date('2026-09-01T00:00:00.000Z') },
      }),
    })

    expect(entries.find((e) => e.uid === 'nattha')?.blockedBy).toBeUndefined()
  })

  it('flags a revoked user', () => {
    const entries = buildAccessEntries({
      ...base,
      permissions: permissions({ company: ['STTH'], revoke: ['janine'] }),
    })

    expect(entries.find((e) => e.uid === 'janine')?.blockedBy).toBe('ถูกระงับ')
  })

  it('applies an ancestor folder restriction too', () => {
    const entries = buildAccessEntries({
      ...base,
      permissions: permissions({ company: ['STTH'] }),
      inherited: [{
        name: 'Finance',
        restrictions: { revoke: ['janine'], expiry: {} },
      }],
    })

    expect(entries.find((e) => e.uid === 'janine')?.blockedBy).toBe('ถูกระงับ')
  })

  it('ignores a restriction on someone with no access at all', () => {
    const entries = buildAccessEntries({
      ...base,
      permissions: permissions({ revoke: ['survey'] }),
    })

    expect(entries).toEqual([])
  })
})

describe('accessibleUsers', () => {
  it('keeps only the users who really get in', () => {
    const entries = buildAccessEntries({
      ...base,
      permissions: permissions({ company: ['STTH'], revoke: ['janine'] }),
    })

    expect(accessibleUsers(entries).map((e) => e.uid)).toEqual(['nattha'])
  })
})
