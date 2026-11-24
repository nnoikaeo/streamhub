<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminRegions } from '~/composables/useAdminRegions'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/useAuth'
import { readInviteCsv, decodeCsvBytes, inviteTemplateCsv, inviteListsCsv, INVITE_TEMPLATE_SHEET_URL } from '~/utils/inviteCsv'
import type { RejectedRow } from '~/utils/inviteCsv'
import { downloadCsv, csvDateStamp } from '~/utils/csv'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  invited: []
}>()

const { companies: adminCompanies, fetchCompanies } = useAdminCompanies()
const { regions, fetchRegions } = useAdminRegions()
const { groups: allGroups, fetchGroups } = useAdminGroups()
const authStore = useAuthStore()
const { getIdToken } = useAuth()

const { apiBase: getApiBase } = useServiceMode()
const apiBase = getApiBase('invitations')

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// --- Queue item type ---
interface QueueItem {
  id: number
  firstName: string
  lastName: string
  email: string
  role: 'user' | 'moderator' | 'admin'
  company: string
  companyName: string
  groups: string[]
  groupNames: string[]
  message: string
}

// Form state (single entry)
const emptyForm = () => ({
  firstName: '',
  lastName: '',
  /** What is in the Gmail box — the part before @gmail.com */
  email: '',
  role: 'user' as 'user' | 'moderator' | 'admin',
  company: '',
  message: '',
  assignedGroups: [] as string[],
})
const form = ref(emptyForm())

const queue = ref<QueueItem[]>([])
let nextId = 1

const submitting = ref(false)
const error = ref('')
const addError = ref('')

interface CreatedInvitation {
  id?: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  company: string
  assignedGroups?: string[]
}

// Results after submit
const results = ref<{
  created: CreatedInvitation[]
  skipped: { email: string; reason: string }[]
} | null>(null)

// Dropdown data (sourced from composable that handles Firestore/JSON mode automatically)
const groups = computed(() => (allGroups.value ?? []).filter(g => g.isActive !== false))

const canAdd = computed(() => !!toGmailAddress(form.value.email) && !!form.value.company)

const canSubmit = computed(() => queue.value.length > 0)

function getCompanyName(code: string) {
  return adminCompanies.value.find(c => c.code === code)?.name ?? code
}

function getGroupNames(ids: string[]) {
  return ids.map(id => groups.value.find(g => g.id === id)?.name ?? id)
}

function addToQueue() {
  addError.value = ''
  const email = toGmailAddress(form.value.email)

  if (!form.value.email.trim() || !form.value.company) {
    addError.value = 'กรุณากรอก Gmail และเลือกบริษัท'
    return
  }
  if (!email) {
    addError.value = 'รับเฉพาะบัญชี @gmail.com'
    return
  }
  if (queue.value.some(q => q.email === email)) {
    addError.value = 'Email นี้อยู่ในรายการแล้ว'
    return
  }

  queue.value.push({
    id: nextId++,
    firstName: form.value.firstName.trim(),
    lastName: form.value.lastName.trim(),
    email,
    role: form.value.role,
    company: form.value.company,
    companyName: getCompanyName(form.value.company),
    groups: groupsForRole(form.value.role, form.value.assignedGroups),
    groupNames: getGroupNames(groupsForRole(form.value.role, form.value.assignedGroups)),
    message: form.value.message,
  })

  // Reset all fields after adding
  form.value = emptyForm()
}

// --- CSV import ---------------------------------------------------------

const fileInput = ref<HTMLInputElement | null>(null)
const importSummary = ref<{ fileName: string, total: number, accepted: number } | null>(null)
const importRejected = ref<RejectedRow[]>([])
const importError = ref('')

function pickFile() {
  fileInput.value?.click()
}

/**
 * Read the chosen file into the queue. Nothing is sent from here: rows that
 * pass join the queue for the admin to look over, rows that fail are listed
 * with the reason, and the admin presses ส่ง as before.
 */
async function importFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // the same file can be picked again after it is fixed
  if (!file) return

  importError.value = ''
  importRejected.value = []
  importSummary.value = null

  const result = readInviteCsv(decodeCsvBytes(await file.arrayBuffer()), {
    companies: adminCompanies.value,
    groups: groups.value,
    queuedEmails: queue.value.map(q => q.email),
  })

  if (result.fileError) {
    importError.value = `${file.name}: ${result.fileError}`
    return
  }

  for (const row of result.accepted) {
    queue.value.push({
      id: nextId++,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      role: row.role,
      company: row.company,
      companyName: getCompanyName(row.company),
      groups: row.groups,
      groupNames: getGroupNames(row.groups),
      message: '',
    })
  }
  importRejected.value = result.rejected
  importSummary.value = {
    fileName: file.name,
    total: result.accepted.length + result.rejected.length,
    accepted: result.accepted.length,
  }
}

