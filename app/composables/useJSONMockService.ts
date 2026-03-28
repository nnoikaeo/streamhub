/**
 * JSON Mock Service
 * Implements IDashboardService interface by fetching from /api/mock/* endpoints
 *
 * Usage:
 * const service = new JSONMockService()
 * const dashboards = await service.getDashboards(userId, companyId)
 */

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
  PermissionMetadata,
  SavePermissionsRequest,
  SaveFolderPermissionsRequest,
  FolderPermissionsResponse,
  SavePermissionsResponse,
} from '~/types/dashboard'
import type { IDashboardService } from '~/composables/useDashboardService'

export class JSONMockService implements IDashboardService {
  private baseURL = '/api/mock'
  private DEBUG = false

  private log(label: string, data?: any) {
    if (this.DEBUG) {
      if (data !== undefined) {
        console.log(`🔍 [JSONMockService] ${label}`, data)
      } else {
        console.log(`🔍 [JSONMockService] ${label}`)
      }
    }
  }

  /**
   * Get Authorization headers with Firebase ID token.
   * Returns empty object if no token is available (e.g., dev mode without login).
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const { getIdToken } = useAuth()
      const token = await getIdToken()
      if (token) {
        return { Authorization: `Bearer ${token}` }
      }
    } catch {
      // Auth may not be available (e.g., during SSR or before plugin init)
    }
    return {}
  }

  /**
   * Wrapper around $fetch that injects auth headers and handles 401 responses.
   */
  private async fetchWithAuth<T>(url: string, options: any = {}): Promise<T> {
    const authHeaders = await this.getAuthHeaders()

    // DEV fallback: send uid in query param for server auth middleware
    // when Firebase Admin SDK credentials are not configured
    const authStore = useAuthStore()
    const query = { ...options.query }
    if (authStore.user?.uid) {
      query.uid = authStore.user.uid
    }

    const mergedOptions = {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      query,
    }

    try {
      return await $fetch(url, mergedOptions) as T
    } catch (error: any) {
      const status = error?.response?.status || error?.statusCode
      if (status === 401) {
        console.warn('🔒 [JSONMockService] Unauthorized (401) — redirecting to login')
        await navigateTo('/login')
      }
      throw error
    }
  }

  /**
   * Get current authenticated user from auth store
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      this.log('getCurrentUser called')
      const authStore = useAuthStore()

      if (!authStore.user?.uid) {
        this.log('getCurrentUser: No user in store')
        return null
      }

      return this.getUser(authStore.user.uid)
    } catch (error) {
      console.error('❌ [JSONMockService] getCurrentUser error:', error)
      return null
    }
  }

  /**
   * Get user by UID from API
   */
  async getUser(uid: string): Promise<User | null> {
    try {
      this.log('getUser called', uid)

      const response = await this.fetchWithAuth<{ success: boolean; data?: User }>(`${this.baseURL}/users/${uid}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        const user = response.data
        this.log(`✅ getUser: Found ${user.name} (role: ${user.role})`)
        return user
      }

      this.log('⚠️ getUser: User not found')
      return null
    } catch (error) {
      console.error('❌ [JSONMockService] getUser error:', error)
      return null
    }
  }

  /**
   * Get all folders accessible to user
   */
  async getFolders(userId: string, companyId: string): Promise<GetFoldersResponse> {
    try {
      this.log('getFolders called', { userId, companyId })

      const response = await this.fetchWithAuth<{ success: boolean; data?: Folder[] }>(`${this.baseURL}/folders`, {
        method: 'GET',
        query: {
          uid: userId,
          company: companyId,
        },
      })

      if (response.success && response.data) {
        this.log(`✅ getFolders: Got ${response.data.length} folders`)

        return {
          folders: response.data,
          hierarchy: [],
        }
      }

      this.log('⚠️ getFolders: No data in response')
      return { folders: [], hierarchy: [] }
    } catch (error: any) {
      if (error?.response?.status === 403 || error?.statusCode === 403) {
        console.error('🚫 [JSONMockService] Access denied:', error.data?.message)
        try { useAppToast().showToast('คุณไม่มีสิทธิ์เข้าถึงโฟลเดอร์นี้', 'error') } catch {}
        return { folders: [], hierarchy: [] }
      }
      console.error('❌ [JSONMockService] getFolders error:', error)
      return { folders: [], hierarchy: [] }
    }
  }

  /**
   * Get single folder by ID
   */
  async getFolder(folderId: string): Promise<Folder | null> {
    try {
      this.log('getFolder:', folderId)

      const response = await this.fetchWithAuth<{ success: boolean; data?: Folder }>(`${this.baseURL}/folders/${folderId}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        return response.data
      }

      return null
    } catch (error) {
      console.error('❌ [JSONMockService] getFolder error:', error)
      return null
    }
  }

