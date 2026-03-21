import { signOut, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { useAuthStore, type UserData } from '~/stores/auth'
import { usePermissionsStore } from '~/stores/permissions'

export const useAuth = () => {
  const { $firebase } = useNuxtApp()
  const authStore = useAuthStore()
  const permissionsStore = usePermissionsStore()

  const signInWithGoogle = async (options?: { skipAutoAccept?: boolean }) => {
    try {
      console.log('🔐 Starting Google Sign-in...')
      console.log('Auth object:', $firebase.auth)

      const provider = new GoogleAuthProvider()
      console.log('🔑 Google Provider created')

      const userCredential = await signInWithPopup($firebase.auth, provider)
      console.log('✅ Sign-in successful:', userCredential.user.email)

      // Fetch user role and company from API
      try {
        const response = await fetch('/api/mock/users')
        const data = await response.json()
        const mockUser = data.data?.find((u: any) => u.uid === userCredential.user.uid)

        // Check if user is deactivated
        if (mockUser && mockUser.isActive === false) {
          // Sign out from Firebase since user is deactivated
          await $firebase.auth.signOut()
          throw new Error('บัญชีของคุณถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ')
        }

        if (!mockUser) {
          // Auto-detect: Check for pending invitation (Flow B)
          // Skip if called from accept page (which handles acceptance explicitly)
          if (!options?.skipAutoAccept) try {
            const invResponse = await $fetch<any>('/api/mock/invitations/check', {
              query: { email: userCredential.user.email }
            })

            if (invResponse.found && invResponse.data?.status === 'pending') {
              const acceptResponse = await $fetch<any>('/api/mock/invitations/accept', {
                method: 'POST',
                body: {
                  invitationCode: invResponse.data.invitationCode,
                  uid: userCredential.user.uid,
                  email: userCredential.user.email,
                  displayName: userCredential.user.displayName,
                  photoURL: userCredential.user.photoURL
                }
              })

              if (acceptResponse.success) {
                const newUser = acceptResponse.data.user
                const userData: UserData = {
                  uid: userCredential.user.uid,
                  email: userCredential.user.email,
                  displayName: userCredential.user.displayName,
                  photoURL: userCredential.user.photoURL,
                  role: newUser.role,
                  company: newUser.company
                }
                authStore.setUser(userData)
                authStore.setAuthError(null)
                permissionsStore.initializePermissions(userData)
                return { success: true }
              }
            }
          } catch (invError) {
            console.log('No pending invitation found for:', userCredential.user.email)
          }

          // Original error: user not found, no invitation
          // If skipAutoAccept, return success anyway — accept page will handle user creation
          if (options?.skipAutoAccept) {
            const userData: UserData = {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userCredential.user.displayName,
              photoURL: userCredential.user.photoURL,
              role: '',
              company: ''
            }
            authStore.setUser(userData)
            return { success: true }
          }
          throw new Error(`User with UID "${userCredential.user.uid}" not found in system. Please contact administrator to create an account.`)
        }

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

      // Firebase is client-only — resolve immediately on server
      if (!$firebase?.auth) {
        authStore.setLoading(false)
        return resolve(null)
      }

      let resolved = false
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          console.warn('⚠️  [useAuth.initAuth] Firebase auth check timeout after 5 seconds, assuming no session')
          resolved = true
          authStore.setLoading(false)
          resolve(null)
        }
      }, 5000)

      onAuthStateChanged($firebase.auth, async (user) => {
        if (resolved) return

        console.log('🔍 Auth state changed:', user?.email || 'not logged in')

        if (user) {
          // Fetch role from API
          try {
            const response = await fetch(`/api/mock/users/${user.uid}`)
            if (!response.ok) {
              throw new Error(`User with UID "${user.uid}" not found in system. Please contact administrator to create an account.`)
            }
            const data = await response.json()
            const mockUser = data.data
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

