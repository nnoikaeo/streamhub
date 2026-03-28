<script setup lang="ts">
/**
 * Admin Audit Logs Page
 *
 * Features:
 * - Summary cards: today, this week, this month, unique users
 * - Filters: action type, company, date range, search
 * - Paginated table with color-coded action badges
 * - CSV export
 *
 * Route: /admin/audit
 * Middleware: auth, admin
 *
 * Pattern: AdminPageContent + custom table (server-side pagination)
 */

import { ref, computed, onMounted, watch } from 'vue'
import PageLayout from '~/components/compositions/PageLayout.vue'
import CompanyDropdownFilter from '~/components/features/CompanyDropdownFilter.vue'
import { useAuth } from '~/composables/useAuth'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminRegions } from '~/composables/useAdminRegions'

const { breadcrumbs } = useAdminBreadcrumbs()
const { companies, fetchCompanies } = useAdminCompanies()
const { regions, fetchRegions } = useAdminRegions()

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

// ============================================================================
// TYPES
// ============================================================================

interface AuditEntry {
  id: string
  action: string
  level: string
  userId: string
  userName: string
  userEmail: string
  company: string
  dashboardId: string
  dashboardName: string
  userAgent?: string
  timestamp: string
}

interface Summary {
  today: number
  thisWeek: number
  thisMonth: number
  uniqueUsers: number
}

// ============================================================================
// STATE
// ============================================================================

const logs = ref<AuditEntry[]>([])
const summary = ref<Summary>({ today: 0, thisWeek: 0, thisMonth: 0, uniqueUsers: 0 })
const isLoading = ref(false)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)
const pageSizeOptions = [10, 25, 50]

// Filters
const filterAction = ref('')
const filterCompany = ref<string | null>(null)
const filterDateFrom = ref('')
const filterDateTo = ref('')
const filterSearch = ref('')

// ============================================================================
// ACTION CONFIG
// ============================================================================

const actionOptions = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'view', label: '👁️ ดู (view)' },
  { value: 'edit', label: '✏️ แก้ไข (edit)' },
  { value: 'create', label: '➕ สร้าง (create)' },
  { value: 'archive', label: '🗄️ เก็บถาวร (archive)' },
  { value: 'delete', label: '🗑️ ลบ (delete)' },
  { value: 'denied', label: '🚫 ปฏิเสธ (denied)' },
]

const actionBadgeClass = (action: string): string => {
  const map: Record<string, string> = {
    view: 'badge--gray',
    edit: 'badge--yellow',
    create: 'badge--green',
    archive: 'badge--orange',
    delete: 'badge--red',
    denied: 'badge--red-solid',
  }
  return map[action] || 'badge--gray'
}

const actionIcon = (action: string): string => {
  const map: Record<string, string> = {
    view: '👁️',
    edit: '✏️',
    create: '➕',
    archive: '🗄️',
    delete: '🗑️',
    denied: '🚫',
  }
  return map[action] || '📋'
}

// ============================================================================
// API HELPERS
// ============================================================================

