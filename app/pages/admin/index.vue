<script setup lang="ts">
/**
 * Admin Dashboard Overview Page
 *
 * Features:
 * - Display statistics for all entities (users, dashboards, folders, companies)
 * - Quick action links to management pages
 * - Protected by admin middleware
 * - Admin sidebar navigation
 *
 * Route: /admin
 * Middleware: auth, admin
 */

import { ref, computed, onMounted } from 'vue'
import { mockUsers, mockFolders, mockDashboards, mockCompanies } from '~/composables/useMockData'
import AdminLayout from '~/components/layouts/AdminLayout.vue'
import UnifiedSidebar from '~/components/layouts/UnifiedSidebar.vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// Page meta
definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'default',
})

console.log('📄 [admin/index.vue] Admin dashboard mounted')

// Statistics data
const statistics = ref({
  totalUsers: 0,
  adminCount: 0,
  moderatorCount: 0,
  userCount: 0,
  totalDashboards: 0,
  archivedDashboards: 0,
  totalFolders: 0,
  totalCompanies: 0,
  activeCompanies: 0,
})

/**
 * Load statistics from mock data
 */
const loadStatistics = () => {
  // Users statistics
  statistics.value.totalUsers = mockUsers.length
  statistics.value.adminCount = mockUsers.filter(u => u.role === 'admin').length
  statistics.value.moderatorCount = mockUsers.filter(u => u.role === 'moderator').length
  statistics.value.userCount = mockUsers.filter(u => u.role === 'user').length

  // Dashboards statistics
  statistics.value.totalDashboards = mockDashboards.length
  statistics.value.archivedDashboards = mockDashboards.filter(d => d.isArchived).length

  // Folders statistics
  statistics.value.totalFolders = mockFolders.length

  // Companies statistics
  statistics.value.totalCompanies = mockCompanies.length
  statistics.value.activeCompanies = mockCompanies.filter(c => c.isActive).length
}

/**
 * Quick action items
 */
const quickActions = [
  {
    to: '/admin/users',
    label: 'จัดการผู้ใช้',
    icon: '👥',
    description: 'เพิ่ม แก้ไข ลบผู้ใช้',
    color: 'blue',
  },
  {
    to: '/admin/dashboards',
    label: 'จัดการแดชบอร์ด',
    icon: '📈',
    description: 'เพิ่ม แก้ไข ลบแดชบอร์ด',
    color: 'green',
  },
  {
    to: '/admin/folders',
    label: 'จัดการโฟลเดอร์',
    icon: '📁',
    description: 'จัดการลำดับชั้นโฟลเดอร์',
    color: 'yellow',
  },
  {
    to: '/admin/companies',
    label: 'จัดการบริษัท',
    icon: '🏢',
    description: 'เพิ่ม แก้ไข บริษัท',
    color: 'purple',
  },
  {
    to: '/admin/groups',
    label: 'จัดการกลุ่ม',
    icon: '👫',
    description: 'เพิ่ม แก้ไข ลบกลุ่ม',
    color: 'pink',
  },
  {
    to: '/admin/permissions',
    label: 'จัดการสิทธิ์',
    icon: '🔐',
    description: 'ตั้งค่าสิทธิ์การใช้งาน',
    color: 'red',
  },
]

onMounted(() => {
  loadStatistics()
})
</script>

