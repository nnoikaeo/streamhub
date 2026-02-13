<template>
  <Modal
    v-model="isOpen"
    title="Share Dashboard"
    size="md"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <!-- Moderator Quick Share: Layer 1 Direct Users Only -->
    <div class="quick-share-dialog">
      <!-- Instructions -->
      <p class="share-description">
        Share access to this dashboard with individual users. They will be able to view it
        immediately.
      </p>

      <!-- User Selection Section -->
      <div class="share-section">
        <label class="share-label">Add Users</label>

        <!-- User Input -->
        <div class="user-input-group">
          <input
            v-model="userSearch"
            type="text"
            placeholder="Search users by name or email..."
            class="user-search-input"
            @keydown.enter.prevent="addSelectedUser"
            @input="filterUsers"
          />
          <button type="button" class="add-user-btn" @click="addSelectedUser">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>

        <!-- User Suggestions -->
        <div v-if="showUserSuggestions && filteredUsers.length > 0" class="user-suggestions">
          <button
            v-for="user in filteredUsers"
            :key="user.id"
            type="button"
            class="suggestion-item"
            @click="selectUser(user)"
          >
            <span class="user-name">{{ user.name }}</span>
            <span class="user-email">{{ user.email }}</span>
          </button>
        </div>
      </div>

      <!-- Selected Users List -->
      <div v-if="selectedUsers.length > 0" class="share-section">
        <label class="share-label">Shared With</label>
        <div class="selected-users-list">
          <div v-for="user in selectedUsers" :key="user.id" class="shared-user-item">
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
            <button
              type="button"
              class="remove-user-btn"
              @click="removeUser(user.id)"
              :title="`Remove ${user.name}`"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Optional Expiry -->
      <div class="share-section">
        <label class="share-label">
          <input v-model="hasExpiry" type="checkbox" class="expiry-checkbox" />
          Set expiration date
        </label>
        <input
          v-if="hasExpiry"
          v-model="expiryDate"
          type="date"
          class="expiry-input"
          :min="minDate"
        />
      </div>

      <!-- Sharing Note -->
      <div class="share-note">
        <p class="note-title">📌 Note</p>
        <p class="note-text">
          Shared users can only view this dashboard. For advanced permissions, contact an
          administrator.
        </p>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <Button variant="secondary" @click="closeDialog"> Cancel </Button>
      <Button
        :disabled="selectedUsers.length === 0"
        @click="handleShare"
      >
        Share ({{ selectedUsers.length }})
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { type User } from '~/types/dashboard'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'

/**
 * QuickShareDialog - Moderator quick share modal
 *
 * Layer 1 Direct Access Only:
 * - Add individual users to share access
 * - Optional expiry date
 * - Simple one-step sharing
 * - For moderators only
 *
 * Features:
 * - User search/autocomplete
 * - Add/remove users
 * - Expiry date option
 * - Share confirmation
 *
 * Events:
 * - update:modelValue: Modal open/close
 * - share: User confirmed sharing with users
 *
 * Usage:
 * <QuickShareDialog
 *   v-model="isShareDialogOpen"
 *   :dashboard-id="activeDashboardId"
 *   :available-users="allUsers"
 *   @share="handleShare"
 * />
 */

interface SharePayload {
  dashboardId: string
  userIds: string[]
  expiryDate?: string
}

const props = defineProps({
  /**
   * Modal visibility (v-model)
   */
  modelValue: {
    type: Boolean,
    required: true,
  },

  /**
   * Dashboard ID being shared
   */
  dashboardId: {
    type: String,
    required: true,
  },

  /**
   * Available users to share with
   */
  availableUsers: {
    type: Array as () => User[],
    required: true,
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  share: [payload: SharePayload]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const userSearch = ref('')
const selectedUsers = ref<User[]>([])
const hasExpiry = ref(false)
const expiryDate = ref('')
const showUserSuggestions = ref(false)

/**
 * Minimum date (today)
 */
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

/**
 * Filter users based on search query
 */
const filteredUsers = computed(() => {
  const query = userSearch.value.toLowerCase().trim()
  if (!query) return []

  const alreadySelected = new Set(selectedUsers.value.map((u) => u.id))

  return props.availableUsers.filter(
    (user) =>
      !alreadySelected.has(user.id) &&
      (user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)),
  )
})

/**
 * Filter users on input
 */
const filterUsers = () => {
  showUserSuggestions.value = userSearch.value.length > 0
}

/**
 * Select user from suggestions
 */
const selectUser = (user: User) => {
  selectedUsers.value.push(user)
  userSearch.value = ''
  showUserSuggestions.value = false
}

/**
 * Add selected user (enter key)
 */
const addSelectedUser = () => {
  if (filteredUsers.value.length > 0) {
    selectUser(filteredUsers.value[0])
  }
}

/**
 * Remove user from selected list
 */
const removeUser = (userId: string) => {
  selectedUsers.value = selectedUsers.value.filter((u) => u.id !== userId)
}

/**
 * Handle share action
 */
const handleShare = () => {
  if (selectedUsers.value.length === 0) return

  emit('share', {
    dashboardId: props.dashboardId,
    userIds: selectedUsers.value.map((u) => u.id),
    expiryDate: hasExpiry.value ? expiryDate.value : undefined,
  })

  closeDialog()
}

/**
 * Close dialog and reset
 */
const closeDialog = () => {
  isOpen.value = false
  selectedUsers.value = []
  userSearch.value = ''
  hasExpiry.value = false
  expiryDate.value = ''
  showUserSuggestions.value = false
}
</script>

<style scoped>
.quick-share-dialog {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ========== DESCRIPTION ========== */
.share-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* ========== SECTION ========== */
.share-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.share-label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ========== USER INPUT ========== */
.user-input-group {
  display: flex;
  gap: 0.5rem;
}

.user-search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border-light);
  border-radius: 0.375rem;
  font-family: inherit;

  &::placeholder {
    color: var(--color-border-light);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(45, 51, 137, 0.1);
  }
}

.add-user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.375rem;
  height: 2.375rem;
  padding: 0;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    background-color: var(--color-primary-dark);
    opacity: 0.9;
  }

  &:active {
    opacity: 0.8;
  }
}

/* ========== USER SUGGESTIONS ========== */
.user-suggestions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 0.375rem;
  padding: 0.5rem 0;
}

.suggestion-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--color-bg-light);
  }
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.user-email {
  font-size: 0.8125rem;
  color: var(--color-gray-400);
}

/* ========== SELECTED USERS ========== */
.selected-users-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.shared-user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: var(--color-bg-info);
  border: 1px solid var(--color-border-info);
  border-radius: 0.375rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
}

.shared-user-item .user-name {
  font-size: 0.875rem;
}

.shared-user-item .user-email {
  font-size: 0.8125rem;
}

.remove-user-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  flex-shrink: 0;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    color: var(--color-error);
    background-color: rgba(220, 38, 38, 0.1);
    border-radius: 0.25rem;
  }
}

/* ========== EXPIRY CHECKBOX ========== */
.expiry-checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.expiry-input {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border-light);
  border-radius: 0.375rem;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(45, 51, 137, 0.1);
  }
}

/* ========== NOTE ========== */
.share-note {
  padding: 0.75rem 1rem;
  background-color: var(--color-bg-warning);
  border-left: 3px solid var(--color-warning);
  border-radius: 0.375rem;
}

.note-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-warning-dark);
}

.note-text {
  margin: 0.25rem 0 0 0;
  font-size: 0.8125rem;
  color: var(--color-warning-dark);
  line-height: 1.4;
}
</style>