  /**
   * Get child folders of a parent
   */
  async getChildFolders(parentId: string | null): Promise<Folder[]> {
    try {
      this.log('getChildFolders:', parentId)

      const response = await this.fetchWithAuth<{ success: boolean; data?: Folder[] }>(`${this.baseURL}/folders`, {
        method: 'GET',
        query: {
          parentId: parentId || 'root',
        },
      })

      if (response.success && response.data) {
        return response.data
      }

      return []
    } catch (error) {
      console.error('❌ [JSONMockService] getChildFolders error:', error)
      return []
    }
  }

  /**
   * Get folder path from root to specific folder
   */
  async getFolderPath(folderId: string): Promise<Folder[]> {
    try {
      this.log('getFolderPath:', folderId)

      // Fetch all folders to build path
      const response = await this.fetchWithAuth<{ success: boolean; data?: Folder[] }>(`${this.baseURL}/folders`, {
        method: 'GET',
      })

      if (!response.success || !response.data) {
        return []
      }

      const allFolders = response.data
      const path: Folder[] = []
      let currentId: string | null | undefined = folderId

      while (currentId) {
        const folder = allFolders.find((f) => f.id === currentId)
        if (!folder) break

        path.unshift(folder)
        currentId = folder.parentId
      }

      return path
    } catch (error) {
      console.error('❌ [JSONMockService] getFolderPath error:', error)
      return []
    }
  }

  /**
   * Get all accessible dashboards for user
   */
  async getDashboards(
    userId: string,
    companyId: string,
    options?: {
      folderId?: string
      limit?: number
      offset?: number
      search?: string
    }
  ): Promise<GetDashboardsResponse> {
    try {
      this.log('getDashboards called', { userId, companyId, options })

      const query: any = {
        uid: userId,
        company: companyId,
      }

      if (options?.folderId) {
        query.folderId = options.folderId
      }

      const response = await this.fetchWithAuth<{ success: boolean; data?: Dashboard[] }>(`${this.baseURL}/dashboards`, {
        method: 'GET',
        query,
      })

      if (response.success && response.data) {
        const dashboards = response.data

        this.log(`✅ getDashboards: Got ${dashboards.length} dashboards for company ${companyId}`)

        return {
          dashboards,
          total: dashboards.length,
          hasMore: false,
        }
      }

      this.log('⚠️ getDashboards: No data in response')
      return { dashboards: [], total: 0, hasMore: false }
    } catch (error: any) {
      if (error?.response?.status === 403 || error?.statusCode === 403) {
        console.error('🚫 [JSONMockService] Access denied:', error.data?.message)
        try { useAppToast().showToast('คุณไม่มีสิทธิ์เข้าถึงแดชบอร์ด', 'error') } catch {}
        return { dashboards: [], total: 0, hasMore: false }
      }
      console.error('❌ [JSONMockService] getDashboards error:', error)
      return { dashboards: [], total: 0, hasMore: false }
    }
  }

