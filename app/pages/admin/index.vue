<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin'],
})
</script>

<template>
  <NuxtRedirect to="/admin/overview" />
</template>
