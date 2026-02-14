/**
 * Auth Middleware
 * Handles authentication-based navigation
 *
 * Rules:
 * 1. If not authenticated → redirect to /login
 * 2. If authenticated + in mockUsers → allow access
 * 3. If authenticated but NOT in mockUsers → show error (allow on index only)
 */

console.log('🔧 [auth.middleware] File is being loaded/executed')

export default defineNuxtRouteMiddleware(async (to, from) => {
  try {
    console.log(`🚀 [auth.middleware] MIDDLEWARE TRIGGERED - Route: ${to.path}, Name: ${to.name}`)
    const authStore = useAuthStore()
    console.log(`📊 [auth.middleware] Auth State:`, {
      loading: authStore.loading,
      authenticated: authStore.isAuthenticated,
      hasError: !!authStore.authError,
      userEmail: authStore.user?.email
    })

    // Wait for auth to initialize if still loading
    if (authStore.loading) {
      console.log('🔄 [auth.middleware] Waiting for auth to load...')
      // Auth is still loading, let Suspense handle it
      return
    }

    // User not authenticated
    if (!authStore.isAuthenticated) {
      console.log('🔐 [auth.middleware] User not authenticated, redirecting to login')

      // If on public pages (index, login), allow access
      if (['index', 'login'].includes(to.name as string)) {
        console.log(`✅ [auth.middleware] Public page (${to.name}), allowing access`)
        return
      }

      // Otherwise redirect to login
      console.log('🔄 [auth.middleware] Redirecting to /login')
      return navigateTo('/login')
    }

    // User authenticated
    console.log(`✅ [auth.middleware] User authenticated: ${authStore.user?.email}`)

    // Check if user has auth error
    if (authStore.authError) {
      console.log('❌ [auth.middleware] User has auth error, allowing on index only')

      // Only allow on index page if there's an error
      if (to.name === 'index') {
        console.log(`✅ [auth.middleware] Error user on index page, allowing`)
        return
      }

      // Redirect to index to show error
      console.log('🔄 [auth.middleware] Redirecting error user to /')
      return navigateTo('/')
    }

    // User authenticated + no errors
    // Redirect index to dashboard for better UX
    if (to.name === 'index') {
      console.log('📊 [auth.middleware] Redirecting authenticated user from index to dashboard')
      return navigateTo('/dashboard/discover')
    }

    console.log('✅ [auth.middleware] All checks passed, allowing route')
  } catch (error) {
    console.error('❌ [auth.middleware] ERROR:', error)
    throw error
  }
})