async function fetchWithAuth(url: string, options: any = {}) {
  const { getIdToken } = useAuth()
  const token = await getIdToken()
  const headers: Record<string, string> = { ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`

  const authStore = useAuthStore()
  const query = { ...options.query }
  if (authStore.user?.uid) {
    query.uid = authStore.user.uid
  }

  return await $fetch(url, { ...options, headers, query })
}

// ============================================================================
// DATA FETCHING
// ============================================================================

const loadSummary = async () => {
  try {
    const data = await fetchWithAuth('/api/audit', {
      query: { summary: 'true' },
    }) as any
    summary.value = {
      today: data.today,
      thisWeek: data.thisWeek,
      thisMonth: data.thisMonth,
      uniqueUsers: data.uniqueUsers,
    }
  } catch (error) {
    console.error('Failed to load audit summary:', error)
  }
}

const loadLogs = async () => {
  try {
    isLoading.value = true
    const query: Record<string, any> = {
      page: currentPage.value,
      limit: pageSize.value,
    }
    if (filterAction.value) query.action = filterAction.value
    if (filterCompany.value) query.company = filterCompany.value
    if (filterDateFrom.value) query.dateFrom = filterDateFrom.value
    if (filterDateTo.value) query.dateTo = filterDateTo.value
    if (filterSearch.value) query.search = filterSearch.value

    const data = await fetchWithAuth('/api/audit', { query }) as any

    logs.value = data.items
    totalItems.value = data.total
    totalPages.value = data.totalPages
  } catch (error) {
    console.error('Failed to load audit logs:', error)
  } finally {
    isLoading.value = false
  }
}

// ============================================================================
// ACTIONS
// ============================================================================

const applyFilters = () => {
  currentPage.value = 1
  loadLogs()
}

const resetFilters = () => {
  filterAction.value = ''
  filterCompany.value = null
  filterDateFrom.value = ''
  filterDateTo.value = ''
  filterSearch.value = ''
  currentPage.value = 1
  loadLogs()
}

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadLogs()
}

const changePageSize = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadLogs()
}

const exportCSV = async () => {
  try {
    const query: Record<string, any> = {}
    if (filterAction.value) query.action = filterAction.value
    if (filterCompany.value) query.company = filterCompany.value
    if (filterDateFrom.value) query.dateFrom = filterDateFrom.value
    if (filterDateTo.value) query.dateTo = filterDateTo.value
    if (filterSearch.value) query.search = filterSearch.value

    const { getIdToken } = useAuth()
    const token = await getIdToken()
    const params = new URLSearchParams()
    for (const [key, val] of Object.entries(query)) {
      if (val) params.set(key, String(val))
    }

    const authStore = useAuthStore()
    if (authStore.user?.uid) {
      params.set('uid', authStore.user.uid)
    }

    const url = `/api/audit/export?${params.toString()}`

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (!response.ok) throw new Error('Export failed')

    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Failed to export CSV:', error)
  }
}

// ============================================================================
// FORMATTING
// ============================================================================

const formatTimestamp = (ts: string): string => {
  const d = new Date(ts)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month} ${hours}:${minutes}`
}

// ============================================================================
// WATCHERS
// ============================================================================

watch(filterSearch, () => {
  const timeout = setTimeout(() => {
    applyFilters()
  }, 400)
  return () => clearTimeout(timeout)
})

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(async () => {
  await Promise.all([loadSummary(), loadLogs(), fetchCompanies(), fetchRegions()])
})
</script>

<template>
  <PageLayout
    :allow-search="false"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <AdminPageContent>
      <!-- Header -->
      <template #header>
        <h1 class="page-header__title">📋 Audit Logs</h1>
        <button type="button" class="page-header-action-btn" @click="exportCSV">
          📥 Export CSV
        </button>
      </template>

      <!-- Summary Cards -->
      <template #summary>
        <div class="summary-cards">
          <div class="summary-card">
            <span class="summary-card__label">วันนี้</span>
            <span class="summary-card__value">{{ summary.today.toLocaleString() }}</span>
          </div>
          <div class="summary-card">
            <span class="summary-card__label">สัปดาห์นี้</span>
            <span class="summary-card__value">{{ summary.thisWeek.toLocaleString() }}</span>
          </div>
          <div class="summary-card">
            <span class="summary-card__label">เดือนนี้</span>
            <span class="summary-card__value">{{ summary.thisMonth.toLocaleString() }}</span>
          </div>
          <div class="summary-card summary-card--highlight">
            <span class="summary-card__label">Unique Users</span>
            <span class="summary-card__value">{{ summary.uniqueUsers }}</span>
          </div>
        </div>
      </template>

      <!-- Filters -->
      <template #filters>
        <div class="filter-group">
          <select v-model="filterAction" class="theme-form-select" @change="applyFilters">
            <option v-for="opt in actionOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <CompanyDropdownFilter
            v-model="filterCompany"
            :companies="companies"
            :regions="regions"
            :show-icon="false"
            placeholder="-- ทุกบริษัท --"
            @update:model-value="applyFilters"
          />
        </div>
        <div class="filter-group">
          <input v-model="filterDateFrom" type="date" class="theme-form-input" @change="applyFilters" />
        </div>
        <div class="filter-group">
          <input v-model="filterDateTo" type="date" class="theme-form-input" @change="applyFilters" />
        </div>
        <button type="button" class="theme-btn theme-btn--ghost theme-btn--sm" @click="resetFilters">
          🔄 ล้างตัวกรอง
        </button>
      </template>

      <!-- Table -->
      <template #table>
        <!-- Search Row -->
        <div class="audit-search">
          <input
            v-model="filterSearch"
            type="text"
            class="theme-form-input"
            placeholder="🔎 ค้นหาชื่อผู้ใช้, email, แดชบอร์ด..."
          />
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="table-loading">
          <div class="spinner" />
          <p>กำลังโหลด...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="logs.length === 0" class="table-empty">
          <p class="text-3xl">📭</p>
          <p>ไม่พบข้อมูล</p>
        </div>

        <!-- Audit Table -->
        <div v-else class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>เวลา</th>
                <th>ประเภท</th>
                <th>ผู้ใช้</th>
                <th>บริษัท</th>
                <th>แดชบอร์ด</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in logs" :key="entry.id" :class="{ 'row--critical': entry.level === 'CRITICAL' }">
                <td class="text-sm text-nowrap">{{ formatTimestamp(entry.timestamp) }}</td>
                <td>
                  <span class="action-badge" :class="actionBadgeClass(entry.action)">
                    {{ actionIcon(entry.action) }} {{ entry.action }}
                  </span>
                </td>
                <td>
                  <div class="flex flex-col">
                    <span class="font-semibold">{{ entry.userName }}</span>
                    <span class="text-sm text-gray-500">{{ entry.userEmail }}</span>
                  </div>
                </td>
                <td>{{ entry.company }}</td>
                <td>{{ entry.dashboardName }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalItems > 0" class="audit-pagination">
          <div class="audit-pagination__left">
            <span>จำนวนรายการต่อหน้า</span>
            <select
              :value="pageSize"
              class="page-size-select"
              @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
          </div>
          <div v-if="totalPages > 1" class="audit-pagination__center">
            <button class="pagination-button" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">
              ← ก่อนหน้า
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              class="pagination-page"
              :class="{ active: currentPage === page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <button class="pagination-button" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">
              ถัดไป →
            </button>
          </div>
          <div class="audit-pagination__right">
            แสดง {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, totalItems) }} จาก {{ totalItems }} รายการ
          </div>
        </div>
      </template>
    </AdminPageContent>
  </PageLayout>
