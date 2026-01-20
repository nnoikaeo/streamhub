<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// ข้อมูล user จาก auth store
const user = computed(() => authStore.user)
const userName = computed(() => user.value?.displayName || 'User')
const userPhoto = computed(() => user.value?.photoURL)
</script>

<template>
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo / Brand -->
        <div class="flex items-center">
          <h1 class="text-2xl font-bold text-blue-600">StreamHub</h1>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-8">
          <NuxtLink 
            to="/dashboard" 
            class="text-gray-700 hover:text-blue-600 transition"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink 
            to="/dashboard/users" 
            class="text-gray-700 hover:text-blue-600 transition"
          >
            Users
          </NuxtLink>
          <NuxtLink 
            to="/dashboard/settings" 
            class="text-gray-700 hover:text-blue-600 transition"
          >
            Settings
          </NuxtLink>
        </nav>

        <!-- User Profile -->
        <div class="flex items-center space-x-4">
          <span class="text-gray-700">{{ userName }}</span>
          <img 
            v-if="userPhoto"
            :src="userPhoto" 
            :alt="userName"
            class="w-10 h-10 rounded-full"
          >
          <div v-else class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            <span class="text-white font-bold">{{ userName.charAt(0) }}</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Header styles */
header {
  position: sticky;
  top: 0;
  z-index: 50;
}
</style>
