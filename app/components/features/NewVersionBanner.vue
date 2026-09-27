<script setup lang="ts">
/**
 * Bottom banner shown when a newer build is live (plugins/version-check.client.ts).
 *
 * Reloading is left to the user, never forced: a half-filled form or a
 * permissions edit in progress must not be thrown away by a deploy.
 * Dismissing hides it for this tab only; the next reload picks up the new
 * build anyway.
 */
const available = useState<boolean>('new-version-available', () => false)
const dismissed = ref(false)

const reload = () => window.location.reload()
</script>

<template>
  <div v-if="available && !dismissed" class="new-version-banner" role="status">
    <span class="new-version-banner__text">มี StreamHub เวอร์ชันใหม่ — โหลดหน้าใหม่เพื่อใช้เวอร์ชันล่าสุด</span>
    <button type="button" class="theme-btn theme-btn--primary new-version-banner__reload" @click="reload">
      โหลดใหม่
    </button>
    <button
      type="button"
      class="new-version-banner__close"
      aria-label="ปิด"
      title="ปิด"
      @click="dismissed = true"
    >
      ✕
    </button>
  </div>
</template>

<style scoped>
.new-version-banner {
  position: fixed;
  bottom: 1rem;
  /* Both sides anchored + fit-content: centred, and on a phone it may use the
     full width. `left: 50%` + translate left it only half the viewport to
     shrink into, and the text wrapped a word per line. */
  left: 1rem;
  right: 1rem;
  width: fit-content;
  margin-inline: auto;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem 0.625rem 1rem;
  background: var(--color-bg-primary, #fff);
  border: 1px solid var(--color-primary, #2d3389);
  border-radius: var(--radius-md, 0.375rem);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.12));
  font-size: 0.875rem;
  color: var(--color-text-primary, #1f2937);
}

.new-version-banner__text {
  min-width: 0;
}

.new-version-banner__reload {
  flex-shrink: 0;
  white-space: nowrap;
}

/* Class contains "close", so the global button rule already skips it. */
.new-version-banner__close {
  flex-shrink: 0;
  padding: 0.25rem;
  background: none;
  border: none;
  color: var(--color-text-secondary, #757575);
  cursor: pointer;
  line-height: 1;
}
</style>
