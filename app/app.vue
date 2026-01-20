<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { initAuth } = useAuth()

onMounted(async () => {
  if (!authStore.isAuthenticated && authStore.loading) {
    await initAuth()
  }
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
