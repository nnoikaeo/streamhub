<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminRegions } from '~/composables/useAdminRegions'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  invited: []
}>()

const { companies: adminCompanies, fetchCompanies } = useAdminCompanies()
const { regions, fetchRegions } = useAdminRegions()
const authStore = useAuthStore()

// --- Queue item type ---
interface QueueItem {
  id: number
  email: string
  role: 'user' | 'moderator' | 'admin'
  company: string
  companyName: string
  groups: string[]
  groupNames: string[]
  message: string
}

// Form state (single entry)
const form = ref({
  email: '',
  role: 'user' as 'user' | 'moderator' | 'admin',
  company: '',
  message: '',
  assignedGroups: [] as string[],
})

const queue = ref<QueueItem[]>([])
let nextId = 1

const submitting = ref(false)
const error = ref('')
const addError = ref('')

// Results after submit
const results = ref<{
  created: { id?: string; email: string; role: string; company: string; assignedGroups?: string[] }[]
  skipped: { email: string; reason: string }[]
} | null>(null)

// Dropdown data
const groups = ref<{ id: string; name: string }[]>([])

const canAdd = computed(() => {
  const e = form.value.email.trim()
  return e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && form.value.company
})

const canSubmit = computed(() => queue.value.length > 0)

function getCompanyName(code: string) {
  return adminCompanies.value.find(c => c.code === code)?.name ?? code
}

function getGroupNames(ids: string[]) {
  return ids.map(id => groups.value.find(g => g.id === id)?.name ?? id)
}

function addToQueue() {
  addError.value = ''
  const email = form.value.email.trim().toLowerCase()

  if (!email || !form.value.company) {
    addError.value = 'กรุณากรอก Email และเลือกบริษัท'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    addError.value = 'รูปแบบ Email ไม่ถูกต้อง'
    return
  }
  if (queue.value.some(q => q.email === email)) {
    addError.value = 'Email นี้อยู่ในรายการแล้ว'
    return
  }

  queue.value.push({
    id: nextId++,
    email,
    role: form.value.role,
    company: form.value.company,
    companyName: getCompanyName(form.value.company),
    groups: [...form.value.assignedGroups],
    groupNames: getGroupNames(form.value.assignedGroups),
    message: form.value.message,
  })

  // Reset all fields after adding
  form.value = { email: '', role: 'user', company: '', message: '', assignedGroups: [] }
}

function removeFromQueue(id: number) {
  queue.value = queue.value.filter(q => q.id !== id)
}

function roleLabel(role: string) {
  const map: Record<string, string> = { user: 'User', moderator: 'Moderator', admin: 'Admin' }
  return map[role] ?? role
}

function roleBadgeClass(role: string) {
  return {
    'role-badge role-badge--user': role === 'user',
    'role-badge role-badge--moderator': role === 'moderator',
    'role-badge role-badge--admin': role === 'admin',
  }
}

