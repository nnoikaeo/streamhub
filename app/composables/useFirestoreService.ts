/**
 * Firestore Service
 * Implements IDashboardService interface using Cloud Firestore
 *
 * Replaces JSONMockService for production use.
 * Toggle via NUXT_PUBLIC_USE_FIRESTORE=true
 *
 * Usage:
 * const service = new FirestoreService()
 * const dashboards = await service.getDashboards(userId, companyId)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'

import type {
  User,
  Dashboard,
  DashboardCardData,
  Folder,
  GetDashboardsResponse,
  GetFoldersResponse,
  AuditLogEntry,
  AccessControl,
  AccessRestrictions,
  SavePermissionsRequest,
  SaveFolderPermissionsRequest,
  FolderPermissionsResponse,
  SavePermissionsResponse,
} from '~/types/dashboard'
import type { IDashboardService } from '~/composables/useDashboardService'

// ============================================================================
// HELPERS
// ============================================================================

/** Convert Firestore Timestamps to JS Dates in a document */
function convertTimestamps<T extends Record<string, any>>(data: T): T {
  const result = { ...data }
  for (const key of Object.keys(result)) {
    const value = result[key]
    if (value instanceof Timestamp) {
      ;(result as any)[key] = value.toDate()
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      ;(result as any)[key] = convertTimestamps(value as Record<string, any>)
    }
  }
  return result
}

// ============================================================================
// FIRESTORE SERVICE
// ============================================================================

export class FirestoreService implements IDashboardService {
  private db: Firestore
  private DEBUG = false

  constructor() {
    const { $firebase } = useNuxtApp()
    this.db = ($firebase as any).db
  }

  private log(label: string, data?: any) {
    if (this.DEBUG) {
      if (data !== undefined) {
        console.log(`🔥 [FirestoreService] ${label}`, data)
      } else {
        console.log(`🔥 [FirestoreService] ${label}`)
      }
    }
  }

  // ========== USER OPERATIONS ==========

  async getCurrentUser(): Promise<User | null> {
    try {
      const authStore = useAuthStore()
      if (!authStore.user?.uid) return null
      return this.getUser(authStore.user.uid)
    } catch (error) {
      console.error('❌ [FirestoreService] getCurrentUser error:', error)
      return null
    }
  }

  async getUser(uid: string): Promise<User | null> {
    try {
      this.log('getUser:', uid)
      const snap = await getDoc(doc(this.db, 'users', uid))
      if (!snap.exists()) return null
      return convertTimestamps({ uid: snap.id, ...snap.data() }) as User
    } catch (error) {
      console.error('❌ [FirestoreService] getUser error:', error)
      return null
    }
  }

  // ========== FOLDER OPERATIONS ==========

  async getFolders(userId: string, companyId: string): Promise<GetFoldersResponse> {
    try {
      this.log('getFolders:', { userId, companyId })
      const user = await this.getUser(userId)
      if (!user) return { folders: [], hierarchy: [] }

      // Fetch all active folders
      const q = query(collection(this.db, 'folders'), where('isActive', '==', true))
      const snap = await getDocs(q)
      const allFolders = snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Folder)

      // Fetch all dashboards to determine accessible folders
      const dashSnap = await getDocs(collection(this.db, 'dashboards'))
      const allDashboards = dashSnap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Dashboard)

      // Filter dashboards accessible to user
      const accessibleDashboards = allDashboards.filter(dash => {
        if (dash.isArchived) return false
        return this.checkAccess(dash, user)
      })

      const accessibleFolderIds = new Set(accessibleDashboards.map(d => d.folderId))

      // Filter to folders that contain accessible dashboards (or descendants do)
      const filteredFolders = allFolders.filter(folder =>
        this.hasFolderAccessibleDashboards(folder.id, accessibleFolderIds, allFolders),
      )

      // Build tree
      const folderTree = this.buildFolderTree(filteredFolders)

