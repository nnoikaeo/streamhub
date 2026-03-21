<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  invited: []
}>()

const authStore = useAuthStore()

// Form state
const emailsRaw = ref('')
const role = ref<'user' | 'moderator'>('user')
const company = ref('')
const message = ref('')
const assignedGroups = ref<string[]>([])

const submitting = ref(false)
const error = ref('')

// Results after submit
const results = ref<{
  created: string[]
  skipped: { email: string; reason: string }[]
} | null>(null)

// Dropdown data
const companies = ref<{ code: string; name: string }[]>([])
const groups = ref<{ id: string; name: string }[]>([])

// Parse emails from textarea
const parsedEmails = computed(() => {
  const raw = emailsRaw.value
  const items = raw.split(/[\n,]+/).map(e => e.trim().toLowerCase()).filter(Boolean)
  const seen = new Set<string>()
  const result: { email: string; valid: boolean; duplicate: boolean }[] = []
  for (const email of items) {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const duplicate = seen.has(email)
    result.push({ email, valid, duplicate })
    seen.add(email)
  }
  return result
})

const validEmails = computed(() => parsedEmails.value.filter(e => e.valid && !e.duplicate).map(e => e.email))
const hasIssues = computed(() => parsedEmails.value.some(e => !e.valid || e.duplicate))
const canSubmit = computed(() => validEmails.value.length > 0 && company.value)

