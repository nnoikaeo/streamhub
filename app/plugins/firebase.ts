import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFirebaseConfig } from '~/utils/firebase'

export default defineNuxtPlugin(() => {
  console.log('🔥 Initializing Firebase...')
  
  try {
    const firebaseConfig = getFirebaseConfig()
    console.log('📝 Config:', firebaseConfig)
    
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const db = getFirestore(app)
    const storage = getStorage(app)

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
