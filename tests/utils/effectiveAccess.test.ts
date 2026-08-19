/**
 * Tests for app/utils/effectiveAccess.ts
 *
 * One calculation now feeds both the "ผลลัพธ์รวม" bar and the picker badges.
 * If it drifts, the page contradicts itself — which is the bug class this
 * builder exists to close.
 */

import { describe, it, expect } from 'vitest'
import {
  buildAccessEntries,
  accessibleUsers,
  sourceLabel,
  sourceDetail,
  strandedRestrictions,
  withoutRestrictionsFor,
} from '../../app/utils/effectiveAccess'
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
    expect(entries[0]?.sources).toEqual([{ kind: 'direct', viaFolder: undefined }])
  })

  it('expands a company grant to its members', () => {
    const entries = buildAccessEntries({ ...base, permissions: permissions({ company: ['STTH'] }) })

    expect(entries.map((e) => e.uid).sort()).toEqual(['janine', 'nattha'])
    expect(entries[0]?.sources.map(sourceLabel)).toEqual(['บริษัท STTH'])
  })

  it('expands ทุกบริษัท to every active company', () => {
    const entries = buildAccessEntries({ ...base, permissions: permissions({ company: ['ALL'] }) })

    expect(entries).toHaveLength(3)
    expect(entries[0]?.sources.map(sourceLabel)).toEqual(['ทุกบริษัท'])
  })

  it('expands a group grant to its members', () => {
    const entries = buildAccessEntries({ ...base, permissions: permissions({ groups: ['finance'] }) })

    expect(entries.map((e) => e.uid)).toEqual(['nattha'])
    expect(entries[0]?.sources.map(sourceLabel)).toEqual(['กลุ่ม การเงิน'])
  })

  it('reaches everyone when the item is public', () => {
    const entries = buildAccessEntries({ ...base, permissions: permissions({ public: true }) })

    expect(entries).toHaveLength(3)
    expect(entries[0]?.sources.map(sourceLabel)).toEqual(['สาธารณะ'])
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
    // the badge names the folder only; the effective-access bar spells out how
    expect(entries[0]?.sources.map(sourceLabel)).toEqual(['โฟลเดอร์ Finance'])
    expect(entries[0]?.sources.map(sourceDetail)).toEqual(['📁 Finance · บริษัท STTH'])
  })

  it('collects every reason a user has access', () => {
    const entries = buildAccessEntries({
      ...base,
      permissions: permissions({ groups: ['finance'], company: ['STTH'] }),
    })
    const nattha = entries.find((e) => e.uid === 'nattha')

    expect(nattha?.sources.map(sourceLabel)).toEqual(['กลุ่ม การเงิน', 'บริษัท STTH'])
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
    expect(nattha?.sources.map(sourceLabel)).toEqual(['บริษัท STTH'])
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

describe('sourceLabel / sourceDetail', () => {
  it('spells out folder and group so an identical name cannot be mistaken', () => {
    // A folder named Finance and a group named Finance both exist in prod
    expect(sourceLabel({ kind: 'company', name: 'STTH', viaFolder: 'Finance' })).toBe('โฟลเดอร์ Finance')
    expect(sourceLabel({ kind: 'group', name: 'Finance' })).toBe('กลุ่ม Finance')
  })

  it('keeps the whole chain in the detailed form', () => {
    expect(sourceDetail({ kind: 'company', name: 'STTH', viaFolder: 'Finance' })).toBe('📁 Finance · บริษัท STTH')
    expect(sourceDetail({ kind: 'group', name: 'Finance' })).toBe('กลุ่ม Finance')
    expect(sourceDetail({ kind: 'direct' })).toBe('สิทธิ์ตรง')
    expect(sourceDetail({ kind: 'allCompanies' })).toBe('ทุกบริษัท')
    expect(sourceDetail({ kind: 'public' })).toBe('สาธารณะ')
  })
})

describe('strandedRestrictions', () => {
  const expiryDate = new Date('2026-09-01T00:00:00.000Z')

  it('reports a restriction whose user no longer has any grant', () => {
    const perms = permissions({ revoke: ['janine'] })
    const entries = buildAccessEntries({ ...base, permissions: perms })

    expect(strandedRestrictions(perms.restrictions, entries)).toEqual(['janine'])
  })

  it('leaves a restriction that still has a grant to act on', () => {
    const perms = permissions({ company: ['STTH'], revoke: ['janine'] })
    const entries = buildAccessEntries({ ...base, permissions: perms })

    expect(strandedRestrictions(perms.restrictions, entries)).toEqual([])
  })

  it('counts public access as a grant, so nothing is stranded while it is on', () => {
    const perms = permissions({ public: true, expiry: { nattha: expiryDate } })
    const entries = buildAccessEntries({ ...base, permissions: perms })

    expect(strandedRestrictions(perms.restrictions, entries)).toEqual([])
  })

  it('strands the same entry once public access is turned off', () => {
    const perms = permissions({ expiry: { nattha: expiryDate } })
    const entries = buildAccessEntries({ ...base, permissions: perms })

    expect(strandedRestrictions(perms.restrictions, entries)).toEqual(['nattha'])
  })

  it('covers revoke and expiry together without duplicates', () => {
    const perms = permissions({ revoke: ['janine', 'nattha'], expiry: { nattha: expiryDate } })
    const entries = buildAccessEntries({ ...base, permissions: perms })

    expect(strandedRestrictions(perms.restrictions, entries).sort()).toEqual(['janine', 'nattha'])
  })

  it('reports nothing when there are no restrictions', () => {
    const perms = permissions({ company: ['STTH'] })
    const entries = buildAccessEntries({ ...base, permissions: perms })

    expect(strandedRestrictions(perms.restrictions, entries)).toEqual([])
  })
})

describe('withoutRestrictionsFor', () => {
  it('drops the named users from both lists and leaves the rest', () => {
    const expiryDate = new Date('2026-09-01T00:00:00.000Z')
    const restrictions = { revoke: ['janine', 'survey'], expiry: { nattha: expiryDate, survey: expiryDate } }

    const next = withoutRestrictionsFor(restrictions, ['survey'])

    expect(next.revoke).toEqual(['janine'])
    expect(next.expiry).toEqual({ nattha: expiryDate })
  })

  it('does not mutate the input', () => {
    const restrictions = { revoke: ['janine'], expiry: {} }

    withoutRestrictionsFor(restrictions, ['janine'])

    expect(restrictions.revoke).toEqual(['janine'])
  })
})
