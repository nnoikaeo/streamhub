import { H3Event } from 'h3'
import { sendUnauthorized, sendForbidden } from '../utils/apiResponse'
import { getAdminDb, isFirestoreMode } from '../utils/firestoreAdmin'
import { isFirebaseAdminAvailable } from '../utils/firebaseAdmin'
import { findById } from '../utils/jsonDatabase'
import type { User } from '~/types/dashboard'

type CheckStatus = 'ok' | 'error'

interface HealthResponse {
  status: 'ok' | 'degraded'
  environment: {
    mode: 'development' | 'production'
    useFirestore: boolean
    appUrl: string
    resendConfigured: boolean
    nodeEnv: string
  }
  checks: {
    firestoreConnection: CheckStatus
    firebaseAuth: CheckStatus
    emailService: CheckStatus
  }
  warnings: string[]
  timestamp: string
  version: string
}

export default defineEventHandler(async (event: H3Event) => {
  // Auth check
  const auth = event.context.auth
  if (!auth?.uid) {
    return sendUnauthorized(event, 'Authentication required')
  }

  // Admin role check — supports both Firestore and JSON modes
  const useFirestore = isFirestoreMode()
  let userRole: string | null = null

  if (useFirestore) {
    try {
      const db = getAdminDb()
      if (db) {
        const userDoc = await db.collection('users').doc(auth.uid).get()
        if (userDoc.exists) {
          userRole = (userDoc.data() as any)?.role ?? null
        }
      }
    } catch {
      // Firestore unavailable — fall through with null role → 403
    }
  } else {
    const user = await findById<User>('users.json', auth.uid)
    userRole = user?.role ?? null
  }

  if (userRole !== 'admin') {
    return sendForbidden(event, 'Admin access required')
  }

  // --- Health checks — each independently try/catch ---
  const checks: HealthResponse['checks'] = {
    firestoreConnection: 'error',
    firebaseAuth: 'error',
    emailService: 'error',
  }

  // 1. Firestore connection: attempt a lightweight read
  try {
    const db = getAdminDb()
    if (!db) throw new Error('Firestore Admin not initialized')
    await db.collection('_health').limit(1).get()
    checks.firestoreConnection = 'ok'
  } catch {
    checks.firestoreConnection = 'error'
  }

  // 2. Firebase Auth: verify Admin SDK is initialized and getAuth() succeeds
  try {
    if (!isFirebaseAdminAvailable()) throw new Error('Firebase Admin not available')
    const { getAuth } = await import('firebase-admin/auth')
    const { getApps } = await import('firebase-admin/app')
    const apps = getApps()
    if (apps.length === 0) throw new Error('No Firebase Admin app initialized')
    getAuth(apps[0]!)
    checks.firebaseAuth = 'ok'
  } catch {
    checks.firebaseAuth = 'error'
  }

  // 3. Email service: check NUXT_RESEND_API_KEY is set and non-placeholder
  try {
    const resendKey = process.env.NUXT_RESEND_API_KEY
    if (!resendKey) throw new Error('NUXT_RESEND_API_KEY not set')
    if (resendKey.startsWith('re_placeholder') || resendKey === 'your-resend-api-key') {
      throw new Error('NUXT_RESEND_API_KEY is a placeholder')
    }
    checks.emailService = 'ok'
  } catch {
    checks.emailService = 'error'
  }

  // --- Warnings ---
  const warnings: string[] = []
  const appUrl = process.env.NUXT_APP_URL || ''
  if (!appUrl) {
    warnings.push('NUXT_APP_URL is not set')
  } else if (appUrl.includes('localhost')) {
    warnings.push('APP_URL is localhost')
  }
  if (!useFirestore) {
    warnings.push('Running in JSON mock mode — not suitable for production')
  }

  // --- Environment info ---
  const resendKey = process.env.NUXT_RESEND_API_KEY
  const resendConfigured = !!(
    resendKey &&
    !resendKey.startsWith('re_placeholder') &&
    resendKey !== 'your-resend-api-key'
  )
  const isLocalhost = appUrl.includes('localhost')

  const environment: HealthResponse['environment'] = {
    mode: process.dev ? 'development' : 'production',
    useFirestore,
    appUrl: isLocalhost ? '[localhost]' : appUrl,
    resendConfigured,
    nodeEnv: process.env.NODE_ENV || 'unknown',
  }

  const status: 'ok' | 'degraded' = Object.values(checks).some(v => v === 'error') ? 'degraded' : 'ok'

  return {
    status,
    environment,
    checks,
    warnings,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
  } satisfies HealthResponse
})
