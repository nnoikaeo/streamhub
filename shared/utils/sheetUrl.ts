/**
 * Google Sheets URL Validation & Parsing Utility
 *
 * In shared/ rather than app/utils next to lookerUrl.ts because the server
 * parses these too: the sharing check (POST /api/sheet/check-sharing) probes a
 * URL built from the same parse, and a second copy of that regex is exactly
 * how a host check drifts.
 *
 * One difference from lookerUrl.ts drove the design: the
 * embed URL is stored whole, never rebuilt from an id. A published sheet is
 * served under `/d/e/2PACX-…`, which is not the file id and cannot be derived
 * from it (spike S1.6).
 *
 * Accepts:
 * - Document URL:  https://docs.google.com/spreadsheets/d/{fileId}/edit?…
 * - Published URL: https://docs.google.com/spreadsheets/d/e/{publishedId}/pubhtml
 *
 * ⚠️ A sheet is only embeddable at all if it is shared "anyone with the link
 * (viewer)" — an account-bound sheet dead-ends in Safari/iOS (S1.3, S1.11).
 * That share also makes `export?format=csv|xlsx|pdf` and `gviz` answer 200 to
 * anyone holding the URL (S1.10). Validating a URL here says nothing about
 * either; the sharing check is a separate server call.
 *
 * ⚠️ `interactive` frames `/edit`, so a viewer who has edit rights on the
 * sheet can edit it through the frame. Link-shared-as-viewer cannot; the owner
 * opening their own dashboard can. That is intended, not a hole.
 */

import type { SheetEmbedMode } from '~/types/dashboard'

/**
 * `/spreadsheets/d/{fileId}/…`. The `(?!e\/)` matters: without it a published
 * URL captures the literal `e` as the file id and silently frames nothing.
 */
const SHEET_DOC_PATTERN = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/(?!e\/)([a-zA-Z0-9_-]+)(?:\/|\?|#|$)/

/** `/spreadsheets/d/e/{publishedId}/pubhtml` — the "publish to the web" URL. */
const SHEET_PUBLISHED_PATTERN = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/([a-zA-Z0-9_-]+)\/pub(?:html)?(?:\/|\?|#|$)/

export interface SheetUrlInfo {
  isValid: boolean
  /** File id, or the published id for a `/d/e/…` URL. */
  sheetId: string | null
  /** Whether the input was a "publish to the web" URL. */
  isPublished: boolean
  embedUrl: string | null
  originalUrl: string
  error?: string
}

/**
 * Parse and validate a Google Sheets URL, returning the URL to frame.
 *
 * A published URL ignores `mode`: `/pubhtml` is the only form Google serves
 * for it, and it is already chrome-free.
 */
export function parseSheetUrl(url: string, mode: SheetEmbedMode = 'interactive'): SheetUrlInfo {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return { isValid: false, sheetId: null, isPublished: false, embedUrl: null, originalUrl: url, error: 'URL is required' }
  }

  const publishedMatch = trimmedUrl.match(SHEET_PUBLISHED_PATTERN)
  if (publishedMatch && publishedMatch[1]) {
    const sheetId = publishedMatch[1]
    return {
      isValid: true,
      sheetId,
      isPublished: true,
      embedUrl: `https://docs.google.com/spreadsheets/d/e/${sheetId}/pubhtml?widget=true&headers=false`,
      originalUrl: trimmedUrl,
    }
  }

  const docMatch = trimmedUrl.match(SHEET_DOC_PATTERN)
  if (docMatch && docMatch[1]) {
    const sheetId = docMatch[1]
    const base = `https://docs.google.com/spreadsheets/d/${sheetId}`
    return {
      isValid: true,
      sheetId,
      isPublished: false,
      embedUrl: mode === 'view'
        ? `${base}/preview`
        : `${base}/edit?rm=minimal&widget=true&headers=false`,
      originalUrl: trimmedUrl,
    }
  }

  return {
    isValid: false,
    sheetId: null,
    isPublished: false,
    embedUrl: null,
    originalUrl: trimmedUrl,
    error: 'Invalid Google Sheets URL. Please use a URL from docs.google.com/spreadsheets',
  }
}

/**
 * Convert a sheet URL → the URL to frame.
 */
export function toSheetEmbedUrl(url: string, mode: SheetEmbedMode = 'interactive'): string | null {
  return parseSheetUrl(url, mode).embedUrl
}

/**
 * Extract the sheet id (file id, or published id for a `/d/e/…` URL).
 */
export function extractSheetId(url: string): string | null {
  return parseSheetUrl(url).sheetId
}

/**
 * The URL to probe when checking whether a sheet is link-shared.
 *
 * CSV export rather than the embed URL itself: measured unauthenticated, it
 * answers 401 before the sheet is link-shared and 200 after, for both URL
 * shapes (S1.10, S1.6). The embed URL answers 200 either way and renders the
 * refusal inside the frame, which is unreadable from the server.
 *
 * `null` for a URL that does not parse — never probe an unvalidated host.
 */
export function sheetProbeUrl(url: string): string | null {
  const info = parseSheetUrl(url)
  if (!info.isValid || !info.sheetId) return null

  return info.isPublished
    ? `https://docs.google.com/spreadsheets/d/e/${info.sheetId}/pub?output=csv`
    : `https://docs.google.com/spreadsheets/d/${info.sheetId}/export?format=csv`
}

/**
 * Validate URL format only (no network check — sharing is checked separately).
 */
export function isValidSheetUrl(url: string): boolean {
  return parseSheetUrl(url).isValid
}
