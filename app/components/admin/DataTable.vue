<script setup lang="ts" generic="T extends Record<string, any>">
import type { Ref } from 'vue'

export interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface Action {
  label: string
  icon?: string
  onClick: (item: T) => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

interface Props {
  columns: Column[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  actions?: Action[]
  selectable?: boolean
  hoverable?: boolean
  striped?: boolean
}

interface Emits {
  select: [items: T[]]
  rowClick: [item: T]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyMessage: 'ไม่มีข้อมูล',
  selectable: false,
  hoverable: true,
  striped: true
})

const emit = defineEmits<Emits>()

// Sorting state
const sortKey = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Selection state
const selectedRows: Ref<Set<number>> = ref(new Set())

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Computed sorted data
const sortedData = computed(() => {
  if (!sortKey.value) return props.data

  const sorted = [...props.data].sort((a, b) => {
    const aVal = a[sortKey.value]
    const bVal = b[sortKey.value]

    if (aVal === bVal) return 0

    const comparison = aVal < bVal ? -1 : 1
    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return sorted
})

// Computed paginated data
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return sortedData.value.slice(start, end)
})

// Computed total pages
const totalPages = computed(() => {
  return Math.ceil(sortedData.value.length / itemsPerPage.value)
})

// Get selected items
const getSelectedItems = (): T[] => {
  const items: T[] = []
  selectedRows.value.forEach((index) => {
    if (props.data[index]) {
      items.push(props.data[index])
    }
  })
  return items
}

// Handle sort
const handleSort = (column: Column) => {
  if (!column.sortable) return

  if (sortKey.value === column.key) {
    // Toggle sort order
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new sort key
    sortKey.value = column.key
    sortOrder.value = 'asc'
  }

  // Reset to first page
  currentPage.value = 1
}

// Handle row selection
const handleRowSelect = (index: number) => {
  if (selectedRows.value.has(index)) {
    selectedRows.value.delete(index)
  } else {
    selectedRows.value.add(index)
  }

  emit('select', getSelectedItems())
}

// Handle select all
const handleSelectAll = () => {
  if (selectedRows.value.size === paginatedData.value.length) {
    selectedRows.value.clear()
  } else {
    const start = (currentPage.value - 1) * itemsPerPage.value
    paginatedData.value.forEach((_, index) => {
      selectedRows.value.add(start + index)
    })
  }

  emit('select', getSelectedItems())
}

// Get column alignment
const getColumnAlign = (column: Column): string => {
  return column.align || 'left'
}

// Get cell value
const getCellValue = (item: T, key: string): string => {
  const value = item[key]

  // Format date if ISO date string
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format boolean
  if (typeof value === 'boolean') {
    return value ? 'ใช่' : 'ไม่'
  }

  return String(value || '-')
}

// Check if row is selected
const isRowSelected = (index: number): boolean => {
  return selectedRows.value.has(index)
}

// Check if all rows are selected
const isAllSelected = computed(() => {
  return selectedRows.value.size === paginatedData.value.length && paginatedData.value.length > 0
})
</script>

<template>
  <div class="data-table">
    <!-- Loading state -->
    <div v-if="loading" class="table-loading">
      <div class="spinner"></div>
      <p>กำลังโหลด...</p>
    </div>

    <!-- Table -->
    <div v-else class="table-wrapper">
      <table class="table" :class="{ striped, hoverable }">
        <!-- Table header -->
        <thead>
          <tr>
            <!-- Select all checkbox -->
            <th v-if="selectable" class="table-th--select">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="handleSelectAll"
                class="table-checkbox"
              />
            </th>

            <!-- Column headers -->
            <th
              v-for="column in columns"
              :key="column.key"
              :style="{ width: column.width }"
              :class="[`table-th--${getColumnAlign(column)}`, { sortable: column.sortable }]"
              @click="handleSort(column)"
            >
              <div class="table-header-content">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable && sortKey === column.key" class="sort-icon">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </div>
            </th>

            <!-- Actions header -->
            <th v-if="actions" class="table-th--actions">
              <span>จัดการ</span>
            </th>
          </tr>
        </thead>

        <!-- Table body -->
        <tbody>
          <!-- Data rows -->
          <template v-if="paginatedData.length > 0">
            <tr
              v-for="(item, index) in paginatedData"
              :key="index"
              class="table-row"
              :class="{ selected: isRowSelected((currentPage - 1) * itemsPerPage + index) }"
            >
              <!-- Row select checkbox -->
              <td v-if="selectable" class="table-td--select">
                <input
                  type="checkbox"
                  :checked="isRowSelected((currentPage - 1) * itemsPerPage + index)"
                  @change="handleRowSelect((currentPage - 1) * itemsPerPage + index)"
                  class="table-checkbox"
                />
              </td>

              <!-- Data cells -->
              <td
                v-for="column in columns"
                :key="column.key"
                :style="{ width: column.width }"
                :class="`table-td--${getColumnAlign(column)}`"
              >
                {{ getCellValue(item, column.key) }}
              </td>

              <!-- Action buttons -->
              <td v-if="actions" class="table-td--actions">
                <div class="action-buttons">
                  <button
                    v-for="(action, actionIndex) in actions"
                    :key="actionIndex"
                    class="action-button"
                    :class="`action-button--${action.variant || 'primary'}`"
                    :title="action.label"
                    @click="action.onClick(item)"
                  >
                    <span v-if="action.icon" class="action-icon">{{ action.icon }}</span>
                    <span class="action-label">{{ action.label }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else class="table-row--empty">
            <td :colspan="(selectable ? 1 : 0) + columns.length + (actions ? 1 : 0)" class="empty-cell">
              <div class="empty-state">
                <p class="empty-icon">📭</p>
                <p class="empty-message">{{ emptyMessage }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && totalPages > 1" class="table-pagination">
      <div class="pagination-info">
        แสดง {{ (currentPage - 1) * itemsPerPage + 1 }} ถึง
        {{ Math.min(currentPage * itemsPerPage, sortedData.length) }} จาก {{ sortedData.length }}
        รายการ
      </div>

      <div class="pagination-controls">
        <button
          class="pagination-button"
          :disabled="currentPage === 1"
          @click="currentPage = Math.max(1, currentPage - 1)"
        >
          ← ก่อนหน้า
        </button>

        <div class="pagination-pages">
          <button
            v-for="page in totalPages"
            :key="page"
            class="pagination-page"
            :class="{ active: currentPage === page }"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </div>

        <button
          class="pagination-button"
          :disabled="currentPage === totalPages"
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
        >
          ถัดไป →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  width: 100%;
}

/* Loading state */
.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Table wrapper */
.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
}

/* Table styles */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

/* Table header */
.table thead {
  background-color: var(--color-bg-secondary);
  border-bottom: 2px solid var(--color-border-light);
}

.table-th {
  padding: var(--spacing-md);
  text-align: left;
  font-weight: 600;
  color: var(--color-text-primary);
  user-select: none;
}

.table-th--left {
  text-align: left;
}

.table-th--center {
  text-align: center;
}

.table-th--right {
  text-align: right;
}

.table-th--select {
  width: 50px;
  padding: var(--spacing-md);
  text-align: center;
}

.table-th--actions {
  width: 180px;
  padding: var(--spacing-md);
  text-align: center;
}

.table-th.sortable {
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.table-th.sortable:hover {
  background-color: var(--color-border-light);
}

.table-header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.sort-icon {
  font-size: 0.8rem;
  color: var(--color-primary);
}

/* Table body */
.table tbody tr {
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color var(--transition-fast);
}

.table.hoverable tbody tr:hover {
  background-color: var(--color-bg-secondary);
}

.table.striped tbody tr:nth-child(odd) {
  background-color: var(--color-bg-secondary);
}

.table-row.selected {
  background-color: rgba(59, 130, 246, 0.1);
}

/* Table cells */
.table-td {
  padding: var(--spacing-md);
  color: var(--color-text-primary);
}

.table-td--left {
  text-align: left;
}

.table-td--center {
  text-align: center;
}

.table-td--right {
  text-align: right;
}

.table-td--select {
  width: 50px;
  text-align: center;
}

.table-td--actions {
  width: 180px;
  text-align: center;
}

.table-checkbox {
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

/* Empty state */
.table-row--empty .empty-cell {
  padding: var(--spacing-3xl) var(--spacing-md) !important;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 2.5rem;
  margin: 0;
}

.empty-message {
  margin: 0;
  font-size: 1rem;
}

/* Action buttons */
.action-buttons {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: center;
  flex-wrap: wrap;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.action-button--primary {
  background-color: var(--color-primary);
  color: white;
}

.action-button--primary:hover {
  background-color: var(--color-primary-dark);
  box-shadow: var(--shadow-sm);
}

.action-button--secondary {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.action-button--secondary:hover {
  background-color: var(--color-primary);
  color: white;
}

.action-button--danger {
  background-color: var(--color-error);
  color: white;
}

.action-button--danger:hover {
  background-color: #dc2626;
  box-shadow: var(--shadow-sm);
}

.action-button--ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
  border-color: var(--color-border-light);
}

.action-button--ghost:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.action-icon {
  font-size: 0.9rem;
}

.action-label {
  display: none;
}

@media (min-width: 768px) {
  .action-label {
    display: inline;
  }
}

/* Pagination */
.table-pagination {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

@media (min-width: 768px) {
  .table-pagination {
    flex-direction: row;
    justify-content: space-between;
  }
}

.pagination-info {
  flex-shrink: 0;
}

.pagination-controls {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.pagination-button {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.pagination-button:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: var(--spacing-xs);
}

.pagination-page {
  min-width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.pagination-page:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pagination-page.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* Responsive design */
@media (max-width: 640px) {
  .table {
    font-size: 0.85rem;
  }

  .table-th,
  .table-td {
    padding: var(--spacing-sm);
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .pagination-pages {
    display: none;
  }
}
</style>
