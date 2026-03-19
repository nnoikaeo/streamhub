<script setup lang="ts">
/**
 * PermissionsPage — Shared Permissions Management Component
 *
 * Used by both admin (/admin/permissions) and moderator (/manage/permissions).
 * Provides searchable dashboard dropdown, PermissionEditor integration,
 * save/reset actions, alerts, and loading/empty states.
 *
 * Role differences controlled via props:
 * - dashboards: all (admin) vs manageable only (moderator)
 * - showRestrictions: true (admin) vs false (moderator)
 * - folderTree: full tree (admin) vs assigned tree (moderator)
 */

import PageLayout from '~/components/compositions/PageLayout.vue'
import PermissionEditor from '~/components/features/PermissionEditor.vue'
import { useDashboardService } from '~/composables/useDashboardService'
import { useAuth } from '~/composables/useAuth'
import type { Dashboard, User, AccessControl, AccessRestrictions, Folder, PermissionMetadata } from '~/types/dashboard'
import type { AdminGroup, Company } from '~/types/admin'

interface Props {
  /** Dashboards available for selection */
  dashboards: Dashboard[]

  /** All users for PermissionEditor */
  allUsers: User[]

  /** All groups for PermissionEditor */
  allGroups: any[]

  /** All companies for PermissionEditor */
  allCompanies: any[]

  /** Whether to show restrictions tab (admin=true, moderator=false) */
  showRestrictions: boolean

  /** Folder tree for PageLayout sidebar */
  folderTree: Folder[]

  /** All folders (flat) for building breadcrumb paths */
  allFolders: Folder[]

  /** PageLayout breadcrumbs */
  breadcrumbs: { label: string; to?: string }[]

  /** Function to get folder path from folderId */
  getFolderPath?: (folderId: string) => Folder[]

  /** Optional permission validation before loading */
  canManageFolder?: (folderId: string) => boolean
}

const props = defineProps<Props>()
const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const dashboardService = useDashboardService()

/** Whether we arrived from explorer via ?dashboard or ?folder query param */
const cameFromExplorer = computed(() => !!route.query.dashboard || !!route.query.folder)

const goBackToExplorer = () => {
  // Navigate back — browser history has the explorer page
  router.back()
}

// ─── State ──────────────────────────────────────────────────────────────

// Non-admin users (admin has implicit access to everything by role)
const nonAdminUsers = computed(() => props.allUsers.filter(u => u.role !== 'admin'))

const selectedDashboardId = ref<string>('')
const currentDashboard = ref<Dashboard | null>(null)
const currentDashboardFolder = ref<string>('')
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const permissionsToEdit = ref<{
  access: AccessControl
  restrictions: AccessRestrictions
}>({
  access: { direct: { users: [], groups: [] }, company: [] },
  restrictions: { revoke: [], expiry: {} },
})

const originalPermissions = ref<{
  access: AccessControl
  restrictions: AccessRestrictions
}>({
  access: { direct: { users: [], groups: [] }, company: [] },
  restrictions: { revoke: [], expiry: {} },
})

// ─── Edit Mode ──────────────────────────────────────────────────────────

const editMode = ref<'dashboard' | 'folder'>('dashboard')

// ─── Folder Mode State ──────────────────────────────────────────────────

const selectedEditFolderId = ref<string>('')
const currentEditFolder = ref<Folder | null>(null)
const folderInheritEnabled = ref(false)

const folderPermissions = ref<{
  access: AccessControl
  restrictions: AccessRestrictions
}>({
  access: { direct: { users: [], groups: [] }, company: [] },
  restrictions: { revoke: [], expiry: {} },
})

const originalFolderPermissions = ref<{
  access: AccessControl
  restrictions: AccessRestrictions
}>({
  access: { direct: { users: [], groups: [] }, company: [] },
  restrictions: { revoke: [], expiry: {} },
})

// ─── Dashboard search dropdown ──────────────────────────────────────────

const dashboardSearchQuery = ref('')
const isDropdownOpen = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

const getFolderBreadcrumb = (folderId: string): string => {
  if (props.getFolderPath) {
    const path = props.getFolderPath(folderId)
    return path.map(f => f.name).join(' > ') || ''
  }
  // Fallback: build path from allFolders
  const parts: string[] = []
  let id: string | null | undefined = folderId
  while (id) {
    const folder = props.allFolders.find(f => f.id === id)
    if (!folder) break
    parts.unshift(folder.name)
    id = folder.parentId ?? null
  }
  return parts.join(' > ') || ''
}

const sortedDashboards = computed(() => {
  return [...props.dashboards].sort((a, b) => {
    const pathA = getFolderBreadcrumb(a.folderId)
    const pathB = getFolderBreadcrumb(b.folderId)
    return pathA.localeCompare(pathB) || a.name.localeCompare(b.name)
  })
})

const filteredDashboards = computed(() => {
  let list = sortedDashboards.value

  if (!dashboardSearchQuery.value) return list
  const q = dashboardSearchQuery.value.toLowerCase()
  return list.filter(d =>
    d.name.toLowerCase().includes(q) || getFolderBreadcrumb(d.folderId).toLowerCase().includes(q)
  )
})

const selectDashboard = (dashboardId: string) => {
  selectedDashboardId.value = dashboardId
  dashboardSearchQuery.value = ''
  isDropdownOpen.value = false
  loadDashboardPermissions()
}

const clearSelection = () => {
  if (cameFromExplorer.value) {
    goBackToExplorer()
    return
  }
  selectedDashboardId.value = ''
  currentDashboard.value = null
  currentDashboardFolder.value = ''
  dashboardSearchQuery.value = ''
}

const focusSearch = () => {
  searchInputRef.value?.focus()
}

// Close dropdown on click outside
const handleClickOutside = (e: MouseEvent) => {
  const wrapper = (e.target as HTMLElement)?.closest('.dashboard-search-wrapper')
  if (!wrapper) isDropdownOpen.value = false
}

