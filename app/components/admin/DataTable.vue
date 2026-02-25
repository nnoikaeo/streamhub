<script setup lang="ts" generic="T extends Record<string, any>">
import type { Ref } from 'vue'

export interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  isNameColumn?: boolean
  isStatusColumn?: boolean
  isRoleColumn?: boolean
  isGroupsColumn?: boolean
}

export interface Action<T extends Record<string, any> = Record<string, any>> {
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
  actions?: Action<T>[]
  selectable?: boolean
  hoverable?: boolean
  striped?: boolean
}

interface Emits {
  select: [items: T[]]
  rowClick: [item: T]
  toggleActive: [item: T]
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

// Handle toggle active status
const handleToggleActive = (item: T) => {
  emit('toggleActive', item)
}

// Get badge class for group (color-coded by group name)
const getGroupBadgeClass = (groupName: string): string => {
  const groupColors: Record<string, string> = {
    'sales': 'badge--group-sales',
    'finance': 'badge--group-finance',
    'operations': 'badge--group-operations',
    'marketing': 'badge--group-marketing',
    'it': 'badge--group-it',
    'hr': 'badge--group-hr',
  }
  return groupColors[groupName.toLowerCase()] || 'badge--group'
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center gap-4 p-8" style="color: var(--color-text-secondary)">
      <div class="spinner"></div>
      <p>กำลังโหลด...</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-md" style="border: 1px solid var(--color-border-light)">
      <table class="w-full border-collapse text-sm" :class="{ striped, hoverable }">
        <!-- Table header -->
        <thead style="background-color: var(--color-bg-secondary); border-bottom: 2px solid var(--color-border-light)">
          <tr>
            <!-- Select all checkbox -->
            <th v-if="selectable" class="w-12 p-4 text-center" style="user-select: none">
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
              :class="[
                'p-4 font-semibold text-center',
                column.sortable ? 'cursor-pointer hover:bg-gray-200 transition-colors' : ''
              ]"
              style="color: var(--color-text-primary); user-select: none"
              @click="handleSort(column)"
            >
              <div class="flex items-center justify-center gap-2">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable && sortKey === column.key" style="color: var(--color-primary); font-size: 0.8rem">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </div>
            </th>

