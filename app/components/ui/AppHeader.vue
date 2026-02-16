<template>
  <header class="app-header-content">
    <div class="header-container">
      <!-- Logo / Brand -->
      <div class="header-brand">
        <img src="/logo.png" alt="StreamHub Logo" class="brand-logo" />
      </div>

      <!-- Header Content Slot -->
      <div class="header-middle">
        <slot />
      </div>

      <!-- User Menu (Right) -->
      <div class="header-user">
        <UserMenu />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * AppHeader - Main application header
 * Used by AppLayout component
 *
 * Features:
 * - Brand logo
 * - Flexible middle slot for breadcrumbs, search, etc.
 * - User menu dropdown (profile, settings, logout)
 */
import UserMenu from './UserMenu.vue'
</script>

<style scoped>
.app-header-content {
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  min-height: 3.5rem;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 1.5rem;
  gap: 1rem;
}

.header-brand {
  flex-shrink: 0;
}

.brand-logo {
  height: 5rem;
  width: auto;
  object-fit: contain;
}

.header-middle {
  flex: 1;
}

.header-user {
  flex-shrink: 0;
}

</style>
