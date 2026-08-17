/**
 * Quick Share — dialog payload → service call (BUG-017)
 *
 * `QuickShareDialog` emits a date-only string and a list of uids; the service
 * takes a real `Date`. This module owns that translation plus the reporting of
 * every outcome, because the bug being fixed here was silence: the old
 * `handleShare` logged the payload and resolved, so the dialog closed as if the
 * share had worked while nothing was written.
 *
 * Two failure shapes have to be handled, not one:
 *
 * - `FirestoreService.quickShareDashboard` catches its own errors and returns
 *   `{ success: false }` — a Firestore rules rejection (a moderator sharing a
 *   dashboard outside their managed folder tree, see firestore.rules) arrives
 *   this way, NOT as a throw
 * - a network/SDK failure before that point still throws
 *
 * Both must reach the user. No path returns quietly.
 *
 * Lives in `app/utils/` rather than inside `useDashboardPage` so it is testable:
 * that composable imports `~/stores/*` directly and the Vitest config declares
 * no `~` alias, so it cannot be imported from a test at all.
 */

import type { SavePermissionsResponse } from '~/types/dashboard'

/** Payload emitted by `QuickShareDialog` — `expiryDate` is `<input type="date">` text. */
export interface QuickSharePayload {
  dashboardId: string
  userIds: string[]
  expiryDate?: string
}

/** Collaborators injected by the caller, so this stays free of Nuxt scope. */
export interface QuickShareDeps {
  /** `dashboardService.quickShareDashboard` */
  share: (
    dashboardId: string,
    userIds: string[],
    expiryDate?: Date,
  ) => Promise<SavePermissionsResponse>
  /** Toast — the caller decides how to reach `useAppToast`. */
  notify: (message: string, type: 'success' | 'error') => void
}

/**
 * Share a dashboard with the selected users, reporting the outcome either way.
 *
 * @returns `true` only when Firestore accepted the write.
 */
export async function runQuickShare(
  payload: QuickSharePayload,
  deps: QuickShareDeps,
): Promise<boolean> {
  if (payload.userIds.length === 0) {
    deps.notify('กรุณาเลือกผู้ใช้อย่างน้อย 1 คน', 'error')
    return false
  }

  let expiry: Date | undefined
  if (payload.expiryDate) {
    const parsed = endOfDayLocal(payload.expiryDate)
    if (!parsed) {
      // Abort rather than share without the expiry: falling through would grant
      // permanent access to someone the user meant to grant temporary access.
      deps.notify('วันหมดอายุไม่ถูกต้อง กรุณาเลือกวันที่ใหม่', 'error')
      return false
    }
    expiry = parsed
  }

  try {
    const result = await deps.share(payload.dashboardId, payload.userIds, expiry)

    if (!result.success) {
      deps.notify(
        `แชร์แดชบอร์ดไม่สำเร็จ: ${result.message || 'ไม่สามารถบันทึกได้'} (อาจไม่มีสิทธิ์แก้ไขแดชบอร์ดนี้)`,
        'error',
      )
      return false
    }

    deps.notify(`แชร์แดชบอร์ดให้ผู้ใช้ ${payload.userIds.length} คนเรียบร้อยแล้ว`, 'success')
    return true
  } catch (err: unknown) {
    console.error('❌ [quickShare] runQuickShare error:', err)
    deps.notify(`แชร์แดชบอร์ดไม่สำเร็จ: ${getErrorMessage(err, 'เกิดข้อผิดพลาด')}`, 'error')
    return false
  }
}
