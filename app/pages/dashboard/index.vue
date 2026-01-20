<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <h1 class="text-4xl font-bold">Dashboard</h1>
      <button
        @click="handleLogout"
        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
      >
        Logout
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Users</h3>
        <p class="text-4xl font-bold">150</p>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Active Dashboards</h3>
        <p class="text-4xl font-bold">12</p>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
        <h3 class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Last Updated</h3>
        <p class="text-xl font-semibold">Today</p>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-4">Welcome to StreamHub</h2>
      <p class="text-slate-600 dark:text-slate-400">
        This is your dashboard management system for StreamVoice company.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { logout } = useAuth()

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const handleLogout = async () => {
  await logout()
}
</script>
