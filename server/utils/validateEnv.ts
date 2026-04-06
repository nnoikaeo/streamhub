export function validateProductionEnv() {
  if (process.dev) return

  const required = ['NUXT_APP_URL', 'NUXT_PUBLIC_USE_FIRESTORE']
  const missing = required.filter(k => !process.env[k])

  if (missing.length) {
    console.error(`❌ Missing required env vars: ${missing.join(', ')}`)
    return
  }

  const appUrl = process.env.NUXT_APP_URL
  if (appUrl && appUrl.includes('localhost')) {
    console.error(`❌ NUXT_APP_URL is set to localhost in production: ${appUrl}`)
  }
}