async function loadDropdownData() {
  try {
    const [companiesRes, groupsRes] = await Promise.all([
      $fetch<{ data: { code: string; name: string }[] }>('/api/mock/companies'),
      $fetch<{ data: { id: string; name: string }[] }>('/api/mock/groups'),
    ])
    companies.value = companiesRes?.data ?? []
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
      data?: { created: string[]; skipped: { email: string; reason: string }[] }
      message?: string
    }>('/api/mock/invitations/bulk', {
      method: 'POST',
      body: {
        emails: validEmails.value,
        role: role.value,
        company: company.value,
        message: message.value || undefined,
        assignedGroups: assignedGroups.value.length ? assignedGroups.value : undefined,
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
  emailsRaw.value = ''
  role.value = 'user'
  company.value = ''
  message.value = ''
  assignedGroups.value = []
  submitting.value = false
  error.value = ''
  results.value = null
}

watch(() => props.modelValue, (val) => { if (val) reset() })
onMounted(loadDropdownData)
</script>

<template>
  <FormModal
    :model-value="modelValue"
    title="Bulk Invite Users"
    size="xl"
    :loading="submitting"
    :submit-text="results ? undefined : `ส่ง ${validEmails.length} Invitations`"
    @update:model-value="emit('update:modelValue', $event)"
    @save="results ? close() : handleSubmit()"
    @cancel="close"
  >
    <!-- Results state -->
    <div v-if="results" class="bulk-results">
      <div class="result-section result-section--success">
        <p class="result-title">✅ ส่งสำเร็จ {{ results.created.length }} รายการ</p>
        <ul class="result-list">
          <li v-for="email in results.created" :key="email">{{ email }}</li>
        </ul>
      </div>

      <div v-if="results.skipped.length" class="result-section result-section--warning mt-4">
        <p class="result-title">⚠️ ข้ามไป {{ results.skipped.length }} รายการ</p>
        <ul class="result-list">
          <li v-for="item in results.skipped" :key="item.email">
            <span class="font-medium">{{ item.email }}</span>
            <span class="text-gray-500"> — {{ item.reason }}</span>
          </li>
        </ul>
      </div>

      <button @click="close" class="theme-btn theme-btn--primary mt-4 w-full">ปิด</button>
    </div>

    <!-- Form -->
    <template v-else>
      <div v-if="error" class="alert-error">{{ error }}</div>

      <div class="form-fields">
        <!-- Emails textarea -->
        <div class="form-field">
          <label class="form-label">รายการ Email <span class="required">*</span></label>
          <textarea
            v-model="emailsRaw"
            class="theme-form-input"
            rows="6"
            placeholder="user1@company.com&#10;user2@company.com&#10;หรือแยกด้วย comma"
          />
          <p class="form-hint">
            ใส่ email แยกด้วยบรรทัดใหม่ หรือ comma
          </p>
        </div>

        <!-- Email preview -->
        <div v-if="parsedEmails.length > 0" class="email-preview">
          <p class="preview-title">
            Preview:
            <span class="text-green-600">{{ validEmails.length }} valid</span>
            <span v-if="hasIssues" class="text-red-500 ml-2">
              {{ parsedEmails.filter(e => !e.valid || e.duplicate).length }} มีปัญหา
            </span>
          </p>
          <div class="preview-list">
            <span
              v-for="item in parsedEmails"
              :key="item.email"
              class="preview-tag"
              :class="{
                'preview-tag--valid': item.valid && !item.duplicate,
                'preview-tag--invalid': !item.valid,
                'preview-tag--duplicate': item.duplicate,
              }"
              :title="!item.valid ? 'รูปแบบ email ไม่ถูกต้อง' : item.duplicate ? 'Email ซ้ำ' : ''"
            >
              {{ item.email }}
            </span>
          </div>
        </div>

        <div class="form-row">
          <!-- Role -->
          <div class="form-field">
            <label class="form-label">Role <span class="required">*</span></label>
            <select v-model="role" class="theme-form-select">
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>

          <!-- Company -->
          <div class="form-field">
            <label class="form-label">บริษัท <span class="required">*</span></label>
            <select v-model="company" class="theme-form-select">
              <option value="">-- เลือกบริษัท --</option>
              <option v-for="c in companies" :key="c.code" :value="c.code">{{ c.name }}</option>
            </select>
          </div>
        </div>

        <!-- Groups -->
        <div class="form-field">
          <label class="form-label">กลุ่มผู้ใช้</label>
          <div class="multi-select-list">
            <label v-for="group in groups" :key="group.id" class="multi-select-item">
              <input type="checkbox" :value="group.id" v-model="assignedGroups" />
              {{ group.name }}
            </label>
            <p v-if="groups.length === 0" class="text-sm text-gray-400">ไม่มี group</p>
          </div>
        </div>

        <!-- Message -->
        <div class="form-field">
          <label class="form-label">ข้อความเพิ่มเติม</label>
          <textarea
            v-model="message"
            class="theme-form-input"
            rows="2"
            maxlength="500"
            placeholder="ข้อความถึงผู้รับทั้งหมด (ไม่บังคับ)"
          />
          <p class="form-hint">{{ message.length }}/500</p>
        </div>
      </div>
    </template>
  </FormModal>
</template>

<style scoped>
.form-fields { display: flex; flex-direction: column; gap: 1rem; }
.form-field { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
.form-row { display: flex; gap: 1rem; }
.form-label { font-size: 0.875rem; font-weight: 500; color: var(--color-text, #111827); }
.required { color: #ef4444; }
.form-hint { font-size: 0.75rem; color: #9ca3af; }

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

.email-preview {
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}
.preview-title { font-size: 0.8125rem; font-weight: 500; margin-bottom: 0.5rem; }
.preview-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.preview-tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
}
.preview-tag--valid     { background: #dcfce7; color: #166534; }
.preview-tag--invalid   { background: #fee2e2; color: #991b1b; }
.preview-tag--duplicate { background: #fef9c3; color: #a16207; }

.alert-error {
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #991b1b;
}

.bulk-results { display: flex; flex-direction: column; }
.result-section { padding: 0.75rem; border-radius: 0.375rem; }
.result-section--success { background: #f0fdf4; border: 1px solid #86efac; }
.result-section--warning { background: #fef9c3; border: 1px solid #fde047; }
.result-title { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; }
.result-list { list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; display: flex; flex-direction: column; gap: 0.25rem; }
</style>
