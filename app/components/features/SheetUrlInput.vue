<script setup lang="ts">
/**
 * SheetUrlInput Component
 *
 * Parallel to LookerUrlInput, with one extra job: checking that the sheet is
 * actually shared "anyone with the link".
 *
 * That check is here rather than left to manual testing because the failure it
 * catches is invisible to whoever creates the dashboard. A sheet that is not
 * link-shared still renders for its own owner in Chrome — the same Google
 * session owns it — and shows a cookie prompt on Safari and every iOS browser
 * whose "allow cookies" button dead-ends (spike S1.3, S1.11). Built in Chrome,
 * broken for users, with nothing in between to notice.
 *
 * A passing check is shown as a warning, not a tick. Link sharing is what makes
 * the embed work AND what makes `export?format=csv|xlsx|pdf` answer to anyone
 * holding the URL with no login (S1.10), so a sheet with data that cannot be
 * public does not belong here at all.
 */

import { ref, computed, watch, onBeforeUnmount } from 'vue'
import type { SheetEmbedMode } from '~/types/dashboard'
import type { SheetSharingStatus } from '~/utils/sheetSharingGuard'
import { useAuth } from '~/composables/useAuth'

// parseSheetUrl comes from shared/utils, auto-imported into app and server
// alike — the server parses the same URLs for the sharing probe.

interface Props {
  modelValue: string
  mode?: SheetEmbedMode
  showPreview?: boolean
  previewHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'interactive',
  showPreview: true,
  previewHeight: 400,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:mode': [value: SheetEmbedMode]
  'update:sharing': [value: SheetSharingStatus]
}>()

interface SharingResult {
  isLinkShared: boolean
  status: number
  message: string
}

const inputUrl = ref(props.modelValue || '')
const showingPreview = ref(false)
const iframeLoading = ref(false)

const sharingChecking = ref(false)
const sharingResult = ref<SharingResult | null>(null)
const sharingError = ref('')

/** Mirrors the three refs above into the one value the form guards on. */
const setSharing = (status: SheetSharingStatus) => emit('update:sharing', status)

// Resolved at setup, not inside the handler — a composable called from an async
// callback is outside the component instance.
const { getIdToken } = useAuth()

const urlInfo = computed(() => parseSheetUrl(inputUrl.value, props.mode))

// The stored value is the embed URL, so a mode change has to rewrite it — the
// mode is not applied at render time anywhere else.
watch([urlInfo, () => props.mode], ([info]) => {
  if (info.isValid && info.embedUrl) {
    emit('update:modelValue', info.embedUrl)
  } else if (!inputUrl.value.trim()) {
    emit('update:modelValue', '')
  }
})

// A new URL invalidates the previous answer. Leaving it on screen is how an
// admin reads "shared" about a sheet that was never checked.
//
// The check then runs on its own rather than waiting for the button. A check
// nobody clicks blocks nothing, and this is the one failure the person adding
// the dashboard cannot see for themselves. Debounced so typing a URL does not
// fire a request per keystroke.
let autoCheckTimer: ReturnType<typeof setTimeout> | null = null

watch(() => urlInfo.value.sheetId, (sheetId) => {
  sharingResult.value = null
  sharingError.value = ''
  setSharing('unknown')

  if (autoCheckTimer) clearTimeout(autoCheckTimer)
  if (!sheetId) return

  autoCheckTimer = setTimeout(() => { void checkSharing() }, 800)
}, { immediate: true })

onBeforeUnmount(() => {
  if (autoCheckTimer) clearTimeout(autoCheckTimer)
})

// Sync from parent
watch(() => props.modelValue, (val) => {
  if (val !== urlInfo.value.embedUrl && val !== inputUrl.value) {
    inputUrl.value = val
  }
})

const setMode = (mode: SheetEmbedMode) => {
  emit('update:mode', mode)
}

