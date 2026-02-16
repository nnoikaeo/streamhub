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

  // Wait for auth to initialize if still loading
  if (authStore.loading) {
    console.log(`⏳ [admin.middleware] Auth still loading, waiting...`)
    await initAuth()
  }

  // Not authenticated → redirect to login
  if (!authStore.isAuthenticated) {
    console.log(`❌ [admin.middleware] User not authenticated, redirecting to /login`)
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

  console.log(`✅ [admin.middleware] Admin access granted for user: ${authStore.user?.email}`)
})
