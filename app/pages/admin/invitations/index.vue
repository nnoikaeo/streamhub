<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
import { ref, computed, onMounted, watch } from 'vue'
import type { Invitation, InvitationStatus } from '~/types/invitation'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminInvitations } from '~/composables/useAdminInvitations'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminRegions } from '~/composables/useAdminRegions'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const { breadcrumbs } = useAdminBreadcrumbs()
const { invitations, loading, fetchInvitations, cancelInvitation, resendInvitation, delete: deleteInvitation } = useAdminInvitations()
const { folders, buildFolderTree } = useAdminFolders()
const { companies, fetchCompanies } = useAdminCompanies()
const { regions, fetchRegions } = useAdminRegions()

// Modal state
const showInviteModal = ref(false)
const showBulkModal = ref(false)
const showCancelDialog = ref(false)
const showResendDialog = ref(false)
const invitationToCancel = ref<Invitation | null>(null)
const invitationToResend = ref<Invitation | null>(null)

// Filters
const searchQuery = ref('')
const filterCompany = ref('')
const filterStatus = ref<InvitationStatus | ''>('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const pageSizeOptions = [10, 25, 50]

const changePageSize = (size: number) => {
  itemsPerPage.value = size
  currentPage.value = 1
}

const statusTabs = [
  { label: 'ทั้งหมด', value: '' },
  { label: 'รอตอบรับ', value: 'pending' as InvitationStatus },
  { label: 'ยอมรับแล้ว', value: 'accepted' as InvitationStatus },
  { label: 'หมดอายุ', value: 'expired' as InvitationStatus },
  { label: 'ยกเลิก', value: 'cancelled' as InvitationStatus },
]

const filteredInvitations = computed(() => {
  return [...invitations.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(inv => {
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        if (!inv.email.toLowerCase().includes(q) && !inv.invitedByName.toLowerCase().includes(q)) return false
      }
      if (filterCompany.value && inv.company !== filterCompany.value) return false
      if (filterStatus.value && effectiveStatus(inv) !== filterStatus.value) return false
      return true
    })
})

const totalPages = computed(() => Math.ceil(filteredInvitations.value.length / itemsPerPage.value))

const paginatedInvitations = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredInvitations.value.slice(start, start + itemsPerPage.value)
})

// Reset to page 1 when filters change
watch([searchQuery, filterCompany, filterStatus], () => {
  currentPage.value = 1
})

const stats = computed(() => ({
  total: invitations.value.length,
  pending: invitations.value.filter(i => effectiveStatus(i) === 'pending').length,
  accepted: invitations.value.filter(i => effectiveStatus(i) === 'accepted').length,
  expired: invitations.value.filter(i => effectiveStatus(i) === 'expired').length,
  cancelled: invitations.value.filter(i => effectiveStatus(i) === 'cancelled').length,
}))



function statusBadgeClass(status: InvitationStatus) {
  return {
    'status-badge status-badge--yellow': status === 'pending',
    'status-badge status-badge--green': status === 'accepted',
    'status-badge status-badge--red': status === 'expired',
    'status-badge status-badge--gray': status === 'cancelled',
  }
}

/** Get effective status — detect expired invitations client-side */
function effectiveStatus(inv: Invitation): InvitationStatus {
  if (inv.status === 'pending' && new Date(inv.expiresAt) <= new Date()) {
    return 'expired'
  }
  return inv.status
}

function statusLabel(status: InvitationStatus) {
  const map: Record<InvitationStatus, string> = {
    pending: 'รอตอบรับ',
    accepted: 'ยอมรับแล้ว',
    expired: 'หมดอายุ',
    cancelled: 'ยกเลิก',
  }
  return map[status]
}

