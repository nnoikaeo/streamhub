export function validateProductionEnv() {
  if (process.dev) return

  const required = ['NUXT_APP_URL', 'NUXT_PUBLIC_USE_FIRESTORE']
  const missing = required.filter(k => !process.env[k])

  if (missing.length) {
    throw new Error(`❌ Missing required env vars: ${missing.join(', ')}`)
  }

  const appUrl = process.env.NUXT_APP_URL
  if (appUrl && appUrl.includes('localhost')) {
    throw new Error(`❌ NUXT_APP_URL is set to localhost in production: ${appUrl}`)
  }
}
