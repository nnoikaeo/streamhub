<template>
  <header class="app-header-content">
    <div class="header-container">
      <!-- Drawer toggle — mobile only, hidden by CSS from 769px up where the
           sidebar is part of the layout -->
      <button
        v-if="showMenuButton"
        type="button"
        class="menu-toggle"
        aria-label="เปิด/ปิดเมนู"
        @click="emit('toggle-sidebar')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <!-- Logo / Brand -->
      <div class="header-brand">
        <img src="/logo.png" alt="StreamHub Logo" class="brand-logo" >
      </div>

      <!-- Admin Menu (Hidden) -->
      <nav v-if="false" class="admin-menu">
        <router-link to="/admin/overview" class="admin-menu-link" active-class="active">
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

withDefaults(defineProps<{
  /** Show the drawer toggle — only meaningful when the page has a sidebar */
  showMenuButton?: boolean
}>(), {
  showMenuButton: false,
})

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

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

  /* A 5rem logo pushed the user menu off the right edge at 375px, taking
     logout and profile with it (TC 5.2.5). The brand also has to yield width,
     or it squeezes the menu back off the edge on the narrowest phones. */
  .brand-logo {
    height: 2.5rem;
    max-width: 100%;
  }

  .header-brand {
    min-width: 0;
    flex-shrink: 1;
  }

  .header-container {
    padding: 0 0.5rem;
    gap: 0.5rem;
  }

  .header-middle {
    display: none;
  }
}

/* ========== DRAWER TOGGLE (mobile only) ========== */
.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  color: #374151;
  cursor: pointer;
  flex-shrink: 0;
}

.menu-toggle svg {
  width: 1.25rem;
  height: 1.25rem;
}

@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
  }
}

</style>
