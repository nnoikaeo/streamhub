/**
 * `sandbox` for the dashboard embed iframe.
 *
 * Extracted from the view page so the two embed types can be pinned by tests:
 * every keyword is a decision measured on production, and nothing else would
 * notice one going missing — a dropped keyword fails silently inside a
 * cross-origin frame, with at most a console line.
 *
 * Both types:
 * - `allow-popups` — hyperlinks in cells and Google's help menu open; a sheet's
 *   in-frame "Sign in" opens a new tab instead of leaving StreamHub.
 * - `allow-storage-access-by-user-activation` — kept for BUG-032, though Looker
 *   never calls `requestStorageAccess()` today.
 * - `allow-downloads` — technicians export a report's table as CSV
 *   (⋮ › Export chart › Export data) to build their site-visit claims; without
 *   it Chrome drops the file and logs "Download is disallowed … 'allow-downloads'
 *   is not set" (measured on prod 2026-10-04). A sheet got it as a separate
 *   decision (M6): File > Download hands out the whole file, every tab.
 *
 * Looker only:
 * - `allow-top-navigation-by-user-activation`. A sheet must not get it: Safari's
 *   in-frame "Sign in" took the whole tab to docs.google.com — out of StreamHub,
 *   no watermark, the sheet's real URL in the address bar (spike M5).
 */

import type { DashboardType } from '~/types/dashboard'

const EMBED_SANDBOX_BASE = 'allow-scripts allow-same-origin allow-popups allow-forms allow-storage-access-by-user-activation allow-downloads'

/** `type` is optional on older stored rows; absent means looker. */
export function getEmbedSandbox(type: DashboardType | undefined): string {
  return type === 'sheet'
    ? EMBED_SANDBOX_BASE
    : `${EMBED_SANDBOX_BASE} allow-top-navigation-by-user-activation`
}
