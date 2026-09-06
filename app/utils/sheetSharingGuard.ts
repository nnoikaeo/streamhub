/**
 * Whether a dashboard can be saved given what the sharing check found.
 *
 * A sheet that is not shared "anyone with the link" renders fine for the
 * person adding it — their own Google session owns it — and dead-ends on every
 * Safari and iOS browser. The check that detects this is only advice unless
 * saving is actually blocked, which is what this decides.
 *
 * Only a definite "not shared" blocks. A check that could not reach Google
 * (`error`) does not: refusing to save because our own probe failed is worse
 * than saving a sheet whose sharing we could not read, and the form still shows
 * what happened. `unknown` means no check has run yet — the form starts one
 * automatically, so this is a brief state, not a way past the guard.
 */

import type { DashboardType } from '~/types/dashboard'

export type SheetSharingStatus = 'unknown' | 'checking' | 'shared' | 'not-shared' | 'error'

/**
 * The message to show instead of saving, or `undefined` when saving is fine.
 */
export function sheetSaveBlockReason(
  type: DashboardType,
  status: SheetSharingStatus,
): string | undefined {
  if (type !== 'sheet') return undefined

  if (status === 'not-shared') {
    return 'ชีตนี้ยังไม่ได้แชร์แบบ "ทุกคนที่มีลิงก์ (ผู้ดู)" — ผู้ใช้ Safari และ iOS จะเปิดไม่ได้เลย แชร์ก่อนแล้วกดตรวจใหม่'
  }

  if (status === 'checking') {
    return 'กำลังตรวจการแชร์ รอสักครู่แล้วบันทึกอีกครั้ง'
  }

  return undefined
}
