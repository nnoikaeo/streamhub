import { initializeApp, cert, getApps, type App } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'

let adminApp: App | null = null
let initialized = false
let initError: string | null = null

/**
 * Initialize Firebase Admin SDK using service account credentials.
 * Uses GOOGLE_SERVICE_ACCOUNT_KEY (inline JSON) or GOOGLE_APPLICATION_CREDENTIALS (file path).
 * In DEV mode, initialization failure is non-fatal (falls back to mock auth).
 */
function ensureInitialized(): boolean {
  if (initialized) return !initError
  initialized = true

  // Skip if already initialized
  if (getApps().length > 0) {
    adminApp = getApps()[0]
    return true
  }

  try {
    const config = useRuntimeConfig()
    const serviceAccountKey = config.googleServiceAccountKey || process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

    if (serviceAccountKey) {
      // Parse inline JSON service account
      const serviceAccount = JSON.parse(serviceAccountKey)
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      })
      console.log('✅ [firebaseAdmin] Initialized with service account key')
      return true
    }

    if (credentialsPath) {
      // Use file path (GOOGLE_APPLICATION_CREDENTIALS is auto-detected by Admin SDK)
      adminApp = initializeApp()
      console.log('✅ [firebaseAdmin] Initialized with GOOGLE_APPLICATION_CREDENTIALS')
      return true
    }

    // In Cloud Functions 2nd gen (Cloud Run), use Application Default Credentials.
    // K_SERVICE is automatically set by the Cloud Run runtime.
    const isCloudFunction = !!(process.env.K_SERVICE || process.env.FUNCTION_TARGET)
    if (isCloudFunction) {
      adminApp = initializeApp()
      console.log('✅ [firebaseAdmin] Initialized with Application Default Credentials (Cloud Functions)')
      return true
    }

    initError = 'No Firebase Admin credentials found'
    if (process.dev) {
      console.warn('⚠️  [firebaseAdmin] No credentials found — DEV mode will use mock auth')
    } else {
      console.error('❌ [firebaseAdmin] No credentials found — production requires Firebase Admin credentials')
    }
    return false
  } catch (error: any) {
    initError = error.message
    console.error('❌ [firebaseAdmin] Initialization error:', error.message)
    return false
  }
}

/**
 * Verify a Firebase ID token.
 * Returns decoded token on success, null on failure.
 */
export async function verifyIdToken(token: string): Promise<DecodedIdToken | null> {
  if (!ensureInitialized() || !adminApp) {
    return null
  }

  try {
    const auth = getAuth(adminApp)
    const decodedToken = await auth.verifyIdToken(token)
    return decodedToken
  } catch (error: any) {
    console.warn('⚠️  [firebaseAdmin] Token verification failed:', error.message)
    return null
  }
}

/**
 * Check if Firebase Admin is available (has credentials).
 */
export function isFirebaseAdminAvailable(): boolean {
  return ensureInitialized() && !initError
}