<template>
  <div class="admin-page">
    <!-- Admin Layout with Unified Sidebar -->
    <div class="admin-layout-wrapper">
      <AdminLayout>
        <!-- Unified Sidebar (Dashboard + Folders + Admin) -->
        <template #sidebar>
          <UnifiedSidebar
            :folders="mockFolders"
            show-folders
            show-admin
            :allow-search="true"
            :allow-create="false"
          />
        </template>

        <!-- Main Content -->
        <div class="admin-content">
          <!-- Page Header -->
          <div class="page-header">
            <h1 class="page-title">Admin Dashboard</h1>
            <p class="page-subtitle">สวัสดี {{ authStore.user?.name || 'Admin' }} 👋</p>
          </div>

          <!-- Statistics Grid -->
          <section class="statistics-section">
            <h2 class="section-title">📊 สถิติทั่วไป</h2>

            <div class="statistics-grid">
              <!-- Users Card -->
              <div class="stat-card stat-card--blue">
                <div class="stat-card__content">
                  <div class="stat-card__icon">👥</div>
                  <div class="stat-card__info">
                    <p class="stat-card__label">ผู้ใช้ทั้งหมด</p>
                    <p class="stat-card__value">{{ statistics.totalUsers }}</p>
                  </div>
                </div>
                <div class="stat-card__breakdown">
                  <span class="badge badge--primary">Admin: {{ statistics.adminCount }}</span>
                  <span class="badge badge--info">Mod: {{ statistics.moderatorCount }}</span>
                  <span class="badge badge--gray">User: {{ statistics.userCount }}</span>
                </div>
              </div>

              <!-- Dashboards Card -->
              <div class="stat-card stat-card--green">
                <div class="stat-card__content">
                  <div class="stat-card__icon">📈</div>
                  <div class="stat-card__info">
                    <p class="stat-card__label">แดชบอร์ด</p>
                    <p class="stat-card__value">{{ statistics.totalDashboards }}</p>
                  </div>
                </div>
                <div class="stat-card__breakdown">
                  <span class="badge badge--success">Active: {{ statistics.totalDashboards - statistics.archivedDashboards }}</span>
                  <span class="badge badge--warning">Archived: {{ statistics.archivedDashboards }}</span>
                </div>
              </div>

              <!-- Folders Card -->
              <div class="stat-card stat-card--yellow">
                <div class="stat-card__content">
                  <div class="stat-card__icon">📁</div>
                  <div class="stat-card__info">
                    <p class="stat-card__label">โฟลเดอร์</p>
                    <p class="stat-card__value">{{ statistics.totalFolders }}</p>
                  </div>
                </div>
              </div>

              <!-- Companies Card -->
              <div class="stat-card stat-card--purple">
                <div class="stat-card__content">
                  <div class="stat-card__icon">🏢</div>
                  <div class="stat-card__info">
                    <p class="stat-card__label">บริษัท</p>
                    <p class="stat-card__value">{{ statistics.totalCompanies }}</p>
                  </div>
                </div>
                <div class="stat-card__breakdown">
                  <span class="badge badge--success">Active: {{ statistics.activeCompanies }}</span>
                  <span class="badge badge--danger">Inactive: {{ statistics.totalCompanies - statistics.activeCompanies }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Quick Actions Section -->
          <section class="actions-section">
            <h2 class="section-title">⚡ การจัดการอย่างรวดเร็ว</h2>

            <div class="actions-grid">
              <NuxtLink
                v-for="action in quickActions"
                :key="action.to"
                :to="action.to"
                :class="['action-card', `action-card--${action.color}`]"
              >
                <div class="action-card__icon">{{ action.icon }}</div>
                <div class="action-card__content">
                  <h3 class="action-card__title">{{ action.label }}</h3>
                  <p class="action-card__description">{{ action.description }}</p>
                </div>
                <div class="action-card__arrow">→</div>
              </NuxtLink>
            </div>
          </section>

          <!-- Footer Info -->
          <section class="info-section">
            <div class="info-box">
              <h3 class="info-box__title">💡 เคล็ดลับ</h3>
              <ul class="info-box__list">
                <li>ใช้เมนู Admin Panel ด้านซ้ายเพื่อนำทางไปยังหน้าต่างต่างๆ</li>
                <li>สามารถค้นหาและกรองข้อมูลในแต่ละหน้าจัดการได้</li>
                <li>สิทธิ์การเข้าถึงถูกตรวจสอบโดยระบบ middleware</li>
              </ul>
            </div>
          </section>
        </div>
      </AdminLayout>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
}

.admin-layout-wrapper {
  min-height: 100vh;
}

/* Main Content */
.admin-content {
  padding: var(--spacing-xl, 2rem) var(--spacing-lg, 1.25rem);
  max-width: 1400px;
}

/* Page Header */
.page-header {
  margin-bottom: var(--spacing-2xl, 2.5rem);
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
}

.page-subtitle {
  margin: var(--spacing-sm, 0.5rem) 0 0;
  font-size: 1rem;
  color: var(--color-text-secondary, #6b7280);
}

/* Section */
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
  margin: 0 0 var(--spacing-lg, 1.25rem);
}

