/**
 * Tests for app/utils/csv.ts and app/utils/accessExport.ts
 *
 * The dashboard-access file is what a tool admin holds up against the PIC
 * sheet, so it has to name exactly the people who can open the dashboard —
 * pinned below against the server's own check, not just the page's bar.
 */

import { describe, it, expect } from 'vitest'
import { toCsv, csvDateStamp, fileNamePart } from '../../app/utils/csv'
import { usersCsv, dashboardAccessCsv } from '../../app/utils/accessExport'
import { buildAccessEntries } from '../../app/utils/effectiveAccess'
import { checkDashboardAccess } from '../../server/utils/companyAccess'
import { isExpired } from '../../shared/utils/dates'
import type { AccessControl, AccessRestrictions, User } from '~/types/dashboard'

/** Parse what toCsv wrote back into rows — every cell is quoted. */
function parse(csv: string): string[][] {
  expect(csv.startsWith('﻿')).toBe(true)
  return csv.slice(1).split('\r\n').map((line) =>
    [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => (m[1] ?? '').replace(/""/g, '"')),
  )
}

describe('toCsv', () => {
  it('quotes every cell and doubles embedded quotes', () => {
    expect(toCsv(['a'], [['say "hi", ok']])).toBe('﻿"a"\r\n"say ""hi"", ok"')
  })

  it('defuses cells Excel would run as a formula', () => {
    const rows = parse(toCsv(['x'], [['=HYPERLINK("http://x")'], ['+1'], ['-1'], ['@SUM(A1)'], ['ปกติ']]))
    expect(rows.slice(1).map((r) => r[0])).toEqual([
      `'=HYPERLINK("http://x")`, `'+1`, `'-1`, `'@SUM(A1)`, 'ปกติ',
    ])
  })
})

describe('file names', () => {
  it('dates by the local calendar, not UTC', () => {
    expect(csvDateStamp(new Date(2026, 9, 6, 0, 30))).toBe('2026-10-06')
  })

  it('strips characters Windows rejects', () => {
    expect(fileNamePart('Hotline / ติดตั้ง: "Q4"')).toBe('Hotline - ติดตั้ง- -Q4-')
    expect(fileNamePart('   ')).toBe('dashboard')
  })
})

const groups = [
  { id: 'hotline', name: 'Hotline' },
  { id: 'lead', name: 'Lead' },
]

type TestUser = Pick<User, 'uid' | 'name' | 'email' | 'company' | 'groups' | 'isActive' | 'role'>

const users: TestUser[] = [
  { uid: 'somchai', name: 'สมชาย', email: 'somchai@x.com', company: 'STSS', groups: [], isActive: true, role: 'user' },
  { uid: 'mana', name: 'มานะ', email: 'mana@x.com', company: 'STEB', groups: ['hotline', 'lead', 'gone'], isActive: true, role: 'user' },
  { uid: 'piti', name: 'ปิติ', email: 'piti@x.com', company: 'STPK', groups: [], isActive: true, role: 'user' },
  { uid: 'left', name: 'วิชัย', email: 'wichai@x.com', company: 'STSS', groups: [], isActive: false, role: 'user' },
  { uid: 'mod', name: 'กุณฑลี', email: 'mod@x.com', company: 'STTH', groups: [], isActive: true, role: 'moderator' },
  { uid: 'mod2', name: 'ชูใจ', email: 'mod2@x.com', company: 'STTH', groups: [], isActive: true, role: 'moderator' },
  { uid: 'boss', name: 'แอดมิน', email: 'admin@x.com', company: 'STTH', groups: [], isActive: true, role: 'admin' },
]

describe('usersCsv', () => {
  it('writes ชื่อ อีเมล บริษัท กลุ่ม สถานะ, with group names and orphan ids dropped', () => {
    const rows = parse(usersCsv(users.slice(1, 4), groups))
    expect(rows).toEqual([
      ['ชื่อ', 'อีเมล', 'บริษัท', 'กลุ่ม', 'สถานะ'],
      ['มานะ', 'mana@x.com', 'STEB', 'Hotline, Lead', 'เปิดใช้งาน'],
      ['ปิติ', 'piti@x.com', 'STPK', '', 'เปิดใช้งาน'],
      ['วิชัย', 'wichai@x.com', 'STSS', '', 'ปิดใช้งาน'],
    ])
  })
})