function downloadTemplate() {
  const company = [...adminCompanies.value].sort((a, b) => a.code.localeCompare(b.code))[0]?.code ?? 'STTH'
  const group = groups.value[0]?.name ?? ''
  downloadCsv('streamhub-invite-template.csv', inviteTemplateCsv({ company, group }))
}

function downloadLists() {
  downloadCsv(`streamhub-invite-lists-${csvDateStamp()}.csv`, inviteListsCsv(adminCompanies.value, groups.value))
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
    await Promise.all([
      fetchCompanies(),
      fetchRegions(),
      fetchGroups(),
    ])
  } catch {
    // degrade gracefully
  }
}

async function handleSubmit() {
  if (!canSubmit.value) return
  error.value = ''
  submitting.value = true

  try {
    const headers = await getAuthHeaders()
    const res = await $fetch<{
      success: boolean
      data?: { created: CreatedInvitation[]; skipped: { email: string; reason: string }[] }
      message?: string
    }>(`${apiBase}/bulk`, {
      method: 'POST',
      headers,
      body: {
        items: queue.value.map(q => ({
          email: q.email,
          firstName: q.firstName || undefined,
          lastName: q.lastName || undefined,
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
  form.value = emptyForm()
  importSummary.value = null
  importRejected.value = []
  importError.value = ''
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
              <th>ชื่อ</th>
              <th>นามสกุล</th>
              <th>บริษัท</th>
              <th>กลุ่ม</th>
              <th>Gmail</th>
              <th>บทบาท</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(inv, idx) in results.created" :key="inv.id || inv.email">
              <td class="queue-cell--num">{{ idx + 1 }}</td>
              <td>{{ inv.firstName || '—' }}</td>
              <td>{{ inv.lastName || '—' }}</td>
              <td>{{ inv.company }}</td>
              <td class="text-gray-500">{{ inv.assignedGroups?.length ? getGroupNames(inv.assignedGroups).join(', ') : '—' }}</td>
              <td>{{ inv.email }}</td>
              <td><span :class="roleBadgeClass(inv.role)">{{ roleLabel(inv.role) }}</span></td>
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
        <!-- Import: rows that pass join the queue below; nothing is sent from here -->
        <div class="import-bar">
          <span class="import-bar__title">นำเข้าจากไฟล์ CSV</span>
          <a
            v-if="INVITE_TEMPLATE_SHEET_URL"
            :href="INVITE_TEMPLATE_SHEET_URL"
            target="_blank"
            rel="noopener"
            class="theme-btn theme-btn--secondary theme-btn--sm"
          >↗ เปิด template (Google Sheets)</a>
          <button type="button" class="theme-btn theme-btn--secondary theme-btn--sm" @click="downloadTemplate">
            📄 ดาวน์โหลด template
          </button>
          <button type="button" class="theme-btn theme-btn--secondary theme-btn--sm" @click="downloadLists">
            📥 ดาวน์โหลดรายการรหัส
          </button>
          <button type="button" class="theme-btn theme-btn--primary theme-btn--sm" @click="pickFile">
            📤 นำเข้า CSV
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".csv,text/csv"
            class="import-bar__file"
            aria-label="เลือกไฟล์ CSV"
            @change="importFile"
          >
        </div>
        <p class="import-hint">
          คอลัมน์: ชื่อ, นามสกุล, บริษัท (รหัส), กลุ่ม 1–3, gmail, บทบาท (user / moderator / admin) — แถวที่ผ่านจะเข้ารายการด้านล่างให้ตรวจก่อนส่ง
        </p>

        <div v-if="importError" class="alert-error">{{ importError }}</div>
        <div v-if="importRejected.length" class="import-rejected" role="alert">
          <p class="import-rejected__title">
            แถวที่นำเข้าไม่ได้ ({{ importRejected.length }}) — แก้ในไฟล์แล้วนำเข้าใหม่ หรือกรอกเองด้านล่าง
          </p>
          <ul class="import-rejected__list">
            <li v-for="row in importRejected" :key="row.line">
              <span class="import-rejected__line">แถว {{ row.line }}</span>
              <span class="import-rejected__who">{{ row.who }}</span>
              <span class="import-rejected__why">{{ row.reasons.join(' · ') }}</span>
            </li>
          </ul>
        </div>

        <!-- Order agreed with One Data (2026-11): name, company, groups, gmail, role -->
        <div class="form-row form-row--3col">
          <div class="form-field">
            <label for="bulk-first-name" class="form-label">ชื่อ</label>
            <input
              id="bulk-first-name"
              v-model="form.firstName"
              type="text"
              class="theme-form-input"
              maxlength="100"
              autocomplete="off"
              @keydown.enter.prevent="addToQueue"
            >
          </div>
          <div class="form-field">
            <label for="bulk-last-name" class="form-label">นามสกุล</label>
            <input
              id="bulk-last-name"
              v-model="form.lastName"
              type="text"
              class="theme-form-input"
              maxlength="100"
              autocomplete="off"
              @keydown.enter.prevent="addToQueue"
            >
          </div>
          <div class="form-field">
            <label for="bulk-company" class="form-label">บริษัท <span class="required">*</span></label>
            <CompanyDropdownFilter
              v-model="form.company"
              :companies="adminCompanies"
              :regions="regions"
              :show-icon="false"
              input-id="bulk-company"
              placeholder="-- เลือกบริษัท --"
            />
          </div>
        </div>

        <div class="form-field">
          <p class="form-label">กลุ่มผู้ใช้</p>
          <p v-if="form.role === 'admin'" class="text-sm text-gray-400">ผู้ดูแลระบบเข้าถึงทุกแดชบอร์ดอยู่แล้ว จึงไม่ต้องอยู่กลุ่ม</p>
          <div v-else class="multi-select-list multi-select-list--grid">
            <label v-for="group in groups" :key="group.id" class="multi-select-item">
              <input v-model="form.assignedGroups" type="checkbox" :value="group.id" >
              {{ group.name }}
            </label>
            <p v-if="groups.length === 0" class="text-sm text-gray-400">ไม่มี group</p>
          </div>
        </div>

        <div class="form-row form-row--3col">
          <div class="form-field form-field--email">
            <label for="bulk-email" class="form-label">Gmail <span class="required">*</span></label>
            <GmailInput
              v-model="form.email"
              input-id="bulk-email"
              @keydown.enter.prevent="addToQueue"
            />
          </div>
          <div class="form-field">
            <label for="bulk-role" class="form-label">บทบาท <span class="required">*</span></label>
            <select id="bulk-role" v-model="form.role" class="theme-form-select">
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label for="bulk-message" class="form-label">ข้อความเพิ่มเติม</label>
          <textarea
            id="bulk-message"
            v-model="form.message"
            class="theme-form-input message-textarea"
            maxlength="500"
            placeholder="ข้อความถึงผู้รับ (ไม่บังคับ)"
          />
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
            <span v-if="importSummary" class="queue-import-note">
              นำเข้าจาก <b>{{ importSummary.fileName }}</b> · {{ importSummary.total }} แถว · ผ่าน {{ importSummary.accepted }}
            </span>
          </div>
          <div class="queue-table-wrapper">
            <table class="queue-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ชื่อ</th>
                  <th>นามสกุล</th>
                  <th>บริษัท</th>
                  <th>กลุ่ม</th>
                  <th>Gmail</th>
                  <th>บทบาท</th>
                  <th/>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in queue" :key="item.id">
                  <td class="queue-cell--num">{{ idx + 1 }}</td>
                  <td>{{ item.firstName || '—' }}</td>
                  <td>{{ item.lastName || '—' }}</td>
                  <td>{{ item.company }}</td>
                  <td class="queue-cell--groups">
                    <span v-if="item.groupNames.length">{{ item.groupNames.join(', ') }}</span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="queue-cell--email">{{ item.email }}</td>
                  <td><span :class="roleBadgeClass(item.role)">{{ roleLabel(item.role) }}</span></td>
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
.message-textarea { min-height: 3.5rem; resize: vertical; }

.import-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px dashed var(--color-border-dark, #bdbdbd);
  border-radius: 0.5rem;
  background: var(--color-bg-secondary, #fafafa);
}
.import-bar__title { margin-right: auto; font-size: 0.875rem; font-weight: 600; color: var(--color-text-primary, #212121); }
.import-bar__file { display: none; }
.import-hint { margin: -0.5rem 0 0; font-size: 0.75rem; color: var(--color-text-secondary, #616161); }

.import-rejected {
  padding: 0.75rem;
  background: #fff5f5;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
}
.import-rejected__title { margin: 0 0 0.5rem; font-size: 0.875rem; font-weight: 600; color: #991b1b; }
.import-rejected__list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.25rem; max-height: 10rem; overflow-y: auto; }
.import-rejected__list li { display: grid; grid-template-columns: 4rem minmax(6rem, 12rem) 1fr; gap: 0.5rem; font-size: 0.8125rem; }
.import-rejected__line { color: var(--color-text-secondary, #616161); }
.import-rejected__why { color: #b71c1c; }
.queue-import-note { font-size: 0.75rem; color: var(--color-text-secondary, #616161); }
.multi-select-list--grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr)); }
@media (max-width: 640px) {
  .form-row--3col { flex-direction: column; }
}
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
