/**
 * Tests for app/utils/sharedCount.ts — the home page "แชร์ให้ฉัน" card, which
 * used to count direct grants only (3 for "ก ข" while Discover showed 4).
 */

import { describe, it, expect } from 'vitest'
import { sharedBreakdown, sharedBreakdownLabel } from '../../app/utils/sharedCount'

const viewer = { uid: 'survey', groups: ['sales', 'marketing'], company: 'OAYT' }
const grant = (over: { users?: string[], groups?: string[], company?: string[] } = {}) => ({
  direct: { users: over.users ?? [], groups: over.groups ?? [] },
  company: over.company ?? [],
})

describe('sharedBreakdown', () => {
  it('counts the prod case: three direct, one through a group', () => {
    const b = sharedBreakdown([
      { owner: 'x', access: grant({ users: ['survey'] }) },
      { owner: 'x', access: grant({ users: ['survey'] }) },
      { owner: 'x', access: grant({ users: ['survey'] }) },
      { owner: 'x', access: grant({ groups: ['sales'] }) },
    ], viewer)
    expect(b).toEqual({ total: 4, direct: 3, group: 1, company: 0, other: 0 })
  })

  it('leaves out dashboards the viewer owns — they are "แดชบอร์ดของฉัน"', () => {
    expect(sharedBreakdown([{ owner: 'survey', access: grant({ users: ['survey'] }) }], viewer).total).toBe(0)
  })

  it('counts a dashboard reached several ways once, under the first way', () => {
    const b = sharedBreakdown([{ owner: 'x', access: grant({ users: ['survey'], groups: ['sales'], company: ['OAYT'] }) }], viewer)
    expect(b).toEqual({ total: 1, direct: 1, group: 0, company: 0, other: 0 })
  })

  it('counts the viewer\'s own company grant, not a stored ALL (BUG-043)', () => {
    const b = sharedBreakdown([
      { owner: 'x', access: grant({ company: ['OAYT'] }) },
      { owner: 'x', access: grant({ company: ['ALL'] }) },
    ], viewer)
    expect(b.company).toBe(1)
    expect(b.other).toBe(1)
  })

  it('puts access with no matching grant on the dashboard (public, folder) under other', () => {
    const b = sharedBreakdown([{ owner: 'x', access: grant() }, { owner: 'x' }], viewer)
    expect(b).toEqual({ total: 2, direct: 0, group: 0, company: 0, other: 2 })
  })
})

describe('sharedBreakdownLabel', () => {
  it('lists non-zero parts only', () => {
    expect(sharedBreakdownLabel({ total: 4, direct: 3, group: 1, company: 0, other: 0 })).toBe('สิทธิ์ตรง 3 · ผ่านกลุ่ม 1')
  })

  it('is empty when nothing is shared', () => {
    expect(sharedBreakdownLabel({ total: 0, direct: 0, group: 0, company: 0, other: 0 })).toBe('')
  })
})
