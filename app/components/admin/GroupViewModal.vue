<script setup lang="ts">
/**
 * GroupViewModal Component
 * Read-only modal showing group details and member list
 *
 * Features:
 * - Displays group info: ID, name, description, status, created date
 * - Lists all members with avatar initials, name, email, role badge
 * - Fetches users from useAdminUsers on mount
 * - Read-only (no form, no save action)
 */

import { computed, onMounted } from 'vue'
import type { AdminGroup } from '~/types/admin'
import type { User } from '~/types/dashboard'
import { useAdminUsers } from '~/composables/useAdminUsers'

interface Props {
  modelValue: boolean
  group: AdminGroup | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const close = () => {
  isOpen.value = false
}

// Fetch users to resolve member UIDs → names/emails
const { users, fetchUsers } = useAdminUsers()

onMounted(async () => {
  if (users.value.length === 0) {
    await fetchUsers()
  }
})

/** Map of uid → User for fast lookups */
const userMap = computed<Map<string, User>>(() => {
  const map = new Map<string, User>()
  for (const user of users.value) {
    map.set(user.uid, user)
  }
  return map
})

/** Resolved member objects (known UIDs only) */
const groupMembers = computed<User[]>(() => {
  if (!props.group?.members) return []
  return props.group.members
    .map(uid => userMap.value.get(uid))
    .filter((u): u is User => u !== undefined)
})

/** UIDs that couldn't be resolved to a user */
const unknownMemberCount = computed(() => {
  if (!props.group?.members) return 0
  return props.group.members.filter(uid => !userMap.value.has(uid)).length
})

/** Generate avatar initials from user name */
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

/** Role badge label → Thai */
const getRoleLabel = (role: User['role']): string => {
  const labels: Record<User['role'], string> = {
    admin: 'Admin',
    moderator: 'Moderator',
    user: 'User',
  }
  return labels[role] ?? role
}

/** Format ISO date string to readable Thai-locale date */
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <Modal
    v-model="isOpen"
    :title="`รายละเอียดกลุ่ม`"
    size="lg"
    @update:model-value="isOpen = $event"
  >
    <div v-if="group" class="group-view">

      <!-- Group Info Section -->
      <section class="group-view__section">
        <div class="group-view__header">
          <div class="group-view__title-block">
            <h3 class="group-view__name">{{ group.name }}</h3>
            <span class="group-view__id">{{ group.id }}</span>
          </div>
          <span
            class="group-view__status-badge"
            :class="group.isActive ? 'group-view__status-badge--active' : 'group-view__status-badge--inactive'"
          >
            {{ group.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
          </span>
        </div>

        <p v-if="group.description" class="group-view__description">
          {{ group.description }}
        </p>
        <p v-else class="group-view__description group-view__description--empty">
          ไม่มีคำอธิบาย
        </p>

        <div class="group-view__meta">
          <div class="group-view__meta-item">
            <span class="group-view__meta-label">วันที่สร้าง</span>
            <span class="group-view__meta-value">{{ formatDate(group.createdAt) }}</span>
          </div>
          <div class="group-view__meta-item">
            <span class="group-view__meta-label">อัปเดตล่าสุด</span>
            <span class="group-view__meta-value">{{ formatDate(group.updatedAt) }}</span>
          </div>
        </div>
      </section>

      <hr class="group-view__divider" />

      <!-- Members Section -->
      <section class="group-view__section">
        <div class="group-view__section-title">
          สมาชิกในกลุ่ม
          <span class="group-view__member-count">{{ group.members?.length ?? 0 }} คน</span>
        </div>

        <!-- Member List -->
        <div v-if="groupMembers.length > 0" class="group-view__member-list">
          <div
            v-for="user in groupMembers"
            :key="user.uid"
            class="group-view__member"
          >
            <div class="group-view__avatar" :class="`group-view__avatar--${user.role}`">
              {{ getInitials(user.name) }}
            </div>
            <div class="group-view__member-info">
              <span class="group-view__member-name">{{ user.name }}</span>
              <span class="group-view__member-email">{{ user.company }}</span>
            </div>
            <span
              class="group-view__role-badge"
              :class="`group-view__role-badge--${user.role}`"
            >
              {{ getRoleLabel(user.role) }}
            </span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="group-view__empty">
          ไม่มีสมาชิกในกลุ่มนี้
        </div>

        <!-- Unknown members notice -->
        <p v-if="unknownMemberCount > 0" class="group-view__unknown-notice">
          มีสมาชิก {{ unknownMemberCount }} คนที่ไม่พบข้อมูลในระบบ
        </p>
      </section>
    </div>

    <!-- Footer -->
    <template #footer>
      <button type="button" class="group-view__close-btn" @click="close">
        ปิด
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.group-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.25rem);
}

/* ── Section ── */
.group-view__section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 1rem);
}

