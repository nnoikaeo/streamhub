<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAdminInvitations } from '~/composables/useAdminInvitations'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import { useAdminRegions } from '~/composables/useAdminRegions'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminGroups } from '~/composables/useAdminGroups'
import { useAuthStore } from '~/stores/auth'
import { useAuth } from '~/composables/useAuth'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  invited: []
}>()

const { invitations } = useAdminInvitations()
const { companies: adminCompanies, fetchCompanies } = useAdminCompanies()
const { regions, fetchRegions } = useAdminRegions()
const { folders: allFolders, fetchFolders } = useAdminFolders()
const { groups: allGroups, fetchGroups } = useAdminGroups()
const authStore = useAuthStore()
const { getIdToken } = useAuth()

const { isFirestore: useFirestore, apiBase: getApiBase } = useServiceMode()
const apiBase = getApiBase('invitations')

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Form state
const form = ref({
  email: '',
  role: 'user' as 'user' | 'moderator' | 'admin',
  company: '',
  message: '',
  assignedFolders: [] as string[],
  assignedGroups: [] as string[],
})

const submitting = ref(false)
const error = ref('')
const successCode = ref('')
const pendingWarning = ref(false)
const domainWarning = ref('')

// Reactivation dialog
const showReactivateDialog = ref(false)
const existingInactiveUser = ref<Record<string, unknown> | null>(null)

// Data for selects (sourced from composables that handle Firestore/JSON mode automatically)
const folders = computed(() => (allFolders.value ?? []).filter((f: any) => f.isActive !== false))
const groups = computed(() => (allGroups.value ?? []).filter((g: any) => g.isActive !== false))

const copied = ref(false)

const inviteLink = computed(() =>
  successCode.value ? `${window.location.origin}/invite/accept?code=${successCode.value}` : ''
)

async function loadDropdownData() {
  try {
    await Promise.all([
      fetchCompanies(),
      fetchRegions(),
      fetchFolders(),
      fetchGroups(),
    ])
  } catch {
    // silently ignore load failures — dropdowns degrade gracefully
  }
}

const GOOGLE_DOMAINS = ['gmail.com', 'googlemail.com']

function isLikelyGoogleAccount(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return GOOGLE_DOMAINS.includes(domain)
}

function checkPendingWarning() {
  if (!form.value.email) return
  const hasPending = invitations.value.some(
    inv => inv.email.toLowerCase() === form.value.email.toLowerCase() && inv.status === 'pending'
  )
  pendingWarning.value = hasPending
}

function checkDomainWarning() {
  const email = form.value.email.trim()
  if (!email || !email.includes('@')) {
    domainWarning.value = ''
    return
  }
  if (!isLikelyGoogleAccount(email)) {
    const domain = email.split('@')[1]
    domainWarning.value = `อีเมล @${domain} อาจไม่ใช่ Google Account — ผู้ใช้อาจไม่สามารถเข้าดู Looker Dashboard ได้ หากบริษัทใช้ Google Workspace กับ domain นี้ สามารถเพิกเฉยคำเตือนนี้ได้`
  } else {
    domainWarning.value = ''
  }
}

async function handleSubmit() {
  error.value = ''
  submitting.value = true

  try {
    const payload = {
      email: form.value.email.trim(),
      role: form.value.role,
      company: form.value.company,
      message: form.value.message || undefined,
      assignedFolders: form.value.role === 'moderator' ? form.value.assignedFolders : undefined,
      assignedGroups: form.value.assignedGroups.length ? form.value.assignedGroups : undefined,
      invitedBy: authStore.user?.uid ?? 'admin',
      invitedByName: authStore.user?.displayName ?? 'Admin',
    }

    const headers = await getAuthHeaders()
    const res = await $fetch<{
      success: boolean
      action?: string
      existingUser?: Record<string, unknown>
      data?: { invitationCode: string }
      message?: string
    }>(apiBase, { method: 'POST', body: payload, headers })

    if (res.action === 'user_exists_inactive') {
      existingInactiveUser.value = res.existingUser ?? null
      showReactivateDialog.value = true
    } else if (res.success && res.data?.invitationCode) {
      successCode.value = res.data.invitationCode
      emit('invited')
    } else if (!res.success) {
      const apiErr = (res as any).error as string | undefined
      if (apiErr === 'User already active') {
        error.value = 'ผู้ใช้ email นี้มีบัญชีในระบบอยู่แล้ว'
      } else {
        error.value = res.message ?? apiErr ?? 'เกิดข้อผิดพลาด'
      }
    } else {
      error.value = res.message ?? 'เกิดข้อผิดพลาด'
    }
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message ?? 'เกิดข้อผิดพลาด'
  } finally {
    submitting.value = false
  }
}

async function handleReactivate() {
  if (!existingInactiveUser.value) return
  submitting.value = true
  error.value = ''

  try {
    const headers = await getAuthHeaders()
    await $fetch(`${apiBase}/reactivate`, {
      method: 'POST',
      body: {
        email: (existingInactiveUser.value as any).email ?? form.value.email.trim(),
        role: form.value.role,
        company: form.value.company,
        groups: form.value.assignedGroups.length ? form.value.assignedGroups : undefined,
        performedBy: authStore.user?.uid ?? 'admin',
        performedByEmail: authStore.user?.email ?? 'admin',
      },
      headers,
    })
    showReactivateDialog.value = false
    emit('invited')
    close()
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message ?? 'เกิดข้อผิดพลาดในการ reactivate'
  } finally {
    submitting.value = false
  }
}

