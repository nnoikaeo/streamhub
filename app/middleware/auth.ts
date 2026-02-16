/**
 * Auth Middleware
 * Handles authentication-based navigation
 *
 * Rules:
 * 1. If not authenticated → redirect to /login
 * 2. If authenticated + in mockUsers → allow access
 * 3. If authenticated but NOT in mockUsers → show error (allow on index only)
 */

export default defineNuxtRouteMiddleware(async (to) => {
  try {
    const authStore = useAuthStore()
    const { initAuth } = useAuth()

    // Wait for auth to initialize if still loading
    if (authStore.loading) {
      // Auth is still loading, wait for initialization to complete
      await initAuth()
    }

    // User not authenticated (after loading completed)
    if (!authStore.isAuthenticated) {
      // If on login page, allow access
      if (to.name === 'login') {
        return
      }

      // Redirect to login for all other pages (including index)
      return navigateTo('/login')
    }

    // Check if user has auth error
    if (authStore.authError) {
      // Only allow on index page if there's an error
      if (to.name === 'index') {
        return
      }

      // Redirect to index to show error
      return navigateTo('/')
    }

    // User authenticated + no errors
    // Redirect index to dashboard for better UX
    if (to.name === 'index') {
      return navigateTo('/dashboard/discover')
    }
  } catch (error) {
    console.error('❌ [auth.middleware] ERROR:', error)
    throw error
  }
})
