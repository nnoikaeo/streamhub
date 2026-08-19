<script setup lang="ts">
/**
 * Profile Page (read-only)
 *
 * Shows the signed-in user what the system knows about them: identity, role,
 * company, groups, and — for moderators — the folders they were assigned.
 * Nothing here is editable: every field on this page is set by an admin at
 * `/admin/users`, so an edit control would only lead to a permission error.
 */

import { computed, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useDashboardService } from '~/composables/useDashboardService'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { useModeratorFolders } from '~/composables/useModeratorFolders'
import PageLayout from '~/components/compositions/PageLayout.vue'
import type { User } from '~/types/dashboard'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const { user } = useAuth()
const service = useDashboardService()
const { companies, fetchCompanies } = useAdminCompanies()
const { groups, fetchGroups } = useAdminGroups()
const { assignedFolders, fetchFolders } = useModeratorFolders()

const profile = ref<User | null>(null)
const isLoading = ref(true)

/**
 * Role comes from the Firestore record, not the auth store: the store is only
 * refreshed when auth re-initialises, so an admin who changes someone's role
 * mid-session leaves it stale — the badge (which reads the record) would say
 * moderator while this card stayed hidden. Falls back to the store until the
 * record arrives.
 */
const isModerator = computed(() => (profile.value?.role ?? user.value?.role) === 'moderator')

const displayName = computed(
  () => profile.value?.name || user.value?.displayName || user.value?.email?.split('@')[0] || 'ผู้ใช้'
)

const initial = computed(() => displayName.value.charAt(0).toUpperCase())

const roleLabel = computed(() => {
  const role = profile.value?.role || user.value?.role
  if (role === 'admin') return 'ผู้ดูแลระบบ'
  if (role === 'moderator') return 'ผู้ดูแลโฟลเดอร์'
  return 'ผู้ใช้ทั่วไป'
})

/** Company docs are keyed by `code`, which is what the user record stores. */
const companyLabel = computed(() => {
  const code = profile.value?.company || user.value?.company
  if (!code) return '—'
  const match = companies.value.find(c => c.code === code)
  return match ? `${match.name} (${code})` : code
})

/** `groups` on the user doc holds ids; the display name lives on the group doc. */
const groupLabels = computed(() => {
  const ids = profile.value?.groups ?? []
  return ids.map(id => groups.value.find(g => g.id === id)?.name || id)
})

const joinedAt = computed(() => {
  const raw = profile.value?.createdAt
  if (!raw) return '—'
  const date = toDate(raw)
  if (!date) return '—'
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
})

