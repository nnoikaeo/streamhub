<script setup lang="ts">
/**
 * ModeratorAssignmentModal Component
 *
 * Dual-panel transfer list for assigning moderators to a folder.
 * Left panel: available moderators with search.
 * Right panel: currently assigned moderators with remove button.
 *
 * Only users with role === 'moderator' are shown.
 */

import type { Folder, User } from '~/types/dashboard'

interface Props {
  modelValue: boolean
  folder: Folder | null
  allUsers: User[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [folderId: string, moderatorUids: string[]]
}>()

// Local state
const searchQuery = ref('')
const localAssigned = ref<string[]>([])

// Reset local state when folder changes
watch(() => props.folder, (folder) => {
  if (folder) {
    localAssigned.value = [...(folder.assignedModerators || [])]
  } else {
    localAssigned.value = []
  }
  searchQuery.value = ''
}, { immediate: true })

// Only show users with role === 'moderator'
const moderatorUsers = computed(() =>
  props.allUsers.filter(u => u.role === 'moderator')
)

// Available = moderator users NOT in localAssigned, filtered by search
const filteredAvailable = computed(() => {
  const assignedSet = new Set(localAssigned.value)
  let available = moderatorUsers.value.filter(u => !assignedSet.has(u.uid))

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    available = available.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.company?.toLowerCase().includes(q)
    )
  }

  return available
})

// Resolve assigned UIDs to user objects (exclude admins — they have implicit access)
const assignedUsers = computed(() =>
  localAssigned.value
    .map(uid => props.allUsers.find(u => u.uid === uid))
    .filter((u): u is User => !!u && u.role !== 'admin')
)

const getRoleLabel = (role: User['role']): string => {
  const labels: Record<User['role'], string> = {
    admin: 'Admin',
    moderator: 'Moderator',
    user: 'User',
  }
  return labels[role] ?? role
}

const addModerator = (uid: string) => {
  if (!localAssigned.value.includes(uid)) {
    localAssigned.value.push(uid)
  }
}

const removeModerator = (uid: string) => {
  localAssigned.value = localAssigned.value.filter(id => id !== uid)
}

const handleSave = () => {
  if (props.folder) {
    emit('save', props.folder.id, [...localAssigned.value])
  }
}

const handleCancel = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <FormModal
    :model-value="modelValue"
    :title="`จัดการผู้ดูแล: ${folder?.name || ''}`"
    :loading="loading"
    size="lg"
    submit-text="บันทึก"
    @update:model-value="emit('update:modelValue', $event)"
    @save="handleSave"
    @cancel="handleCancel"
  >
    <div class="assignment-panels">
      <!-- Left: Available Moderators -->
      <div class="assignment-panel">
        <div class="panel-header">
          <span class="panel-title">ผู้ดูแลที่สามารถเลือกได้</span>
          <span class="panel-count">({{ filteredAvailable.length }})</span>
        </div>
        <div class="panel-search">
          <input
            v-model="searchQuery"
            type="search"
            class="panel-search-input"
            placeholder="ค้นหาชื่อ หรืออีเมล..."
          />
        </div>
        <div class="panel-list">
          <div v-if="filteredAvailable.length === 0" class="panel-empty">
            {{ searchQuery ? 'ไม่พบผู้ดูแลที่ตรงกัน' : 'ไม่มีผู้ดูแลให้เลือกเพิ่ม' }}
          </div>
          <button
            v-for="user in filteredAvailable"
            :key="user.uid"
            type="button"
            class="user-row"
            @click="addModerator(user.uid)"
          >
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-company">{{ getRoleLabel(user.role) }} · {{ user.company }}</span>
            </div>
            <span class="user-action user-action--add">&gt;&gt;</span>
          </button>
        </div>
      </div>

      <!-- Right: Assigned Moderators -->
      <div class="assignment-panel">
        <div class="panel-header">
          <span class="panel-title">ผู้ดูแลที่กำหนดแล้ว</span>
          <span class="panel-count">({{ assignedUsers.length }})</span>
        </div>
        <div class="panel-list panel-list--assigned">
          <div v-if="assignedUsers.length === 0" class="panel-empty">
            ยังไม่ได้กำหนดผู้ดูแล
          </div>
          <div
            v-for="user in assignedUsers"
            :key="user.uid"
            class="user-row user-row--assigned"
          >
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-company">{{ getRoleLabel(user.role) }} · {{ user.company }}</span>
            </div>
            <button
              type="button"
              class="user-action user-action--remove"
              title="ลบผู้ดูแล"
              @click="removeModerator(user.uid)"
            >&times;</button>
          </div>
        </div>
      </div>
    </div>

    <p class="assignment-info">
      ผู้ดูแลจะได้สิทธิ์จัดการโฟลเดอร์นี้และโฟลเดอร์ย่อยทั้งหมด
    </p>
  </FormModal>
</template>

<style scoped>
.assignment-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md, 1rem);
  min-height: 300px;
}

.assignment-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  background: var(--color-bg-secondary, #f9fafb);
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  flex-shrink: 0;
}

.panel-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-secondary, #6b7280);
}

.panel-count {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #9ca3af);
}

.panel-search {
  padding: var(--spacing-sm, 0.5rem);
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  flex-shrink: 0;
}

.panel-search-input {
  width: 100%;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-sm, 0.25rem);
  font-size: 0.8125rem;
  outline: none;
  transition: border-color 0.12s ease;
}

.panel-search-input:focus {
  border-color: var(--color-primary, #3b82f6);
}

.panel-list {
  flex: 1;
  overflow-y: auto;
  max-height: 280px;
}

.panel-list--assigned {
  max-height: 340px;
}

.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 80px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #9ca3af);
  padding: var(--spacing-md, 1rem);
  text-align: center;
}

.user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease;
  border-bottom: 1px solid var(--color-border-light, #f3f4f6);
}

.user-row:hover {
  background: var(--color-bg-secondary, #f9fafb);
}

.user-row--assigned {
  cursor: default;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.user-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-primary, #1f2937);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-company {
  font-size: 0.72rem;
  color: var(--color-text-secondary, #9ca3af);
}

.user-action {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.user-action--add {
  color: var(--color-primary, #3b82f6);
  font-size: 0.8rem;
}

.user-action--remove {
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #9ca3af);
  font-size: 1.125rem;
  cursor: pointer;
  border-radius: var(--radius-sm, 0.25rem);
  transition: all 0.12s ease;
}

.user-action--remove:hover {
  background: #fee2e2;
  color: #dc2626;
}

.assignment-info {
  margin: var(--spacing-sm, 0.5rem) 0 0;
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  font-size: 0.8rem;
  color: var(--color-text-secondary, #6b7280);
  background: #eff6ff;
  border-radius: var(--radius-sm, 0.25rem);
  border-left: 3px solid var(--color-primary, #3b82f6);
}

@media (max-width: 640px) {
  .assignment-panels {
    grid-template-columns: 1fr;
  }
}
</style>