// ─── Folder search dropdown ─────────────────────────────────────────────

const folderSearchQuery = ref('')
const isFolderDropdownOpen = ref(false)
const folderSearchInputRef = ref<HTMLInputElement | null>(null)

const flatSortedFolders = computed(() => {
  return [...props.allFolders]
    .filter(f => f.isActive)
    .sort((a, b) => {
      const pathA = getFolderBreadcrumb(a.id)
      const pathB = getFolderBreadcrumb(b.id)
      return pathA.localeCompare(pathB)
    })
})

const filteredEditFolders = computed(() => {
  const list = flatSortedFolders.value
  if (!folderSearchQuery.value) return list
  const q = folderSearchQuery.value.toLowerCase()
  return list.filter(f =>
    f.name.toLowerCase().includes(q) || getFolderBreadcrumb(f.id).toLowerCase().includes(q)
  )
})

const selectEditFolder = (folderId: string) => {
  selectedEditFolderId.value = folderId
  folderSearchQuery.value = ''
  isFolderDropdownOpen.value = false
  loadFolderPermissions()
}

const clearFolderSelection = () => {
  if (cameFromExplorer.value) {
    goBackToExplorer()
    return
  }
  selectedEditFolderId.value = ''
  currentEditFolder.value = null
  folderSearchQuery.value = ''
  folderInheritEnabled.value = false
}

const focusFolderSearch = () => {
  folderSearchInputRef.value?.focus()
}

const handleFolderClickOutside = (e: MouseEvent) => {
  const wrapper = (e.target as HTMLElement)?.closest('.folder-search-wrapper')
  if (!wrapper) isFolderDropdownOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('click', handleFolderClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('click', handleFolderClickOutside)
})

// ─── Computed ───────────────────────────────────────────────────────────

const activePermissions = computed(() => {
  return editMode.value === 'dashboard' ? permissionsToEdit.value : folderPermissions.value
})

const hasChanges = computed(() => {
  if (editMode.value === 'dashboard') {
    return JSON.stringify(permissionsToEdit.value) !== JSON.stringify(originalPermissions.value)
  }
  return JSON.stringify(folderPermissions.value) !== JSON.stringify(originalFolderPermissions.value) ||
    folderInheritEnabled.value !== (currentEditFolder.value?.inheritPermissions ?? false)
})

// ─── Inherited Permissions ──────────────────────────────────────────────

const inheritedExpanded = ref(true)

const getAncestorChain = (folderId: string): Folder[] => {
  const ancestors: Folder[] = []
  let currentId: string | null | undefined = folderId
  while (currentId) {
    const folder = props.allFolders.find(f => f.id === currentId)
    if (!folder) break
    ancestors.push(folder)
    currentId = folder.parentId ?? null
  }
  return ancestors
}

const inheritedFolders = computed((): Folder[] => {
  let folderId = ''
  if (editMode.value === 'dashboard' && currentDashboard.value) {
    folderId = currentDashboard.value.folderId
  } else if (editMode.value === 'folder' && currentEditFolder.value) {
    folderId = currentEditFolder.value.id
  }
  if (!folderId) return []

  const ancestors = getAncestorChain(folderId)
  // For folder mode: skip the folder itself
  const startIdx = editMode.value === 'folder' ? 1 : 0
  return ancestors
    .slice(startIdx)
    .filter(f => f.inheritPermissions && f.access)
})

const getInheritedUserCount = (folder: Folder): number => {
  if (!folder.access) return 0
  const uids = new Set<string>()
  for (const uid of folder.access.direct.users) uids.add(uid)
  for (const gid of folder.access.direct.groups) {
    const group = props.allGroups.find((g: any) => g.id === gid)
    if (group) group.members.forEach((uid: string) => uids.add(uid))
  }
  for (const companyCode of folder.access.company) {
    const usersForCode = companyCode === 'ALL'
      ? nonAdminUsers.value.filter(u => props.allCompanies.some((c: any) => c.code === u.company && c.isActive))
      : nonAdminUsers.value.filter(u => u.company === companyCode)
    usersForCode.forEach(u => uids.add(u.uid))
  }
  return uids.size
}