            <!-- Actions header -->
            <th v-if="actions" class="w-44 p-4 text-center" style="color: var(--color-text-primary)">
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
              :class="[
                isRowSelected((currentPage - 1) * itemsPerPage + index) ? 'selected-row' : '',
                hoverable ? 'hover:bg-gray-100 transition-colors' : '',
                striped && index % 2 === 0 ? 'bg-gray-50' : ''
              ]"
              style="border-bottom: 1px solid var(--color-border-light)"
            >
              <!-- Row select checkbox -->
              <td v-if="selectable" class="w-12 p-4 text-center">
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
                :style="{ width: column.width, color: 'var(--color-text-primary)' }"
                :class="[
                  'px-4 py-3',
                  getColumnAlign(column) === 'left' ? 'text-left' :
                  getColumnAlign(column) === 'right' ? 'text-right' : 'text-center'
                ]"
              >
                <!-- Name + Email combined display -->
                <div v-if="column.isNameColumn" class="flex flex-col">
                  <span class="font-semibold">{{ item.name }}</span>
                  <span class="text-sm" style="color: var(--color-text-secondary)">{{ item.email }}</span>
                </div>

                <!-- Status toggle switch -->
                <div v-else-if="column.isStatusColumn" class="flex justify-center items-center">
                  <label class="ios-toggle">
                    <input
                      type="checkbox"
                      :checked="item.isActive"
                      @change="handleToggleActive(item)"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <!-- Role badge -->
                <div v-else-if="column.isRoleColumn" class="flex justify-center">
                  <span class="badge" :class="`badge--${item.role}`">{{ item.role }}</span>
                </div>

                <!-- Groups badges (comma-separated to individual badges) -->
                <div v-else-if="column.isGroupsColumn" class="flex gap-2 flex-wrap justify-center">
                  <span
                    v-for="group in (typeof item.groups === 'string' ? item.groups.split(',').map(g => g.trim()) : item.groups)"
                    :key="group"
                    class="badge"
                    :class="getGroupBadgeClass(group)"
                  >
                    {{ group }}
                  </span>
                </div>

                <!-- Regular cell display -->
                <span v-else>{{ getCellValue(item, column.key) }}</span>
              </td>

              <!-- Action buttons -->
              <td v-if="actions" class="px-4 py-3 text-center" style="width: 120px; flex-shrink: 0;">
                <div class="flex gap-2 justify-center flex-wrap">
                  <button
                    v-for="(action, actionIndex) in actions"
                    :key="actionIndex"
                    class="action-button"
                    :class="`action-button--${action.variant || 'primary'}`"
                    :title="action.label"
                    @click="action.onClick(item)"
                  >
                    <span v-if="action.icon" class="text-lg">{{ action.icon }}</span>
                    <span class="action-label">{{ action.label }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else>
            <td :colspan="(selectable ? 1 : 0) + columns.length + (actions ? 1 : 0)" class="p-12 text-center">
              <div class="flex flex-col items-center gap-4" style="color: var(--color-text-secondary)">
                <p class="text-3xl m-0">📭</p>
                <p class="m-0 text-base">{{ emptyMessage }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && totalPages > 1" class="flex flex-col md:flex-row gap-4 items-center p-4 rounded-md" style="background-color: var(--color-bg-secondary); color: var(--color-text-secondary); font-size: 0.9rem">
      <div class="flex-shrink-0">
        แสดง {{ (currentPage - 1) * itemsPerPage + 1 }} ถึง
        {{ Math.min(currentPage * itemsPerPage, sortedData.length) }} จาก {{ sortedData.length }}
        รายการ
      </div>

      <div class="flex gap-2 items-center ml-auto">
        <button
          class="pagination-button"
          :disabled="currentPage === 1"
          @click="currentPage = Math.max(1, currentPage - 1)"
        >
          ← ก่อนหน้า
        </button>

        <div class="flex gap-1">
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
/* Spinner animation */
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

/* Table styling for improved row spacing */
table {
  border-spacing: 0;
  width: 100%;
}

/* Enhanced row styling with better visual separation */
tbody tr {
  transition: background-color 150ms ease-in-out;
}

tbody tr:last-child td {
  border-bottom: none;
}

/* Table checkbox */
.table-checkbox {
  cursor: pointer;
  width: 18px;
  height: 18px;
}
.table-checkbox {
  accent-color: var(--color-primary);
}

/* Selected row highlight */
.selected-row {
  background-color: rgba(45, 51, 137, 0.1);
}

/* Action buttons - Icon only style */
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem;
  font-size: 1.25rem;
  font-weight: 500;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 150ms ease-in-out;
  white-space: nowrap;
  background-color: transparent;
  min-width: 36px;
  min-height: 36px;
}

.action-button--primary {
  color: var(--color-primary);
}

.action-button--primary:hover {
  background-color: var(--color-primary-lightest);
  transform: scale(1.1);
}

.action-button--secondary {
  color: var(--color-primary);
}

.action-button--secondary:hover {
  background-color: var(--color-primary-lightest);
  transform: scale(1.1);
}

.action-button--danger {
  color: var(--color-error);
}

.action-button--danger:hover {
  background-color: #fee2e2;
  transform: scale(1.1);
}

.action-button--ghost {
  color: var(--color-text-secondary);
}

.action-button--ghost:hover {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  transform: scale(1.1);
}

/* Hide action labels (show icon only) */
.action-label {
  display: none;
}

/* iOS Toggle Switch */
.ios-toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  cursor: pointer;
}

.ios-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.ios-toggle input:checked + .toggle-slider {
  background-color: #10b981;
}

.ios-toggle input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

/* Badge Styles */
.badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--admin {
  background-color: #fee2e2;
  color: #991b1b;
}

.badge--moderator {
  background-color: #fef3c7;
  color: #92400e;
}

.badge--user {
  background-color: #d1fae5;
  color: #065f46;
}

.badge--group {
  background-color: #e0e7ff;
  color: #3730a3;
}

/* Group-specific badge colors */
.badge--group-sales {
  background-color: #fecaca;
  color: #991b1b;
}

.badge--group-finance {
  background-color: #bfdbfe;
  color: #1e40af;
}

.badge--group-operations {
  background-color: #bbf7d0;
  color: #065f46;
}

.badge--group-marketing {
  background-color: #fed7aa;
  color: #92400e;
}

.badge--group-it {
  background-color: #e9d5ff;
  color: #6b21a8;
}

.badge--group-hr {
  background-color: #fce7f3;
  color: #be185d;
}

/* Pagination buttons */
.pagination-button {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-border-light);
  border-radius: 0.375rem;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-weight: 500;
  transition: all 150ms ease-in-out;
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

.pagination-page {
  min-width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--color-border-light);
  border-radius: 0.375rem;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  cursor: pointer;
  font-weight: 500;
  transition: all 150ms ease-in-out;
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
</style>