  /**
   * Get single dashboard by ID
   */
  async getDashboard(dashboardId: string): Promise<Dashboard | null> {
    try {
      this.log('getDashboard:', dashboardId)

      const response = await this.fetchWithAuth<{ success: boolean; data?: Dashboard }>(`${this.baseURL}/dashboards/${dashboardId}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        return response.data
      }

      return null
    } catch (error: any) {
      // Re-throw 403 so callers can show proper access-denied UI
      if (error?.response?.status === 403 || error?.statusCode === 403 || error?.status === 403) {
        throw error
      }
      console.error('❌ [JSONMockService] getDashboard error:', error)
      return null
    }
  }

  /**
   * Request a one-time proxy URL for a dashboard embed (server URL proxy).
   * Returns a short-lived /api/embed/{token} URL — the real Looker URL never reaches the client.
   */
  async getDashboardEmbedUrl(dashboardId: string): Promise<string | null> {
    try {
      this.log('getDashboardEmbedUrl (proxy):', dashboardId)

      const authStore = useAuthStore()
      const uid = authStore.user?.uid

      const response = await this.fetchWithAuth<{ success: boolean; data?: { token: string; proxyUrl: string } }>('/api/embed/request', {
        method: 'POST',
        body: { dashboardId },
        query: uid ? { uid } : {},
      })

      if (response.success && response.data?.proxyUrl) {
        return response.data.proxyUrl
      }

      return null
    } catch (error: any) {
      if (error?.response?.status === 403 || error?.statusCode === 403) {
        console.error('🚫 [JSONMockService] Embed URL access denied')
      } else {
        console.error('❌ [JSONMockService] getDashboardEmbedUrl error:', error)
      }
      return null
    }
  }

  /**
   * Get dashboards in specific folder accessible to user
   */
  async getDashboardsByFolder(
    folderId: string,
    userId: string
  ): Promise<Dashboard[]> {
    try {
      this.log('getDashboardsByFolder:', { folderId, userId })

      const response = await this.fetchWithAuth<{ success: boolean; data?: Dashboard[] }>(`${this.baseURL}/dashboards`, {
        method: 'GET',
        query: {
          folderId,
          uid: userId,
        },
      })

      if (response.success && response.data) {
        return response.data
      }

      return []
    } catch (error) {
      console.error('❌ [JSONMockService] getDashboardsByFolder error:', error)
      return []
    }
  }

  /**
   * Get dashboard with UI-enriched data (not implemented in mock)
   */
  async getDashboardCard(dashboardId: string, _currentUserId: string): Promise<DashboardCardData | null> {
    try {
      this.log('getDashboardCard:', dashboardId)

      const dashboard = await this.getDashboard(dashboardId)

      if (!dashboard) {
        return null
      }

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
      console.error('❌ [JSONMockService] getDashboardCard error:', error)
      return null
    }
  }

  /**
   * Create or update dashboard
   */
  async saveDashboard(dashboard: Dashboard): Promise<Dashboard | null> {
    try {
      this.log('saveDashboard:', dashboard.id)

      const response = await this.fetchWithAuth<{ success: boolean; data?: Dashboard }>(`${this.baseURL}/dashboards`, {
        method: 'POST',
        body: {
          action: dashboard.id ? 'update' : 'create',
          data: dashboard,
        },
      })

      if (response.success && response.data) {
        this.log('saveDashboard: Saved', dashboard.id)
        return response.data
      }

      return null
    } catch (error) {
      console.error('❌ [JSONMockService] saveDashboard error:', error)
      return null
    }
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(dashboardId: string): Promise<void> {
    try {
      this.log('deleteDashboard:', dashboardId)

      const response = await this.fetchWithAuth<{ success: boolean; deleted?: boolean }>(`${this.baseURL}/dashboards/${dashboardId}`, {
        method: 'DELETE',
      })

      if (response.success && response.deleted) {
        this.log('deleteDashboard: Deleted', dashboardId)
      }
    } catch (error) {
      console.error('❌ [JSONMockService] deleteDashboard error:', error)
    }
  }

  /**
   * Get current permissions for a dashboard
   */
  async getDashboardPermissions(dashboardId: string): Promise<{
    access: any
    restrictions: any
  }> {
    try {
      this.log('getDashboardPermissions:', dashboardId)
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
      console.error('❌ [JSONMockService] getDashboardPermissions error:', error)
      return {
        access: { direct: { users: [], groups: [] }, company: [] },
        restrictions: { revoke: [], expiry: {} },
      }
    }
  }

  /**
   * Save permissions (not implemented in mock, just logs)
   */
  async saveDashboardPermissions(
    request: SavePermissionsRequest
  ): Promise<SavePermissionsResponse> {
    try {
      this.log('saveDashboardPermissions:', request.dashboardId)
      return { success: true, message: 'Permissions saved successfully', updatedAt: new Date() }
    } catch (error) {
      console.error(
        '❌ [JSONMockService] saveDashboardPermissions error:',
        error
      )
      return { success: false, message: 'Failed to save permissions', updatedAt: new Date() }
    }
  }

  /**
   * Quick share dashboard (not implemented in mock, just logs)
   */
  async quickShareDashboard(
    dashboardId: string,
    userIds: string[],
    expiryDate?: Date
  ): Promise<SavePermissionsResponse> {
    try {
      this.log('quickShareDashboard:', { dashboardId, userIds, expiryDate })
      return { success: true, message: 'Quick share successful', updatedAt: new Date() }
    } catch (error) {
      console.error('❌ [JSONMockService] quickShareDashboard error:', error)
      return { success: false, message: 'Quick share failed', updatedAt: new Date() }
    }
  }

  /**
   * Get audit log (not implemented in mock)
   */
  async getAuditLog(options?: any): Promise<AuditLogEntry[]> {
    try {
      this.log('getAuditLog called')
      return []
    } catch (error) {
      console.error('❌ [JSONMockService] getAuditLog error:', error)
      return []
    }
  }

  /**
   * Save folder-level permissions via POST /api/mock/folders
   */
  async saveFolderPermissions(
    request: SaveFolderPermissionsRequest
  ): Promise<SavePermissionsResponse> {
    try {
      this.log('saveFolderPermissions:', request.folderId)

      // Fetch existing folder to merge
      const folder = await this.getFolder(request.folderId)
      if (!folder) {
        return { success: false, message: 'Folder not found', updatedAt: new Date() }
      }

      const updatedFolder = {
        ...folder,
        access: request.access,
        restrictions: request.restrictions,
        inheritPermissions: request.inheritPermissions,
        permissionMeta: request.permissionMeta,
        updatedAt: new Date().toISOString(),
      }

      const response = await this.fetchWithAuth(`${this.baseURL}/folders`, {
        method: 'POST',
        body: updatedFolder,
      }) as { success: boolean; message?: string }

      if (response.success) {
        this.log('✅ saveFolderPermissions: Saved')
        return { success: true, message: 'Folder permissions saved', updatedAt: new Date() }
      }

      return { success: false, message: 'Failed to save folder permissions', updatedAt: new Date() }
    } catch (error) {
      console.error('❌ [JSONMockService] saveFolderPermissions error:', error)
      return { success: false, message: 'Failed to save folder permissions', updatedAt: new Date() }
    }
  }

  /**
   * Get folder permissions from folder data
   */
  async getFolderPermissions(folderId: string): Promise<FolderPermissionsResponse> {
    try {
      this.log('getFolderPermissions:', folderId)

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
      console.error('❌ [JSONMockService] getFolderPermissions error:', error)
      return {
        access: { direct: { users: [], groups: [] }, company: [] },
        restrictions: { revoke: [], expiry: {} },
        inheritPermissions: false,
      }
    }
  }

  /**
   * Resolve effective users from access rules (deduplicated)
   */
  async resolveEffectiveUsers(
    access: AccessControl,
    restrictions: AccessRestrictions,
    allUsers: User[],
    allGroups: { id: string; members: string[] }[]
  ): Promise<User[]> {
    try {
      this.log('resolveEffectiveUsers called')

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

      this.log(`✅ resolveEffectiveUsers: ${uids.size} users`)
      return allUsers.filter(u => uids.has(u.uid))
    } catch (error) {
      console.error('❌ [JSONMockService] resolveEffectiveUsers error:', error)
      return []
    }
  }

  async canAccessDashboard(dashboardId: string, userId: string): Promise<boolean> {
    try {
      this.log('canAccessDashboard:', { dashboardId, userId })
      const dashboard = await this.getDashboard(dashboardId)
      const user = await this.getUser(userId)

      if (!dashboard || !user) return false

      // Admin bypass
      if (user.role === 'admin') return true

      // Check restrictions
      if (dashboard.restrictions?.revoke?.includes(userId)) return false
      if (dashboard.restrictions?.expiry?.[userId]) {
        if (new Date() > new Date(dashboard.restrictions.expiry[userId])) return false
      }

      // Layer 1: direct access
      const access = dashboard.access
      if (access.direct.users.includes(userId)) return true
      if (user.groups?.some((g: string) => access.direct.groups.includes(g))) return true

      // Layer 2: company access
      // Empty company array means "all companies" — everyone has access
      if (access.company.length === 0) return true
      if (access.company.includes(user.company)) return true

      return false
    } catch (error) {
      console.error('❌ [JSONMockService] canAccessDashboard error:', error)
      return false
    }
  }

  async getAccessReason(
    dashboardId: string,
    userId: string
  ): Promise<{
    hasAccess: boolean
    layer?: 1 | 2
    grantedBy?: 'user' | 'role' | 'group'
    grantName?: string
  }> {
    const hasAccess = await this.canAccessDashboard(dashboardId, userId)
    return { hasAccess }
  }

  async getAccessibleUsers(_dashboardId: string): Promise<User[]> {
    return []
  }

  async getDirectAccessUsers(_dashboardId: string): Promise<User[]> {
    return []
  }

  async removeDirectAccess(
    _dashboardId: string,
    _userId: string
  ): Promise<SavePermissionsResponse> {
    return { success: true, message: 'Access removed', updatedAt: new Date() }
  }

  async createDashboard(
    name: string,
    folderId: string,
    userId: string,
    description?: string
  ): Promise<Dashboard> {
    const dashboard: Dashboard = {
      id: `dash_${Date.now()}`,
      name,
      folderId,
      type: 'looker',
      description,
      owner: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
      tags: [],
      isArchived: false,
      access: { direct: { users: [], groups: [] }, company: [] },
      restrictions: { revoke: [], expiry: {} },
    }
    return dashboard
  }

  async updateDashboard(dashboard: Dashboard): Promise<Dashboard> {
    return dashboard
  }

  async archiveDashboard(dashboardId: string): Promise<Dashboard> {
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) throw new Error('Dashboard not found')
    return { ...dashboard, isArchived: true, archivedAt: new Date() }
  }

  async unarchiveDashboard(dashboardId: string): Promise<Dashboard> {
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) throw new Error('Dashboard not found')
    return { ...dashboard, isArchived: false, archivedAt: undefined }
  }
}

/**
 * Export singleton instance of JSONMockService
 */
export function useJSONMockService(): JSONMockService {
  return new JSONMockService()
}
