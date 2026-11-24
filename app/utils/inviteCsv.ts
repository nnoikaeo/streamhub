/**
 * Invitations from a CSV file — the bulk-invite modal's import.
 *
 * The admin hands each company a Google Sheets template (dropdowns for company
 * code, groups and role), the company fills it and downloads it as CSV, and
 * the admin imports the file here. Every row is checked again — a dropdown in
 * the sheet does not stop someone typing over it — and only rows that pass go
 * into the queue; the rest come back with the reason, so nothing is sent that
 * the admin has not seen.
 *
 * Columns, in the order agreed with One Data (2026-11):
 *   ชื่อ, นามสกุล, บริษัท, กลุ่ม 1, กลุ่ม 2, กลุ่ม 3, gmail, บทบาท
 * Company is the code only; role is `user`, `moderator` or `admin` only.
 */
import { toCsv } from './csv'

export const INVITE_CSV_HEADERS = ['ชื่อ', 'นามสกุล', 'บริษัท', 'กลุ่ม 1', 'กลุ่ม 2', 'กลุ่ม 3', 'gmail', 'บทบาท'] as const

export const INVITE_ROLES = ['user', 'moderator', 'admin'] as const
export type InviteRole = typeof INVITE_ROLES[number]

/**
 * The Google Sheets template the admin copies for each company — dropdowns for
 * company code, groups and role, fed from its "รายการ" tab. Empty until the
 * sheet exists; the modal hides the link while it is. How to build it:
 * docs/OPERATIONS/invite-csv-template.md.
 */
export const INVITE_TEMPLATE_SHEET_URL = ''

/** Most rows one file may hold — a company sends tens, not thousands. */
export const INVITE_CSV_MAX_ROWS = 500

export interface ImportedInvite {
  /** Line in the file, counting the header as 1 — what the admin sees in Sheets */
  line: number
  firstName: string
  lastName: string
  company: string
  groups: string[]
  email: string
  role: InviteRole
}

export interface RejectedRow {
  line: number
  /** Whatever identifies the row to the admin: name, else gmail, else the line */
  who: string
  reasons: string[]
}

export interface InviteCsvResult {
  accepted: ImportedInvite[]
  rejected: RejectedRow[]
  /** Set when the file as a whole cannot be read — no rows are returned then */
  fileError?: string
}

interface CompanyRef { code: string }
interface GroupRef { id: string, name: string }

export interface InviteCsvContext {
  companies: readonly CompanyRef[]
  groups: readonly GroupRef[]
  /** Addresses already queued in the modal — imported again they would be sent twice */
  queuedEmails?: readonly string[]
}

/**
 * Bytes of an uploaded file as text.
 *
 * Google Sheets and Excel's "CSV UTF-8" write UTF-8. Excel's plain "CSV" on a
 * Thai Windows writes the system code page, windows-874, which read as UTF-8
 * turns every Thai name into noise — so a file that is not valid UTF-8 is read
 * as windows-874 instead.
 */
export function decodeCsvBytes(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let text: string
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(view)
  } catch {
    text = new TextDecoder('windows-874').decode(view)
  }
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text
}