</template>

<style scoped>
/* ==============================
   SUMMARY CARDS (inside #table slot, like stats-bar in invitations)
   ============================== */
.summary-cards {
  display: flex;
  gap: 0;
  background-color: var(--color-bg-primary, #fff);
  border-radius: var(--radius-lg, 0.75rem);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
  overflow: hidden;
}

.summary-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem;
  border-right: 1px solid var(--color-border-light, #e2e8f0);
}

.summary-card:last-child {
  border-right: none;
}

.summary-card--highlight {
  background: var(--color-success-bg, #f0fdf4);
}

.summary-card__label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary, #64748b);
}

.summary-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary, #1e293b);
}

/* ==============================
   SEARCH ROW
   ============================== */
.audit-search {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border-light, #e2e8f0);
}

/* ==============================
   TABLE
   ============================== */
.data-table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table thead {
  background-color: var(--color-bg-secondary, #f1f5f9);
  border-bottom: 2px solid var(--color-border-light, #e2e8f0);
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary, #64748b);
  user-select: none;
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border-light, #f1f5f9);
  color: var(--color-text-primary, #1e293b);
}

.data-table tbody tr:hover {
  background-color: var(--color-bg-hover, #f8fafc);
}

.row--critical {
  background: #fef2f2;
}

.row--critical:hover {
  background: #fee2e2 !important;
}

.text-nowrap {
  white-space: nowrap;
}

/* ==============================
   ACTION BADGES
   ============================== */
.action-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.badge--gray { background: #f1f5f9; color: #475569; }
.badge--yellow { background: #fefce8; color: #a16207; }
.badge--green { background: #f0fdf4; color: #15803d; }
.badge--orange { background: #fff7ed; color: #c2410c; }
.badge--red { background: #fef2f2; color: #dc2626; }
.badge--red-solid { background: #dc2626; color: #fff; }

/* ==============================
   LOADING & EMPTY
   ============================== */
.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--color-text-secondary, #64748b);
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--color-border-light, #e2e8f0);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem;
  color: var(--color-text-secondary, #64748b);
}

/* ==============================
   PAGINATION (matches DataTable pattern)
   ============================== */
.audit-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--color-bg-secondary, #f8fafc);
  color: var(--color-text-secondary, #64748b);
  font-size: 0.875rem;
}

.audit-pagination__left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.audit-pagination__center {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0 auto;
}

.audit-pagination__right {
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
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 0.375rem;
  background: var(--color-bg-primary, #fff);
  color: var(--color-text-primary, #1e293b);
  font-size: 0.8125rem;
  cursor: pointer;
}

.pagination-button:hover:not(:disabled) {
  background: var(--color-bg-hover, #f1f5f9);
}

.pagination-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-page {
  padding: 0.35rem 0.625rem;
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-radius: 0.375rem;
  background: var(--color-bg-primary, #fff);
  color: var(--color-text-primary, #1e293b);
  font-size: 0.8125rem;
  cursor: pointer;
}

.pagination-page.active {
  background: var(--color-primary, #2d3389);
  color: #fff;
  border-color: var(--color-primary, #2d3389);
}

.pagination-page:hover:not(.active) {
  background: var(--color-bg-hover, #f1f5f9);
}

/* ==============================
   RESPONSIVE
   ============================== */
@media (max-width: 768px) {
  .summary-cards {
    flex-wrap: wrap;
  }

  .summary-card {
    flex: 1 1 45%;
  }

  .audit-pagination {
    flex-direction: column;
    align-items: flex-start;
  }

  .audit-pagination__center {
    margin: 0;
  }
}
</style>
