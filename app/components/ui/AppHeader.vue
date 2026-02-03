<template>
  <header class="app-header-content">
    <div class="header-container">
      <!-- Logo / Brand -->
      <div class="header-brand">
        <h1 class="brand-logo">StreamHub</h1>
      </div>

      <!-- Header Content Slot -->
      <div class="header-middle">
        <slot />
      </div>

      <!-- User Menu (Right) -->
      <div class="header-user">
        <button class="user-menu-btn" type="button">
          <span class="user-avatar">👤</span>
          <span class="user-name">User</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * AppHeader - Main application header
 * Used by AppLayout component
 */
</script>

<style scoped>
.app-header-content {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-middle {
  flex: 1;
}

.header-user {
  flex-shrink: 0;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
}

.user-avatar {
  font-size: 1.25rem;
}

.user-name {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
}
</style>
