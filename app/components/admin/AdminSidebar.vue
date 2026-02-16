<script setup lang="ts">
/**
 * AdminSidebar Component
 * Navigation sidebar for admin panel
 *
 * Features:
 * - Navigation links to all admin pages
 * - Active route highlighting
 * - Icons for each section
 * - Organized by management category
 * - Thai language labels
 *
 * Usage:
 * <AdminSidebar />
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Navigation items organized by category
const navCategories = [
  {
    label: 'ภาพรวม',
    items: [
      {
        path: '/admin',
        label: 'แดชบอร์ด',
        icon: '📊',
        exact: true,
      },
    ],
  },
  {
    label: 'จัดการข้อมูล',
    items: [
      {
        path: '/admin/users',
        label: 'ผู้ใช้',
        icon: '👥',
      },
      {
        path: '/admin/dashboards',
        label: 'แดชบอร์ด',
        icon: '📈',
      },
      {
        path: '/admin/folders',
        label: 'โฟลเดอร์',
        icon: '📁',
      },
      {
        path: '/admin/companies',
        label: 'บริษัท',
        icon: '🏢',
      },
      {
        path: '/admin/groups',
        label: 'กลุ่ม',
        icon: '👫',
      },
    ],
  },
  {
    label: 'ระบบ',
    items: [
      {
        path: '/admin/permissions',
        label: 'สิทธิ์',
        icon: '🔐',
      },
    ],
  },
]

/**
 * Check if route is active
 */
const isActive = (path: string, exact: boolean = false): boolean => {
  if (exact) {
    return route.path === path
  }
  return route.path.startsWith(path)
}

/**
 * Get active class for link
 */
const getLinkClass = (path: string, exact: boolean = false): string => {
  return isActive(path, exact) ? 'nav-link--active' : ''
}
</script>

<template>
  <div class="admin-sidebar__wrapper">
    <!-- Header -->
    <div class="sidebar-header">
      <h2 class="sidebar-title">Admin Panel</h2>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <template v-for="category in navCategories" :key="category.label">
        <!-- Category Header -->
        <div class="nav-category-label">
          {{ category.label }}
        </div>

        <!-- Category Items -->
        <div class="nav-category-items">
          <NuxtLink
            v-for="item in category.items"
            :key="item.path"
            :to="item.path"
            :class="['nav-link', getLinkClass(item.path, item.exact)]"
            exact-active-class="nav-link--active"
          >
            <span class="nav-link__icon">{{ item.icon }}</span>
            <span class="nav-link__label">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </template>
    </nav>

    <!-- Footer Info -->
    <div class="sidebar-footer">
      <p class="sidebar-footer__text">
        Admin Interface v1.0
      </p>
    </div>
  </div>
</template>

<style scoped>
.admin-sidebar__wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-md, 1rem);
}

/* Header */
.sidebar-header {
  padding: var(--spacing-lg, 1.25rem) var(--spacing-md, 1rem);
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  flex-shrink: 0;
}

.sidebar-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md, 1rem) 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.25rem);
}

/* Category Label */
.nav-category-label {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary, #6b7280);
}

/* Category Items Container */
.nav-category-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

/* Navigation Link */
.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  color: var(--color-text-secondary, #6b7280);
  text-decoration: none;
  font-size: 0.95rem;
  transition: all var(--transition-base, 0.2s ease);
  cursor: pointer;
  border-left: 3px solid transparent;
  margin: 0 var(--spacing-xs, 0.25rem);
}

.nav-link:hover {
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-primary, #1f2937);
}

/* Active Link */
.nav-link--active {
  background-color: rgba(59, 130, 246, 0.08);
  color: var(--color-primary, #3b82f6);
  font-weight: 600;
  border-left-color: var(--color-primary, #3b82f6);
}

/* Link Icon */
.nav-link__icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

/* Link Label */
.nav-link__label {
  flex: 1;
}

/* Footer */
.sidebar-footer {
  padding: var(--spacing-md, 1rem);
  border-top: 1px solid var(--color-border-light, #e5e7eb);
  flex-shrink: 0;
  background-color: var(--color-bg-secondary, #f3f4f6);
}

.sidebar-footer__text {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary, #6b7280);
  text-align: center;
}

/* Custom Scrollbar */
.sidebar-nav {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