      this.log(`✅ getFolders: ${filteredFolders.length} folders`)
      return { folders: folderTree, hierarchy: [] }
    } catch (error) {
      console.error('❌ [FirestoreService] getFolders error:', error)
      return { folders: [], hierarchy: [] }
    }
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    try {
      this.log('getFolder:', folderId)
      const snap = await getDoc(doc(this.db, 'folders', folderId))
      if (!snap.exists()) return null
      return convertTimestamps({ id: snap.id, ...snap.data() }) as Folder
    } catch (error) {
      console.error('❌ [FirestoreService] getFolder error:', error)
      return null
    }
  }

  async getChildFolders(parentId: string | null): Promise<Folder[]> {
    try {
      this.log('getChildFolders:', parentId)
      const q = parentId
        ? query(collection(this.db, 'folders'), where('parentId', '==', parentId))
        : query(collection(this.db, 'folders'), where('parentId', '==', null))
      const snap = await getDocs(q)
      return snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Folder)
    } catch (error) {
      console.error('❌ [FirestoreService] getChildFolders error:', error)
      return []
    }
  }

  async getFolderPath(folderId: string): Promise<Folder[]> {
    try {
      this.log('getFolderPath:', folderId)
      const path: Folder[] = []
      let currentId: string | null | undefined = folderId

      while (currentId) {
        const folder = await this.getFolder(currentId)
        if (!folder) break
        path.unshift(folder)
        currentId = folder.parentId
      }

      return path
    } catch (error) {
      console.error('❌ [FirestoreService] getFolderPath error:', error)
      return []
    }
  }

  // ========== DASHBOARD OPERATIONS ==========

  async getDashboards(
    userId: string,
    companyId: string,
    options?: {
      folderId?: string
      limit?: number
      offset?: number
      search?: string
      includeArchived?: boolean
    },
  ): Promise<GetDashboardsResponse> {
    try {
      this.log('getDashboards:', { userId, companyId, options })
      const user = await this.getUser(userId)
      if (!user) return { dashboards: [], total: 0, hasMore: false }

      // Build Firestore query
      let q = query(collection(this.db, 'dashboards'))

      if (options?.folderId) {
        q = query(q, where('folderId', '==', options.folderId))
      }

      const snap = await getDocs(q)
      let dashboards = snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Dashboard)

      // Filter by access
      dashboards = dashboards.filter(dash => this.checkAccess(dash, user))

      // Filter archived
      if (!options?.includeArchived) {
        dashboards = dashboards.filter(d => !d.isArchived)
      }

      // Search filter
      if (options?.search) {
        const searchLower = options.search.toLowerCase()
        dashboards = dashboards.filter(d =>
          d.name.toLowerCase().includes(searchLower)
          || d.description?.toLowerCase().includes(searchLower),
        )
      }

      this.log(`✅ getDashboards: ${dashboards.length} dashboards`)
      return {
        dashboards,
        total: dashboards.length,
        hasMore: false,
      }
    } catch (error) {
      console.error('❌ [FirestoreService] getDashboards error:', error)
      return { dashboards: [], total: 0, hasMore: false }
    }
  }

  async getDashboard(dashboardId: string): Promise<Dashboard | null> {
    try {
      this.log('getDashboard:', dashboardId)
      const snap = await getDoc(doc(this.db, 'dashboards', dashboardId))
      if (!snap.exists()) return null
      return convertTimestamps({ id: snap.id, ...snap.data() }) as Dashboard
    } catch (error) {
      console.error('❌ [FirestoreService] getDashboard error:', error)
      return null
    }
  }

  async getDashboardEmbedUrl(dashboardId: string): Promise<string | null> {
    try {
      this.log('getDashboardEmbedUrl:', dashboardId)

      // Use server proxy endpoint (same as JSONMockService)
      const authStore = useAuthStore()
      const uid = authStore.user?.uid

      const authHeaders = await this.getAuthHeaders()
      const response = await $fetch<{ success: boolean; data?: { proxyUrl: string } }>('/api/embed/request', {
        method: 'POST',
        body: { dashboardId },
        query: uid ? { uid } : {},
        headers: authHeaders,
      })

      if (response.success && response.data?.proxyUrl) {
        return response.data.proxyUrl
      }
      return null
    } catch (error) {
      console.error('❌ [FirestoreService] getDashboardEmbedUrl error:', error)
      return null
    }
  }

  async getDashboardsByFolder(folderId: string, userId: string): Promise<Dashboard[]> {
    try {
      this.log('getDashboardsByFolder:', { folderId, userId })
      const user = await this.getUser(userId)
      if (!user) return []

      const q = query(collection(this.db, 'dashboards'), where('folderId', '==', folderId))
      const snap = await getDocs(q)
      const dashboards = snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as Dashboard)

      return dashboards.filter(dash => this.checkAccess(dash, user))
    } catch (error) {
      console.error('❌ [FirestoreService] getDashboardsByFolder error:', error)
      return []
    }
  }

  async getDashboardCard(dashboardId: string, _currentUserId: string): Promise<DashboardCardData | null> {
    try {
      const dashboard = await this.getDashboard(dashboardId)
      if (!dashboard) return null

      return {
        ...dashboard,
        accessReason: { layer: 1, type: 'user', name: '' },
        isOwner: false,
        canEdit: false,
        canDelete: false,
        canShare: false,
        canManageAccess: false,
      } as DashboardCardData
    } catch (error) {
      console.error('❌ [FirestoreService] getDashboardCard error:', error)
      return null
    }
  }

  // ========== PERMISSION CHECK ==========

  async canAccessDashboard(dashboardId: string, userId: string): Promise<boolean> {
    try {
      this.log('canAccessDashboard:', { dashboardId, userId })
      const dashboard = await this.getDashboard(dashboardId)
      const user = await this.getUser(userId)
      if (!dashboard || !user) return false
      return this.checkAccess(dashboard, user)
    } catch (error) {
      console.error('❌ [FirestoreService] canAccessDashboard error:', error)
      return false
    }
  }

  async getAccessReason(
    dashboardId: string,
    userId: string,
  ): Promise<{
    hasAccess: boolean
    layer?: 1 | 2
    grantedBy?: 'user' | 'role' | 'group'
    grantName?: string
  }> {
    const hasAccess = await this.canAccessDashboard(dashboardId, userId)
    return { hasAccess }
  }

  // ========== PERMISSION MANAGEMENT ==========

  async saveDashboardPermissions(request: SavePermissionsRequest): Promise<SavePermissionsResponse> {
    try {
      this.log('saveDashboardPermissions:', request.dashboardId)
      const ref = doc(this.db, 'dashboards', request.dashboardId)
      await updateDoc(ref, {
        access: request.access,
        restrictions: request.restrictions,
        updatedAt: Timestamp.now(),
      })
      return { success: true, message: 'Permissions saved', updatedAt: new Date() }
    } catch (error) {
      console.error('❌ [FirestoreService] saveDashboardPermissions error:', error)
      return { success: false, message: 'Failed to save permissions', updatedAt: new Date() }
    }
  }

  async getDashboardPermissions(dashboardId: string): Promise<{ access: any; restrictions: any }> {
    try {
      const dashboard = await this.getDashboard(dashboardId)
      if (!dashboard) {
        return {
          access: { direct: { users: [], groups: [] }, company: [] },
          restrictions: { revoke: [], expiry: {} },
        }
      }
      return {
        access: dashboard.access ?? { direct: { users: [], groups: [] }, company: [] },
        restrictions: dashboard.restrictions ?? { revoke: [], expiry: {} },
      }
    } catch (error) {
      console.error('❌ [FirestoreService] getDashboardPermissions error:', error)
      return {
        access: { direct: { users: [], groups: [] }, company: [] },
        restrictions: { revoke: [], expiry: {} },
      }
    }
  }

  async getAccessibleUsers(dashboardId: string): Promise<User[]> {
    try {
      const dashboard = await this.getDashboard(dashboardId)
      if (!dashboard) return []

      const snap = await getDocs(collection(this.db, 'users'))
      const allUsers = snap.docs.map(d => convertTimestamps({ uid: d.id, ...d.data() }) as User)

      const groupSnap = await getDocs(collection(this.db, 'groups'))
      const allGroups = groupSnap.docs.map(d => ({ id: d.id, members: (d.data().members || []) as string[] }))

      return this.resolveEffectiveUsers(
        dashboard.access,
        dashboard.restrictions,
        allUsers,
        allGroups,
      )
    } catch (error) {
      console.error('❌ [FirestoreService] getAccessibleUsers error:', error)
      return []
    }
  }

  // ========== FOLDER PERMISSIONS ==========

  async saveFolderPermissions(request: SaveFolderPermissionsRequest): Promise<SavePermissionsResponse> {
    try {
      this.log('saveFolderPermissions:', request.folderId)
      const ref = doc(this.db, 'folders', request.folderId)
      await updateDoc(ref, {
        access: request.access,
        restrictions: request.restrictions,
        inheritPermissions: request.inheritPermissions,
        permissionMeta: request.permissionMeta || null,
        updatedAt: Timestamp.now(),
      })
      return { success: true, message: 'Folder permissions saved', updatedAt: new Date() }
    } catch (error) {
      console.error('❌ [FirestoreService] saveFolderPermissions error:', error)
      return { success: false, message: 'Failed to save folder permissions', updatedAt: new Date() }
    }
  }

  async getFolderPermissions(folderId: string): Promise<FolderPermissionsResponse> {
    try {
      const folder = await this.getFolder(folderId)
      if (!folder) {
        return {
          access: { direct: { users: [], groups: [] }, company: [] },
          restrictions: { revoke: [], expiry: {} },
          inheritPermissions: false,
        }
      }
      return {
        access: folder.access ?? { direct: { users: [], groups: [] }, company: [] },
        restrictions: folder.restrictions ?? { revoke: [], expiry: {} },
        inheritPermissions: folder.inheritPermissions ?? false,
        permissionMeta: folder.permissionMeta,
      }
    } catch (error) {
      console.error('❌ [FirestoreService] getFolderPermissions error:', error)
      return {
        access: { direct: { users: [], groups: [] }, company: [] },
        restrictions: { revoke: [], expiry: {} },
        inheritPermissions: false,
      }
    }
  }

  async resolveEffectiveUsers(
    access: AccessControl,
    restrictions: AccessRestrictions,
    allUsers: User[],
    allGroups: { id: string; members: string[] }[],
  ): Promise<User[]> {
    try {
      const uids = new Set<string>()

      // Direct users
      for (const uid of access.direct.users) uids.add(uid)

      // Group members
      for (const gid of access.direct.groups) {
        const group = allGroups.find(g => g.id === gid)
        if (group) group.members.forEach(uid => uids.add(uid))
      }

      // Company users
      for (const companyCode of access.company) {
        allUsers.filter(u => u.company === companyCode).forEach(u => uids.add(u.uid))
      }

      // Remove restricted
      for (const uid of restrictions.revoke) uids.delete(uid)
      const now = new Date()
      for (const [uid, date] of Object.entries(restrictions.expiry)) {
        if (new Date(date as any) < now) uids.delete(uid)
      }

      return allUsers.filter(u => uids.has(u.uid))
    } catch (error) {
      console.error('❌ [FirestoreService] resolveEffectiveUsers error:', error)
      return []
    }
  }

  // ========== QUICK SHARE ==========

  async quickShareDashboard(
    dashboardId: string,
    selectedUserIds: string[],
    expiryDate?: Date,
  ): Promise<SavePermissionsResponse> {
    try {
      this.log('quickShareDashboard:', { dashboardId, selectedUserIds })
      const dashboard = await this.getDashboard(dashboardId)
      if (!dashboard) return { success: false, message: 'Dashboard not found', updatedAt: new Date() }

      const access = dashboard.access ?? { direct: { users: [], groups: [] }, company: [] }
      const directUsers = new Set(access.direct.users)
      selectedUserIds.forEach(uid => directUsers.add(uid))
      access.direct.users = Array.from(directUsers)

      const updateData: Record<string, any> = {
        access,
        updatedAt: Timestamp.now(),
      }

      // Set expiry if provided
      if (expiryDate) {
        const restrictions = dashboard.restrictions ?? { revoke: [], expiry: {} }
        for (const uid of selectedUserIds) {
          ;(restrictions.expiry as Record<string, any>)[uid] = Timestamp.fromDate(expiryDate)
        }
        updateData.restrictions = restrictions
      }

      await updateDoc(doc(this.db, 'dashboards', dashboardId), updateData)
      return { success: true, message: 'Quick share successful', updatedAt: new Date() }
    } catch (error) {
      console.error('❌ [FirestoreService] quickShareDashboard error:', error)
      return { success: false, message: 'Quick share failed', updatedAt: new Date() }
    }
  }

  async getDirectAccessUsers(dashboardId: string): Promise<User[]> {
    try {
      const dashboard = await this.getDashboard(dashboardId)
      if (!dashboard) return []

      const directUids = dashboard.access?.direct?.users || []
      if (directUids.length === 0) return []

      const users: User[] = []
      for (const uid of directUids) {
        const user = await this.getUser(uid)
        if (user) users.push(user)
      }
      return users
    } catch (error) {
      console.error('❌ [FirestoreService] getDirectAccessUsers error:', error)
      return []
    }
  }

  async removeDirectAccess(dashboardId: string, userId: string): Promise<SavePermissionsResponse> {
    try {
      this.log('removeDirectAccess:', { dashboardId, userId })
      const dashboard = await this.getDashboard(dashboardId)
      if (!dashboard) return { success: false, message: 'Dashboard not found', updatedAt: new Date() }

      const access = dashboard.access ?? { direct: { users: [], groups: [] }, company: [] }
      access.direct.users = access.direct.users.filter((uid: string) => uid !== userId)

      await updateDoc(doc(this.db, 'dashboards', dashboardId), {
        access,
        updatedAt: Timestamp.now(),
      })
      return { success: true, message: 'Access removed', updatedAt: new Date() }
    } catch (error) {
      console.error('❌ [FirestoreService] removeDirectAccess error:', error)
      return { success: false, message: 'Failed to remove access', updatedAt: new Date() }
    }
  }

  // ========== AUDIT LOG ==========

  async getAuditLog(dashboardId?: string, limit?: number): Promise<AuditLogEntry[]> {
    try {
      this.log('getAuditLog:', dashboardId)

      let q = query(
        collection(this.db, 'audit-log'),
        orderBy('timestamp', 'desc'),
      )

      if (dashboardId) {
        q = query(q, where('targetId', '==', dashboardId))
      }

      if (limit) {
        q = query(q, firestoreLimit(limit))
      }

      const snap = await getDocs(q)
      return snap.docs.map(d => convertTimestamps({ id: d.id, ...d.data() }) as unknown as AuditLogEntry)
    } catch (error) {
      console.error('❌ [FirestoreService] getAuditLog error:', error)
      return []
    }
  }

  // ========== DASHBOARD MODIFICATION ==========

  async createDashboard(
    name: string,
    folderId: string,
    userId: string,
    description?: string,
  ): Promise<Dashboard> {
    this.log('createDashboard:', { name, folderId })
    const id = `dash_${Date.now()}`
    const now = new Date()

    const dashboard: Record<string, any> = {
      name,
      folderId,
      type: 'looker',
      description: description || '',
      owner: userId,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      updatedBy: userId,
      tags: [],
      isArchived: false,
      access: { direct: { users: [], groups: [] }, company: [] },
      restrictions: { revoke: [], expiry: {} },
    }

    await setDoc(doc(this.db, 'dashboards', id), dashboard)

    return { id, ...dashboard, createdAt: now, updatedAt: now } as unknown as Dashboard
  }

  async updateDashboard(dashboard: Dashboard): Promise<Dashboard> {
    this.log('updateDashboard:', dashboard.id)
    const ref = doc(this.db, 'dashboards', dashboard.id)
    await updateDoc(ref, {
      name: dashboard.name,
      description: dashboard.description ?? '',
      tags: dashboard.tags ?? [],
      folderId: dashboard.folderId,
      isArchived: dashboard.isArchived ?? false,
      updatedAt: Timestamp.now(),
    })
    return { ...dashboard, updatedAt: new Date() }
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    this.log('deleteDashboard:', dashboardId)
    await deleteDoc(doc(this.db, 'dashboards', dashboardId))
  }

  async archiveDashboard(dashboardId: string): Promise<Dashboard> {
    this.log('archiveDashboard:', dashboardId)
    const ref = doc(this.db, 'dashboards', dashboardId)
    const now = Timestamp.now()
    await updateDoc(ref, { isArchived: true, archivedAt: now, updatedAt: now })

    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) throw new Error('Dashboard not found')
    return dashboard
  }

  async unarchiveDashboard(dashboardId: string): Promise<Dashboard> {
    this.log('unarchiveDashboard:', dashboardId)
    const ref = doc(this.db, 'dashboards', dashboardId)
    await updateDoc(ref, { isArchived: false, archivedAt: null, updatedAt: Timestamp.now() })

    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) throw new Error('Dashboard not found')
    return dashboard
  }

  // ========== PRIVATE HELPERS ==========

  /** Get auth headers for server API calls */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { getIdToken } = useAuth()
      const token = await getIdToken()
      if (token) return { Authorization: `Bearer ${token}` }
    } catch {
      // Auth may not be available
    }
    return {}
  }

  /** Check 3-layer access for a dashboard and user */
  private checkAccess(dashboard: Dashboard, user: User): boolean {
    // Admin bypass
    if (user.role === 'admin') return true

    const access = dashboard.access
    const restrictions = dashboard.restrictions

    // Layer 3: check restrictions first
    if (restrictions?.revoke?.includes(user.uid)) return false
    const expiryDate = restrictions?.expiry?.[user.uid]
    if (expiryDate) {
      if (new Date() > new Date(expiryDate as any)) return false
    }

    // Layer 1a: direct user access
    if (access?.direct?.users?.includes(user.uid)) return true

    // Layer 1b: group access
    if (user.groups?.some((g: string) => access?.direct?.groups?.includes(g))) return true

    // Layer 2: company access
    // Empty company array means "all companies"
    if (access?.company?.length === 0) return true
    if (access?.company?.includes(user.company)) return true

    return false
  }

  /** Check if folder or any descendant has accessible dashboards */
  private hasFolderAccessibleDashboards(
    folderId: string,
    accessibleFolderIds: Set<string>,
    allFolders: Folder[],
  ): boolean {
    if (accessibleFolderIds.has(folderId)) return true
    const children = allFolders.filter(f => f.parentId === folderId)
    return children.some(child =>
      this.hasFolderAccessibleDashboards(child.id, accessibleFolderIds, allFolders),
    )
  }

  /** Build hierarchical folder tree */
  private buildFolderTree(folders: Folder[]): Folder[] {
    const folderMap = new Map<string, Folder & { children?: Folder[] }>()
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] })
    })

    const rootFolders: Folder[] = []
    folderMap.forEach(folder => {
      if (!folder.parentId) {
        rootFolders.push(folder)
      } else {
        const parent = folderMap.get(folder.parentId)
        if (parent) {
          parent.children!.push(folder)
        }
      }
    })

    return rootFolders
  }
}

/**
 * Export singleton factory
 */
export function useFirestoreService(): FirestoreService {
  return new FirestoreService()
}
