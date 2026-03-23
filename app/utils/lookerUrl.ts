/**
 * Looker Studio URL Validation & Parsing Utility
 *
 * Supports:
 * - Looker Studio embed URL: https://lookerstudio.google.com/embed/reporting/{reportId}/page/{pageId}
 * - Looker Studio view URL:  https://lookerstudio.google.com/reporting/{reportId}/page/{pageId}
 * - Legacy Data Studio embed: https://datastudio.google.com/embed/reporting/{reportId}
 * - Legacy Data Studio view:  https://datastudio.google.com/reporting/{reportId}
 */

const LOOKER_URL_PATTERNS = [
  /^https:\/\/lookerstudio\.google\.com\/embed\/reporting\/([a-f0-9-]+)/,
  /^https:\/\/lookerstudio\.google\.com\/reporting\/([a-f0-9-]+)/,
  /^https:\/\/datastudio\.google\.com\/embed\/reporting\/([a-f0-9-]+)/,
  /^https:\/\/datastudio\.google\.com\/reporting\/([a-f0-9-]+)/,
]

export interface LookerUrlInfo {
  isValid: boolean
  reportId: string | null
  embedUrl: string | null
  originalUrl: string
  error?: string
}

/**
 * Parse and validate Looker Studio URL
 * Automatically converts view URL → embed URL
 */
export function parseLookerUrl(url: string): LookerUrlInfo {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return { isValid: false, reportId: null, embedUrl: null, originalUrl: url, error: 'URL is required' }
  }

  for (const pattern of LOOKER_URL_PATTERNS) {
    const match = trimmedUrl.match(pattern)
    if (match && match[1]) {
      const reportId = match[1]
      const embedUrl = `https://lookerstudio.google.com/embed/reporting/${reportId}`

      // Preserve page path if present
      const pageMatch = trimmedUrl.match(/\/page\/([a-zA-Z0-9_-]+)/)
      const fullEmbedUrl = pageMatch
        ? `${embedUrl}/page/${pageMatch[1]}`
        : embedUrl

      return {
        isValid: true,
        reportId,
        embedUrl: fullEmbedUrl,
        originalUrl: trimmedUrl,
      }
    }
  }

  return {
    isValid: false,
    reportId: null,
    embedUrl: null,
    originalUrl: trimmedUrl,
    error: 'Invalid Looker Studio URL. Please use a URL from lookerstudio.google.com',
  }
}

/**
 * Convert view URL → embed URL
 */
export function toEmbedUrl(url: string): string | null {
  return parseLookerUrl(url).embedUrl
}

/**
 * Extract report ID from URL
 */
export function extractReportId(url: string): string | null {
  return parseLookerUrl(url).reportId
}

/**
 * Validate URL format only (no network check)
 */
export function isValidLookerUrl(url: string): boolean {
  return parseLookerUrl(url).isValid
}