const checkSharing = async () => {
  if (!urlInfo.value.isValid) return

  sharingChecking.value = true
  sharingResult.value = null
  sharingError.value = ''
  setSharing('checking')

  try {
    const token = await getIdToken()
    const response = await $fetch<{ success: boolean, data?: SharingResult, message?: string }>(
      '/api/sheet/check-sharing',
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: { url: inputUrl.value },
      },
    )

    if (response.success && response.data) {
      sharingResult.value = response.data
      setSharing(response.data.isLinkShared ? 'shared' : 'not-shared')
    } else {
      sharingError.value = response.message || 'ตรวจสอบไม่สำเร็จ'
      setSharing('error')
    }
  } catch (error: unknown) {
    sharingError.value = getErrorDataMessage(error) || getErrorMessage(error, 'ตรวจสอบไม่สำเร็จ')
    setSharing('error')
  } finally {
    sharingChecking.value = false
  }
}

const togglePreview = () => {
  if (!urlInfo.value.isValid) return
  showingPreview.value = !showingPreview.value
  if (showingPreview.value) {
    iframeLoading.value = true
  }
}

const openInNewTab = () => {
  if (urlInfo.value.embedUrl) {
    window.open(urlInfo.value.embedUrl, '_blank', 'noopener,noreferrer')
  }
}
</script>

<template>
  <div class="sheet-url-input">
    <label class="sheet-label">
      Google Sheets URL
    </label>
    <div class="input-row">
      <input
        v-model="inputUrl"
        type="text"
        class="sheet-input"
        :class="{
          'input-valid': urlInfo.isValid,
          'input-invalid': inputUrl.trim() && !urlInfo.isValid,
        }"
        placeholder="https://docs.google.com/spreadsheets/d/..."
      >
    </div>

    <!-- Validation Message -->
    <div v-if="inputUrl.trim()" class="validation-message">
      <template v-if="urlInfo.isValid">
        <span class="status-valid">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>
            {{ urlInfo.isPublished ? 'URL เผยแพร่ (published)' : 'URL ชีต' }} —
            <code>{{ urlInfo.sheetId }}</code>
          </span>
        </span>
      </template>
      <template v-else>
        <span class="status-invalid">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {{ urlInfo.error }}
        </span>
      </template>
    </div>

    <!-- Embed mode. Interactive is the default because it is the only mode
         where cells can be selected (S1.7); the published URL has one form. -->
    <div v-if="urlInfo.isValid && !urlInfo.isPublished" class="mode-row">
      <span class="mode-label">โหมดแสดงผล</span>
      <div class="mode-options" role="group" aria-label="โหมดแสดงผล">
        <button
          type="button"
          class="mode-button"
          :class="{ 'mode-button--active': mode === 'interactive' }"
          @click="setMode('interactive')"
        >
          Interactive
          <span class="mode-hint">UI ของ Sheets เลือกเซลล์ได้</span>
        </button>
        <button
          type="button"
          class="mode-button"
          :class="{ 'mode-button--active': mode === 'view' }"
          @click="setMode('view')"
        >
          View
          <span class="mode-hint">ตารางแบน คลิกไม่ได้</span>
        </button>
      </div>
    </div>

    <!-- Sharing check. The one thing that cannot be verified by looking at the
         form on the machine that built it. -->
    <div v-if="urlInfo.isValid" class="sharing-check">
      <div class="sharing-check-row">
        <button
          type="button"
          class="action-btn"
          :disabled="sharingChecking"
          @click="checkSharing"
        >
          {{ sharingChecking ? 'กำลังตรวจ...' : 'ตรวจการแชร์' }}
        </button>
        <span class="sharing-check-hint">
          ต้องแชร์เป็น <strong>ทุกคนที่มีลิงก์ (ผู้ดู)</strong> ไม่งั้น Safari และ iOS เปิดไม่ได้เลย
        </span>
      </div>

      <p v-if="sharingError" class="sharing-status sharing-status--unknown">
        {{ sharingError }} — ตรวจไม่ได้ ไม่ได้แปลว่าตั้งค่าผิด ลองใหม่อีกครั้ง
      </p>

      <template v-else-if="sharingResult">
        <!-- Deliberately a warning, not a tick: a shared sheet is embeddable
             AND downloadable in full by anyone holding the URL (S1.10). -->
        <p v-if="sharingResult.isLinkShared" class="sharing-status sharing-status--shared">
          <strong>แชร์ลิงก์แล้ว — ฝังได้</strong><br>
          แต่ใครก็ตามที่ได้ URL นี้ ดาวน์โหลดทั้งไฟล์เป็น CSV / XLSX / PDF ได้โดยไม่ต้องล็อกอิน
          ถ้าชีตมีข้อมูลที่เปิดสาธารณะไม่ได้ ต้องให้เจ้าของข้อมูลตัดสินก่อน
        </p>
        <p v-else class="sharing-status sharing-status--not-shared">
          <strong>ยังไม่ได้แชร์ลิงก์ (HTTP {{ sharingResult.status }})</strong><br>
          เปิดชีต → Share → General access → <strong>ทุกคนที่มีลิงก์ (ผู้ดู)</strong> แล้วตรวจใหม่
        </p>
      </template>
    </div>

    <!-- Action Buttons -->
    <div v-if="urlInfo.isValid" class="action-buttons">
      <button
        v-if="showPreview"
        type="button"
        class="action-btn"
        @click="togglePreview"
      >
        {{ showingPreview ? 'Hide Preview' : 'Preview' }}
      </button>
      <button
        type="button"
        class="action-btn"
        @click="openInNewTab"
      >
        Open in New Tab
      </button>
    </div>

    <!-- Iframe Preview -->
    <div
      v-if="showingPreview && urlInfo.isValid && urlInfo.embedUrl"
      class="preview-container"
      :style="{ height: `${previewHeight}px` }"
    >
      <div v-if="iframeLoading" class="preview-loading">
        <div class="preview-spinner" />
        <p>Loading preview...</p>
      </div>
      <iframe
        :src="urlInfo.embedUrl"
        class="preview-iframe"
        title="Google Sheet Preview"
        frameborder="0"
        sandbox="allow-scripts allow-same-origin allow-popups allow-storage-access-by-user-activation"
        @load="iframeLoading = false"
      />
    </div>
  </div>
