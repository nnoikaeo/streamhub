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
import type { AccessControl, User } from '~/types/dashboard'

interface TestUser {
  uid: string
  // The union, not `string` — checkDashboardAccess reads role as User['role']
  role: User['role']
  company: string
  groups: string[]
}

const user = (over: Partial<TestUser> = {}): TestUser => ({
  uid: 'u1',
  role: 'user',
  company: 'ORAY',
  groups: [],
  ...over,
})

const dash = (access: AccessControl) => ({
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

describe('checkDashboardAccess — moderator folder management (DESIGN-001)', () => {
  const mgrFolders = [
    { id: 'f1', name: 'Sales', parentId: null, assignedModerators: ['mod1'], access: { direct: { users: [], groups: [] }, company: [] }, restrictions: { revoke: [], expiry: {} } },
    { id: 'f1a', name: 'Sub', parentId: 'f1', assignedModerators: [], access: { direct: { users: [], groups: [] }, company: [] }, restrictions: { revoke: [], expiry: {} } },
  ]

  it('moderator sees a private dashboard in a folder they manage', () => {
    const d = dash({ direct: { users: [], groups: [] }, company: [] }) // folderId f1
    expect(checkDashboardAccess(d, user({ uid: 'mod1', role: 'moderator' }), mgrFolders).allowed).toBe(true)
  })

  it('moderator sees a private dashboard in a SUBfolder of a managed folder', () => {
    const d = { ...dash({ direct: { users: [], groups: [] }, company: [] }), folderId: 'f1a' }
    expect(checkDashboardAccess(d, user({ uid: 'mod1', role: 'moderator' }), mgrFolders).allowed).toBe(true)
  })

  it('moderator does NOT see a private dashboard in a folder they do not manage', () => {
    const d = dash({ direct: { users: [], groups: [] }, company: [] })
    expect(checkDashboardAccess(d, user({ uid: 'mod2', role: 'moderator' }), mgrFolders).allowed).toBe(false)
  })

  it('revoke overrides moderator folder management', () => {
    const d = {
      ...dash({ direct: { users: [], groups: [] }, company: [] }),
      restrictions: { revoke: ['mod1'], expiry: {} },
    }
    expect(checkDashboardAccess(d, user({ uid: 'mod1', role: 'moderator' }), mgrFolders).allowed).toBe(false)
  })

  it('regular user gets nothing from folder management', () => {
    const d = dash({ direct: { users: [], groups: [] }, company: [] })
    expect(checkDashboardAccess(d, user({ uid: 'mod1', role: 'user' }), mgrFolders).allowed).toBe(false)
  })
})

describe('checkDashboardAccess — access expiry (PR #364)', () => {
  const past = new Date(Date.now() - 86_400_000)
  const future = new Date(Date.now() + 86_400_000)

  /**
   * A Firestore Timestamp as it reaches the server: the admin SDK hands back a
   * Timestamp object, not a Date, and nothing converts it on this path. Only
   * `toDate()` is read, so the double stubs that much of the SDK type.
   */
  const timestamp = (date: Date) =>
    ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0, toDate: () => date }) as unknown as Date

  const granted = (expiry: Record<string, Date>) => ({
    id: 'd1',
    folderId: 'f1',
    access: { direct: { users: ['u1'], groups: [] }, company: [] },
    restrictions: { revoke: [], expiry },
  })

  it('a Timestamp expiry in the past denies a granted user', () => {
    const d = granted({ u1: timestamp(past) })
    const result = checkDashboardAccess(d, user({ uid: 'u1' }))
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Access revoked or expired')
  })

  it('a Timestamp expiry in the future still allows', () => {
    const d = granted({ u1: timestamp(future) })
    expect(checkDashboardAccess(d, user({ uid: 'u1' })).allowed).toBe(true)
  })

  it('an ISO-string expiry (JSON store) behaves the same as a Timestamp', () => {
    const iso = (date: Date) => date.toISOString() as unknown as Date
    expect(checkDashboardAccess(granted({ u1: iso(past) }), user({ uid: 'u1' })).allowed).toBe(false)
    expect(checkDashboardAccess(granted({ u1: iso(future) }), user({ uid: 'u1' })).allowed).toBe(true)
  })

  it('an expiry on another user does not touch this one', () => {
    const d = granted({ u2: timestamp(past) })
    expect(checkDashboardAccess(d, user({ uid: 'u1' })).allowed).toBe(true)
  })

  it('an expiry inherited from an ancestor folder denies too', () => {
    const d = {
      id: 'd1',
      folderId: 'f1',
      access: { direct: { users: ['u1'], groups: [] }, company: [] },
      restrictions: { revoke: [], expiry: {} },
    }
    const folders = [
      {
        id: 'f1',
        name: 'Finance',
        inheritPermissions: true,
        access: { direct: { users: [], groups: [] }, company: [] },
        restrictions: { revoke: [], expiry: { u1: timestamp(past) } },
      },
    ]
    expect(checkDashboardAccess(d, user({ uid: 'u1' }), folders).reason).toBe('Restricted by folder: Finance')
  })

  it('an unreadable expiry does NOT deny — bad data must not lock a user out', () => {
    const d = granted({ u1: 'not a date' as unknown as Date })
    expect(checkDashboardAccess(d, user({ uid: 'u1' })).allowed).toBe(true)
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