function roleLabel(role: string) {
  const map: Record<string, string> = { user: 'User', moderator: 'Moderator', admin: 'Admin' }
  return map[role] ?? role
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function isExpiringSoon(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000 // < 3 days
}

async function copyInviteLink(inv: Invitation) {
  const url = `${window.location.origin}/invite/accept?code=${inv.invitationCode}`
  await navigator.clipboard.writeText(url)
}

const handleCancelInvitation = (inv: Invitation) => {
  invitationToCancel.value = inv
  showCancelDialog.value = true
}

const confirmCancel = async () => {
  if (!invitationToCancel.value) return
  const email = invitationToCancel.value.email
  try {
    await cancelInvitation(invitationToCancel.value.id)
    showCancelDialog.value = false
    invitationToCancel.value = null
    showToast(`ยกเลิกคำเชิญของ '${email}' เรียบร้อยแล้ว`)
  } catch {
    showToast('เกิดข้อผิดพลาดในการยกเลิกคำเชิญ', 'error')
  }
}

const handleResendInvitation = (inv: Invitation) => {
  invitationToResend.value = inv
  showResendDialog.value = true
}

const confirmResend = async () => {
  if (!invitationToResend.value) return
  const email = invitationToResend.value.email
  try {
    await resendInvitation(invitationToResend.value.id)
    showResendDialog.value = false
    invitationToResend.value = null
    showToast(`ส่งคำเชิญใหม่ไปยัง '${email}' เรียบร้อยแล้ว`)
  } catch {
    showToast('เกิดข้อผิดพลาดในการส่งคำเชิญใหม่', 'error')
  }
}

const { showToast } = useAppToast()

const clearFilters = () => {
  searchQuery.value = ''
  filterCompany.value = ''
  filterStatus.value = ''
}

onMounted(() => Promise.all([fetchInvitations(), fetchCompanies(), fetchRegions()]))

const folderTree = computed(() => buildFolderTree(folders.value))
</script>

<template>
  <PageLayout :folders="folderTree" :allow-search="true" :allow-create="false" :breadcrumbs="breadcrumbs">
    <AdminPageContent>
      <template #header>
        <h1 class="page-header__title">คำเชิญผู้ใช้</h1>
        <div class="flex gap-2">
          <button @click="showBulkModal = true" class="theme-btn theme-btn--ghost">
            📨 เชิญหลายคน
          </button>
          <button @click="showInviteModal = true" class="page-header-action-btn">
            ➕ เชิญผู้ใช้
          </button>
        </div>
      </template>

      <template #filters>
        <!-- Search -->
        <div class="filter-group">
          <input
            v-model="searchQuery"
            type="text"
            class="theme-form-input"
            placeholder="ค้นหาตาม email หรือผู้เชิญ..."
          />
        </div>

        <!-- Company filter -->
        <div class="filter-group">
          <CompanyDropdownFilter
            v-model="filterCompany"
            :companies="companies"
            :regions="regions"
            :show-icon="false"
            placeholder="-- ทุกบริษัท --"
          />
        </div>

        <button @click="clearFilters" class="theme-btn theme-btn--ghost theme-btn--sm">
          🔄 ล้างตัวกรอง
        </button>
      </template>

      <template #table>

        <!-- Stats bar (clickable filters) -->
        <div class="stats-bar">
          <button
            class="stats-bar__item stats-bar__item--default"
            :class="{ 'stats-bar__item--active': filterStatus === '' }"
            @click="filterStatus = ''"
          >
            ทั้งหมด <span class="stats-count stats-count--default">{{ stats.total }}</span>
          </button>
          <button
            class="stats-bar__item stats-bar__item--pending"
            :class="{ 'stats-bar__item--active': filterStatus === 'pending' }"
            @click="filterStatus = filterStatus === 'pending' ? '' : 'pending'"
          >
            รอตอบรับ <span class="stats-count stats-count--pending">{{ stats.pending }}</span>
          </button>
          <button
            class="stats-bar__item stats-bar__item--accepted"
            :class="{ 'stats-bar__item--active': filterStatus === 'accepted' }"
            @click="filterStatus = filterStatus === 'accepted' ? '' : 'accepted'"
          >
            ยอมรับแล้ว <span class="stats-count stats-count--accepted">{{ stats.accepted }}</span>
          </button>
          <button
            class="stats-bar__item stats-bar__item--expired"
            :class="{ 'stats-bar__item--active': filterStatus === 'expired' }"
            @click="filterStatus = filterStatus === 'expired' ? '' : 'expired'"
          >
            หมดอายุ <span class="stats-count stats-count--expired">{{ stats.expired }}</span>
          </button>
          <button
            class="stats-bar__item stats-bar__item--cancelled"
            :class="{ 'stats-bar__item--active': filterStatus === 'cancelled' }"
            @click="filterStatus = filterStatus === 'cancelled' ? '' : 'cancelled'"
          >
            ยกเลิก <span class="stats-count stats-count--cancelled">{{ stats.cancelled }}</span>
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="table-loading">กำลังโหลด...</div>

        <!-- Empty state -->
        <div v-else-if="filteredInvitations.length === 0" class="table-empty">
          <p>ไม่พบคำเชิญ</p>
          <p class="text-sm text-gray-500">คลิก "เชิญผู้ใช้" เพื่อเริ่มต้นเชิญผู้ใช้</p>
        </div>

        <!-- Table -->
        <div v-else class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>อีเมล</th>
                <th>บทบาท</th>
                <th>บริษัท</th>
                <th>สถานะ</th>
                <th>ผู้เชิญ</th>
                <th>วันที่ส่ง</th>
                <th>หมดอายุ</th>
                <th>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in paginatedInvitations" :key="inv.id">
                <td>
                  <div class="flex flex-col">
                    <span class="font-semibold">{{ inv.email.split('@')[0] }}</span>
                    <span class="text-sm text-gray-500">{{ inv.email }}</span>
                  </div>
                </td>
                <td>
                  <span class="role-badge" :class="`role-badge--${inv.role}`">
                    {{ roleLabel(inv.role) }}
                  </span>
                </td>
                <td>{{ inv.company }}</td>
                <td>
                  <span :class="statusBadgeClass(effectiveStatus(inv))">
                    {{ statusLabel(effectiveStatus(inv)) }}
                  </span>
                </td>
                <td class="text-sm text-gray-600">{{ inv.invitedByName }}</td>
                <td class="text-sm">{{ formatDate(inv.createdAt) }}</td>
                <td class="text-sm" :class="{ 'text-orange-500 font-medium': isExpiringSoon(inv.expiresAt) }">
                  {{ formatDate(inv.expiresAt) }}
                </td>
                <td>
                  <div class="action-buttons">
                    <!-- Pending actions -->
                    <template v-if="effectiveStatus(inv) === 'pending'">
                      <button @click="copyInviteLink(inv)" class="action-btn action-btn--ghost" title="คัดลอกลิงก์">
                        🔗 คัดลอก
                      </button>
                      <button @click="handleResendInvitation(inv)" class="action-btn action-btn--primary" title="ส่งอีกครั้ง">
                        📨 ส่งอีกครั้ง
                      </button>
                      <button @click="handleCancelInvitation(inv)" class="action-btn action-btn--danger" title="ยกเลิก">
                        ✕ ยกเลิก
                      </button>
                    </template>
                    <!-- Expired / Cancelled actions -->
                    <template v-else-if="effectiveStatus(inv) === 'expired' || effectiveStatus(inv) === 'cancelled'">
                      <button @click="handleResendInvitation(inv)" class="action-btn action-btn--primary" title="ส่งอีกครั้ง">
                        📨 ส่งอีกครั้ง
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="filteredInvitations.length > 0" class="pagination-bar">
          <div class="pagination-bar__left">
            <span>จำนวนรายการต่อหน้า</span>
            <select
              :value="itemsPerPage"
              class="page-size-select"
              @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
          </div>
          <div class="pagination-bar__center">
            <button
              class="pagination-button"
              :disabled="currentPage <= 1"
              @click="currentPage = Math.max(1, currentPage - 1)"
            >
              ← ก่อนหน้า
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              class="pagination-page"
              :class="{ active: currentPage === page }"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
            <button
              class="pagination-button"
              :disabled="currentPage >= totalPages"
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
            >
              ถัดไป →
            </button>
          </div>
          <div class="pagination-bar__right">
            แสดง {{ (currentPage - 1) * itemsPerPage + 1 }}–{{ Math.min(currentPage * itemsPerPage, filteredInvitations.length) }} จาก {{ filteredInvitations.length }} รายการ
          </div>
        </div>
      </template>

      <!-- Modals -->
      <InviteUserModal
        v-if="showInviteModal"
        v-model="showInviteModal"
        @invited="fetchInvitations"
      />

      <BulkInviteModal
        v-if="showBulkModal"
        v-model="showBulkModal"
        @invited="fetchInvitations"
      />

      <!-- Cancel Confirmation -->
      <ConfirmDialog
        :is-open="showCancelDialog"
        title="ยืนยันการยกเลิกคำเชิญ"
        :message="`ต้องการยกเลิกคำเชิญของ '${invitationToCancel?.email}' ใช่หรือไม่?`"
        confirm-text="ยกเลิกคำเชิญ"
        cancel-text="ไม่ยกเลิก"
        :is-danger="true"
        :loading="loading"
        @confirm="confirmCancel"
        @cancel="showCancelDialog = false; invitationToCancel = null"
      />

      <!-- Resend Confirmation -->
      <ConfirmDialog
        :is-open="showResendDialog"
        title="ส่งคำเชิญใหม่อีกครั้ง"
        :message="`ต้องการส่งคำเชิญใหม่ไปยัง '${invitationToResend?.email}' ใช่หรือไม่? วันหมดอายุจะถูกรีเซ็ตเป็น 14 วัน`"
        confirm-text="ส่งคำเชิญใหม่"
        cancel-text="ยกเลิก"
        :loading="loading"
        @confirm="confirmResend"
        @cancel="showResendDialog = false; invitationToResend = null"
      />
    </AdminPageContent>
  </PageLayout>
</template>

<style scoped>
.stats-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--color-surface, #f9fafb);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.stats-bar__item {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  font-size: 0.875rem;
}