async function loadDropdownData() {
  try {
    const [, , groupsRes] = await Promise.all([
      fetchCompanies(),
      fetchRegions(),
      $fetch<{ data: { id: string; name: string }[] }>('/api/mock/groups'),
    ])
    groups.value = (groupsRes?.data ?? []).filter((g: any) => g.isActive !== false)
  } catch {
    // degrade gracefully
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  error.value = ''
  submitting.value = true

  try {
    const res = await $fetch<{
      success: boolean
      data?: { created: { id?: string; email: string; role: string; company: string; assignedGroups?: string[] }[]; skipped: { email: string; reason: string }[] }
      message?: string
    }>('/api/mock/invitations/bulk', {
      method: 'POST',
      body: {
        items: queue.value.map(q => ({
          email: q.email,
          role: q.role,
          company: q.company,
          message: q.message || undefined,
          assignedGroups: q.groups.length ? q.groups : undefined,
        })),
        // Fallback: also send flat arrays for backward compat
        emails: queue.value.map(q => q.email),
        role: queue.value[0]?.role ?? 'user',
        company: queue.value[0]?.company ?? '',
        message: queue.value[0]?.message || undefined,
        assignedGroups: queue.value[0]?.groups.length ? queue.value[0].groups : undefined,
        invitedBy: authStore.user?.uid ?? 'admin',
        invitedByName: authStore.user?.displayName ?? 'Admin',
      },
    })

    if (res.success && res.data) {
      results.value = res.data
      emit('invited')
    } else {
      error.value = res.message ?? 'เกิดข้อผิดพลาด'
    }
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message ?? 'เกิดข้อผิดพลาด'
  } finally {
    submitting.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}

function reset() {
  form.value = { email: '', role: 'user', company: '', message: '', assignedGroups: [] }
  queue.value = []
  nextId = 1
  submitting.value = false
  error.value = ''
  addError.value = ''
  results.value = null
}

watch(() => props.modelValue, (val) => { if (val) reset() })
onMounted(loadDropdownData)
</script>

<template>
  <FormModal
    :model-value="modelValue"
    title="เชิญผู้ใช้หลายคน"
    size="xl"
    :loading="submitting"
    :submit-text="results ? 'ปิด' : `ส่ง ${queue.length} คำเชิญ`"
    :submit-disabled="!canSubmit && !results"
    :hide-cancel="!!results"
    @update:model-value="emit('update:modelValue', $event)"
    @save="results ? close() : handleSubmit()"
    @cancel="close"
  >
    <!-- Results state -->
    <div v-if="results" class="bulk-results">
      <div v-if="results.created.length" class="result-section result-section--success">
        <p class="result-title">✅ ส่งสำเร็จ {{ results.created.length }} รายการ</p>
        <table class="result-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Role</th>
              <th>บริษัท</th>
              <th>กลุ่ม</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(inv, idx) in results.created" :key="inv.id || inv.email">
              <td class="queue-cell--num">{{ idx + 1 }}</td>
              <td>{{ inv.email }}</td>
              <td><span :class="roleBadgeClass(inv.role)">{{ roleLabel(inv.role) }}</span></td>
              <td>{{ inv.company }}</td>
              <td class="text-gray-500">{{ inv.assignedGroups?.length ? getGroupNames(inv.assignedGroups).join(', ') : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="results.skipped.length" class="result-section result-section--warning">
        <p class="result-title">⚠️ ข้ามไป {{ results.skipped.length }} รายการ</p>
        <table class="result-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>เหตุผล</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in results.skipped" :key="item.email">
              <td>{{ item.email }}</td>
              <td class="text-gray-500">{{ item.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Form -->
    <template v-else>
      <div v-if="error" class="alert-error">{{ error }}</div>

      <div class="form-fields">
        <!-- Row 1: Email + Role + Company -->
        <div class="form-row form-row--3col">
          <div class="form-field form-field--email">
            <label class="form-label">Email <span class="required">*</span></label>
            <input
              v-model="form.email"
              type="email"
              class="theme-form-input"
              placeholder="user@company.com"
              @keydown.enter.prevent="addToQueue"
            />
          </div>
          <div class="form-field">
            <label class="form-label">Role <span class="required">*</span></label>
            <select v-model="form.role" class="theme-form-select">
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label">บริษัท <span class="required">*</span></label>
            <CompanyDropdownFilter
              v-model="form.company"
              :companies="adminCompanies"
              :regions="regions"
              :show-icon="false"
              placeholder="-- เลือกบริษัท --"
            />
          </div>
        </div>

        <!-- Row 2: Groups + Message -->
        <div class="form-row form-row--2col form-row--stretch">
          <div class="form-field">
            <label class="form-label">กลุ่มผู้ใช้</label>
            <div class="multi-select-list">
              <label v-for="group in groups" :key="group.id" class="multi-select-item">
                <input type="checkbox" :value="group.id" v-model="form.assignedGroups" />
                {{ group.name }}
              </label>
              <p v-if="groups.length === 0" class="text-sm text-gray-400">ไม่มี group</p>
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">ข้อความเพิ่มเติม</label>
            <textarea
              v-model="form.message"
              class="theme-form-input message-textarea"
              maxlength="500"
              placeholder="ข้อความถึงผู้รับ (ไม่บังคับ)"
            />
          </div>
        </div>

        <!-- Row 3: Add button -->
        <div class="add-row">
          <div v-if="addError" class="add-error">{{ addError }}</div>
          <button
            type="button"
            class="theme-btn theme-btn--primary theme-btn--sm"
            :disabled="!canAdd"
            @click="addToQueue"
          >
            ➕ เพิ่มในรายการ
          </button>
        </div>

        <!-- Row 4: Queue table -->
        <div v-if="queue.length > 0" class="queue-section">
          <div class="queue-header">
            <span class="queue-title">รายการคำเชิญ</span>
            <span class="queue-count">{{ queue.length }} รายการ</span>
          </div>
          <div class="queue-table-wrapper">
            <table class="queue-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>บริษัท</th>
                  <th>กลุ่ม</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in queue" :key="item.id">
                  <td class="queue-cell--num">{{ idx + 1 }}</td>
                  <td class="queue-cell--email">{{ item.email }}</td>
                  <td><span :class="roleBadgeClass(item.role)">{{ roleLabel(item.role) }}</span></td>
                  <td>{{ item.company }}</td>
                  <td class="queue-cell--groups">
                    <span v-if="item.groupNames.length">{{ item.groupNames.join(', ') }}</span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="queue-cell--action">
                    <button
                      type="button"
                      class="queue-remove-btn"
                      title="ลบ"
                      @click="removeFromQueue(item.id)"
                    >✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty queue hint -->
        <div v-else class="queue-empty">
          <p>กรอกข้อมูลด้านบน แล้วกด "เพิ่มในรายการ" เพื่อเพิ่มผู้ใช้</p>
        </div>
      </div>
    </template>
  </FormModal>
</template>

<style scoped>
.form-fields { display: flex; flex-direction: column; gap: 1rem; }
.form-field { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; min-width: 0; }
.form-row { display: flex; gap: 1rem; }
.form-row--3col { display: flex; gap: 1rem; }
.form-row--3col .form-field--email { flex: 2; }
.form-row--2col { display: flex; gap: 1rem; }
.form-row--stretch { align-items: stretch; }
.form-row--stretch .form-field { display: flex; flex-direction: column; }
.form-row--stretch .multi-select-list { flex: 1; }
.form-row--stretch .message-textarea { flex: 1; resize: none; }
.form-label { font-size: 0.875rem; font-weight: 500; color: var(--color-text, #111827); }
.required { color: #ef4444; }
.form-hint { font-size: 0.75rem; color: #9ca3af; text-align: right; }

.multi-select-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-height: 8rem;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
}
.multi-select-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
}

/* Row 3: Add button row */
.add-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
}
.add-error {
  font-size: 0.8125rem;
  color: #dc2626;
}

/* Row 4: Queue table */
.queue-section {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  overflow: hidden;
}
.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface, #f9fafb);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
.queue-title { font-size: 0.875rem; font-weight: 600; color: var(--color-text, #111827); }
.queue-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  background: #e5e7eb;
  color: #6b7280;
}
.queue-table-wrapper {
  max-height: 12rem;
  overflow-y: auto;
}
.queue-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}
.queue-table th {
  text-align: left;
  padding: 0.375rem 0.5rem;
  background: var(--color-surface, #f9fafb);
  font-weight: 500;
  color: #6b7280;
  font-size: 0.75rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  position: sticky;
  top: 0;
}
.queue-table td {
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}
.queue-table tbody tr:hover { background: #f9fafb; }
.queue-cell--num { color: #9ca3af; width: 2rem; text-align: center; }
.queue-cell--email { font-weight: 500; }
.queue-cell--groups { font-size: 0.75rem; color: #6b7280; max-width: 10rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-cell--action { width: 2rem; text-align: center; }

.queue-remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  transition: all 150ms;
}
.queue-remove-btn:hover { background: #fee2e2; color: #dc2626; }

/* Role badges */
.role-badge {
  display: inline-block;
  padding: 0.0625rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}
.role-badge--user { background: #dbeafe; color: #1d4ed8; }
.role-badge--moderator { background: #f3e8ff; color: #7c3aed; }
.role-badge--admin { background: #fef9c3; color: #a16207; }

/* Empty state */
.queue-empty {
  padding: 1.5rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
  border: 1px dashed var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
}

.alert-error {
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #991b1b;
}

.bulk-results { display: flex; flex-direction: column; gap: 1rem; }
.result-section { padding: 0.75rem; border-radius: 0.375rem; }
.result-section--success { background: #f0fdf4; border: 1px solid #86efac; }
.result-section--warning { background: #fef9c3; border: 1px solid #fde047; }
.result-title { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; }
.result-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
.result-table th { text-align: left; padding: 0.25rem 0.5rem; font-weight: 500; color: #6b7280; border-bottom: 1px solid rgba(0,0,0,0.1); }
.result-table td { padding: 0.25rem 0.5rem; }
</style>
