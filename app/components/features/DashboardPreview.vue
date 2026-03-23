<template>
  <!-- Inline mode: direct iframe embed -->
  <div v-if="mode === 'inline'" class="preview-inline" :style="containerStyle">
    <div v-if="!embedUrl" class="preview-placeholder" :style="placeholderStyle">
      <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
      <span class="placeholder-label">ไม่มี URL สำหรับ Dashboard นี้</span>
    </div>
    <iframe
      v-else
      :src="embedUrl"
      class="preview-iframe"
      frameborder="0"
      allowfullscreen
      sandbox="allow-scripts allow-same-origin allow-popups"
      @load="iframeLoaded = true"
    />
  </div>

  <!-- Thumbnail mode: gradient placeholder + hover Quick View -->
  <div
    v-else-if="mode === 'thumbnail'"
    class="preview-thumbnail"
    :style="thumbnailContainerStyle"
    @click="openModal"
  >
    <!-- Gradient placeholder background -->
    <div class="thumbnail-bg" :style="placeholderStyle">
      <svg class="thumbnail-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" opacity="0.6">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    </div>

    <!-- Hover overlay with Quick View button -->
    <div v-if="embedUrl" class="thumbnail-overlay">
      <button class="quick-view-btn" type="button" @click.stop="openModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>Quick View</span>
      </button>
    </div>
    <div v-else class="thumbnail-no-url">
      <span>ยังไม่ได้กำหนด URL</span>
    </div>
  </div>

  <!-- Modal is shared between thumbnail + modal modes -->
  <Modal
    v-if="mode === 'thumbnail' || mode === 'modal'"
    v-model="showModal"
    :title="title || 'Dashboard Preview'"
    size="xl"
  >
    <div class="modal-preview-body">
      <!-- Loading state -->
      <div v-if="!iframeLoaded && embedUrl" class="modal-loading">
        <div class="loading-spinner" />
        <span>กำลังโหลด Dashboard...</span>
      </div>

      <!-- No URL state -->
      <div v-if="!embedUrl" class="modal-no-url">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <p>Dashboard นี้ยังไม่มี Looker Studio URL</p>
      </div>

      <iframe
        v-if="embedUrl"
        :src="embedUrl"
        class="modal-iframe"
        frameborder="0"
        allowfullscreen
        sandbox="allow-scripts allow-same-origin allow-popups"
        @load="iframeLoaded = true"
      />
    </div>

    <template #footer>
      <div class="modal-footer-actions">
        <button v-if="embedUrl" class="open-full-btn" type="button" @click="openFullView">
          <span>Open Full View</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '~/components/ui/Modal.vue'

interface Props {
  embedUrl?: string
  thumbnailUrl?: string
  title?: string
  mode?: 'thumbnail' | 'modal' | 'inline'
  width?: string | number
  height?: string | number
  dashboardId?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'thumbnail',
  width: '100%',
})

const router = useRouter()
const showModal = ref(false)
const iframeLoaded = ref(false)

// Reset iframe loaded state when modal opens
watch(showModal, (open) => {
  if (open) iframeLoaded.value = false
})

function openModal() {
  if (props.mode === 'thumbnail') {
    showModal.value = true
  }
}

function openFullView() {
  showModal.value = false
  if (props.dashboardId) {
    router.push(`/dashboard/view/${props.dashboardId}`)
  }
}

// Gradient placeholder from title hash
const placeholderGradient = computed(() => {
  if (!props.title) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  let hash = 0
  for (let i = 0; i < props.title.length; i++) {
    hash = props.title.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `linear-gradient(135deg, hsl(${hue}, 70%, 60%) 0%, hsl(${(hue + 60) % 360}, 70%, 40%) 100%)`
})

const defaultHeight = computed(() => {
  if (props.height !== undefined) return props.height
  return props.mode === 'thumbnail' ? 160 : 600
})

const heightPx = computed(() => {
  const h = defaultHeight.value
  return typeof h === 'number' ? `${h}px` : h
})

const widthVal = computed(() => {
  const w = props.width
  return typeof w === 'number' ? `${w}px` : w
})

const containerStyle = computed(() => ({
  width: widthVal.value,
  height: heightPx.value,
}))

const thumbnailContainerStyle = computed(() => ({
  width: widthVal.value,
  height: heightPx.value,
  cursor: props.embedUrl ? 'pointer' : 'default',
}))

const placeholderStyle = computed(() => ({
  background: placeholderGradient.value,
}))
</script>

<style scoped>
/* ============================================================================
   DASHBOARD PREVIEW — All modes
   ============================================================================ */

/* ========== INLINE MODE ========== */
.preview-inline {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md, 8px);
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border-radius: var(--radius-md, 8px);
}

.placeholder-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: rgba(255, 255, 255, 0.7);
}

.placeholder-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* ========== THUMBNAIL MODE ========== */
.preview-thumbnail {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md, 8px) var(--radius-md, 8px) 0 0;
  flex-shrink: 0;
}

.thumbnail-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s ease;
}

.preview-thumbnail:hover .thumbnail-bg {
  transform: scale(1.03);
}

.thumbnail-icon {
  width: 2.5rem;
  height: 2.5rem;
}

/* Hover overlay */
.thumbnail-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.preview-thumbnail:hover .thumbnail-overlay {
  opacity: 1;
}

.quick-view-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  background: rgba(255, 255, 255, 0.95);
  color: #1e293b;
  border: none;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.quick-view-btn:hover {
  background: #fff;
  transform: scale(1.05);
}

.quick-view-btn svg {
  width: 1rem;
  height: 1rem;
}

.thumbnail-no-url {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 0.5rem 0.75rem;
}

.thumbnail-no-url span {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.65);
  font-style: italic;
}

/* ========== MODAL BODY ========== */
.modal-preview-body {
  position: relative;
  min-height: 480px;
  display: flex;
  align-items: stretch;
}

.modal-iframe {
  width: 100%;
  min-height: 480px;
  border: none;
  display: block;
  border-radius: var(--radius-sm, 4px);
}

.modal-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: var(--color-bg-secondary, #f8fafc);
  border-radius: var(--radius-sm, 4px);
  z-index: 1;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-border-light, #e2e8f0);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-loading span {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #64748b);
}

.modal-no-url {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--color-text-secondary, #94a3b8);
  background: var(--color-bg-secondary, #f8fafc);
  border-radius: var(--radius-sm, 4px);
}

.modal-no-url svg {
  width: 3rem;
  height: 3rem;
  opacity: 0.4;
}

.modal-no-url p {
  font-size: 0.875rem;
  margin: 0;
}

/* ========== MODAL FOOTER ========== */
.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
}

.open-full-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.2rem;
  background: var(--color-primary, #3b82f6);
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 6px);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.open-full-btn:hover {
  background: var(--color-primary-dark, #2563eb);
}

.open-full-btn svg {
  width: 1rem;
  height: 1rem;
  transition: transform 0.15s ease;
}

.open-full-btn:hover svg {
  transform: translateX(2px);
}
</style>
