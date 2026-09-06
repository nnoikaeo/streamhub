/**
 * Which embed URL a dashboard uses, and stripping those URLs from responses.
 *
 * Both halves exist because the URL is the secret. A dashboard's embed URL
 * never leaves the server in a listing or a detail response — the client asks
 * `POST /api/embed/request`, which seals the URL into a token. Adding a second
 * embed type (Sheets) meant a second field, and the strip was written three
 * times with the field name spelled out. One `sheetEmbedUrl` missed from one
 * of them leaks the URL out of the API and voids the token entirely, so the
 * field list lives here once instead.
 *
 * For a Sheet that leak is worse than for Looker: a link-shared sheet answers
 * `export?format=csv|xlsx|pdf` and `gviz` to anyone holding the URL with no
 * login, so the URL is the whole file, not a rendered report (spike S1.10).
 */

import type { Dashboard } from '~/types/dashboard'

/** Every field holding an embed URL. Add a new embed type here first. */
export const EMBED_URL_FIELDS = ['lookerEmbedUrl', 'sheetEmbedUrl'] as const

export type EmbedUrlField = typeof EMBED_URL_FIELDS[number]

/** The parts of a dashboard that decide which URL to frame. */
export type EmbedSource = Pick<Dashboard, 'type'> & Partial<Pick<Dashboard, EmbedUrlField>>

/**
 * The embed URL for a dashboard, chosen by its type.
 * `undefined` when the dashboard has no URL configured for its type.
 */
export function getEmbedUrl(dashboard: EmbedSource): string | undefined {
  return dashboard.type === 'sheet' ? dashboard.sheetEmbedUrl : dashboard.lookerEmbedUrl
}

/**
 * A copy of the dashboard with every embed URL removed.
 */
export function stripEmbedUrls<T extends object>(dashboard: T): Omit<T, EmbedUrlField> {
  const stripped: readonly string[] = EMBED_URL_FIELDS
  return Object.fromEntries(
    Object.entries(dashboard).filter(([key]) => !stripped.includes(key))
  ) as Omit<T, EmbedUrlField>
}
