/**
 * Tests for app/utils/browser.ts (BUG-032)
 *
 * The cookie hint on the dashboard view is shown to browsers that block
 * third-party cookies. Getting the sniff wrong is cheap in one direction and
 * annoying in the other: a missed Safari leaves the user staring at Looker's
 * "cannot access report" page with no explanation, while a false positive
 * shows Chrome a hint about a setting it does not have.
 *
 * Nearly every browser puts "Safari" in its UA, so the interesting cases are
 * the impostors — and iOS Chrome/Firefox, which are impostors on desktop but
 * genuine WebKit (and genuinely restricted) on iOS.
 */

import { describe, it, expect } from 'vitest'
import { isSafariLike } from '../../app/utils/browser'

const UA = {
  iPadSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  iPhoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  windowsEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  macFirefox:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  iosChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1',
  iosFirefox:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15',
}

describe('isSafariLike', () => {
  it('matches Safari on iPad, iPhone and macOS — the browsers that block third-party cookies', () => {
    expect(isSafariLike(UA.iPadSafari)).toBe(true)
    expect(isSafariLike(UA.iPhoneSafari)).toBe(true)
    expect(isSafariLike(UA.macSafari)).toBe(true)
  })

  it('does not match Chromium or Gecko browsers, which all claim "Safari" too', () => {
    expect(isSafariLike(UA.macChrome)).toBe(false)
    expect(isSafariLike(UA.windowsEdge)).toBe(false)
    expect(isSafariLike(UA.macFirefox)).toBe(false)
    expect(isSafariLike(UA.androidChrome)).toBe(false)
  })

  it('matches Chrome and Firefox on iOS, which are WebKit and inherit the cookie policy', () => {
    expect(isSafariLike(UA.iosChrome)).toBe(true)
    expect(isSafariLike(UA.iosFirefox)).toBe(true)
  })

  it('treats a missing user agent as not-Safari rather than showing the hint to everyone', () => {
    expect(isSafariLike('')).toBe(false)
  })
})
