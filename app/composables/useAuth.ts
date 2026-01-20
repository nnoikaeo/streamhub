import { signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { useAuthStore, type UserData } from '~/stores/auth'

export const useAuth = () => {
  const { $firebase } = useNuxtApp()
  const authStore = useAuthStore()

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google Sign-in...')
      console.log('Auth object:', $firebase.auth)
      
      const provider = new GoogleAuthProvider()
      console.log('🔑 Google Provider created')
      
      const userCredential = await signInWithPopup($firebase.auth, provider)
      console.log('✅ Sign-in successful:', userCredential.user.email)
      
      const userData: UserData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL
      }
      authStore.setUser(userData)
      return { success: true }
    } catch (error: any) {
      console.error('❌ Sign-in error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Logging out...')
      await signOut($firebase.auth)
      authStore.setUser(null)
      await navigateTo('/login')
      console.log('✅ Logged out successfully')
    } catch (error: any) {
      console.error('Logout error:', error)
    }
  }

  const initAuth = () => {
    return new Promise((resolve) => {
      console.log('📡 Initializing auth listener...')
      onAuthStateChanged($firebase.auth, (user) => {
        console.log('🔍 Auth state changed:', user?.email || 'not logged in')
        
        if (user) {
          const userData: UserData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }
          authStore.setUser(userData)
        } else {
          authStore.setUser(null)
        }
        
        authStore.setLoading(false)
        resolve(user)
      })
    })
  }

  return {
    signInWithGoogle,
    logout,
    initAuth
  }
}
