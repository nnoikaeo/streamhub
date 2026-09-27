/**
 * Browser sniffing, kept to the one case that genuinely needs it.
 *
 * Safari blocks third-party cookies outright, and a Looker Studio report in an
 * iframe needs Google's cookies to prove who is looking at it. When they are
 * blocked, Looker renders its own "cannot access report" page *inside* the
 * frame — a cross-origin document we cannot inspect, so there is no event, no
 * error and nothing to feature-detect. The page looks broken with no
 * explanation. Confirmed on an iPad 9: signing into Google first-party was not
 * enough; only turning off "Prevent Cross-Site Tracking" made the report
 * appear (BUG-032).
 *
 * Since the failure is invisible to us, the hint has to be shown pre-emptively
 * to the browsers that have the restriction — which is what the sniff is for.
 * It is a hint, dismissible, never a block.
 */

/**
 * True for WebKit browsers that apply Safari's cross-site tracking prevention.
 *
 * Covers desktop Safari and every browser on iOS/iPadOS — Chrome and Firefox
 * there are Safari's engine in a different wrapper and inherit the same cookie
 * policy, so matching on the Safari token and excluding the desktop
 * Chromium/Gecko families is both what we want and what is achievable from a
 * UA string.
 */
export function isSafariLike(userAgent: string): boolean {
  if (!userAgent) return false

  // Chrome, Edge, Opera and Android WebViews all carry "Safari" in their UA;
  // their own tokens are what tell them apart. Ordering matters: check for the
  // impostors first, then require the Safari token.
  if (/\b(chrome|chromium|crios|edg|edgios|opr|opios|firefox|fxios|android)\b/i.test(userAgent)) {
    // iOS Chrome/Firefox (CriOS/FxiOS) are WebKit underneath and do inherit the
    // policy, so they are the exception to the exclusion above.
    return /\b(crios|fxios|edgios|opios)\b/i.test(userAgent)
  }

  return /safari/i.test(userAgent)
}

/**
 * True for a phone — the one place a framed Google Sheet cannot be edited.
 *
 * On a phone Google does not serve the Sheets editor at all: the frame gets
 * its mobile page, a plain grid with the tabs as links and no menu bar,
 * whatever the embed mode and whatever the account's rights. Measured on an
 * iPhone (2026-09-27) with an account that edits the same sheet from desktop
 * Safari; Android is assumed to get the same page, since it is Google's
 * choice by user agent and not the browser's.
 *
 * Every phone browser puts "Mobile" in its UA. iPadOS Safari asks for the
 * desktop site by default and reports itself as a Mac, so an iPad lands on
 * the desktop editor and correctly does not match.
 */
export function isPhone(userAgent: string): boolean {
  if (!userAgent) return false
  return /\bMobile\b/.test(userAgent) && !/\biPad\b/.test(userAgent)
}