// ─── Dashboard access ────────────────────────────────────────────────────

const folders = [
  {
    id: 'hotline', name: 'Hotline', parentId: 'ops',
    assignedModerators: ['mod'],
    inheritPermissions: false,
  },
  {
    id: 'ops', name: 'Ops', parentId: null,
    assignedModerators: ['mod2', 'somchai'],
    inheritPermissions: true,
    access: { direct: { users: ['piti'], groups: [] }, company: [] } as AccessControl,
    restrictions: { revoke: [], expiry: {} } as unknown as AccessRestrictions,
  },
]

function exportFor(access: AccessControl, restrictions: AccessRestrictions) {
  const nonAdmin = users.filter((u) => u.role !== 'admin')
  const entries = buildAccessEntries({
    permissions: { access, restrictions },
    users: nonAdmin,
    groups,
    inherited: folders
      .filter((f) => f.inheritPermissions && f.access)
      .map((f) => ({ name: f.name, access: f.access, restrictions: f.restrictions })),
    isExpiredFn: isExpired,
  })
  return parse(dashboardAccessCsv({ entries, users, groups, folderChain: folders }))
}

const scenarios: { name: string, access: AccessControl, restrictions: AccessRestrictions }[] = [
  {
    name: 'company + group grants',
    access: { direct: { users: [], groups: ['hotline'] }, company: ['STSS'] },
    restrictions: { revoke: [], expiry: {} },
  },
  {
    name: 'public',
    access: { public: true, direct: { users: [], groups: [] }, company: [] },
    restrictions: { revoke: [], expiry: {} },
  },
  {
    name: '"ทุกบริษัท" (ALL) only',
    access: { direct: { users: [], groups: [] }, company: ['ALL'] },
    restrictions: { revoke: [], expiry: {} },
  },
  {
    name: 'revoked moderator and expired grant',
    access: { direct: { users: ['mod', 'mana'], groups: [] }, company: [] },
    restrictions: { revoke: ['mod'], expiry: { mana: '2020-01-01T00:00:00.000Z' } } as unknown as AccessRestrictions,
  },
]

describe('dashboardAccessCsv', () => {
  it('lists each person once with every reason, admins and disabled accounts left out', () => {
    const rows = exportFor(scenarios[0]!.access, scenarios[0]!.restrictions)
    expect(rows[0]).toEqual(['ชื่อ', 'อีเมล', 'บริษัท', 'กลุ่ม', 'ได้สิทธิ์ผ่าน'])
    const byName = Object.fromEntries(rows.slice(1).map((r) => [r[0], r]))

    expect(byName['สมชาย']).toEqual(['สมชาย', 'somchai@x.com', 'STSS', '', 'บริษัท STSS'])
    expect(byName['มานะ']).toEqual(['มานะ', 'mana@x.com', 'STEB', 'Hotline, Lead', 'กลุ่ม Hotline'])
    expect(byName['ปิติ']?.[4]).toBe('โฟลเดอร์ Ops · สิทธิ์ตรง')
    expect(byName['กุณฑลี']?.[4]).toBe('ผู้ดูแลโฟลเดอร์ Hotline')
    expect(byName['ชูใจ']?.[4]).toBe('ผู้ดูแลโฟลเดอร์ Ops')
    expect(byName['วิชัย']).toBeUndefined()
    expect(byName['แอดมิน']).toBeUndefined()
  })

  it('does not call a user a folder moderator just because a folder names them', () => {
    const rows = exportFor(scenarios[0]!.access, scenarios[0]!.restrictions)
    expect(rows.find((r) => r[0] === 'สมชาย')?.[4]).not.toContain('ผู้ดูแลโฟลเดอร์')
  })

  it.each(scenarios)('names exactly who the server lets in — $name', ({ access, restrictions }) => {
    const exported = exportFor(access, restrictions).slice(1).map((r) => r[1]).sort()

    const dashboard = { folderId: 'hotline', access, restrictions }
    const allowed = users
      .filter((u) => u.isActive && u.role !== 'admin')
      .filter((u) => checkDashboardAccess(dashboard, { ...u, company: u.company ?? '' }, folders).allowed)
      .map((u) => u.email)
      .sort()

    expect(exported).toEqual(allowed)
  })
})
