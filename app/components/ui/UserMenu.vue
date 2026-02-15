<template>
  <div class="user-menu">
    <!-- User Menu Button -->
    <button
      class="user-menu-btn"
      type="button"
      @click="toggleMenu"
    >
      <span class="user-avatar">{{ userInitial }}</span>
      <span class="user-name">{{ displayName }}</span>
      <svg
        class="dropdown-icon"
        :class="{ open: isMenuOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div v-if="isMenuOpen" class="dropdown-menu">
        <!-- User Profile Section -->
        <div class="dropdown-header">
          <div class="user-info">
            <div class="user-avatar-lg">{{ userInitial }}</div>
            <div class="user-details">
              <div class="user-name-lg">{{ displayName }}</div>
              <div class="user-email">{{ userEmail }}</div>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="dropdown-divider"></div>

        <!-- Menu Items -->
        <button
          class="dropdown-item"
          type="button"
          @click="handleProfile"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>โปรไฟล์</span>
        </button>

        <button
          class="dropdown-item"
          type="button"
          @click="handleSettings"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m3.08-3.08l4.24-4.24"></path>
          </svg>
          <span>การตั้งค่า</span>
        </button>

        <!-- Divider -->
        <div class="dropdown-divider"></div>

        <!-- Logout -->
        <button
          class="dropdown-item logout"
          type="button"
          @click="handleLogout"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, logout } = useAuth()
const isMenuOpen = ref(false)

/**
 * Get user display name or email
 */
const displayName = computed(() => {
  return user.value?.displayName || user.value?.email?.split('@')[0] || 'User'
})

/**
 * Get user email
 */
const userEmail = computed(() => {
  return user.value?.email || 'No email'
})

/**
 * Get user initial for avatar
 */
const userInitial = computed(() => {
  const name = user.value?.displayName || user.value?.email || 'U'
  return name.charAt(0).toUpperCase()
})

/**
 * Toggle dropdown menu
 */
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

/**
 * Close menu
 */
const closeMenu = () => {
  isMenuOpen.value = false
}

/**
 * Handle click outside to close menu
 */
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu')) {
    closeMenu()
  }
}

/**
 * Handle profile click
 */
const handleProfile = () => {
  closeMenu()
  // TODO: Navigate to profile page
  console.log('Profile clicked')
}

/**
 * Handle settings click
 */
const handleSettings = () => {
  closeMenu()
  // TODO: Navigate to settings page
  console.log('Settings clicked')
}

/**
 * Handle logout
 */
const handleLogout = async () => {
  closeMenu()
  await logout()
}

/**
 * Setup/teardown click outside listener
 */
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.user-menu {
  position: relative;
}

/* ========== BUTTON ========== */
.user-menu-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background-color: var(--color-primary-lightest);
    border-color: var(--color-border-default);
  }

  &:active {
    background-color: var(--color-primary-lighter);
  }
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-text-inverse);
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.dropdown-icon {
  width: 1rem;
  height: 1rem;
  transition: transform var(--transition-fast);
  flex-shrink: 0;
  color: var(--color-primary);

  &.open {
    transform: rotate(180deg);
  }
}

/* ========== DROPDOWN MENU ========== */
.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  right: 0;
  width: 280px;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  overflow: hidden;
}

/* ========== DROPDOWN HEADER ========== */
.dropdown-header {
  padding: var(--spacing-md);
  background-color: var(--color-bg-secondary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
}

.user-avatar-lg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-text-inverse);
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.user-details {
  min-width: 0;
  flex: 1;
}

.user-name-lg {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0 var(--spacing-xs) 0;
}

.user-email {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== DIVIDER ========== */
.dropdown-divider {
  height: 1px;
  background-color: var(--color-border-light);
}

/* ========== DROPDOWN ITEMS ========== */
.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  text-align: left;

  svg {
    width: 1rem;
    height: 1rem;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  &:hover {
    background-color: var(--color-bg-secondary);
    color: var(--color-primary);

    svg {
      color: var(--color-primary);
    }
  }

  &.logout {
    color: var(--color-error);

    svg {
      color: var(--color-error);
    }

    &:hover {
      background-color: var(--color-primary-lightest);
      color: var(--color-error);

      svg {
        color: var(--color-error);
      }
    }
  }
}

/* ========== TRANSITIONS ========== */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-fast);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
