/**
 * Tests for app/utils/inviteCsv.ts — importing invitations from a CSV file.
 *
 * A row reaches the queue only when every cell is one StreamHub accepts;
 * anything else comes back with the reason and the line it sits on.
 */

import { describe, it, expect } from 'vitest'
import {
  decodeCsvBytes, parseCsv, readInviteCsv, inviteTemplateCsv, inviteListsCsv,
  INVITE_CSV_HEADERS, INVITE_CSV_MAX_ROWS,
} from '../../app/utils/inviteCsv'
import type { InviteCsvContext } from '../../app/utils/inviteCsv'

const HEADER = INVITE_CSV_HEADERS.join(',')
const context: InviteCsvContext = {
  companies: [{ code: 'STSB' }, { code: 'INFE' }],
  groups: [{ id: 'g_tech', name: 'Technician' }, { id: 'g_fin', name: 'Finance' }, { id: 'g_mgmt', name: 'Management' }],
}
const read = (lines: string[], ctx: InviteCsvContext = context) => readInviteCsv([HEADER, ...lines].join('\r\n'), ctx)

describe('decodeCsvBytes', () => {
  it('reads UTF-8 and drops the BOM', () => {
    const bytes = new TextEncoder().encode('﻿ชื่อ,สมชาย')
    expect(decodeCsvBytes(bytes)).toBe('ชื่อ,สมชาย')
  })

  it('reads a Thai Excel file saved as windows-874', () => {
    // "สมชาย" in TIS-620 / windows-874 — not valid UTF-8
    const bytes = new Uint8Array([0xCA, 0xC1, 0xAA, 0xD2, 0xC2])
    expect(decodeCsvBytes(bytes)).toBe('สมชาย')
  })
})

describe('parseCsv', () => {
  it('handles quoted commas, quotes and line breaks', () => {
    expect(parseCsv('a,"b, c","say ""hi""","x\ny"\r\n1,2,3,4')).toEqual([
      ['a', 'b, c', 'say "hi"', 'x\ny'],
      ['1', '2', '3', '4'],
    ])
  })

  it('accepts a file with no final line break and empty cells', () => {
    expect(parseCsv('a,,c\n,,')).toEqual([['a', '', 'c'], ['', '', '']])
  })
})

describe('readInviteCsv', () => {
  it('queues a valid row with group ids and a normalized gmail', () => {
    const { accepted, rejected } = read(['สมชาย,ใจดี,stsb,Technician,finance,,SomChai.J@Gmail.com,user'])
    expect(rejected).toEqual([])
    expect(accepted).toEqual([{
      line: 2, firstName: 'สมชาย', lastName: 'ใจดี', company: 'STSB',
      groups: ['g_tech', 'g_fin'], email: 'somchai.j@gmail.com', role: 'user',
    }])
  })

  it('accepts a bare username in the gmail column and no name', () => {
    const { accepted } = read([',,INFE,,,,stsb.lead,moderator'])
    expect(accepted[0]).toMatchObject({ firstName: '', lastName: '', email: 'stsb.lead@gmail.com', role: 'moderator', groups: [] })
  })

  it('reads the file Google Sheets writes, quotes and all', () => {
    const { accepted } = read(['"สมหญิง","รัก งาน","STSB","Technician","","","somying@gmail.com","user"'])
    expect(accepted[0]).toMatchObject({ firstName: 'สมหญิง', lastName: 'รัก งาน' })
  })

  it('drops the groups of an admin, as every other write path does', () => {
    const { accepted } = read(['ก,ข,STSB,Finance,,,boss@gmail.com,admin'])
    expect(accepted[0]!.groups).toEqual([])
  })

  it('refuses a company name, an unknown group, another domain and a Thai role — all reasons at once', () => {
    const { accepted, rejected } = read(['วิชัย,มั่นคง,บริษัท สตรีมวอช,Sales,,,wichai@hotmail.com,ผู้ใช้'])
    expect(accepted).toEqual([])
    expect(rejected).toEqual([{
      line: 2,
      who: 'วิชัย มั่นคง',
      reasons: [
        'บริษัท "บริษัท สตรีมวอช" ไม่มีในระบบ — ใช้รหัสบริษัทเท่านั้น',
        'กลุ่ม "Sales" ไม่มีในระบบ',
        'gmail "wichai@hotmail.com" — รับเฉพาะ @gmail.com',
        'บทบาท "ผู้ใช้" — ใช้ได้เฉพาะ user / moderator / admin',
      ],
    }])
  })

  it('names the missing cells', () => {
    const { rejected } = read(['อรุณ,,,,,,,'])
    expect(rejected[0]!.reasons).toEqual(['ไม่มีรหัสบริษัท', 'ไม่มี gmail', 'ไม่มีบทบาท'])
  })

  it('refuses a gmail repeated in the file, naming the first line', () => {
    const { accepted, rejected } = read([
      ',,STSB,,,,a@gmail.com,user',
      ',,STSB,,,,A@gmail.com,user',
    ])
    expect(accepted).toHaveLength(1)
    expect(rejected[0]).toMatchObject({ line: 3, reasons: ['gmail ซ้ำกับแถว 2'] })
  })

  it('refuses a gmail already in the queue', () => {
    const { rejected } = read([',,STSB,,,,a@gmail.com,user'], { ...context, queuedEmails: ['a@gmail.com'] })
    expect(rejected[0]!.reasons).toEqual(['gmail นี้อยู่ในรายการแล้ว'])
  })

  it('skips blank rows but keeps line numbers as in the sheet', () => {
    const { accepted } = read([',,,,,,,', '', ',,STSB,,,,a@gmail.com,user'])
    expect(accepted[0]!.line).toBe(4)
  })

  it('refuses a file whose headers are not the template\'s', () => {
    const result = readInviteCsv('gmail,ชื่อ\na@gmail.com,ก', context)
    expect(result.fileError).toContain('หัวคอลัมน์ต้องเป็น')
    expect(result.accepted).toEqual([])
  })

  it('refuses an empty file and one that is too long', () => {
    expect(read([]).fileError).toBe('ไฟล์ไม่มีข้อมูลใต้หัวคอลัมน์')
    const many = Array.from({ length: INVITE_CSV_MAX_ROWS + 1 }, (_, i) => `,,STSB,,,,u${i}@gmail.com,user`)
    expect(read(many).fileError).toContain(`ไม่เกิน ${INVITE_CSV_MAX_ROWS}`)
  })

  it('reads back the template it hands out', () => {
    const text = decodeCsvBytes(new TextEncoder().encode(inviteTemplateCsv({ company: 'STSB', group: 'Technician' })))
    const { accepted, fileError } = readInviteCsv(text, context)
    expect(fileError).toBeUndefined()
    expect(accepted).toHaveLength(1)
  })
})

describe('inviteListsCsv', () => {
  it('writes codes, group names and roles as columns of their own lengths', () => {
    const rows = parseCsv(inviteListsCsv([{ code: 'STSB', name: 'สตรีมวอช' }], [...context.groups]).slice(1))
    expect(rows[0]).toEqual(['รหัสบริษัท', 'ชื่อบริษัท', 'กลุ่ม', 'บทบาท'])
    expect(rows[1]).toEqual(['STSB', 'สตรีมวอช', 'Finance', 'user'])
    expect(rows[3]).toEqual(['', '', 'Technician', 'admin'])
  })
})