async function copyLink() {
  await navigator.clipboard.writeText(inviteLink.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function close() {
  emit('update:modelValue', false)
}

function reset() {
  form.value = { email: '', role: 'user', company: '', message: '', assignedFolders: [], assignedGroups: [] }
  error.value = ''
  successCode.value = ''
  pendingWarning.value = false
  domainWarning.value = ''
  showReactivateDialog.value = false
  existingInactiveUser.value = null
  submitting.value = false
}

watch(() => props.modelValue, (val) => {
  if (val) reset()
})

onMounted(loadDropdownData)
</script>

<template>
  <FormModal
    :model-value="modelValue"
    title="เชิญผู้ใช้ใหม่"
    size="lg"
    :loading="submitting"
    :submit-text="successCode ? 'ปิด' : 'ส่งคำเชิญ'"
    :submit-disabled="false"
    :hide-cancel="!!successCode"
    @update:model-value="emit('update:modelValue', $event)"
    @save="successCode ? close() : handleSubmit()"
    @cancel="close"
  >
    <!-- Success state -->
    <div v-if="successCode" class="invite-success">
      <p class="text-green-600 font-medium mb-3">✅ ส่งคำเชิญเรียบร้อยแล้ว!</p>
      <p class="text-sm text-gray-600 mb-2">ลิงก์สำหรับยืนยัน:</p>
      <div class="invite-link-box">
        <code class="invite-link-text">{{ inviteLink }}</code>
        <button @click="copyLink" class="theme-btn theme-btn--ghost theme-btn--sm">
          {{ copied ? '✅ คัดลอกแล้ว' : '📋 คัดลอก' }}
        </button>
      </div>
    </div>

    <!-- Form -->
    <template v-else>
      <!-- Pending warning -->
      <div v-if="pendingWarning" class="alert-warning">
        ⚠️ Email นี้มี invitation ที่ยังรอตอบรับอยู่แล้ว
      </div>

      <!-- Domain warning -->
      <div v-if="domainWarning" class="alert-domain-warning">
        ⚠️ {{ domainWarning }}
      </div>

      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <div class="form-fields">
        <!-- Row 1: Email + Role + Company -->
        <div class="form-row form-row--3col">
          <!-- Email -->
          <div class="form-field form-field--email">
            <label class="form-label">Email <span class="required">*</span></label>
            <input
              v-model="form.email"
              type="email"
              class="theme-form-input"
              placeholder="user@company.com"
              @blur="checkPendingWarning(); checkDomainWarning()"
            />
          </div>

          <!-- Role -->
          <div class="form-field">
            <label class="form-label">Role <span class="required">*</span></label>
            <select v-model="form.role" class="theme-form-select">
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <!-- Company -->
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
          <!-- Groups -->
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

          <!-- Message -->
          <div class="form-field">
            <label class="form-label">ข้อความเพิ่มเติม</label>
            <textarea
              v-model="form.message"
              class="theme-form-input message-textarea"
              maxlength="500"
              placeholder="ข้อความถึงผู้รับ invitation (ไม่บังคับ)"
            />
          </div>
        </div>

        <!-- Folders (moderator only) — full width -->
        <div v-if="form.role === 'moderator'" class="form-field">
          <label class="form-label">Folders ที่ดูแล</label>
          <div class="multi-select-list">
            <label v-for="folder in folders" :key="folder.id" class="multi-select-item">
              <input type="checkbox" :value="folder.id" v-model="form.assignedFolders" />
              {{ folder.name }}
            </label>
            <p v-if="folders.length === 0" class="text-sm text-gray-400">ไม่มี folder</p>
          </div>
        </div>
      </div>
    </template>
  </FormModal>

  <!-- Reactivation confirm dialog -->
  <ConfirmDialog
    :is-open="showReactivateDialog"
    title="พบผู้ใช้ที่ถูกปิดใช้งาน"
    :message="`พบบัญชีของ '${(existingInactiveUser?.email as string) ?? form.email}' ในระบบแต่ถูกปิดการใช้งานอยู่ ต้องการเปิดใช้งานบัญชีนี้อีกครั้งหรือไม่?`"
    confirm-text="เปิดใช้งาน"
    cancel-text="ยกเลิก"
    :loading="submitting"
    @confirm="handleReactivate"
    @cancel="showReactivateDialog = false"
  />
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
  max-height: 10rem;
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

.alert-warning {
  padding: 0.75rem;
  background: #fef9c3;
  border: 1px solid #fde047;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #a16207;
}
.alert-domain-warning {
  padding: 0.75rem;
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: 0.375rem;
  font-size: 0.813rem;
  color: #9a3412;
  line-height: 1.5;
}
.alert-error {
  padding: 0.75rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #991b1b;
}

.invite-success { display: flex; flex-direction: column; }
.invite-link-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  flex-wrap: wrap;
}
.invite-link-text {
  flex: 1;
  font-size: 0.75rem;
  word-break: break-all;
  color: #374151;
}
</style>
