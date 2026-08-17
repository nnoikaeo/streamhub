/**
 * Tests for app/utils/quickShare.ts (BUG-017)
 *
 * The share button used to log its payload and close the dialog — no write, no
 * toast, no error. These cover the three things that regression needs: the
 * service actually gets called, the expiry reaches it as a real `Date`, and
 * every failure path says so out loud.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runQuickShare } from '../../app/utils/quickShare'
import type { QuickShareDeps } from '../../app/utils/quickShare'

const notify = vi.fn()

function makeDeps(overrides: Partial<QuickShareDeps> = {}): QuickShareDeps {
  return {
    share: vi.fn().mockResolvedValue({ success: true, message: 'ok', updatedAt: new Date() }),
    notify,
    ...overrides,
  }
}

beforeEach(() => {
  notify.mockClear()
})

describe('runQuickShare — service call', () => {
  it('calls the service with the dashboard id and the selected uids', async () => {
    const deps = makeDeps()

    const ok = await runQuickShare(
      { dashboardId: 'dash_1', userIds: ['uid_a', 'uid_b'] },
      deps,
    )

    expect(ok).toBe(true)
    expect(deps.share).toHaveBeenCalledWith('dash_1', ['uid_a', 'uid_b'], undefined)
  })

  it('reports success with a toast', async () => {
    await runQuickShare({ dashboardId: 'dash_1', userIds: ['uid_a'] }, makeDeps())

    expect(notify).toHaveBeenCalledWith(expect.stringContaining('เรียบร้อยแล้ว'), 'success')
  })

  it('refuses an empty selection instead of writing nothing silently', async () => {
    const deps = makeDeps()

    const ok = await runQuickShare({ dashboardId: 'dash_1', userIds: [] }, deps)

    expect(ok).toBe(false)
    expect(deps.share).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledWith(expect.any(String), 'error')
  })
})

describe('runQuickShare — expiry conversion', () => {
  it('passes the end of the chosen day in local time', async () => {
    const deps = makeDeps()

    await runQuickShare(
      { dashboardId: 'dash_1', userIds: ['uid_a'], expiryDate: '2026-08-17' },
      deps,
    )

    const expiry = vi.mocked(deps.share).mock.calls[0]?.[2]
    expect(expiry).toBeInstanceOf(Date)
    // Asserted through local getters so the expectation holds in any TZ — the
    // point is that the instant is the END of 17 Aug where the user is, not
    // midnight UTC (07:00 Bangkok, 17 hours early).
    expect(expiry?.getFullYear()).toBe(2026)
    expect(expiry?.getMonth()).toBe(7)
    expect(expiry?.getDate()).toBe(17)
    expect(expiry?.getHours()).toBe(23)
    expect(expiry?.getMinutes()).toBe(59)
    expect(expiry?.getSeconds()).toBe(59)
  })

  it('passes undefined — never an Invalid Date — when no expiry was ticked', async () => {
    const deps = makeDeps()

    await runQuickShare({ dashboardId: 'dash_1', userIds: ['uid_a'] }, deps)

    expect(vi.mocked(deps.share).mock.calls[0]?.[2]).toBeUndefined()
  })

  it('aborts on an unparseable expiry rather than granting permanent access', async () => {
    const deps = makeDeps()

    const ok = await runQuickShare(
      { dashboardId: 'dash_1', userIds: ['uid_a'], expiryDate: '17/08/2026' },
      deps,
    )

    expect(ok).toBe(false)
    expect(deps.share).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('วันหมดอายุ'), 'error')
  })
})

describe('runQuickShare — failure surfacing', () => {
  it('toasts when the service reports success: false (how a rules rejection arrives)', async () => {
    // FirestoreService.quickShareDashboard catches permission-denied itself and
    // returns this shape — a moderator sharing outside their managed folder
    // tree never reaches the catch block below.
    const deps = makeDeps({
      share: vi.fn().mockResolvedValue({
        success: false,
        message: 'Quick share failed',
        updatedAt: new Date(),
      }),
    })

    const ok = await runQuickShare({ dashboardId: 'dash_1', userIds: ['uid_a'] }, deps)

    expect(ok).toBe(false)
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('ไม่สำเร็จ'), 'error')
  })

  it('toasts when the service throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const deps = makeDeps({
      share: vi.fn().mockRejectedValue(new Error('Missing or insufficient permissions.')),
    })

    const ok = await runQuickShare({ dashboardId: 'dash_1', userIds: ['uid_a'] }, deps)

    expect(ok).toBe(false)
    expect(notify).toHaveBeenCalledWith(
      expect.stringContaining('Missing or insufficient permissions.'),
      'error',
    )
    consoleError.mockRestore()
  })
})
