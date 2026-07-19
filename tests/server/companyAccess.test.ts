/**
 * Regression tests for server/utils/companyAccess.ts — checkDashboardAccess
 *
 * DESIGN-001 (v6.1, Looker-style visibility):
 * - Default is PRIVATE: no public flag, no grants, no company → only admin.
 * - access.public === true → every logged-in user can access.
 * - direct users / groups / company grants restrict to those.
 */

import { describe, it, expect } from 'vitest'
import { checkDashboardAccess } from '../../server/utils/companyAccess'

const user = (over: Record<string, any> = {}) => ({
  uid: 'u1',
  role: 'user',
  company: 'ORAY',
  groups: [] as string[],
  ...over,
})

const dash = (access: any) => ({
  id: 'd1',
  folderId: 'f1',
  access,
  restrictions: { revoke: [], expiry: {} },
})

describe('checkDashboardAccess — Looker-style visibility (DESIGN-001)', () => {
  it('no grants + no public → PRIVATE (denied for non-admin)', () => {
    const d = dash({ direct: { users: [], groups: [] }, company: [] })
    expect(checkDashboardAccess(d, user()).allowed).toBe(false)
  })

  it('public:true → everyone allowed', () => {
    const d = dash({ public: true, direct: { users: [], groups: [] }, company: [] })
    expect(checkDashboardAccess(d, user()).allowed).toBe(true)
    expect(checkDashboardAccess(d, user({ uid: 'zzz', company: 'X' })).allowed).toBe(true)
  })

  it('direct users → only granted users', () => {
    const d = dash({ direct: { users: ['u1'], groups: [] }, company: [] })
    expect(checkDashboardAccess(d, user({ uid: 'u1' })).allowed).toBe(true)
    expect(checkDashboardAccess(d, user({ uid: 'u2' })).allowed).toBe(false)
  })

  it('direct groups → only members', () => {
    const d = dash({ direct: { users: [], groups: ['finance'] }, company: [] })
    expect(checkDashboardAccess(d, user({ groups: ['finance'] })).allowed).toBe(true)
    expect(checkDashboardAccess(d, user({ groups: ['sales'] })).allowed).toBe(false)
  })

  it('company → only matching company', () => {
    const d = dash({ direct: { users: [], groups: [] }, company: ['STTH'] })
    expect(checkDashboardAccess(d, user({ company: 'STTH' })).allowed).toBe(true)
    expect(checkDashboardAccess(d, user({ company: 'ORAY' })).allowed).toBe(false)
  })

  it('removing the last grant makes a dashboard private (not public)', () => {
    const granted = dash({ direct: { users: ['u1'], groups: [] }, company: [] })
    expect(checkDashboardAccess(granted, user({ uid: 'u1' })).allowed).toBe(true)
    const cleared = dash({ direct: { users: [], groups: [] }, company: [] })
    expect(checkDashboardAccess(cleared, user({ uid: 'u1' })).allowed).toBe(false)
  })

  it('admin always allowed even on a private dashboard', () => {
    const d = dash({ direct: { users: [], groups: [] }, company: [] })
    expect(checkDashboardAccess(d, user({ role: 'admin' })).allowed).toBe(true)
  })

  it('explicit revoke overrides public', () => {
    const d = {
      id: 'd1',
      folderId: 'f1',
      access: { public: true, direct: { users: [], groups: [] }, company: [] },
      restrictions: { revoke: ['u1'], expiry: {} },
    }
    expect(checkDashboardAccess(d, user({ uid: 'u1' })).allowed).toBe(false)
  })
})

describe('checkDashboardAccess — folder inheritance', () => {
  it('private dashboard reachable via inheriting folder company grant', () => {
    const d = dash({ direct: { users: [], groups: [] }, company: [] })
    const folders = [
      {
        id: 'f1',
        name: 'Finance',
        inheritPermissions: true,
        access: { direct: { users: [], groups: [] }, company: ['STTH'] },
        restrictions: { revoke: [], expiry: {} },
      },
    ]
    expect(checkDashboardAccess(d, user({ uid: 'u2', company: 'STTH' }), folders).allowed).toBe(true)
    expect(checkDashboardAccess(d, user({ uid: 'u3', company: 'ORAY' }), folders).allowed).toBe(false)
  })
})
