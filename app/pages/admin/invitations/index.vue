<script setup lang="ts">
import PageLayout from '~/components/compositions/PageLayout.vue'
import { ref, computed, onMounted } from 'vue'
import type { Invitation, InvitationStatus } from '~/types/invitation'
import { useAdminBreadcrumbs } from '~/composables/useAdminBreadcrumbs'
import { useAdminInvitations } from '~/composables/useAdminInvitations'
import { useAdminFolders } from '~/composables/useAdminFolders'

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

const { breadcrumbs } = useAdminBreadcrumbs()
const { invitations, loading, fetchInvitations, cancelInvitation, resendInvitation, delete: deleteInvitation } = useAdminInvitations()
const { folders, buildFolderTree } = useAdminFolders()

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
      if (filterStatus.value && inv.status !== filterStatus.value) return false
      return true
    })
})

const stats = computed(() => ({
  total: invitations.value.length,
  pending: invitations.value.filter(i => i.status === 'pending').length,
  accepted: invitations.value.filter(i => i.status === 'accepted').length,
  expired: invitations.value.filter(i => i.status === 'expired').length,
  cancelled: invitations.value.filter(i => i.status === 'cancelled').length,
}))

const uniqueCompanies = computed(() => {
  const codes = [...new Set(invitations.value.map(inv => inv.company))]
  return codes.sort()
})

function statusBadgeClass(status: InvitationStatus) {
  return {
    'status-badge status-badge--yellow': status === 'pending',
    'status-badge status-badge--green': status === 'accepted',
    'status-badge status-badge--red': status === 'expired',
    'status-badge status-badge--gray': status === 'cancelled',
  }
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

// Toast notification
const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => { toast.value = null }, 3500)
}

const clearFilters = () => {
  searchQuery.value = ''
  filterCompany.value = ''
  filterStatus.value = ''
}

onMounted(() => fetchInvitations())

const folderTree = computed(() => buildFolderTree(folders.value))
</script>

<template>
  <!-- Toast notification -->
  <Transition name="toast">
    <div v-if="toast" class="toast-notification" :class="`toast-notification--${toast.type}`">
      {{ toast.type === 'success' ? '✅' : '❌' }} {{ toast.message }}
    </div>
  </Transition>

  <PageLayout :folders="folderTree" :allow-search="true" :allow-create="false" :breadcrumbs="breadcrumbs">
    <AdminPageContent>
      <template #header>
        <h1 class="page-header__title">User Invitations</h1>
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
          <select v-model="filterCompany" class="theme-form-select">
            <option value="">-- ทุกบริษัท --</option>
            <option v-for="code in uniqueCompanies" :key="code" :value="code">{{ code }}</option>
          </select>
        </div>

        <!-- Status tabs -->
        <div class="filter-group flex gap-1">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            class="theme-btn theme-btn--sm"
            :class="filterStatus === tab.value ? 'theme-btn--primary' : 'theme-btn--ghost'"
            @click="filterStatus = tab.value as any"
          >
            {{ tab.label }}
            <span v-if="tab.value === 'pending' && stats.pending > 0" class="ml-1 badge-count">
              {{ stats.pending }}
            </span>
          </button>
        </div>

        <button @click="clearFilters" class="theme-btn theme-btn--ghost">
          🔄 ล้างตัวกรอง
        </button>
      </template>

      <template #table>

        <!-- Stats bar -->
        <div class="stats-bar">
          <span>ทั้งหมด <strong>{{ stats.total }}</strong></span>
          <span class="text-yellow-600">รอตอบรับ <strong>{{ stats.pending }}</strong></span>
          <span class="text-green-600">ยอมรับแล้ว <strong>{{ stats.accepted }}</strong></span>
          <span class="text-red-600">หมดอายุ <strong>{{ stats.expired }}</strong></span>
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
              <tr v-for="inv in filteredInvitations" :key="inv.id">
                <td class="font-medium">{{ inv.email }}</td>
                <td>
                  <span class="role-badge" :class="`role-badge--${inv.role}`">
                    {{ roleLabel(inv.role) }}
                  </span>
                </td>
                <td>{{ inv.company }}</td>
                <td>
                  <span :class="statusBadgeClass(inv.status)">
                    {{ statusLabel(inv.status) }}
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
                    <template v-if="inv.status === 'pending'">
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
                    <template v-else-if="inv.status === 'expired' || inv.status === 'cancelled'">
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
  gap: 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface, #f9fafb);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

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
  padding: 0.625rem 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  white-space: nowrap;
}
.data-table td {
  padding: 0.625rem 0.75rem;
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

/* Toast notification */
.toast-notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  max-width: 22rem;
}
.toast-notification--success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.toast-notification--error   { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(0.5rem); }

.table-loading, .table-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-secondary, #6b7280);
}
</style>
