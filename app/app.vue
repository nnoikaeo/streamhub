<script setup lang="ts">
import '../assets/css/main.css'
import '../assets/css/theme.css'
import AppToast from '~/components/ui/AppToast.vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { initAuth } = useAuth()

console.log('🔍 [app.vue] initializing')

onMounted(async () => {
  console.log('🔍 [app.vue] onMounted called', { loading: authStore.loading, authenticated: authStore.isAuthenticated })

  // Always initialize auth if not already authenticated or if still loading
  if (authStore.loading) {
    console.log('🔍 [app.vue] calling initAuth because loading is true')
    await initAuth()
    console.log('🔍 [app.vue] initAuth completed')
  } else {
    console.log('🔍 [app.vue] skipping initAuth - already loaded')
  }
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppToast />
  </div>
</template>
