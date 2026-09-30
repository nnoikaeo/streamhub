<template>
  <div class="user-menu">
    <!-- User Menu Button -->
    <button
      class="user-menu-btn"
      type="button"
      @click="toggleMenu"
    >
      <span class="user-avatar"><ClientOnly>{{ userInitial }}<template #fallback>U</template></ClientOnly></span>
      <span class="user-name"><ClientOnly>{{ displayName }}<template #fallback>User</template></ClientOnly></span>
      <svg
        class="dropdown-icon"
        :class="{ open: isMenuOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div v-if="isMenuOpen" class="dropdown-menu">
        <!-- User Profile Section -->
        <div class="dropdown-header">
          <div class="user-info">
            <div class="user-avatar-lg"><ClientOnly>{{ userInitial }}<template #fallback>U</template></ClientOnly></div>
            <div class="user-details">
              <div class="user-name-lg"><ClientOnly>{{ displayName }}<template #fallback>User</template></ClientOnly></div>
              <div class="user-email"><ClientOnly>{{ userEmail }}<template #fallback>&nbsp;</template></ClientOnly></div>
              <div v-if="userRoleCompany" class="user-role-company">{{ userRoleCompany }}</div>
              <div v-if="groupChips.shown.length" class="user-groups">
                <span v-for="chip in groupChips.shown" :key="chip.id" class="user-group-chip">👥 {{ chip.name }}</span>
                <span
                  v-if="groupChips.hidden.length"
                  class="user-group-chip user-group-chip--more"
                  :title="groupChips.hidden.map((c) => c.name).join(', ')"
                >+{{ groupChips.hidden.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="dropdown-divider"/>

        <!-- Menu Items -->
        <button
          class="dropdown-item"
          type="button"
          @click="handleProfile"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>โปรไฟล์</span>
        </button>

        <!-- Divider -->
        <div class="dropdown-divider"/>

        <!-- Logout -->
        <button
          class="dropdown-item logout"
          type="button"
          @click="handleLogout"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
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
import { useAdminGroups } from '~/composables/useAdminGroups'
import { userGroupChips } from '~/utils/groupDisplay'
import { roleLabel } from '~/utils/roleLabel'

const { user, logout } = useAuth()
const { groups, fetchGroups } = useAdminGroups()
const isMenuOpen = ref(false)

/**
 * The user's groups, by name. Group names live on the group docs, so the list
 * is fetched the first time the menu opens rather than on every page.
 */
let groupsRequested = false
const groupChips = computed(() => userGroupChips(user.value?.groups, groups.value, []))

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
 * Get user role + company label
 */
const userRoleCompany = computed(() => {
  const role = user.value?.role
  const company = user.value?.company
  if (!role && !company) return ''
  const parts = [role ? roleLabel(role) : '', company].filter(Boolean)
  return parts.join(' · ')
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
  if (isMenuOpen.value && !groupsRequested && user.value?.groups?.length) {
    groupsRequested = true
    fetchGroups().catch(() => { groupsRequested = false })
  }
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
  navigateTo('/profile')
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
/* Phones: the avatar alone identifies the account — the name would push the
   whole menu off the right edge (TC 5.2.5) */
@media (max-width: 768px) {
  .user-name,
  .dropdown-icon {
    display: none;
  }

  .user-menu-btn {
    padding: 0.375rem;
  }
}

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

.user-role-company {
  font-size: 0.7rem;
  color: var(--color-primary);
  font-weight: 500;
  margin-top: 2px;
}

.user-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.375rem;
}

.user-group-chip {
  font-size: 0.7rem;
  line-height: 1.5;
  padding: 0 0.4rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  background-color: var(--color-bg-secondary);
  white-space: nowrap;
}

.user-group-chip--more {
  cursor: help;
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
