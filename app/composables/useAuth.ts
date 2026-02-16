import { signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { useAuthStore, type UserData } from '~/stores/auth'
import { usePermissionsStore } from '~/stores/permissions'
import { getMockUserByUid } from '~/composables/useMockData'

export const useAuth = () => {
  const { $firebase } = useNuxtApp()
  const authStore = useAuthStore()
  const permissionsStore = usePermissionsStore()

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google Sign-in...')
      console.log('Auth object:', $firebase.auth)

      const provider = new GoogleAuthProvider()
      console.log('🔑 Google Provider created')

      const userCredential = await signInWithPopup($firebase.auth, provider)
      console.log('✅ Sign-in successful:', userCredential.user.email)

      // Fetch role from mock data
      try {
        const mockUser = getMockUserByUid(userCredential.user.uid)

        const userData: UserData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          role: mockUser.role,
          company: mockUser.company
        }
        authStore.setUser(userData)
        authStore.setAuthError(null)
        
        // Initialize permissions
        permissionsStore.initializePermissions(userData)
        console.log('✅ Permissions initialized for role:', mockUser.role)
        
        return { success: true }
      } catch (userError: any) {
        // User not found in system
        console.error('❌ User profile not found:', userError.message)
        authStore.setUser(null)
        authStore.setAuthError(userError.message)
        permissionsStore.initializePermissions(null)
        return {
          success: false,
          error: userError.message
        }
      }
    } catch (error: any) {
      console.error('❌ Sign-in error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      authStore.setAuthError(error.message)
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
      permissionsStore.initializePermissions(null)
      await navigateTo('/login')
      console.log('✅ Logged out successfully')
    } catch (error: any) {
      console.error('Logout error:', error)
    }
  }

  const initAuth = () => {
    return new Promise<any>((resolve) => {
      console.log('📡 Initializing auth listener...')

      let resolved = false
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn('⚠️  [useAuth.initAuth] Firebase auth check timeout after 5 seconds, assuming no session')
          resolved = true
          authStore.setLoading(false)
          resolve(null)
        }
      }, 5000)

      onAuthStateChanged($firebase.auth, (user) => {
        if (resolved) return

        console.log('🔍 Auth state changed:', user?.email || 'not logged in')

        if (user) {
          // Fetch role from mock data
          try {
            const mockUser = getMockUserByUid(user.uid)
            console.log(`🔍 [useAuth.initAuth] Got mock user with role: ${mockUser.role}`)

            const userData: UserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: mockUser.role,
              company: mockUser.company
            }
            console.log(`🔍 [useAuth.initAuth] Setting user data:`, userData)
            authStore.setUser(userData)
            authStore.setAuthError(null)

            // Initialize permissions
            permissionsStore.initializePermissions(userData)
            console.log('✅ Permissions initialized for role:', mockUser.role)
          } catch (userError: any) {
            // User not found in system
            console.error('❌ [useAuth.initAuth] User profile not found:', userError.message)
            authStore.setUser(null)
            authStore.setAuthError(userError.message)
            permissionsStore.initializePermissions(null)
          }
        } else {
          authStore.setUser(null)
          authStore.setAuthError(null)
          permissionsStore.initializePermissions(null)
        }

        console.log(`🔍 [useAuth.initAuth] Setting loading to false`)
        authStore.setLoading(false)
        clearTimeout(timeoutId)
        resolved = true
        resolve(user)
      })
    })
  }

  return {
    user: computed(() => authStore.user),
    loading: computed(() => authStore.loading),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    signInWithGoogle,
    logout,
    initAuth
  }
}

