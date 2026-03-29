<script setup lang="ts">
import '../assets/css/main.css'
import '../assets/css/theme.css'
import AppToast from '~/components/ui/AppToast.vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { initAuth } = useAuth()

onMounted(async () => {
  if (authStore.loading) {
    await initAuth()
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
