<template>
  <header class="admin-header-content">
    <div class="header-container">
      <!-- Admin Brand -->
      <div class="header-brand">
        <h1 class="brand-logo">⚙️ Admin Panel</h1>
      </div>

      <!-- Admin Navigation (Slot) -->
      <div class="header-middle">
        <slot />
      </div>

      <!-- Admin User Menu -->
      <div class="header-admin-user">
        <button class="admin-user-menu" type="button">
          <span class="admin-user-avatar">👤</span>
          <span class="admin-user-name">Administrator</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * AdminHeader - Admin panel header
 * Used by AdminLayout component
 */
</script>

<style scoped>
.admin-header-content {
  background-color: #1f2937;
  border-bottom: 1px solid #111827;
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
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.header-middle {
  flex: 1;
}

.header-admin-user {
  flex-shrink: 0;
}

.admin-user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.admin-user-avatar {
  font-size: 1.25rem;
}

.admin-user-name {
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
