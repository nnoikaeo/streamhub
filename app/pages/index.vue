<template>
  <div>
    <h1 class="text-4xl font-bold mb-8">Index</h1>
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
definePageMeta({
  layout: 'default'
})
</script>
