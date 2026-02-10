import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

console.log('✅ Auth middleware loaded')

// Manual middleware implementation without defineRouteMiddleware
export default (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  console.log(`📍 Middleware triggered: ${to.path}`)
  
  // Skip middleware on server-side for now
  if (process.server) {
    console.log('⏭️ Skipping middleware on server')
    return
  }

  const authStore = useAuthStore()
  
  // Don't redirect while auth is still loading
  if (authStore.loading) {
    console.log(`⏳ Auth still loading, skipping middleware checks`)
    return
  }
  
  console.log(`📊 Auth state - Authenticated: ${authStore.isAuthenticated}, User: ${authStore.user?.email || 'none'}, Role: ${authStore.user?.role || 'none'}`)

  // If user is authenticated and trying to access login, redirect to dashboard
  if (authStore.isAuthenticated && to.path === '/login') {
    console.log('✅ Already logged in, redirecting to dashboard')
    return navigateTo('/dashboard')
  }

  // Allow access to login and public pages
  if (to.path === '/login' || to.path === '/') {
    console.log('✅ Allowing access to public page')
    return
  }

  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    console.log('🔐 Not authenticated, redirecting to login')
    return navigateTo('/login')
  }
  
  // Check admin role for admin routes
  if (to.path.startsWith('/admin/')) {
    console.log(`🔐 Admin route detected: ${to.path}, checking admin role. Current role: ${authStore.user?.role}`)
    if (authStore.user?.role !== 'admin') {
      console.log(`❌ Not admin (role: ${authStore.user?.role}), redirecting to /dashboard/discover`)
      return navigateTo('/dashboard/discover')
    }
    console.log(`✅ Admin access granted`)
  }
}