onMounted(async () => {
  try {
    // The record has to land first — whether the folder list is worth fetching
    // depends on the role it carries.
    profile.value = await service.getCurrentUser()

    // Company and group names are lookups, so both lists are needed before the
    // labels resolve; the folder list is only meaningful for a moderator.
    await Promise.all([
      fetchCompanies(),
      fetchGroups(),
      ...(isModerator.value ? [fetchFolders()] : []),
    ])
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <PageLayout :breadcrumbs="[{ label: 'โปรไฟล์' }]" :allow-search="false">
    <div class="profile-page">
      <div v-if="isLoading" class="profile-loading">
        <div class="spinner" />
        <p>กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>

      <template v-else>
        <!-- Identity -->
        <section class="profile-identity">
          <div class="profile-avatar">{{ initial }}</div>
          <div class="profile-identity__text">
            <h1 class="profile-name">{{ displayName }}</h1>
            <p class="profile-email">{{ profile?.email || user?.email }}</p>
            <span class="profile-role-badge" :class="`profile-role-badge--${profile?.role || user?.role}`">
              {{ roleLabel }}
            </span>
          </div>
        </section>

        <!-- Account facts -->
        <section class="theme-card profile-card">
          <div class="theme-card__header">
            <h2 class="theme-card__title">ข้อมูลบัญชี</h2>
          </div>
          <dl class="profile-facts">
            <div class="profile-fact">
              <dt>บริษัท</dt>
              <dd>{{ companyLabel }}</dd>
            </div>
            <div class="profile-fact">
              <dt>สถานะ</dt>
              <dd>
                <span class="profile-status" :class="profile?.isActive === false ? 'profile-status--off' : 'profile-status--on'">
                  {{ profile?.isActive === false ? 'ถูกระงับ' : 'ใช้งานอยู่' }}
                </span>
              </dd>
            </div>
            <div class="profile-fact">
              <dt>เข้าร่วมเมื่อ</dt>
              <dd>{{ joinedAt }}</dd>
            </div>
          </dl>
        </section>

        <!-- Groups -->
        <section class="theme-card profile-card">
          <div class="theme-card__header">
            <h2 class="theme-card__title">กลุ่มผู้ใช้</h2>
          </div>
          <div class="profile-chips">
            <span v-for="label in groupLabels" :key="label" class="profile-chip">{{ label }}</span>
            <p v-if="groupLabels.length === 0" class="profile-empty">ยังไม่ได้อยู่กลุ่มใด</p>
          </div>
        </section>

        <!-- Managed folders (moderator only) -->
        <section v-if="isModerator" class="theme-card profile-card">
          <div class="theme-card__header">
            <h2 class="theme-card__title">โฟลเดอร์ที่ดูแล</h2>
          </div>
          <div class="profile-chips">
            <span v-for="folder in assignedFolders" :key="folder.id" class="profile-chip profile-chip--folder">
              📁 {{ folder.name }}
            </span>
            <p v-if="assignedFolders.length === 0" class="profile-empty">ยังไม่ได้รับมอบหมายโฟลเดอร์</p>
          </div>
        </section>

        <p class="profile-note">
          ข้อมูลทั้งหมดในหน้านี้แก้ไขได้โดยผู้ดูแลระบบเท่านั้น หากไม่ถูกต้องให้ติดต่อผู้ดูแลระบบ
        </p>
      </template>
    </div>
  </PageLayout>
</template>

<style scoped>
.profile-page {
  max-width: 44rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ========== IDENTITY ========== */
.profile-identity {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e3a8a, #4338ca);
  color: #fff;
  font-size: 1.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.profile-identity__text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.profile-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.profile-email {
  margin: 0;
  color: #6b7280;
  font-size: 0.9375rem;
}

.profile-role-badge {
  align-self: flex-start;
  margin-top: 0.25rem;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  background-color: #f3f4f6;
  color: #374151;
}

.profile-role-badge--admin {
  background-color: #ede9fe;
  color: #5b21b6;
}

.profile-role-badge--moderator {
  background-color: #dbeafe;
  color: #1e40af;
}

/* ========== FACTS ========== */
.profile-card {
  padding: 1.25rem;
}

.profile-facts {
  display: grid;
  grid-template-columns: 10rem 1fr;
  gap: 0.75rem 1rem;
  margin: 0;
}

.profile-fact {
  display: contents;
}

.profile-fact dt {
  color: #6b7280;
  font-size: 0.9375rem;
}

.profile-fact dd {
  margin: 0;
  color: #111827;
  font-size: 0.9375rem;
}

.profile-status {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.profile-status--on {
  background-color: #dcfce7;
  color: #166534;
}

.profile-status--off {
  background-color: #fee2e2;
  color: #991b1b;
}

/* ========== CHIPS ========== */
.profile-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.profile-chip {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background-color: #eef2ff;
  color: #3730a3;
  font-size: 0.875rem;
}

.profile-chip--folder {
  background-color: #fef3c7;
  color: #92400e;
}

.profile-empty {
  margin: 0;
  color: #9ca3af;
  font-size: 0.9375rem;
}

.profile-note {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

/* ========== LOADING ========== */
.profile-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 0;
  color: #6b7280;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #e5e7eb;
  border-top-color: #4338ca;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .profile-facts {
    grid-template-columns: 1fr;
    gap: 0.25rem 0;
  }

  .profile-fact {
    display: block;
    margin-bottom: 0.75rem;
  }
}
</style>
