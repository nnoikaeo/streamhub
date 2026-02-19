/**
 * Admin Middleware
 * Protects admin routes by checking user role
 * Should be used in combination with 'auth' middleware
 */

export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  const permissionsStore = usePermissionsStore()
  const { initAuth } = useAuth()

  console.log(`🔐 [admin.middleware] Checking admin access for route: ${to.path}`)
  console.log(`🔐 [admin.middleware] Current state - loading: ${authStore.loading}, authenticated: ${authStore.isAuthenticated}`)

  // Wait for auth to initialize if still loading
  if (authStore.loading) {
    console.log(`⏳ [admin.middleware] Auth still loading, waiting for initAuth...`)
    const user = await initAuth()
    console.log(`⏳ [admin.middleware] initAuth completed, user: ${user?.email || 'none'}`)
  }

  // Not authenticated → redirect to login
  if (!authStore.isAuthenticated) {
    console.log(`❌ [admin.middleware] User not authenticated after init check`)
    console.log(`❌ [admin.middleware] authStore.user = ${authStore.user ? authStore.user.email : 'null'}`)
    console.log(`❌ [admin.middleware] Redirecting to /login`)
    return navigateTo('/login')
  }

  // Check if user has admin access permission
  const hasAdminAccess = permissionsStore.can('canAccessAdmin')

  if (!hasAdminAccess) {
    console.log(
      `❌ [admin.middleware] Access denied - user role: ${authStore.user?.role}, redirecting to /dashboard/discover`
    )
    return navigateTo('/dashboard/discover')
  }

  console.log(`✅ [admin.middleware] Admin access granted for user: ${authStore.user?.email} (role: ${authStore.user?.role})`)
})
