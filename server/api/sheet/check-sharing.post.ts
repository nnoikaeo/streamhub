import { readBody } from 'h3'
import { validateCompanyAccess } from '../../utils/companyAccess'
import { sendBadRequest, sendForbidden, sendUnauthorized } from '../../utils/apiResponse'
import { isFirestoreMode, getAdminDb } from '../../utils/firestoreAdmin'
import type { User } from '~/types/dashboard'

/**
 * POST /api/sheet/check-sharing
 *
 * Answers one question about a Google Sheet URL: is it shared "anyone with the
 * link"?
 *
 * This exists because the failure it catches is invisible to whoever creates
 * the dashboard. A sheet that is not link-shared still renders for its owner in
 * Chrome — the same session that owns the sheet — and shows Google's cookie
 * prompt to everyone on Safari/iOS, whose "allow cookies" button dead-ends
 * (S1.3, S1.11). Checked at the form instead, so it fails for the admin rather
 * than for the users.
 *
 * The probe is deliberately credential-free: `fetch` with no cookies and no
 * Authorization header is exactly the position an anonymous viewer is in.
 * 200 = link-shared, 401/404 = not.
 *
 * ⚠️ A 200 here is also the risk statement. It means anyone holding the URL can
 * pull the whole file as CSV/XLSX/PDF with no login (S1.10), so the form shows
 * it as a warning, not as a green tick.
 */

/** Google can be slow; the form is waiting on this, so cap it. */
const PROBE_TIMEOUT_MS = 8000

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const url = typeof body?.url === 'string' ? body.url : ''

  const uid = event.context.auth?.uid
  if (!uid) {
    return sendUnauthorized(event, 'Authentication required')
  }

  // Only the roles that can create a dashboard may probe. Without this the
  // endpoint is an authenticated URL prober pointed at Google on our IP.
  let user: User | null
  if (isFirestoreMode()) {
    const db = getAdminDb()
    if (!db) {
      throw createError({ statusCode: 500, message: 'Firestore not available' })
    }
    const userDoc = await db.collection('users').doc(uid).get()
    user = userDoc.exists ? ({ ...userDoc.data(), uid: userDoc.id } as User) : null
  } else {
    const accessResult = await validateCompanyAccess(event)
    if (!accessResult.allowed) {
      return sendForbidden(event, accessResult.reason)
    }
    user = accessResult.user
  }

  if (!user || !user.isActive) {
    return sendForbidden(event, 'User not found or inactive')
  }
  if (user.role !== 'admin' && user.role !== 'moderator') {
    return sendForbidden(event, 'Only admins and moderators can check sheet sharing')
  }

  // Parsing is what pins the request to docs.google.com — the probe URL is
  // rebuilt from the parsed id, never taken from the request body.
  const probeUrl = sheetProbeUrl(url)
  if (!probeUrl) {
    return sendBadRequest(event, 'Invalid Google Sheets URL')
  }

  let status: number
  try {
    const response = await fetch(probeUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'Accept': 'text/csv' },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    })
    status = response.status
  } catch (error: unknown) {
    // A network failure is not an answer either way — say so rather than
    // reporting "not shared" and sending the admin to change a correct setting.
    return {
      success: false,
      error: 'Probe failed',
      message: `Could not reach Google to check sharing: ${getErrorMessage(error)}`,
    }
  }

  const isLinkShared = status === 200

  return {
    success: true,
    data: {
      isLinkShared,
      status,
      // Stated plainly because it is the trade-off, not a detail: link sharing
      // is what makes the embed work AND what makes the raw file downloadable.
      message: isLinkShared
        ? 'Shared with anyone who has the link. The sheet will embed — and anyone holding the URL can download the whole file (CSV, XLSX, PDF) without logging in.'
        : 'Not shared with anyone who has the link. The embed will fail on Safari and iOS. Share the sheet as "Anyone with the link (Viewer)" in Google Sheets.',
    },
  }
})