/**
 * Split CSV text into rows of cells (RFC 4180: quoted cells may hold commas,
 * line breaks and `""` for a quote). Accepts `\r\n`, `\n` or `\r` line ends.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        cell += ch
      }
      continue
    }
    if (ch === '"' && cell === '') {
      quoted = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

/** The cell as text a person typed — `'` prefixes that Sheets adds to keep text as text are dropped. */
const clean = (value: string | undefined): string => (value ?? '').replace(/^'/, '').trim()

/** Read a decoded CSV file into rows to queue and rows to send back. */
export function readInviteCsv(text: string, context: InviteCsvContext): InviteCsvResult {
  const rows = parseCsv(text)
  const header = (rows[0] ?? []).map((h) => clean(h))
  const expected = [...INVITE_CSV_HEADERS]

  if (header.length < expected.length || expected.some((h, i) => header[i] !== h)) {
    return {
      accepted: [],
      rejected: [],
      fileError: `หัวคอลัมน์ต้องเป็น ${expected.join(', ')} ตามลำดับ — ใช้ template ของ StreamHub`,
    }
  }

  const body = rows
    .map((cells, i) => ({ cells, line: i + 1 }))
    .slice(1)
    .filter(({ cells }) => cells.some((c) => clean(c) !== ''))

  if (body.length === 0) {
    return { accepted: [], rejected: [], fileError: 'ไฟล์ไม่มีข้อมูลใต้หัวคอลัมน์' }
  }
  if (body.length > INVITE_CSV_MAX_ROWS) {
    return {
      accepted: [],
      rejected: [],
      fileError: `ไฟล์มี ${body.length} แถว — นำเข้าได้ครั้งละไม่เกิน ${INVITE_CSV_MAX_ROWS} แถว`,
    }
  }

  const companyByCode = new Map(context.companies.map((c) => [c.code.toUpperCase(), c.code]))
  const groupByName = new Map(context.groups.map((g) => [g.name.trim().toLowerCase(), g]))
  const queued = new Set((context.queuedEmails ?? []).map((e) => e.toLowerCase()))
  const seen = new Map<string, number>()

  const accepted: ImportedInvite[] = []
  const rejected: RejectedRow[] = []

  for (const { cells, line } of body) {
    const [first, last, companyCell, g1, g2, g3, gmailCell, roleCell] = cells.map(clean)
    const reasons: string[] = []
    const firstName = cleanNamePart(first)
    const lastName = cleanNamePart(last)

    const company = companyCell ? companyByCode.get(companyCell.toUpperCase()) : undefined
    if (!companyCell) reasons.push('ไม่มีรหัสบริษัท')
    else if (!company) reasons.push(`บริษัท "${companyCell}" ไม่มีในระบบ — ใช้รหัสบริษัทเท่านั้น`)

    const groups: string[] = []
    for (const name of [g1, g2, g3]) {
      if (!name) continue
      const group = groupByName.get(name.toLowerCase())
      if (!group) reasons.push(`กลุ่ม "${name}" ไม่มีในระบบ`)
      else if (!groups.includes(group.id)) groups.push(group.id)
    }

    const email = gmailCell ? toGmailAddress(gmailCell) : null
    if (!gmailCell) reasons.push('ไม่มี gmail')
    else if (!email) reasons.push(`gmail "${gmailCell}" — รับเฉพาะ @gmail.com`)
    else if (seen.has(email)) reasons.push(`gmail ซ้ำกับแถว ${seen.get(email)}`)
    else if (queued.has(email)) reasons.push('gmail นี้อยู่ในรายการแล้ว')

    const role = (INVITE_ROLES as readonly string[]).includes(roleCell ?? '') ? roleCell as InviteRole : null
    if (!roleCell) reasons.push('ไม่มีบทบาท')
    else if (!role) reasons.push(`บทบาท "${roleCell}" — ใช้ได้เฉพาะ user / moderator / admin`)

    if (email && !seen.has(email)) seen.set(email, line)

    if (reasons.length || !company || !email || !role) {
      rejected.push({ line, who: fullName({ firstName, lastName }) || gmailCell || `แถว ${line}`, reasons })
      continue
    }

    // An admin holds no groups — see shared/utils/roleGroups.ts
    accepted.push({ line, firstName, lastName, company, groups: groupsForRole(role, groups), email, role })
  }

  return { accepted, rejected }
}

/**
 * The template as CSV: headers and one example row. For an admin who would
 * rather send a file than a Google Sheets copy — it has no dropdowns.
 */
export function inviteTemplateCsv(example: { company: string, group: string }): string {
  return toCsv(INVITE_CSV_HEADERS, [
    ['สมชาย', 'ใจดี', example.company, example.group, '', '', 'somchai.j@gmail.com', 'user'],
  ])
}

/**
 * Every value the template's dropdowns may hold, one list per column — pasted
 * into the template's "รายการ" tab so the dropdowns follow StreamHub.
 */
export function inviteListsCsv(companies: readonly { code: string, name: string }[], groups: readonly GroupRef[]): string {
  const codes = [...companies].sort((a, b) => a.code.localeCompare(b.code))
  const groupNames = groups.map((g) => g.name).sort((a, b) => a.localeCompare(b))
  const length = Math.max(codes.length, groupNames.length, INVITE_ROLES.length)
  const rows = Array.from({ length }, (_, i) => [
    codes[i]?.code ?? '',
    codes[i]?.name ?? '',
    groupNames[i] ?? '',
    INVITE_ROLES[i] ?? '',
  ])
  return toCsv(['รหัสบริษัท', 'ชื่อบริษัท', 'กลุ่ม', 'บทบาท'], rows)
}
