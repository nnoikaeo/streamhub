import { entryScriptFromHtml, isNewBuild } from '~/utils/buildId'

/**
 * Notice when a newer build is live, so a tab left open across a deploy can
 * be told to reload instead of quietly running old code.
 *
 * An old tab keeps its old JS and CSS for as long as it stays open — the SPA
 * never refetches them on in-app navigation. That is how an outdated global
 * button rule came back during testing (BUG-038). Nuxt's own check
 * (`experimental.appManifest`) is off for Firebase reasons, see
 * tests/config/routeRules.test.ts.
 *
 * The check fetches `/` (served `no-store`) and compares its entry script with
 * the one this tab loaded. It runs after navigation and when the tab becomes
 * visible again, at most once every CHECK_INTERVAL_MS, and never in dev.
 * The result is `useState('new-version-available')`, read by NewVersionBanner.
 */

const CHECK_INTERVAL_MS = 5 * 60 * 1000

export default defineNuxtPlugin(() => {
  if (import.meta.dev) return

  const available = useState<boolean>('new-version-available', () => false)
  const running = entryScriptFromHtml(document.head.innerHTML)
  let lastCheck = Date.now()
  let checking = false

  const check = async () => {
    if (available.value || checking || !running) return
    if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return
    checking = true
    lastCheck = Date.now()
    try {
      const response = await fetch('/', { cache: 'no-store', credentials: 'same-origin' })
      if (!response.ok) return
      if (isNewBuild(running, entryScriptFromHtml(await response.text()))) {
        available.value = true
      }
    } catch {
      // Offline or a transient failure — try again at the next trigger.
    } finally {
      checking = false
    }
  }

  useRouter().afterEach(() => { void check() })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check()
  })
})