.group-view__section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.group-view__member-count {
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-secondary, #6b7280);
  border-radius: 9999px;
}

/* ── Header ── */
.group-view__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md, 1rem);
}

.group-view__title-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.group-view__name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
}

.group-view__id {
  font-size: 0.8125rem;
  font-family: monospace;
  color: var(--color-text-secondary, #6b7280);
  background-color: var(--color-bg-secondary, #f3f4f6);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-sm, 0.25rem);
  width: fit-content;
}

/* ── Status Badge ── */
.group-view__status-badge {
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.group-view__status-badge--active {
  background-color: #d1fae5;
  color: #065f46;
}

.group-view__status-badge--inactive {
  background-color: #fee2e2;
  color: #991b1b;
}

/* ── Description ── */
.group-view__description {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--color-text-primary, #1f2937);
  line-height: 1.6;
}

.group-view__description--empty {
  color: var(--color-text-secondary, #6b7280);
  font-style: italic;
}

/* ── Meta ── */
.group-view__meta {
  display: flex;
  gap: var(--spacing-lg, 1.25rem);
  flex-wrap: wrap;
}

.group-view__meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.group-view__meta-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  font-weight: 500;
}

.group-view__meta-value {
  font-size: 0.875rem;
  color: var(--color-text-primary, #1f2937);
}

/* ── Divider ── */
.group-view__divider {
  border: none;
  border-top: 1px solid var(--color-border-light, #e5e7eb);
  margin: 0;
}

/* ── Member List ── */
.group-view__member-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.group-view__member-list::-webkit-scrollbar {
  width: 6px;
}

.group-view__member-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.group-view__member-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

/* ── Member Row ── */
.group-view__member {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 1rem);
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  border-radius: var(--radius-md, 0.375rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  transition: background-color 0.15s ease;
}

.group-view__member:hover {
  background-color: #e5e7eb;
}

/* ── Avatar ── */
.group-view__avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
}

.group-view__avatar--admin {
  background-color: #3b82f6;
}

.group-view__avatar--moderator {
  background-color: #8b5cf6;
}

.group-view__avatar--user {
  background-color: #6b7280;
}

/* ── Member Info ── */
.group-view__member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.group-view__member-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary, #1f2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-view__member-email {
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Role Badge ── */
.group-view__role-badge {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.group-view__role-badge--admin {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.group-view__role-badge--moderator {
  background-color: #ede9fe;
  color: #6d28d9;
}

.group-view__role-badge--user {
  background-color: #f3f4f6;
  color: #374151;
}

/* ── Empty State ── */
.group-view__empty {
  text-align: center;
  padding: var(--spacing-xl, 2rem);
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
  background-color: var(--color-bg-secondary, #f3f4f6);
  border-radius: var(--radius-md, 0.375rem);
}

/* ── Unknown Notice ── */
.group-view__unknown-notice {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #6b7280);
}

/* ── Close Button ── */
.group-view__close-btn {
  padding: var(--spacing-sm, 0.5rem) var(--spacing-xl, 1.5rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-primary, #1f2937);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.group-view__close-btn:hover {
  background-color: #e5e7eb;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .group-view__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .group-view__meta {
    flex-direction: column;
    gap: var(--spacing-sm, 0.5rem);
  }
}
</style>
