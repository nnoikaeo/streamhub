<template>
  <PageLayout
    :breadcrumbs="[{ label: 'หน้าแรก' }]"
    :folders="folderTree"
    :allow-search="true"
    @select-folder="handleSelectFolder"
  >
    <!-- Note: showFolders & showAdmin now determined by user role (role-based) -->
    <!-- Main Content -->
    <div class="dashboard-main-content">
      
      <!-- Page Content -->
      <div class="dashboard-page">
          <div class="dashboard-header">
            <h1 class="dashboard-title">สวัสดี <ClientOnly>{{ user?.displayName || 'User' }}<template #fallback>User</template></ClientOnly></h1>
            <!-- <p class="dashboard-subtitle">{{ user?.email }}</p> -->
          </div>

    <!-- All Users Section -->
    <section class="dashboard-section">
      <h2 class="section-title">พื้นที่ทำงานของฉัน</h2>
      
      <div class="stats-grid stats-grid--2col">
        <DashboardStatCard
          title="แดชบอร์ดของฉัน"
          :count="myDashboardsCount"
          icon="📊"
          link="/dashboard/discover?filter=my"
        />
        <DashboardStatCard
          title="แชร์ให้ฉัน"
          :count="shared?.total"
          :detail="sharedDetail"
          icon="🤝"
          link="/dashboard/discover?filter=shared"
        />
      </div>

      <div class="content-grid">
        <DashboardRecentDashboards :dashboards="recentDashboards" />
        <ClientOnly>
          <DashboardQuickActions
            :can-create="isModerator || isAdmin"
            :can-invite="false"
            @view-dashboards="navigateTo('/dashboard/discover')"
            @create-dashboard="navigateTo(createDashboardPath)"
          />
        </ClientOnly>
      </div>
    </section>

    <!-- Moderator + Admin Section -->
    <ClientOnly>
    <section v-if="isModerator || isAdmin" class="dashboard-section">
      <h2 class="section-title">ภาพรวมบริษัท</h2>

      <div class="stats-grid">
        <DashboardStatCard
          title="แดชบอร์ดบริษัท"
          :count="companyDashboardsCount"
          icon="🏢"
          :link="companyDashboardsLink"
        />
        <DashboardStatCard
          title="โฟลเดอร์"
          :count="foldersCount"
          icon="📁"
          link="/admin/folders"
        />
        <DashboardStatCard
          title="บริษัท"
          :count="companiesCount"
          icon="🏢"
          link="/admin/companies"
        />
      </div>
    </section>
    </ClientOnly>
        </div>
      </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useAdminFolders } from '~/composables/useAdminFolders'
import { useAdminCompanies } from '~/composables/useAdminCompanies'
import type { Dashboard, Folder } from '~/types/dashboard'
import PageLayout from '~/components/compositions/PageLayout.vue'
import { useRecentDashboards } from '~/composables/useRecentDashboards'
import { useDashboardService } from '~/composables/useDashboardService'
import { sharedBreakdown, sharedBreakdownLabel, type SharedBreakdown } from '~/utils/sharedCount'
import { matchesOwnershipFilter } from '~/utils/ownershipFilter'
import { matchesCompanyFilter } from '~/utils/companyFilter'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const { user } = useAuth()
const service = useDashboardService()
const { getRecentDashboards } = useRecentDashboards()
const { folders, fetchFolders } = useAdminFolders()
const { companies, fetchCompanies } = useAdminCompanies()


// Role checks
const isAdmin = computed(() => user.value?.role === 'admin')
const isModerator = computed(() => user.value?.role === 'moderator')

/**
 * Where "สร้างแดชบอร์ด" goes. It used to point at /dashboard/create, a page
 * that was never written — admins and moderators landed on a full-screen 404.
 * Creation lives in Explorer, which each role reaches by a different path.
 */
const createDashboardPath = computed(() =>
  isAdmin.value ? '/admin/explorer' : '/manage/explorer'
)

/**
 * Build folder tree hierarchy with children from flat folders array
 * Converts flat folders to tree structure for FolderTree component
 */
