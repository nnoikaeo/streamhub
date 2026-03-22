<script setup lang="ts">
/**
 * LookerUrlInput Component
 *
 * Input for Looker Studio URLs with:
 * - Real-time validation
 * - Auto-convert view URL → embed URL
 * - Report ID display
 * - Iframe preview toggle
 * - Open in new tab button
 * - Browse Reports from Looker API (when configured)
 */

import { ref, computed, watch, onMounted } from 'vue'
import { parseLookerUrl } from '~/utils/lookerUrl'
import { useLookerApi, type LookerReport } from '~/composables/useLookerApi'

interface Props {
  modelValue: string
  showPreview?: boolean
  previewHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: true,
  previewHeight: 400,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:reportId': [value: string | null]
}>()

const inputUrl = ref(props.modelValue || '')
const showingPreview = ref(false)
const iframeLoading = ref(false)

// Browse Reports state
const showReportBrowser = ref(false)
const reportSearch = ref('')
const { enabled: lookerApiEnabled, reports: apiReports, loading: apiLoading, checkStatus, searchReports } = useLookerApi()

const urlInfo = computed(() => parseLookerUrl(inputUrl.value))

// Filtered reports based on search
const filteredReports = computed(() => {
  if (!reportSearch.value.trim()) return apiReports.value
  const q = reportSearch.value.toLowerCase()
  return apiReports.value.filter(
    (r) => r.title.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q),
  )
})

// When input changes, emit embed URL
watch(urlInfo, (info) => {
  if (info.isValid && info.embedUrl) {
    emit('update:modelValue', info.embedUrl)
    emit('update:reportId', info.reportId)
  } else if (!inputUrl.value.trim()) {
    emit('update:modelValue', '')
    emit('update:reportId', null)
  }
})

// Sync from parent
watch(() => props.modelValue, (val) => {
  if (val !== urlInfo.value.embedUrl && val !== inputUrl.value) {
    inputUrl.value = val
  }
})

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

const openReportBrowser = async () => {
  showReportBrowser.value = true
  reportSearch.value = ''
  await searchReports()
}

const selectReport = (report: LookerReport) => {
  inputUrl.value = report.embedUrl
  showReportBrowser.value = false
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Check API status on mount
onMounted(async () => {
  await checkStatus()
})
</script>

<template>
  <div class="looker-url-input">
    <!-- URL Input -->
    <label class="looker-label">
      Looker Studio URL
    </label>
    <div class="input-row">
      <input
        v-model="inputUrl"
        type="text"
        class="looker-input"
        :class="{
          'input-valid': urlInfo.isValid,
          'input-invalid': inputUrl.trim() && !urlInfo.isValid,
        }"
        placeholder="https://lookerstudio.google.com/reporting/..."
      />
      <!-- Browse Reports button (only when API is configured) -->
      <button
        v-if="lookerApiEnabled"
        type="button"
        class="browse-btn"
        @click="openReportBrowser"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Browse Reports
      </button>
    </div>

    <!-- Validation Message -->
    <div v-if="inputUrl.trim()" class="validation-message">
      <template v-if="urlInfo.isValid">
        <span class="status-valid">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Valid Looker URL — Report ID: <code>{{ urlInfo.reportId }}</code>
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

    <!-- Action Buttons -->
    <div v-if="urlInfo.isValid" class="action-buttons">
      <button
        v-if="showPreview"
        type="button"
        class="action-btn"
        @click="togglePreview"
      >
        <svg v-if="!showingPreview" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        {{ showingPreview ? 'Hide Preview' : 'Preview' }}
      </button>
      <button
        type="button"
        class="action-btn"
        @click="openInNewTab"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
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
        title="Looker Dashboard Preview"
        frameborder="0"
        sandbox="allow-scripts allow-same-origin allow-popups"
        @load="iframeLoading = false"
      />
    </div>

    <!-- Report Browser Dialog -->
    <Teleport to="body">
      <div v-if="showReportBrowser" class="report-browser-overlay" @click.self="showReportBrowser = false">
        <div class="report-browser-dialog">
          <div class="dialog-header">
            <h3>Select Looker Report</h3>
            <button type="button" class="close-btn" @click="showReportBrowser = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="dialog-search">
            <input
              v-model="reportSearch"
              type="text"
              class="search-input"
              placeholder="Search reports..."
            />
          </div>
          <div class="dialog-body">
            <div v-if="apiLoading" class="dialog-loading">
              <div class="preview-spinner" />
              <p>Loading reports...</p>
            </div>
            <div v-else-if="filteredReports.length === 0" class="dialog-empty">
              <p>No reports found</p>
            </div>
            <table v-else class="reports-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Last Modified</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="report in filteredReports"
                  :key="report.id"
                  class="report-row"
                  @click="selectReport(report)"
                >
                  <td class="report-title">{{ report.title }}</td>
                  <td class="report-owner">{{ report.owner }}</td>
                  <td class="report-date">{{ formatDate(report.lastModified) }}</td>
                  <td class="report-action">
                    <button type="button" class="select-btn">Select</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.looker-url-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.looker-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.looker-input {
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

.browse-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  color: var(--color-primary, #3b82f6);
  background: var(--color-bg-info, #eff6ff);
  border: 1px solid var(--color-primary, #3b82f6);
  border-radius: var(--radius-md, 0.375rem);
  cursor: pointer;
  transition: all 0.2s;
}

.browse-btn:hover {
  background: var(--color-primary, #3b82f6);
  color: white;
}

.looker-input:focus {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.looker-input.input-valid {
  border-color: var(--color-success, #22c55e);
}

.looker-input.input-valid:focus {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.looker-input.input-invalid {
  border-color: var(--color-error, #ef4444);
}

.looker-input.input-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
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

.action-btn:hover {
  background: var(--color-bg-primary, #fff);
  color: var(--color-text-primary);
  border-color: var(--color-text-secondary);
}

.btn-icon {
  width: 0.875rem;
  height: 0.875rem;
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

/* Report Browser Dialog */
.report-browser-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.report-browser-dialog {
  background: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text-secondary);
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.close-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.dialog-search {
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-md, 0.375rem);
  font-size: 0.875rem;
  outline: none;
}

.search-input:focus {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

.dialog-loading,
.dialog-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--color-text-secondary);
}

.dialog-loading p,
.dialog-empty p {
  margin: 0;
  font-size: 0.875rem;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table th {
  text-align: left;
  padding: 0.625rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary, #f9fafb);
  letter-spacing: 0.05em;
}

.report-row {
  cursor: pointer;
  transition: background 0.15s;
}

.report-row:hover {
  background: var(--color-bg-info, #eff6ff);
}

.report-row td {
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
}

.report-title {
  font-weight: 500;
  color: var(--color-text-primary);
}

.report-owner {
  color: var(--color-text-secondary);
}

.report-date {
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.report-action {
  text-align: right;
}

.select-btn {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-primary, #3b82f6);
  background: transparent;
  border: 1px solid var(--color-primary, #3b82f6);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.select-btn:hover {
  background: var(--color-primary, #3b82f6);
  color: white;
}
</style>