/* Statistics Section */
.statistics-section {
  margin-bottom: var(--spacing-2xl, 2.5rem);
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg, 1.25rem);
}

/* Statistic Card */
.stat-card {
  padding: var(--spacing-lg, 1.25rem);
  background-color: var(--color-bg-primary, #ffffff);
  border-radius: var(--radius-lg, 0.5rem);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
  border-left: 4px solid;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 1rem);
  transition: all var(--transition-base, 0.2s ease);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
}

/* Card Colors */
.stat-card--blue {
  border-left-color: #3b82f6;
  background: linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent);
}

.stat-card--green {
  border-left-color: #10b981;
  background: linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), transparent);
}

.stat-card--yellow {
  border-left-color: #f59e0b;
  background: linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent);
}

.stat-card--purple {
  border-left-color: #a855f7;
  background: linear-gradient(to bottom right, rgba(168, 85, 247, 0.05), transparent);
}

/* Card Content */
.stat-card__content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md, 1rem);
}

.stat-card__icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.stat-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.stat-card__label {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary, #6b7280);
  font-weight: 500;
}

.stat-card__value {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
}

/* Card Breakdown */
.stat-card__breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs, 0.25rem);
}

/* Badges */
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--primary {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge--info {
  background-color: #cffafe;
  color: #164e63;
}

.badge--success {
  background-color: #dcfce7;
  color: #15803d;
}

.badge--warning {
  background-color: #fef3c7;
  color: #92400e;
}

.badge--danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.badge--gray {
  background-color: #f3f4f6;
  color: #6b7280;
}

/* Actions Section */
.actions-section {
  margin-bottom: var(--spacing-2xl, 2.5rem);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg, 1.25rem);
}

/* Action Card */
.action-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 1rem);
  padding: var(--spacing-lg, 1.25rem);
  background-color: var(--color-bg-primary, #ffffff);
  border-radius: var(--radius-lg, 0.5rem);
  border: 2px solid;
  text-decoration: none;
  color: inherit;
  transition: all var(--transition-base, 0.2s ease);
  cursor: pointer;
}

.action-card:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
}

/* Action Card Colors */
.action-card--blue {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.02);
}

.action-card--green {
  border-color: #10b981;
  background-color: rgba(16, 185, 129, 0.02);
}

.action-card--yellow {
  border-color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.02);
}

.action-card--purple {
  border-color: #a855f7;
  background-color: rgba(168, 85, 247, 0.02);
}

.action-card--pink {
  border-color: #ec4899;
  background-color: rgba(236, 72, 153, 0.02);
}

.action-card--red {
  border-color: #ef4444;
  background-color: rgba(239, 68, 68, 0.02);
}

.action-card--active,
.action-card:hover {
  border-color: currentColor;
}

/* Card Parts */
.action-card__icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.action-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.action-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary, #1f2937);
}

.action-card__description {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-secondary, #6b7280);
}

.action-card__arrow {
  font-size: 1.5rem;
  font-weight: 700;
  opacity: 0;
  transition: opacity var(--transition-base, 0.2s ease);
  flex-shrink: 0;
}

.action-card:hover .action-card__arrow {
  opacity: 1;
}

/* Info Section */
.info-section {
  margin-top: var(--spacing-2xl, 2.5rem);
}

.info-box {
  padding: var(--spacing-lg, 1.25rem);
  background-color: var(--color-bg-secondary, #f3f4f6);
  border-radius: var(--radius-lg, 0.5rem);
  border-left: 4px solid var(--color-primary, #3b82f6);
}

.info-box__title {
  margin: 0 0 var(--spacing-md, 1rem);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary, #1f2937);
}

.info-box__list {
  margin: 0;
  padding-left: var(--spacing-lg, 1.25rem);
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.95rem;
}

.info-box__list li {
  margin-bottom: var(--spacing-sm, 0.5rem);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-content {
    padding: var(--spacing-lg, 1.25rem) var(--spacing-md, 1rem);
  }

  .page-title {
    font-size: 1.5rem;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .action-card {
    flex-direction: column;
    text-align: center;
  }

  .action-card__arrow {
    opacity: 1;
    transform: rotate(90deg);
  }
}
</style>