const buildFolderTree = (flatFolders: Folder[]): Folder[] => {
  const folderMap = new Map<string, Folder & { children: Folder[] }>()

  // First pass: create enhanced folder objects with empty children arrays
  for (const folder of flatFolders) {
    folderMap.set(folder.id, {
      ...folder,
      children: []
    })
  }

  // Second pass: build parent-child relationships
  const rootFolders: (Folder & { children: Folder[] })[] = []
  for (const folder of flatFolders) {
    const enhancedFolder = folderMap.get(folder.id)!
    if (folder.parentId) {
      // This folder has a parent
      const parentFolder = folderMap.get(folder.parentId)
      if (parentFolder) {
        parentFolder.children.push(enhancedFolder)
      }
    } else {
      // Root folder (no parent)
      rootFolders.push(enhancedFolder)
    }
  }

  return rootFolders
}

/**
 * Folder tree with hierarchy built from flat folders array
 */
const folderTree = computed(() => buildFolderTree(folders.value))

/**
 * Every count on this page comes from the access-checked list Discover shows,
 * archived left out as Discover does by default, so each card's number is
 * what its link lands on. The page used to count the raw `dashboards`
 * collection, which any signed-in user can read in full — so "แดชบอร์ดบริษัท"
 * was every dashboard in the system, linking to a `?scope=` Discover ignored,
 * and "แดชบอร์ดของฉัน" included archived ones Discover hides.
 * `null` until loaded, so a card shows its placeholder instead of 0.
 */
const visible = ref<Dashboard[] | null>(null)
const loadVisible = async () => {
  const u = user.value
  if (!u?.uid) return
  const { dashboards: list } = await service.getDashboards(u.uid, u.company || '')
  visible.value = list.filter((d) => !d.isArchived)
}

const myDashboardsCount = computed(() =>
  visible.value?.filter((d) => matchesOwnershipFilter(d, 'my', user.value?.uid)).length
)

/** "แชร์ให้ฉัน", split by how the user got in. */
const shared = computed<SharedBreakdown | null>(() => {
  const u = user.value
  if (!visible.value || !u?.uid) return null
  return sharedBreakdown(visible.value, { uid: u.uid, groups: u.groups, company: u.company })
})
const sharedDetail = computed(() =>
  shared.value && !isAdmin.value ? sharedBreakdownLabel(shared.value) : undefined
)

/**
 * "แดชบอร์ดบริษัท": dashboards granted to the user's company (or `ALL`) — the
 * Discover company filter, preset. A user with no company gets the whole list.
 */
const userCompany = computed(() => user.value?.company || '')
const companyDashboardsCount = computed(() => {
  if (!visible.value) return undefined
  const code = userCompany.value
  return code ? visible.value.filter((d) => matchesCompanyFilter(d, code)).length : visible.value.length
})
const companyDashboardsLink = computed(() =>
  userCompany.value
    ? `/dashboard/discover?company=${encodeURIComponent(userCompany.value)}`
    : '/dashboard/discover'
)

const foldersCount = computed(() => folders.value.length)

const companiesCount = computed(() => companies.value.length)

// Recent dashboards - top 5 most recently visited by this user (localStorage)
const recentDashboards = ref<Array<{ id: string; name: string; lastAccessed: string }>>([])

const loadRecentDashboards = () => {
  const uid = user.value?.uid
  if (!uid) return
  recentDashboards.value = getRecentDashboards(uid, 5)
}

// Actions
const handleSelectFolder = (folder: Folder) => {
  // Navigate to discover page with selected folder
  navigateTo(`/dashboard/discover?folder=${folder.id}`)
}

// Fetch all data on mount
onMounted(async () => {
  loadRecentDashboards()
  const isPrivileged = isAdmin.value || isModerator.value
  await Promise.all([
    loadVisible(),
    ...(isPrivileged ? [fetchFolders(), fetchCompanies()] : []),
  ])
})
</script>

<style scoped>
.dashboard-main-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-xl) 0;
  height: 100%;
}

.dashboard-page {
  width: 100%;
}

.dashboard-header {
  margin-bottom: var(--spacing-xl);
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.dashboard-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.dashboard-section {
  margin-bottom: var(--spacing-2xl);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-lg) 0;
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-border-light);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stats-grid--2col {
  grid-template-columns: repeat(2, 1fr);
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