/* Status-matching colors (same as status badges) */
.stats-bar__item--default  { color: var(--color-text-primary, #212121); }
.stats-bar__item--pending  { color: #a16207; }
.stats-bar__item--accepted { color: #166534; }
.stats-bar__item--expired  { color: #991b1b; }
.stats-bar__item--cancelled { color: #6b7280; }

.stats-bar__item:hover {
  opacity: 0.85;
}
.stats-bar__item--default:hover  { background: #f3f4f6; }
.stats-bar__item--pending:hover  { background: #fef9c3; }
.stats-bar__item--accepted:hover { background: #dcfce7; }
.stats-bar__item--expired:hover  { background: #fee2e2; }
.stats-bar__item--cancelled:hover { background: #f3f4f6; }

/* Active state — use badge background color */
.stats-bar__item--active.stats-bar__item--default  { background: #e0e5f3; border-color: #bdc5db; }
.stats-bar__item--active.stats-bar__item--pending  { background: #fef9c3; border-color: #f5d96e; }
.stats-bar__item--active.stats-bar__item--accepted { background: #dcfce7; border-color: #86efac; }
.stats-bar__item--active.stats-bar__item--expired  { background: #fee2e2; border-color: #fca5a5; }
.stats-bar__item--active.stats-bar__item--cancelled { background: #f3f4f6; border-color: #d1d5db; }

.stats-bar__item--active {
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

/* Pill badge for counts (matches Explorer folder-dashboard-count) */
.stats-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-left: 0.25rem;
}
.stats-count--default   { background: #e5e7eb; color: #6b7280; }
.stats-count--pending   { background: #fde68a; color: #92400e; }
.stats-count--accepted  { background: #bbf7d0; color: #14532d; }
.stats-count--expired   { background: #fecaca; color: #7f1d1d; }
.stats-count--cancelled { background: #e5e7eb; color: #6b7280; }

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: white;
  border-radius: 9999px;
  font-size: 0.75rem;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.25rem;
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.status-badge--yellow { background: #fef9c3; color: #a16207; }
.status-badge--green  { background: #dcfce7; color: #166534; }
.status-badge--red    { background: #fee2e2; color: #991b1b; }
.status-badge--gray   { background: #f3f4f6; color: #6b7280; }

.role-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}
.role-badge--admin     { background: #fae8ff; color: #86198f; }
.role-badge--moderator { background: #e0f2fe; color: #0369a1; }
.role-badge--user      { background: #f0fdf4; color: #166534; }

.data-table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.data-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
  border-bottom: 2px solid var(--color-border, #e5e7eb);
  white-space: nowrap;
}
.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  vertical-align: middle;
}
.data-table tr:hover td { background: var(--color-surface-hover, #f9fafb); }

.action-buttons { display: flex; gap: 0.375rem; align-items: center; flex-wrap: wrap; }
.action-btn {
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.action-btn:hover { opacity: 0.8; }
.action-btn--ghost   { background: transparent; border-color: var(--color-border, #e5e7eb); color: var(--color-text-primary, #374151); }
.action-btn--primary { background: #2d3389; color: white; }
.action-btn--danger  { background: #ef4444; color: white; }

.table-loading, .table-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-secondary, #6b7280);
}

/* Pagination bar (matches DataTable) */
.pagination-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: var(--color-bg-secondary, #f8fafc);
  color: var(--color-text-secondary, #64748b);
  font-size: 0.875rem;
}

.pagination-bar__left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.pagination-bar__center {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0 auto;
}

.pagination-bar__right {
  flex-shrink: 0;
  white-space: nowrap;
}

.page-size-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 0.375rem;
  background-color: var(--color-bg-primary, #fff);
  color: var(--color-text-primary, #1e293b);
  font-size: 0.85rem;
  cursor: pointer;
}

.page-size-select:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
}

.pagination-button {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 0.375rem;
  background-color: var(--color-bg-primary, #fff);
  color: var(--color-text-primary, #1e293b);
  cursor: pointer;
  font-weight: 500;
  transition: all 150ms ease-in-out;
}

.pagination-button:hover:not(:disabled) {
  background-color: var(--color-primary, #3b82f6);
  color: white;
  border-color: var(--color-primary, #3b82f6);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-page {
  min-width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 0.375rem;
  background-color: var(--color-bg-primary, #fff);
  color: var(--color-text-primary, #1e293b);
  cursor: pointer;
  font-weight: 500;
  transition: all 150ms ease-in-out;
}

.pagination-page:hover {
  border-color: var(--color-primary, #3b82f6);
  color: var(--color-primary, #3b82f6);
}

.pagination-page.active {
  background-color: var(--color-primary, #3b82f6);
  color: white;
  border-color: var(--color-primary, #3b82f6);
}
</style>
