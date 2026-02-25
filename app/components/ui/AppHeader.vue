<template>
  <header class="app-header-content">
    <div class="header-container">
      <!-- Logo / Brand -->
      <div class="header-brand">
        <img src="/logo.png" alt="StreamHub Logo" class="brand-logo" />
      </div>

      <!-- Admin Menu (Hidden) -->
      <nav v-if="false" class="admin-menu">
        <router-link to="/admin" class="admin-menu-link" active-class="active">
          📊 Dashboard
        </router-link>
        <router-link to="/admin/users" class="admin-menu-link" active-class="active">
          👥 Users
        </router-link>
        <router-link to="/admin/dashboards" class="admin-menu-link" active-class="active">
          📈 Dashboards
        </router-link>
        <router-link to="/admin/folders" class="admin-menu-link" active-class="active">
          📁 Folders
        </router-link>
        <router-link to="/admin/companies" class="admin-menu-link" active-class="active">
          🏢 Companies
        </router-link>
        <router-link to="/admin/groups" class="admin-menu-link" active-class="active">
          👤 Groups
        </router-link>
      </nav>

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
 * - Conditional admin menu (for admin users only)
 * - User menu dropdown (profile, settings, logout)
 */
import UserMenu from './UserMenu.vue'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')
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

/* Admin Menu Navigation */
.admin-menu {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.5rem;
}

.admin-menu-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: 0.375rem;
  transition: all var(--transition-fast);

  &:hover {
    color: var(--color-text-primary);
    background-color: var(--color-bg-secondary);
  }

  &.active {
    color: var(--color-info);
    background-color: rgba(59, 130, 246, 0.1);
  }
}

.header-middle {
  flex: 1;
}

.header-user {
  flex-shrink: 0;
}

/* Responsive: Hide admin menu on smaller screens */
@media (max-width: 1024px) {
  .admin-menu {
    gap: 0;
  }

  .admin-menu-link {
    padding: 0.5rem 0.5rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 768px) {
  .admin-menu {
    display: none;
  }
}

</style>
