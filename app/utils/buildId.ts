/**
 * Which build a page is running, identified by its entry script.
 *
 * Every deploy gives the entry script a new content-hashed name
 * (`/_nuxt/DYiEDWHq.js`), and the SPA HTML is served `no-store`, so fetching
 * `/` always answers with the name of the build that is live now. Comparing
 * that with the script the open tab loaded tells the tab it is out of date —
 * no server endpoint and no version number to keep in step.
 *
 * Used by plugins/version-check.client.ts.
 */

/** The entry script path in an SPA HTML document, or `null` if there is none. */
export function entryScriptFromHtml(html: string): string | null {
  const match = html.match(/<script\b[^>]*\btype="module"[^>]*\bsrc="(\/_nuxt\/[\w-]+\.js)"/)
  return match?.[1] ?? null
}

/**
 * Whether the live build differs from the running one. Unknown on either side
 * counts as "same": a failed fetch or an odd document must never nag the user.
 */
export function isNewBuild(running: string | null, live: string | null): boolean {
  return !!running && !!live && running !== live
}