const formatProvenance = (meta?: PermissionMetadata): string => {
  if (!meta) return ''
  const name = meta.setByName || meta.setBy
  const date = new Date(meta.setAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${name}, ${date}`
}

// ─── Conflict Detection ──────────────────────────────────────────────────

interface ConflictWarning {
  type: 'redundant-grant' | 'revoke-vs-inherited-grant' | 'grant-vs-inherited-revoke'
  message: string
}

const conflicts = computed<ConflictWarning[]>(() => {
  const perms = activePermissions.value
  const warnings: ConflictWarning[] = []

  // 1. Redundant grant: user in direct.users but already covered by company or group
  for (const uid of perms.access.direct.users) {
    const u = props.allUsers.find(x => x.uid === uid)
    if (!u) continue
    if (perms.access.company.includes(u.company) || perms.access.company.includes('ALL')) {
      warnings.push({
        type: 'redundant-grant',
        message: `${u.name} มีสิทธิ์ตรงซ้ำซ้อน — ${perms.access.company.includes('ALL') ? 'ทุกบริษัท' : `บริษัท ${u.company}`} มีสิทธิ์อยู่แล้ว`,
      })
    }
    for (const gid of perms.access.direct.groups) {
      const group = props.allGroups.find((g: any) => g.id === gid)
      if (group?.members.includes(uid)) {
        warnings.push({
          type: 'redundant-grant',
          message: `${u.name} มีสิทธิ์ตรงซ้ำซ้อน — อยู่ในกลุ่ม ${group.name} อยู่แล้ว`,
        })
        break
      }
    }
  }

  // 2. revoke-vs-inherited-grant: user revoked but has inherited access
  for (const uid of perms.restrictions.revoke) {
    const u = props.allUsers.find(x => x.uid === uid)
    if (!u) continue
    for (const folder of inheritedFolders.value) {
      if (!folder.access) continue
      const hasInheritedAccess =
        folder.access.direct.users.includes(uid) ||
        folder.access.company.includes(u.company) ||
        folder.access.company.includes('ALL') ||
        folder.access.direct.groups.some((gid: string) => {
          const g = props.allGroups.find((g: any) => g.id === gid)
          return g?.members.includes(uid)
        })
      if (hasInheritedAccess) {
        warnings.push({
          type: 'revoke-vs-inherited-grant',
          message: `${u.name} ถูกระงับ แต่ยังมีสิทธิ์จากโฟลเดอร์ "${folder.name}" (สิทธิ์สืบทอด)`,
        })
        break
      }
    }
  }

  // 3. grant-vs-inherited-revoke: user granted here but restricted in inherited folder
  for (const folder of inheritedFolders.value) {
    if (!folder.restrictions?.revoke.length) continue
    for (const uid of folder.restrictions.revoke) {
      const u = props.allUsers.find(x => x.uid === uid)
      if (!u) continue
      const hasDirectAccess =
        perms.access.direct.users.includes(uid) ||
        perms.access.company.includes(u.company) ||
        perms.access.company.includes('ALL') ||
        perms.access.direct.groups.some((gid: string) => {
          const g = props.allGroups.find((g: any) => g.id === gid)
          return g?.members.includes(uid)
        })
      if (hasDirectAccess) {
        warnings.push({
          type: 'grant-vs-inherited-revoke',
          message: `${u.name} มีสิทธิ์ที่นี่ แต่ถูกระงับในโฟลเดอร์ "${folder.name}"`,
        })
      }
    }
  }

  return warnings
})

// ─── Effective Access Summary ───────────────────────────────────────────

const effectiveAccessExpanded = ref(false)

interface EffectiveAccessEntry {
  uid: string
  name: string
  company: string
  sources: string[]
}

const effectiveAccess = computed<EffectiveAccessEntry[]>(() => {
  const perms = activePermissions.value
  const isFolderMode = editMode.value === 'folder'
  const userMap = new Map<string, EffectiveAccessEntry>()

  const addUser = (uid: string, source: string) => {
    const u = nonAdminUsers.value.find(x => x.uid === uid)
    if (!u) return
    if (!userMap.has(uid)) {
      userMap.set(uid, { uid, name: u.name, company: u.company, sources: [] })
    }
    const entry = userMap.get(uid)!
    if (!entry.sources.includes(source)) entry.sources.push(source)
  }

  // Direct permissions on the current item (same labels in both modes)
  for (const uid of perms.access.direct.users) addUser(uid, 'สิทธิ์ตรง')

  for (const gid of perms.access.direct.groups) {
    const group = props.allGroups.find((g: any) => g.id === gid)
    if (!group) continue
    for (const uid of group.members) addUser(uid, `กลุ่ม ${group.name}`)
  }

  for (const companyCode of perms.access.company) {
    const usersForCode = companyCode === 'ALL'
      ? nonAdminUsers.value.filter(x => props.allCompanies.some((c: any) => c.code === x.company && c.isActive))
      : nonAdminUsers.value.filter(x => x.company === companyCode)
    const label = companyCode === 'ALL' ? 'ทุกบริษัท' : `บริษัท ${companyCode}`
    for (const u of usersForCode) {
      addUser(u.uid, label)
    }
  }

  // Inherited folder permissions (from parent folders).
  // Skip redundant badges when the user already has the equivalent direct badge.
  for (const folder of inheritedFolders.value) {
    if (!folder.access) continue
    for (const uid of folder.access.direct.users) {
      if (userMap.get(uid)?.sources.includes('สิทธิ์ตรง')) continue
      addUser(uid, `📁 ${folder.name}`)
    }
    for (const gid of folder.access.direct.groups) {
      const group = props.allGroups.find((g: any) => g.id === gid)
      if (!group) continue
      for (const uid of group.members) {
        if (userMap.get(uid)?.sources.includes(`กลุ่ม ${group.name}`)) continue
        addUser(uid, `📁 ${folder.name} · กลุ่ม ${group.name}`)
      }
    }
    for (const companyCode of folder.access.company) {
      const usersForCode = companyCode === 'ALL'
        ? nonAdminUsers.value.filter(x => props.allCompanies.some((c: any) => c.code === x.company && c.isActive))
        : nonAdminUsers.value.filter(x => x.company === companyCode)
      const label = companyCode === 'ALL' ? 'ทุกบริษัท' : `บริษัท ${companyCode}`
      for (const u of usersForCode) {
        if (userMap.get(u.uid)?.sources.includes(label)) continue
        addUser(u.uid, `📁 ${folder.name} · ${label}`)
      }
    }
  }

  // Remove restricted users
  const restricted = new Set<string>(perms.restrictions.revoke)
  const now = new Date()
  for (const [uid, date] of Object.entries(perms.restrictions.expiry)) {
    if (new Date(date as string) < now) restricted.add(uid)
  }
  for (const folder of inheritedFolders.value) {
    if (!folder.restrictions) continue
    for (const uid of folder.restrictions.revoke) restricted.add(uid)
  }
  for (const uid of restricted) userMap.delete(uid)

  return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name))
})

// ─── Load permissions ───────────────────────────────────────────────────

const loadDashboardPermissions = async () => {
  try {
    if (!selectedDashboardId.value) {
      currentDashboard.value = null
      return
    }

    isLoading.value = true
    errorMessage.value = null

    const dashboard = await dashboardService.getDashboard(selectedDashboardId.value)
    if (!dashboard) {
      errorMessage.value = 'ไม่พบแดชบอร์ด'
      return
    }

    // Verify permission if canManageFolder is provided
    if (props.canManageFolder && !props.canManageFolder(dashboard.folderId)) {
      errorMessage.value = 'ไม่มีสิทธิ์จัดการแดชบอร์ดนี้'
      return
    }

    currentDashboard.value = dashboard

    const folder = await dashboardService.getFolder(dashboard.folderId)
    if (folder) {
      currentDashboardFolder.value = folder.name
    }

    const perms = await dashboardService.getDashboardPermissions(selectedDashboardId.value)
    permissionsToEdit.value = {
      access: perms.access,
      restrictions: perms.restrictions,
    }
    originalPermissions.value = JSON.parse(JSON.stringify(permissionsToEdit.value))
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'ไม่สามารถโหลดสิทธิ์ได้'
    console.error('Error loading permissions:', err)
  } finally {
    isLoading.value = false
  }
}

// ─── Load folder permissions ────────────────────────────────────────────

const loadFolderPermissions = () => {
  const folder = props.allFolders.find(f => f.id === selectedEditFolderId.value)
  if (!folder) {
    currentEditFolder.value = null
    return
  }

  currentEditFolder.value = folder
  folderInheritEnabled.value = folder.inheritPermissions ?? false

  const access: AccessControl = folder.access
    ? JSON.parse(JSON.stringify(folder.access))
    : { direct: { users: [], groups: [] }, company: [] }
  const restrictions: AccessRestrictions = folder.restrictions
    ? JSON.parse(JSON.stringify(folder.restrictions))
    : { revoke: [], expiry: {} }

  folderPermissions.value = { access, restrictions }
  originalFolderPermissions.value = JSON.parse(JSON.stringify({ access, restrictions }))
}

// ─── Handle permissions update ──────────────────────────────────────────

const handlePermissionsUpdate = (newPermissions: { access: AccessControl; restrictions: AccessRestrictions }) => {
  if (editMode.value === 'dashboard') {
    permissionsToEdit.value = newPermissions
  } else {
    folderPermissions.value = newPermissions
  }
}

// ─── Save permissions ───────────────────────────────────────────────────

const savePermissions = async () => {
  if (editMode.value === 'folder') {
    await saveFolderPermissions()
    return
  }

  try {
    if (!selectedDashboardId.value || !currentDashboard.value) {
      errorMessage.value = 'ยังไม่ได้เลือกแดชบอร์ด'
      return
    }

    isSaving.value = true
    errorMessage.value = null

    const response = await dashboardService.saveDashboardPermissions({
      dashboardId: selectedDashboardId.value,
      access: permissionsToEdit.value.access,
      restrictions: permissionsToEdit.value.restrictions,
      updatedBy: user.value?.uid ?? '',
    })

    if (response.success) {
      if (cameFromExplorer.value) {
        goBackToExplorer()
        return
      }
      successMessage.value = `บันทึกสิทธิ์สำหรับ "${currentDashboard.value.name}" แล้ว`
      originalPermissions.value = JSON.parse(JSON.stringify(permissionsToEdit.value))
      setTimeout(() => { successMessage.value = null }, 5000)
    } else {
      errorMessage.value = response.message || 'ไม่สามารถบันทึกสิทธิ์ได้'
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'ไม่สามารถบันทึกสิทธิ์ได้'
    console.error('Error saving permissions:', err)
  } finally {
    isSaving.value = false
  }
}

const saveFolderPermissions = async () => {
  try {
    if (!selectedEditFolderId.value || !currentEditFolder.value) {
      errorMessage.value = 'ยังไม่ได้เลือกโฟลเดอร์'
      return
    }

    isSaving.value = true
    errorMessage.value = null

    const permissionMeta: PermissionMetadata = {
      setBy: user.value?.uid ?? '',
      setByName: user.value?.name ?? '',
      setAt: new Date().toISOString(),
    }

    const response = await dashboardService.saveFolderPermissions({
      folderId: selectedEditFolderId.value,
      access: folderPermissions.value.access,
      restrictions: folderPermissions.value.restrictions,
      inheritPermissions: folderInheritEnabled.value,
      permissionMeta,
    })

    if (response.success) {
      if (cameFromExplorer.value) {
        goBackToExplorer()
        return
      }
      successMessage.value = `บันทึกสิทธิ์สำหรับโฟลเดอร์ "${currentEditFolder.value.name}" แล้ว`
      originalFolderPermissions.value = JSON.parse(JSON.stringify(folderPermissions.value))
      currentEditFolder.value = {
        ...currentEditFolder.value,
        access: folderPermissions.value.access,
        restrictions: folderPermissions.value.restrictions,
        inheritPermissions: folderInheritEnabled.value,
        permissionMeta,
      }
      setTimeout(() => { successMessage.value = null }, 5000)
    } else {
      errorMessage.value = response.message || 'ไม่สามารถบันทึกสิทธิ์ได้'
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'ไม่สามารถบันทึกสิทธิ์ได้'
    console.error('Error saving folder permissions:', err)
  } finally {
    isSaving.value = false
  }
}

// ─── Reset ──────────────────────────────────────────────────────────────

const resetEditor = () => {
  if (editMode.value === 'dashboard') {
    permissionsToEdit.value = JSON.parse(JSON.stringify(originalPermissions.value))
  } else {
    folderPermissions.value = JSON.parse(JSON.stringify(originalFolderPermissions.value))
    folderInheritEnabled.value = currentEditFolder.value?.inheritPermissions ?? false
  }
}

// ─── Mode switch ────────────────────────────────────────────────────────

const hasSelection = computed(() => {
  return editMode.value === 'dashboard' ? !!selectedDashboardId.value : !!selectedEditFolderId.value
})

const switchMode = (mode: 'dashboard' | 'folder') => {
  if (editMode.value === mode) return
  editMode.value = mode
  errorMessage.value = null
  successMessage.value = null
}

// Auto-select from query params (?dashboard=xxx or ?folder=xxx)
const queryHandled = ref(false)

watch(() => props.dashboards, (dashboards) => {
  if (queryHandled.value) return
  const dashId = route.query.dashboard as string
  if (dashId && dashboards.length > 0) {
    const exists = dashboards.some(d => d.id === dashId)
    if (exists) {
      queryHandled.value = true
      editMode.value = 'dashboard'
      selectDashboard(dashId)
    }
  }
}, { immediate: true })

watch(() => props.allFolders, (folders) => {
  if (queryHandled.value) return
  const folderId = route.query.folder as string
  if (folderId && folders.length > 0) {
    const exists = folders.some(f => f.id === folderId)
    if (exists) {
      queryHandled.value = true
      editMode.value = 'folder'
      selectEditFolder(folderId)
    }
  }
}, { immediate: true })

</script>

<template>
  <PageLayout
    :folders="folderTree"
    :allow-search="false"
    :allow-create="false"
    :breadcrumbs="breadcrumbs"
  >
    <AdminPageContent>
      <template #header>
        <h1 class="page-header__title">จัดการสิทธิ์</h1>
      </template>

      <template #filters>
        <div class="filter-bar">
          <!-- Mode Toggle (Button Group) -->
          <div class="mode-toggle">
            <button
              type="button"
              class="mode-toggle__btn"
              :class="{ 'mode-toggle__btn--active': editMode === 'dashboard' }"
              @click="switchMode('dashboard')"
            >
              📊 แดชบอร์ด
            </button>
            <button
              type="button"
              class="mode-toggle__btn"
              :class="{ 'mode-toggle__btn--active': editMode === 'folder' }"
              @click="switchMode('folder')"
            >
              📁 โฟลเดอร์
            </button>
          </div>

          <!-- Dashboard Selector (dashboard mode) -->
          <div v-if="editMode === 'dashboard'" class="filter-search dashboard-search-wrapper">
            <div class="dashboard-search" :class="{ 'dashboard-search--open': isDropdownOpen }">
              <input
                ref="searchInputRef"
                v-show="!selectedDashboardId || dashboardSearchQuery"
                v-model="dashboardSearchQuery"
                type="text"
                class="theme-form-input"
                :placeholder="'🔍 เลือกแดชบอร์ดเพื่อจัดการสิทธิ์... (พิมพ์เพื่อค้นหา)'"
                :disabled="isLoading"
                @focus="isDropdownOpen = true"
                @input="isDropdownOpen = true"
              />
              <div
                v-if="selectedDashboardId && !dashboardSearchQuery"
                class="dashboard-search__selected"
                @click="focusSearch"
              >
                <span class="dashboard-search__name">{{ currentDashboard?.name }}</span>
                <span class="dashboard-search__folder">{{ currentDashboardFolder }}</span>
                <button
                  type="button"
                  class="dashboard-search__clear"
                  @click.stop="clearSelection"
                  title="ล้างการเลือก"
                >✕</button>
              </div>
              <div v-if="isDropdownOpen" class="dashboard-dropdown">
                <div
                  v-for="dash in filteredDashboards"
                  :key="dash.id"
                  class="dashboard-dropdown__item"
                  :class="{ 'dashboard-dropdown__item--active': dash.id === selectedDashboardId }"
                  @mousedown.prevent="selectDashboard(dash.id)"
                >
                  <span class="dashboard-dropdown__name">{{ dash.name }}</span>
                  <span class="dashboard-dropdown__folder">{{ getFolderBreadcrumb(dash.folderId) }}</span>
                </div>
                <div v-if="filteredDashboards.length === 0" class="dashboard-dropdown__empty">
                  ไม่พบแดชบอร์ด
                </div>
              </div>
            </div>
          </div>

          <!-- Folder Selector (folder mode) -->
          <div v-if="editMode === 'folder'" class="filter-search folder-search-wrapper">
            <div class="dashboard-search" :class="{ 'dashboard-search--open': isFolderDropdownOpen }">
              <input
                ref="folderSearchInputRef"
                v-show="!selectedEditFolderId || folderSearchQuery"
                v-model="folderSearchQuery"
                type="text"
                class="theme-form-input"
                :placeholder="'🔍 เลือกโฟลเดอร์เพื่อจัดการสิทธิ์... (พิมพ์เพื่อค้นหา)'"
                @focus="isFolderDropdownOpen = true"
                @input="isFolderDropdownOpen = true"
              />
              <div
                v-if="selectedEditFolderId && !folderSearchQuery"
                class="dashboard-search__selected"
                @click="focusFolderSearch"
              >
                <span class="dashboard-search__name">📁 {{ currentEditFolder?.name }}</span>
                <span class="dashboard-search__folder">{{ getFolderBreadcrumb(selectedEditFolderId) }}</span>
                <button
                  type="button"
                  class="dashboard-search__clear"
                  @click.stop="clearFolderSelection"
                  title="ล้างการเลือก"
                >✕</button>
              </div>
              <div v-if="isFolderDropdownOpen" class="dashboard-dropdown">
                <div
                  v-for="folder in filteredEditFolders"
                  :key="folder.id"
                  class="dashboard-dropdown__item"
                  :class="{ 'dashboard-dropdown__item--active': folder.id === selectedEditFolderId }"
                  @mousedown.prevent="selectEditFolder(folder.id)"
                >
                  <span class="dashboard-dropdown__name">📁 {{ folder.name }}</span>
                  <span class="dashboard-dropdown__folder">{{ getFolderBreadcrumb(folder.id) }}</span>
                </div>
                <div v-if="filteredEditFolders.length === 0" class="dashboard-dropdown__empty">
                  ไม่พบโฟลเดอร์
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hint bar (shown when nothing selected) -->
        <div v-if="!hasSelection" class="filter-hint">
          💡 เลือกโหมด <strong>แดชบอร์ด</strong> หรือ <strong>โฟลเดอร์</strong> ด้านซ้าย แล้วค้นหารายการที่ต้องการจัดการสิทธิ์
        </div>
      </template>

      <template #table>
        <!-- Status Messages -->
        <div v-if="successMessage" class="alert alert-success" role="status">
          <span>{{ successMessage }}</span>
          <button type="button" class="alert-close" @click="successMessage = null" aria-label="Dismiss">✕</button>
        </div>

        <div v-if="errorMessage" class="alert alert-error" role="alert">
          <span>{{ errorMessage }}</span>
          <button type="button" class="alert-close" @click="errorMessage = null" aria-label="Dismiss">✕</button>
        </div>

        <!-- ═══ Dashboard Mode ═══ -->
        <div v-if="editMode === 'dashboard' && selectedDashboardId && currentDashboard" class="editor-section">
          <div class="editor-header">
            <div>
              <h2 class="editor-title">{{ currentDashboard.name }}</h2>
              <p class="editor-subtitle">
                โฟลเดอร์: {{ currentDashboardFolder }}
                <template v-if="currentDashboard.permissionMeta">
                  · <span class="provenance-text">{{ formatProvenance(currentDashboard.permissionMeta) }}</span>
                </template>
              </p>
            </div>
            <div class="editor-actions">
              <button
                type="button"
                class="page-header-action-btn page-header-action-btn--secondary"
                @click="resetEditor"
                :disabled="!hasChanges"
              >
                รีเซ็ต
              </button>
              <button
                type="button"
                class="page-header-action-btn"
                @click="savePermissions"
                :disabled="!hasChanges || isSaving"
              >
                {{ isSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
              </button>
            </div>
          </div>

          <!-- Inherited Permissions -->
          <div v-if="inheritedFolders.length > 0" class="inherited-section">
            <button type="button" class="inherited-section__toggle" @click="inheritedExpanded = !inheritedExpanded">
              <span class="inherited-section__icon">{{ inheritedExpanded ? '▼' : '▶' }}</span>
              <span>🔒 สิทธิ์ที่สืบทอดมา ({{ inheritedFolders.length }} โฟลเดอร์)</span>
            </button>
            <div v-if="inheritedExpanded" class="inherited-section__list">
              <div
                v-for="folder in inheritedFolders"
                :key="folder.id"
                class="inherited-row"
              >
                <span class="inherited-row__icon">📁</span>
                <span class="inherited-row__name">{{ folder.name }}</span>
                <span v-if="folder.access?.company.length" class="inherited-row__badge">🏢 {{ folder.access.company.join(', ') }}</span>
                <span class="inherited-row__count">({{ getInheritedUserCount(folder) }} คน)</span>
                <span v-if="folder.permissionMeta" class="inherited-row__provenance">{{ formatProvenance(folder.permissionMeta) }}</span>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="loading-state">
            <div class="loading-spinner" />
            <p>กำลังโหลด...</p>
          </div>

          <!-- Permission Editor Component -->
          <div v-else>
            <PermissionEditor
              :all-users="allUsers"
              :all-groups="allGroups"
              :all-companies="allCompanies"
              :permissions="permissionsToEdit"
              :show-restrictions="showRestrictions"
              @update:permissions="handlePermissionsUpdate"
            />
          </div>

          <!-- Conflict Warnings -->
          <div v-if="conflicts.length > 0" class="conflict-section">
            <div class="conflict-section__title">⚠️ การแจ้งเตือน ({{ conflicts.length }})</div>
            <div
              v-for="(conflict, idx) in conflicts"
              :key="idx"
              class="conflict-item"
              :class="{
                'conflict-item--redundant': conflict.type === 'redundant-grant',
                'conflict-item--warning': conflict.type === 'revoke-vs-inherited-grant',
                'conflict-item--danger': conflict.type === 'grant-vs-inherited-revoke',
              }"
            >
              <span class="conflict-item__icon">{{ conflict.type === 'redundant-grant' ? 'ℹ️' : '⚠️' }}</span>
              <span class="conflict-item__message">{{ conflict.message }}</span>
            </div>
          </div>

          <!-- Effective Access Summary -->
          <div class="effective-section">
            <button type="button" class="effective-section__toggle" @click="effectiveAccessExpanded = !effectiveAccessExpanded">
              <span>ผลลัพธ์รวม: <strong>{{ effectiveAccess.length }} คน</strong> มีสิทธิ์เข้าถึง</span>
              <span class="effective-section__caret">{{ effectiveAccessExpanded ? '▲' : '▼' }}</span>
            </button>
            <div v-if="effectiveAccessExpanded" class="effective-section__list">
              <div
                v-for="entry in effectiveAccess"
                :key="entry.uid"
                class="effective-row"
              >
                <span class="effective-row__name">{{ entry.name }}</span>
                <span class="effective-row__sources">
                  <span v-for="(src, i) in entry.sources" :key="i" class="effective-row__source-badge">{{ src }}</span>
                </span>
              </div>
              <div v-if="effectiveAccess.length === 0" class="effective-section__empty">ไม่มีผู้ใช้ที่มีสิทธิ์เข้าถึง</div>
            </div>
          </div>
        </div>

        <!-- ═══ Folder Mode ═══ -->
        <div v-else-if="editMode === 'folder' && selectedEditFolderId && currentEditFolder" class="editor-section">
          <div class="editor-header">
            <div>
              <h2 class="editor-title">📁 {{ currentEditFolder.name }}</h2>
              <p class="editor-subtitle">
                {{ getFolderBreadcrumb(selectedEditFolderId) }}
                <template v-if="currentEditFolder.permissionMeta">
                  · <span class="provenance-text">{{ formatProvenance(currentEditFolder.permissionMeta) }}</span>
                </template>
              </p>
            </div>
            <div class="editor-actions">
              <button
                type="button"
                class="page-header-action-btn page-header-action-btn--secondary"
                @click="resetEditor"
                :disabled="!hasChanges"
              >
                รีเซ็ต
              </button>
              <button
                type="button"
                class="page-header-action-btn"
                @click="savePermissions"
                :disabled="!hasChanges || isSaving"
              >
                {{ isSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
              </button>
            </div>
          </div>

          <!-- Inherit Toggle -->
          <div class="inherit-toggle">
            <label class="inherit-toggle__label">
              <input
                type="checkbox"
                v-model="folderInheritEnabled"
                class="inherit-toggle__checkbox"
              />
              <span class="inherit-toggle__text">สิทธิ์สืบทอด</span>
            </label>
            <span class="inherit-toggle__hint">เมื่อเปิด สิทธิ์จะส่งต่อไปยังแดชบอร์ดทุกตัวในโฟลเดอร์นี้</span>
          </div>

          <!-- Inherited Permissions from parent folders -->
          <div v-if="inheritedFolders.length > 0" class="inherited-section">
            <button type="button" class="inherited-section__toggle" @click="inheritedExpanded = !inheritedExpanded">
              <span class="inherited-section__icon">{{ inheritedExpanded ? '▼' : '▶' }}</span>
              <span>🔒 สิทธิ์ที่สืบทอดมา ({{ inheritedFolders.length }} โฟลเดอร์)</span>
            </button>
            <div v-if="inheritedExpanded" class="inherited-section__list">
              <div
                v-for="folder in inheritedFolders"
                :key="folder.id"
                class="inherited-row"
              >
                <span class="inherited-row__icon">📁</span>
                <span class="inherited-row__name">{{ folder.name }}</span>
                <span v-if="folder.access?.company.length" class="inherited-row__badge">🏢 {{ folder.access.company.join(', ') }}</span>
                <span class="inherited-row__count">({{ getInheritedUserCount(folder) }} คน)</span>
                <span v-if="folder.permissionMeta" class="inherited-row__provenance">{{ formatProvenance(folder.permissionMeta) }}</span>
              </div>
            </div>
          </div>

          <!-- Permission Editor Component -->
          <PermissionEditor
            :all-users="allUsers"
            :all-groups="allGroups"
            :all-companies="allCompanies"
            :permissions="folderPermissions"
            :show-restrictions="showRestrictions"
            @update:permissions="handlePermissionsUpdate"
          />

          <!-- Conflict Warnings -->
          <div v-if="conflicts.length > 0" class="conflict-section">
            <div class="conflict-section__title">⚠️ การแจ้งเตือน ({{ conflicts.length }})</div>
            <div
              v-for="(conflict, idx) in conflicts"
              :key="idx"
              class="conflict-item"
              :class="{
                'conflict-item--redundant': conflict.type === 'redundant-grant',
                'conflict-item--warning': conflict.type === 'revoke-vs-inherited-grant',
                'conflict-item--danger': conflict.type === 'grant-vs-inherited-revoke',
              }"
            >
              <span class="conflict-item__icon">{{ conflict.type === 'redundant-grant' ? 'ℹ️' : '⚠️' }}</span>
              <span class="conflict-item__message">{{ conflict.message }}</span>
            </div>
          </div>

          <!-- Effective Access Summary -->
          <div class="effective-section">
            <button type="button" class="effective-section__toggle" @click="effectiveAccessExpanded = !effectiveAccessExpanded">
              <span>ผลลัพธ์รวม: <strong>{{ effectiveAccess.length }} คน</strong> มีสิทธิ์เข้าถึง</span>
              <span class="effective-section__caret">{{ effectiveAccessExpanded ? '▲' : '▼' }}</span>
            </button>
            <div v-if="effectiveAccessExpanded" class="effective-section__list">
              <div
                v-for="entry in effectiveAccess"
                :key="entry.uid"
                class="effective-row"
              >
                <span class="effective-row__name">{{ entry.name }}</span>
                <span class="effective-row__sources">
                  <span v-for="(src, i) in entry.sources" :key="i" class="effective-row__source-badge">{{ src }}</span>
                </span>
              </div>
              <div v-if="effectiveAccess.length === 0" class="effective-section__empty">ไม่มีผู้ใช้ที่มีสิทธิ์เข้าถึง</div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!isLoading" class="empty-state">
          <div class="empty-state__icon">🔐</div>
          <h3>{{ editMode === 'dashboard' ? 'เลือกแดชบอร์ด' : 'เลือกโฟลเดอร์' }}</h3>
          <p>{{ editMode === 'dashboard' ? 'เลือกแดชบอร์ดจากด้านบนเพื่อจัดการสิทธิ์' : 'เลือกโฟลเดอร์จากด้านบนเพื่อจัดการสิทธิ์' }}</p>
        </div>
      </template>
    </AdminPageContent>
  </PageLayout>
</template>

<style scoped>
/* Filter Bar */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  width: 100%;
}

.filter-search {
  flex: 1;
  min-width: 0;
}

/* Mode Toggle (Button Group — Bootstrap btn-outline-primary style) */
.mode-toggle {
  display: inline-flex;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid var(--color-primary, #2d3389);
  flex-shrink: 0;
}

.mode-toggle__btn {
  position: relative;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-right: 1px solid var(--color-primary, #2d3389);
  background: var(--color-bg-primary, white);
  color: var(--color-primary, #2d3389);
  transition: background-color 0.15s ease, color 0.15s ease;
  font-family: inherit;
  white-space: nowrap;
}

.mode-toggle__btn:last-child {
  border-right: none;
}

.mode-toggle__btn:hover:not(.mode-toggle__btn--active) {
  background: var(--color-primary-lightest, #e0e5f3);
}

.mode-toggle__btn--active {
  background: var(--color-primary);
  color: white;
  z-index: 1;
}

/* Filter Hint */
.filter-hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-primary-dark, #1e3a5f);
  background-color: var(--color-primary-lightest, #eff6ff);
  border: 1px solid var(--color-primary-lighter, #bfdbfe);
  border-radius: 0.5rem;
  margin-top: var(--spacing-xs, 0.25rem);
}

/* Dashboard / Folder Search Dropdown */
.dashboard-search-wrapper,
.folder-search-wrapper {
  position: relative;
}

.dashboard-search {
  position: relative;
  height: 2.375rem;
}

.dashboard-search .theme-form-input {
  height: 100%;
}

.dashboard-search__selected {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
  padding: 0 2.25rem 0 var(--spacing-md, 0.75rem);
  cursor: pointer;
  background: var(--color-bg-primary, white);
  border: 1px solid var(--color-border-default, #d1d5db);
  border-radius: 0.5rem;
  overflow: hidden;
}

.dashboard-search__name {
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-search__folder {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.dashboard-search__clear {
  position: absolute;
  right: 0.375rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  padding: 0.25rem 0.375rem;
  line-height: 1;
  border-radius: 0.25rem;
  z-index: 1;
}

.dashboard-search__clear:hover {
  color: var(--color-text-primary);
}

.dashboard-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 320px;
  overflow-y: auto;
  background: white;
  border: 1px solid var(--color-border-default, #d1d5db);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,.1));
}

.dashboard-dropdown__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background-color 0.15s;
}

.dashboard-dropdown__item:hover {
  background-color: var(--color-bg-secondary, #f3f4f6);
}

.dashboard-dropdown__item--active {
  background-color: var(--color-primary-light, #e0e7ff);
  font-weight: 600;
}

.dashboard-dropdown__name {
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-dropdown__folder {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.dashboard-dropdown__empty {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Editor Section */
.editor-section {
  padding: var(--spacing-lg);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  gap: var(--spacing-md);
}

.editor-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.editor-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0.25rem 0 0 0;
}

.provenance-text {
  font-style: italic;
  color: var(--color-text-tertiary, #9ca3af);
}

.editor-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.page-header-action-btn--secondary {
  background: white !important;
  color: var(--color-text-primary) !important;
  border: 1px solid var(--color-border-default) !important;
}

.page-header-action-btn--secondary:hover:not(:disabled) {
  background: var(--color-bg-secondary) !important;
}

/* Inherited Permissions Section */
.inherited-section {
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.inherited-section__toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: var(--color-bg-tertiary, #f9fafb);
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  font-family: inherit;
  text-align: left;
}

.inherited-section__toggle:hover {
  background: var(--color-bg-secondary, #f3f4f6);
}

.inherited-section__icon {
  font-size: 0.7rem;
  width: 1rem;
  text-align: center;
}

.inherited-section__list {
  border-top: 1px solid var(--color-border-light, #e5e7eb);
}

.inherited-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
}

.inherited-row:last-child {
  border-bottom: none;
}

.inherited-row__icon {
  flex-shrink: 0;
}

.inherited-row__name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.inherited-row__badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  background: var(--color-primary-lightest, #eff6ff);
  color: var(--color-primary, #2563eb);
  border-radius: 9999px;
}

.inherited-row__count {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.inherited-row__provenance {
  margin-left: auto;
  font-size: 0.75rem;
  font-style: italic;
  color: var(--color-text-tertiary, #9ca3af);
}

/* Inherit Toggle (folder mode) */
.inherit-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-tertiary, #f9fafb);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md);
}

.inherit-toggle__label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
}

.inherit-toggle__checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.inherit-toggle__text {
  color: var(--color-text-primary);
}

.inherit-toggle__hint {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

/* Conflict Warnings */
.conflict-section {
  margin-top: var(--spacing-lg);
}

.conflict-section__title {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}

.conflict-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  margin-bottom: 0.25rem;
}

.conflict-item--redundant {
  background: #eff6ff;
  color: #1e40af;
}

.conflict-item--warning {
  background: #fffbeb;
  color: #92400e;
}

.conflict-item--danger {
  background: #fef2f2;
  color: #991b1b;
}

.conflict-item__icon {
  flex-shrink: 0;
}

.conflict-item__message {
  line-height: 1.4;
}

/* Effective Access Summary */
.effective-section {
  margin-top: var(--spacing-lg);
  border: 1px solid var(--color-border-light, #e5e7eb);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.effective-section__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: var(--color-bg-tertiary, #f9fafb);
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  font-family: inherit;
}

.effective-section__toggle:hover {
  background: var(--color-bg-secondary, #f3f4f6);
}

.effective-section__caret {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.effective-section__list {
  border-top: 1px solid var(--color-border-light, #e5e7eb);
  max-height: 300px;
  overflow-y: auto;
}

.effective-section__empty {
  padding: 1rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.effective-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  border-bottom: 1px solid var(--color-border-light, #e5e7eb);
}

.effective-row:last-child {
  border-bottom: none;
}

.effective-row__name {
  font-weight: 500;
  color: var(--color-text-primary);
  min-width: 8rem;
}

.effective-row__sources {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  flex: 1;
  justify-content: flex-end;
}

.effective-row__source-badge {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background-color: var(--color-primary-lightest, #eff6ff);
  color: var(--color-primary-dark, #1e3a5f);
  white-space: nowrap;
}

/* Alerts */
.alert {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  margin: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.alert-success {
  background: var(--color-bg-success, #f0fdf4);
  border: 1px solid var(--color-border-success, #bbf7d0);
  color: var(--color-success, #16a34a);
}

.alert-error {
  background: var(--color-bg-error, #fef2f2);
  border: 1px solid var(--color-border-error, #fecaca);
  color: var(--color-error, #dc2626);
}

.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 1rem;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  padding: 3rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--color-border-light, #e5e7eb);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 4rem 2rem;
  text-align: center;
}

.empty-state__icon {
  font-size: 3rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .editor-actions {
    width: 100%;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .mode-toggle {
    width: 100%;
    display: flex;
  }

  .mode-toggle__btn {
    flex: 1;
  }

  .filter-search {
    width: 100%;
  }

  .inherited-row {
    flex-wrap: wrap;
  }

  .inherited-row__provenance {
    margin-left: 0;
    width: 100%;
  }

  .effective-row {
    flex-wrap: wrap;
  }
}
</style>
