import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFirebaseConfig } from '~/utils/firebase'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  console.log('🔥 Initializing Firebase...')

  try {
    const firebaseConfig = getFirebaseConfig()
    console.log('📝 Config:', firebaseConfig)

    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const db = getFirestore(app)
    const storage = getStorage(app)

    // Enable persistent session storage so auth state survives page refresh and across tabs
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('✅ Firebase session persistence enabled')
      })
      .catch((error) => {
        console.warn('⚠️  Session persistence unavailable:', error.message)
      })

    console.log('✅ Firebase initialized successfully')

    return {
      provide: {
        firebase: {
          app,
          auth,
          db,
          storage
        }
      }
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error)
    throw error
  }
})
