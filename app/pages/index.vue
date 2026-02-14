<template>
  <div>
    <h1 class="text-4xl font-bold mb-8">Index</h1>

    <!-- Auth Error Display -->
    <div
      v-if="authStore.authError"
      class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg shadow p-6 mb-6"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium">
            Authentication Error
          </h3>
          <p class="mt-2 text-sm">
            {{ authStore.authError }}
          </p>
          <p class="mt-3 text-xs">
            Please contact your administrator to set up your account.
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-lg shadow p-8 text-center">
      <p class="text-slate-600 dark:text-slate-400 mb-6">
        Welcome to StreamHub Dashboard Management System
      </p>
      <NuxtLink
        to="/login"
        class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
      >
        Go to Login
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const route = useRoute()

console.log('📄 [index.vue] Page mounted')
console.log('📄 [index.vue] Route info:', {
  path: route.path,
  name: route.name,
  params: route.params,
  query: route.query
})

definePageMeta({
  layout: 'default',
  middleware: 'auth'  // Explicitly apply auth middleware
})
</script>
