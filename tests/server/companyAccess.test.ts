/**
 * Regression tests for server/utils/companyAccess.ts — checkDashboardAccess
 *
 * Covers DESIGN-001: an empty `access.company` array means "all companies"
 * ONLY when the source has no direct grants. Once direct users/groups are set,
 * an empty company must mean "grant-only" so per-user/group grants actually
 * restrict access (previously they were silently overridden to public).
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

describe('checkDashboardAccess — empty company semantics (DESIGN-001)', () => {
  it('empty company + NO grants → public (everyone allowed)', () => {
    const d = dash({ direct: { users: [], groups: [] }, company: [] })
    expect(checkDashboardAccess(d, user()).allowed).toBe(true)
  })

  it('empty company + direct users → only granted users (others denied)', () => {
    const d = dash({ direct: { users: ['u1'], groups: [] }, company: [] })
    expect(checkDashboardAccess(d, user({ uid: 'u1' })).allowed).toBe(true)
    expect(checkDashboardAccess(d, user({ uid: 'u2' })).allowed).toBe(false)
  })

  it('empty company + direct groups → only members of the group (others denied)', () => {
    const d = dash({ direct: { users: [], groups: ['finance'] }, company: [] })
    expect(checkDashboardAccess(d, user({ groups: ['finance'] })).allowed).toBe(true)
    expect(checkDashboardAccess(d, user({ groups: ['sales'] })).allowed).toBe(false)
  })

  it('removing the last grant makes an empty-company dashboard public again', () => {
    const granted = dash({ direct: { users: ['u1'], groups: [] }, company: [] })
    expect(checkDashboardAccess(granted, user({ uid: 'u2' })).allowed).toBe(false)
    const cleared = dash({ direct: { users: [], groups: [] }, company: [] })
    expect(checkDashboardAccess(cleared, user({ uid: 'u2' })).allowed).toBe(true)
  })

  it('non-empty company still scopes by company regardless of grants', () => {
    const d = dash({ direct: { users: [], groups: [] }, company: ['STTH'] })
    expect(checkDashboardAccess(d, user({ company: 'STTH' })).allowed).toBe(true)
    expect(checkDashboardAccess(d, user({ company: 'ORAY' })).allowed).toBe(false)
  })

  it('admin always allowed', () => {
    const d = dash({ direct: { users: ['u9'], groups: [] }, company: ['STTH'] })
    expect(checkDashboardAccess(d, user({ role: 'admin' })).allowed).toBe(true)
  })
})

describe('checkDashboardAccess — folder inheritance still works', () => {
  it('grant-only dashboard is still reachable via an inheriting folder', () => {
    const d = dash({ direct: { users: ['u1'], groups: [] }, company: [] })
    const folders = [
      {
        id: 'f1',
        name: 'Finance',
        inheritPermissions: true,
        access: { direct: { users: [], groups: [] }, company: ['STTH'] },
        restrictions: { revoke: [], expiry: {} },
      },
    ]
    // u2 is not granted on the dashboard, but is in company STTH via folder
    expect(checkDashboardAccess(d, user({ uid: 'u2', company: 'STTH' }), folders).allowed).toBe(true)
    // u3 in ORAY: no dashboard grant, no folder company match → denied
    expect(checkDashboardAccess(d, user({ uid: 'u3', company: 'ORAY' }), folders).allowed).toBe(false)
  })
})
