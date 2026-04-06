<script setup lang="ts">
/**
 * Admin Health Check Page
 *
 * Displays system health status: Firestore, Firebase Auth, Email Service.
 * Fetches /api/health (admin-only) and renders check results with visual indicators.
 *
 * Route: /admin/health
 * Middleware: auth, admin
 */

import { ref, onMounted } from 'vue'
import PageLayout from '~/components/compositions/PageLayout.vue'
import { useAuth } from '~/composables/useAuth'

const { breadcrumbs } = useAdminBreadcrumbs()

definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

// ============================================================================
// TYPES
// ============================================================================

type CheckStatus = 'ok' | 'error'

interface HealthData {
  status: 'ok' | 'degraded'
  environment: {
    mode: 'development' | 'production'
    useFirestore: boolean
    appUrl: string
    resendConfigured: boolean
    nodeEnv: string
  }
  checks: {
    firestoreConnection: CheckStatus
    firebaseAuth: CheckStatus
    emailService: CheckStatus
  }
  warnings: string[]
  timestamp: string
  version: string
}

// ============================================================================
// STATE
// ============================================================================

const health = ref<HealthData | null>(null)
const isLoading = ref(false)
const fetchError = ref<string | null>(null)

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchHealth() {
  isLoading.value = true
  fetchError.value = null

  try {
    const { getIdToken } = useAuth()
    const token = await getIdToken()
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const authStore = useAuthStore()
    const query = authStore.user?.uid ? `?uid=${authStore.user.uid}` : ''

    health.value = await $fetch<HealthData>(`/api/health${query}`, { headers })
  } catch (err: any) {
    fetchError.value = err?.data?.message || err?.message || 'Failed to load health status'
  } finally {
    isLoading.value = false
  }
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(fetchHealth)
</script>

<template>
  <PageLayout
    :allow-search="false"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <AdminPageContent>
      <!-- Header -->
      <template #header>
        <h1 class="page-header__title">🏥 System Health</h1>
        <button
          type="button"
          class="page-header-action-btn"
          :disabled="isLoading"
          @click="fetchHealth"
        >
          {{ isLoading ? '⏳ Checking...' : '🔄 Refresh' }}
        </button>
      </template>

      <template #table>
        <!-- Loading -->
        <div v-if="isLoading && !health" class="health-loading">
          <div class="spinner" />
          <p>Checking system health...</p>
        </div>

        <!-- Error -->
        <div v-else-if="fetchError" class="health-error">
          <p class="health-error__icon">❌</p>
          <p class="health-error__message">{{ fetchError }}</p>
          <button type="button" class="theme-btn theme-btn--ghost theme-btn--sm" @click="fetchHealth">
            Try Again
          </button>
        </div>

        <template v-else-if="health">
          <!-- Degraded Banner -->
          <div v-if="health.status === 'degraded'" class="health-banner health-banner--degraded">
            <span class="health-banner__icon">⚠️</span>
            <span>System is <strong>degraded</strong> — one or more checks failed. See details below.</span>
          </div>
          <div v-else class="health-banner health-banner--ok">
            <span class="health-banner__icon">✅</span>
            <span>All systems <strong>operational</strong></span>
          </div>

          <!-- Checks -->
          <section class="health-section">
            <h2 class="health-section__title">Service Checks</h2>
            <div class="check-list">
              <div class="check-item">
                <span class="check-item__icon">{{ health.checks.firestoreConnection === 'ok' ? '✅' : '❌' }}</span>
                <div class="check-item__body">
                  <span class="check-item__label">Firestore Connection</span>
                  <span
                    class="check-item__status"
                    :class="health.checks.firestoreConnection === 'ok' ? 'status--ok' : 'status--error'"
                  >
                    {{ health.checks.firestoreConnection }}
                  </span>
                </div>
              </div>

              <div class="check-item">
                <span class="check-item__icon">{{ health.checks.firebaseAuth === 'ok' ? '✅' : '❌' }}</span>
                <div class="check-item__body">
                  <span class="check-item__label">Firebase Auth</span>
                  <span
                    class="check-item__status"
                    :class="health.checks.firebaseAuth === 'ok' ? 'status--ok' : 'status--error'"
                  >
                    {{ health.checks.firebaseAuth }}
                  </span>
                </div>
              </div>

              <div class="check-item">
                <span class="check-item__icon">{{ health.checks.emailService === 'ok' ? '✅' : '❌' }}</span>
                <div class="check-item__body">
                  <span class="check-item__label">Email Service (Resend)</span>
                  <span
                    class="check-item__status"
                    :class="health.checks.emailService === 'ok' ? 'status--ok' : 'status--error'"
                  >
                    {{ health.checks.emailService }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Environment -->
          <section class="health-section">
            <h2 class="health-section__title">Environment</h2>
            <div class="env-grid">
              <div class="env-item">
                <span class="env-item__key">Mode</span>
                <span
                  class="env-item__value"
                  :class="health.environment.mode === 'production' ? 'value--prod' : 'value--dev'"
                >
                  {{ health.environment.mode }}
                </span>
              </div>
              <div class="env-item">
                <span class="env-item__key">NODE_ENV</span>
                <span class="env-item__value">{{ health.environment.nodeEnv }}</span>
              </div>
              <div class="env-item">
                <span class="env-item__key">Data Source</span>
                <span class="env-item__value">{{ health.environment.useFirestore ? 'Firestore' : 'JSON Mock' }}</span>
              </div>
              <div class="env-item">
                <span class="env-item__key">App URL</span>
                <span class="env-item__value">{{ health.environment.appUrl || '(not set)' }}</span>
              </div>
              <div class="env-item">
                <span class="env-item__key">Resend API Key</span>
                <span class="env-item__value">{{ health.environment.resendConfigured ? 'Configured' : 'Not configured' }}</span>
              </div>
              <div class="env-item">
                <span class="env-item__key">Version</span>
                <span class="env-item__value">{{ health.version }}</span>
              </div>
            </div>
          </section>

          <!-- Warnings -->
          <section v-if="health.warnings.length > 0" class="health-section">
            <h2 class="health-section__title">Warnings</h2>
            <ul class="warning-list">
              <li v-for="warning in health.warnings" :key="warning" class="warning-item">
                ⚠️ {{ warning }}
              </li>
            </ul>
          </section>

          <!-- Timestamp -->
          <div class="health-footer">
            Last checked: {{ new Date(health.timestamp).toLocaleString() }}
          </div>
        </template>
      </template>
    </AdminPageContent>
  </PageLayout>
</template>

<style scoped>
/* ==============================
   LOADING
   ============================== */
.health-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--color-text-secondary, #64748b);
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--color-border-light, #e2e8f0);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ==============================
   ERROR
   ============================== */
.health-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--color-text-secondary, #64748b);
}

.health-error__icon { font-size: 2rem; }
.health-error__message { color: #dc2626; font-size: 0.9rem; }

/* ==============================
   BANNERS
   ============================== */
.health-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  font-size: 0.925rem;
  border-bottom: 1px solid var(--color-border-light, #e2e8f0);
}

.health-banner--ok {
  background: #f0fdf4;
  color: #15803d;
}

.health-banner--degraded {
  background: #fff7ed;
  color: #c2410c;
}

.health-banner__icon { font-size: 1.25rem; }

/* ==============================
   SECTIONS
   ============================== */
.health-section {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light, #f1f5f9);
}

.health-section__title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary, #64748b);
  margin-bottom: 0.875rem;
}

/* ==============================
   CHECK LIST
   ============================== */
.check-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: var(--color-bg-secondary, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
}

.check-item__icon { font-size: 1.25rem; flex-shrink: 0; }

.check-item__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 1rem;
}

.check-item__label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary, #1e293b);
}

.check-item__status {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.status--ok { background: #dcfce7; color: #15803d; }
.status--error { background: #fef2f2; color: #dc2626; }

/* ==============================
   ENVIRONMENT GRID
   ============================== */
.env-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.625rem;
}

.env-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: var(--color-bg-secondary, #f8fafc);
  border: 1px solid var(--color-border-light, #e2e8f0);
}

.env-item__key {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary, #64748b);
}

.env-item__value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary, #1e293b);
  word-break: break-all;
}

.value--prod { color: #15803d; font-weight: 700; }
.value--dev { color: #a16207; font-weight: 700; }

/* ==============================
   WARNINGS
   ============================== */
.warning-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.warning-item {
  padding: 0.625rem 1rem;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #c2410c;
}

/* ==============================
   FOOTER
   ============================== */
.health-footer {
  padding: 0.875rem 1.5rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary, #64748b);
  background: var(--color-bg-secondary, #f8fafc);
}
</style>