</template>

<style scoped>
.sheet-url-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sheet-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.sheet-input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.875rem;
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary, #fff);
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.sheet-input:focus {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sheet-input.input-valid {
  border-color: var(--color-success, #22c55e);
}

.sheet-input.input-invalid {
  border-color: var(--color-error, #ef4444);
}

.validation-message {
  font-size: 0.8rem;
  line-height: 1.4;
}

.status-valid {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-success, #22c55e);
}

.status-valid code {
  font-size: 0.75rem;
  background: rgba(34, 197, 94, 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: var(--color-success, #16a34a);
  /* A published id is ~90 characters — without this it pushes the row wide
     enough to scroll the whole form sideways. */
  overflow-wrap: anywhere;
}

.status-invalid {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-error, #ef4444);
}

.status-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.mode-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.mode-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary, #64748b);
}

.mode-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.mode-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-align: left;
  color: var(--color-text-secondary, #6b7280);
  background: var(--color-bg-secondary, #f3f4f6);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-md, 0.375rem);
  cursor: pointer;
  transition: all 0.2s;
}

.mode-button--active {
  color: var(--color-primary, #3b82f6);
  background: var(--color-bg-info, #eff6ff);
  border-color: var(--color-primary, #3b82f6);
}

.mode-hint {
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--color-text-secondary, #94a3b8);
}

.sharing-check {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-border-light, #e2e8f0);
  border-left: 3px solid var(--color-warning, #f59e0b);
  border-radius: var(--radius-md, 0.375rem);
  background: #fffbeb;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-text-primary, #1e293b);
}

.sharing-check-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.sharing-check-hint {
  color: var(--color-text-secondary, #64748b);
}

.sharing-status {
  margin: 0;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-md, 0.375rem);
  background: rgba(255, 255, 255, 0.7);
}

.sharing-status--shared {
  border-left: 3px solid var(--color-warning, #f59e0b);
}

.sharing-status--not-shared {
  border-left: 3px solid var(--color-error, #ef4444);
}

.sharing-status--unknown {
  border-left: 3px solid var(--color-text-secondary, #94a3b8);
  color: var(--color-text-secondary, #64748b);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary, #6b7280);
  background: var(--color-bg-secondary, #f3f4f6);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-md, 0.375rem);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-bg-primary, #fff);
  color: var(--color-text-primary);
  border-color: var(--color-text-secondary);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.preview-container {
  position: relative;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-md, 0.375rem);
  overflow: hidden;
  background: var(--color-bg-secondary, #f9fafb);
}

.preview-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: var(--color-bg-secondary, #f9fafb);
  z-index: 1;
}

.preview-loading p {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.preview-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--color-border-light, #e5e7eb);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
