/**
 * Dashboard Service Layer Abstraction
 * 
 * This service interface allows switching between:
 * 1. Mock data (for development/testing)
 * 2. Firebase/Firestore (for production)
 * 
 * Components never need to know which implementation is used.
 * Just inject the service and call methods.
 * 
 * Usage:
 * const dashboardService = useNuxtApp().$dashboardService
 * const dashboards = await dashboardService.getDashboards(userId)
 */

import type {
  User,
  Folder,
  Dashboard,
  DashboardCardData,
  GetDashboardsResponse,
  GetFoldersResponse,
  SavePermissionsRequest,
  SavePermissionsResponse,
  AuditLogEntry,
} from '~/types/dashboard'

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

export interface IDashboardService {
  // ========== USER OPERATIONS ==========

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Promise<User | null>

  /**
   * Get user by UID
   */
  getUser(uid: string): Promise<User | null>

  // ========== FOLDER OPERATIONS ==========

  /**
   * Get all accessible folders for user
   * (Filters to only show folders with accessible dashboards)
   */
  getFolders(userId: string, companyId: string): Promise<GetFoldersResponse>

  /**
   * Get folder by ID
   */
  getFolder(folderId: string): Promise<Folder | null>

  /**
   * Get child folders of a parent
   */
  getChildFolders(parentId: string | null): Promise<Folder[]>

  /**
   * Get folder path from root to specific folder
   */
  getFolderPath(folderId: string): Promise<Folder[]>

  // ========== DASHBOARD OPERATIONS (BROWSE) ==========

  /**
   * Get all accessible dashboards for user (with pagination)
   */
  getDashboards(
    userId: string,
    companyId: string,
    options?: {
      folderId?: string
      limit?: number
      offset?: number
      search?: string
    }
  ): Promise<GetDashboardsResponse>

  /**
   * Get dashboard by ID
   */
  getDashboard(dashboardId: string): Promise<Dashboard | null>

  /**
   * Get dashboards in specific folder (accessible to user)
   */
  getDashboardsByFolder(
    folderId: string,
    userId: string
  ): Promise<Dashboard[]>

  /**
   * Get dashboard with UI-enriched data (card format)
   */
  getDashboardCard(
    dashboardId: string,
    currentUserId: string
  ): Promise<DashboardCardData | null>

  // ========== PERMISSION CHECK ==========

  /**
   * Check if user can access dashboard
   * Returns: { hasAccess: boolean, reason: 'layer1'|'layer2'|'revoked'|'expired'|'no_match' }
   */
  canAccessDashboard(dashboardId: string, userId: string): Promise<boolean>

  /**
   * Get why user can access (which permission layer granted access)
   */
  getAccessReason(
    dashboardId: string,
    userId: string
  ): Promise<{
    hasAccess: boolean
    layer?: 1 | 2
    grantedBy?: 'user' | 'role' | 'group'
    grantName?: string
  }>

  // ========== PERMISSION MANAGEMENT (ADMIN) ==========

  /**
   * Save full permission settings for dashboard
   * Only accessible to Admin role
   */
  saveDashboardPermissions(
    request: SavePermissionsRequest
  ): Promise<SavePermissionsResponse>

  /**
   * Get current permissions for dashboard
   */
  getDashboardPermissions(dashboardId: string): Promise<{
    access: any
    restrictions: any
  }>

  /**
   * Get who actually has access to dashboard (expanded view)
   */
  getAccessibleUsers(dashboardId: string): Promise<User[]>

  // ========== QUICK SHARE (MODERATOR) ==========

  /**
   * Quick share dashboard with user(s)
   * Adds direct user access with optional expiry
   * Only dashboard owner or admin can do this
   */
  quickShareDashboard(
    dashboardId: string,
    selectedUserIds: string[],
    expiryDate?: Date
  ): Promise<SavePermissionsResponse>

  /**
   * Get direct access users for dashboard
   */
  getDirectAccessUsers(dashboardId: string): Promise<User[]>

  /**
   * Remove direct user access
   */
  removeDirectAccess(
    dashboardId: string,
    userId: string
  ): Promise<SavePermissionsResponse>

  // ========== AUDIT LOG ==========

  /**
   * Get permission change history for dashboard
   */
  getAuditLog(
    dashboardId: string,
    limit?: number
  ): Promise<AuditLogEntry[]>

  // ========== DASHBOARD MODIFICATION ==========

  /**
   * Create new dashboard
   */
  createDashboard(
    name: string,
    folderId: string,
    userId: string,
    description?: string
  ): Promise<Dashboard>

  /**
   * Update dashboard
   */
  updateDashboard(dashboard: Dashboard): Promise<Dashboard>

  /**
   * Delete dashboard
   */
  deleteDashboard(dashboardId: string): Promise<void>

  /**
   * Archive dashboard (hide from view)
   */
  archiveDashboard(dashboardId: string): Promise<Dashboard>

  /**
   * Unarchive dashboard
   */
  unarchiveDashboard(dashboardId: string): Promise<Dashboard>
}

// ============================================================================
// MOCK SERVICE IMPLEMENTATION
// ============================================================================

import {
  getMockFoldersByParent,
  getMockDashboardById,
  getMockDashboardsByFolder,
  getFolderPath as getMockFolderPath,
  getAccessibleDashboards,
} from './useMockData'

export class MockDashboardService implements IDashboardService {
  private currentUserId: string | null = null
  private users: User[] = []
  private folders: Folder[] = []
  private dashboards: Dashboard[] = []

  // For demo: set current user
  setCurrentUser(userId: string) {
    this.currentUserId = userId
  }

  // Load data from API
  private async loadData() {
    try {
      const { $fetch } = useNuxtApp()
      const [usersResp, foldersResp, dashboardsResp] = await Promise.all([
        $fetch('/api/mock/users'),
        $fetch('/api/mock/folders'),
        $fetch('/api/mock/dashboards'),
      ])
      this.users = usersResp.data || []
      this.folders = foldersResp.data || []
      this.dashboards = dashboardsResp.data || []
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.currentUserId) return null
    await this.loadData()
    return this.users.find(u => u.uid === this.currentUserId) || null
  }

  async getUser(uid: string): Promise<User | null> {
    await this.loadData()
    return this.users.find(u => u.uid === uid) || null
  }

  async getFolders(userId: string): Promise<GetFoldersResponse> {
    const user = await this.getUser(userId)
    if (!user) {
      return { folders: [], hierarchy: [] }
    }

    // Get accessible dashboards
    const accessible = getAccessibleDashboards(user, this.dashboards)
    const accessibleFolderIds = new Set(
      accessible.map((d) => d.folderId)
    )

    // Filter folders that have accessible dashboards
    const accessibleFolders = this.folders.filter((folder) => {
      // Check if this folder or any descendant has accessible dashboards
      return hasFolderAccessibleDashboards(
        folder.id,
        accessibleFolderIds,
        this.folders
      )
    })

    // Build folder tree with children property
    const folderTree = this.buildFolderTree(accessibleFolders)

    return {
      folders: folderTree,
      hierarchy: [],
    }
  }

  /**
   * Build hierarchical folder tree structure
   */
  private buildFolderTree(folders: Folder[]): Folder[] {
    // Create a map of folders by ID for easy lookup
    const folderMap = new Map<string, Folder & { children?: Folder[] }>()
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] })
    })

    // Build tree structure
    const rootFolders: Folder[] = []
    folderMap.forEach(folder => {
      if (!folder.parentId) {
        // Root level folder
        rootFolders.push(folder)
      } else {
        // Child folder - add to parent's children
        const parent = folderMap.get(folder.parentId)
        if (parent) {
          parent.children!.push(folder)
        }
      }
    })

    return rootFolders
  }

  async getFolder(folderId: string): Promise<Folder | null> {
    await this.loadData()
    return this.folders.find((f) => f.id === folderId) || null
  }

  async getChildFolders(parentId: string | null): Promise<Folder[]> {
    await this.loadData()
    return getMockFoldersByParent(parentId, this.folders)
  }

  async getFolderPath(folderId: string): Promise<Folder[]> {
    await this.loadData()
    return getMockFolderPath(folderId, this.folders)
  }

  async getDashboards(
    userId: string,
    companyId: string,
    options?: any
  ): Promise<GetDashboardsResponse> {
    const user = await this.getUser(userId)
    if (!user) {
      return { dashboards: [], total: 0, hasMore: false }
    }

    let accessible = getAccessibleDashboards(user, this.dashboards)

    // Filter by folder if specified
    if (options?.folderId) {
      accessible = accessible.filter(
        (d) => d.folderId === options.folderId
      )
    }

    // Filter by search
    if (options?.search) {
      const search = options.search.toLowerCase()
      accessible = accessible.filter(
        (d) =>
          d.name.toLowerCase().includes(search) ||
          d.description?.toLowerCase().includes(search)
      )
    }

    // Pagination
    const limit = options?.limit || 20
    const offset = options?.offset || 0
    const paginated = accessible.slice(offset, offset + limit)

    return {
      dashboards: paginated,
      total: accessible.length,
      hasMore: offset + limit < accessible.length,
    }
  }

  async getDashboard(dashboardId: string): Promise<Dashboard | null> {
    await this.loadData()
    return getMockDashboardById(dashboardId, this.dashboards) || null
  }

  async getDashboardsByFolder(
    folderId: string,
    userId: string
  ): Promise<Dashboard[]> {
    const user = await this.getUser(userId)
    if (!user) return []

    const allInFolder = getMockDashboardsByFolder(folderId, this.dashboards)
    return getAccessibleDashboards(user, allInFolder)
  }

  async getDashboardCard(
    dashboardId: string,
    currentUserId: string
  ): Promise<DashboardCardData | null> {
    const dashboard = await this.getDashboard(dashboardId)
    const user = await this.getUser(currentUserId)

    if (!dashboard || !user) return null

    // Check access
    const hasAccess = await this.canAccessDashboard(
      dashboardId,
      currentUserId
    )
    if (!hasAccess) return null

    const isOwner = dashboard.owner === currentUserId
    const canEdit = isOwner || user.role === 'admin'
    const canDelete = isOwner || user.role === 'admin'
    const canShare = isOwner || user.role === 'admin'
    const canManageAccess = user.role === 'admin'

    return {
      ...dashboard,
      accessReason: {
        layer: 1,
        type: 'role' as const,
        name: 'user',
      },
      isOwner,
      canEdit,
      canDelete,
      canShare,
      canManageAccess,
    }
  }

  async canAccessDashboard(
    dashboardId: string,
    userId: string
  ): Promise<boolean> {
    const dashboard = await this.getDashboard(dashboardId)
    const user = await this.getUser(userId)

    if (!dashboard || !user) return false

    // Check restrictions
    if (dashboard.restrictions.revoke.includes(userId)) {
      return false
    }

    if (dashboard.restrictions.expiry[userId]) {
      if (new Date() > dashboard.restrictions.expiry[userId]) {
        return false
      }
    }

    // Check layer 1
    const access = dashboard.access
    if (access.direct.users.includes(userId)) return true
    if (access.direct.roles.includes(user.role)) return true
    if (user.groups.some((g) => access.direct.groups.includes(g))) {
      return true
    }

    // Check layer 2
    const compAccess = access.company[user.company]
    if (compAccess) {
      if (compAccess.roles.includes(user.role)) return true
      if (user.groups.some((g) => compAccess.groups.includes(g))) {
        return true
      }
    }

    return false
  }

  async getAccessReason(
    dashboardId: string,
    userId: string
  ): Promise<any> {
    const dashboard = await this.getDashboard(dashboardId)
    const user = await this.getUser(userId)

    if (!dashboard || !user) {
      return { hasAccess: false }
    }

    const access = dashboard.access

    if (access.direct.users.includes(userId)) {
      return {
        hasAccess: true,
        layer: 1,
        grantedBy: 'user',
      }
    }

    if (access.direct.roles.includes(user.role)) {
      return {
        hasAccess: true,
        layer: 1,
        grantedBy: 'role',
        grantName: user.role,
      }
    }

    for (const group of user.groups) {
      if (access.direct.groups.includes(group)) {
        return {
          hasAccess: true,
          layer: 1,
          grantedBy: 'group',
          grantName: group,
        }
      }
    }

    const compAccess2 = access.company[user.company]
    if (compAccess2) {
      if (compAccess2.roles.includes(user.role)) {
        return {
          hasAccess: true,
          layer: 2,
          grantedBy: 'role',
          grantName: `${user.role} (in ${user.company})`,
        }
      }

      for (const group of user.groups) {
        if (compAccess2.groups.includes(group)) {
          return {
            hasAccess: true,
            layer: 2,
            grantedBy: 'group',
            grantName: `${group} (in ${user.company})`,
          }
        }
      }
    }

    return { hasAccess: false }
  }

  async saveDashboardPermissions(
    request: SavePermissionsRequest
  ): Promise<SavePermissionsResponse> {
    // Mock: just return success
    return {
      success: true,
      message: 'Permissions saved successfully',
      updatedAt: new Date(),
    }
  }

  async getDashboardPermissions(dashboardId: string): Promise<any> {
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) return null

    return {
      access: dashboard.access,
      restrictions: dashboard.restrictions,
    }
  }

  async getAccessibleUsers(dashboardId: string): Promise<User[]> {
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) return []

    // Mock: return all users that can access
    const access = dashboard.access
    const result: Set<string> = new Set()

    // Direct users
    access.direct.users.forEach((u) => result.add(u))

    // Direct roles
    this.users.forEach((user) => {
      if (access.direct.roles.includes(user.role)) {
        result.add(user.uid)
      }
    })

    // Direct groups
    this.users.forEach((user) => {
      if (user.groups.some((g) => access.direct.groups.includes(g))) {
        result.add(user.uid)
      }
    })

    // Company-scoped
    this.users.forEach((user) => {
      const compAccess3 = access.company[user.company]
      if (compAccess3) {
        if (compAccess3.roles.includes(user.role)) {
          result.add(user.uid)
        }
        if (user.groups.some((g) => compAccess3.groups.includes(g))) {
          result.add(user.uid)
        }
      }
    })

    return this.users.filter((u) => result.has(u.uid))
  }

  async quickShareDashboard(
    dashboardId: string,
    selectedUserIds: string[],
    expiryDate?: Date
  ): Promise<SavePermissionsResponse> {
    // Mock: add to direct users
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) {
      return { success: false, message: 'Dashboard not found', updatedAt: new Date() }
    }

    // Add users
    dashboard.access.direct.users.push(...selectedUserIds)

    // Set expiry if provided
    if (expiryDate) {
      selectedUserIds.forEach((uid) => {
        dashboard.restrictions.expiry[uid] = expiryDate
      })
    }

    return {
      success: true,
      message: `Shared with ${selectedUserIds.length} user(s)`,
      updatedAt: new Date(),
    }
  }

  async getDirectAccessUsers(dashboardId: string): Promise<User[]> {
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) return []

    await this.loadData()
    return this.users.filter((u) =>
      dashboard.access.direct.users.includes(u.uid)
    )
  }

  async removeDirectAccess(
    dashboardId: string,
    userId: string
  ): Promise<SavePermissionsResponse> {
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) {
      return { success: false, message: 'Dashboard not found', updatedAt: new Date() }
    }

    // Remove user
    const index = dashboard.access.direct.users.indexOf(userId)
    if (index > -1) {
      dashboard.access.direct.users.splice(index, 1)
    }

    // Remove expiry
    delete dashboard.restrictions.expiry[userId]

    return {
      success: true,
      message: 'Access removed',
      updatedAt: new Date(),
    }
  }

  async getAuditLog(dashboardId: string): Promise<AuditLogEntry[]> {
    // Mock: return empty for now
    return []
  }

  async createDashboard(): Promise<Dashboard> {
    throw new Error('Not implemented in mock')
  }

  async updateDashboard(dashboard: Dashboard): Promise<Dashboard> {
    return dashboard
  }

  async deleteDashboard(): Promise<void> {
    // Mock
  }

  async archiveDashboard(dashboardId: string): Promise<Dashboard> {
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) throw new Error('Dashboard not found')
    dashboard.isArchived = true
    dashboard.archivedAt = new Date()
    return dashboard
  }

  async unarchiveDashboard(dashboardId: string): Promise<Dashboard> {
    const dashboard = await this.getDashboard(dashboardId)
    if (!dashboard) throw new Error('Dashboard not found')
    dashboard.isArchived = false
    return dashboard
  }
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

function hasFolderAccessibleDashboards(
  folderId: string,
  accessibleFolderIds: Set<string>,
  folders: Folder[]
): boolean {
  if (accessibleFolderIds.has(folderId)) return true

  const children = folders.filter((f) => f.parentId === folderId)
  return children.some((child) =>
    hasFolderAccessibleDashboards(child.id, accessibleFolderIds, folders)
  )
}

// ============================================================================
// COMPOSABLE HOOK
// ============================================================================

let dashboardServiceInstance: IDashboardService | null = null

/**
 * Use Dashboard Service Composable
 *
 * Usage in component:
 * const { getDashboards, getDashboard } = useDashboardService()
 *
 * @returns IDashboardService instance
 */
export const useDashboardService = (): IDashboardService => {
  if (!dashboardServiceInstance) {
    // Check if we should use JSON Mock Service
    const config = useRuntimeConfig()
    const useJsonMock = config.public.useJsonMock ?? true

    if (useJsonMock) {
      console.log('🔷 [useDashboardService] Using JSON Mock Service')
      // Import and use JSON Mock Service
      const { useJSONMockService } = import('~/composables/useJSONMockService')

      // Use dynamic import approach for lazy loading
      dashboardServiceInstance = new (class implements IDashboardService {
        private jsonService: any = null

        async initJsonService() {
          if (!this.jsonService) {
            const module = await import('~/composables/useJSONMockService')
            this.jsonService = new module.JSONMockService()
          }
          return this.jsonService
        }

        // Delegate all methods to jsonService
        async getCurrentUser() {
          const service = await this.initJsonService()
          return service.getCurrentUser()
        }

        async getUser(uid: string) {
          const service = await this.initJsonService()
          return service.getUser(uid)
        }

        async getFolders(userId: string, companyId: string) {
          const service = await this.initJsonService()
          return service.getFolders(userId, companyId)
        }

        async getFolder(folderId: string) {
          const service = await this.initJsonService()
          return service.getFolder(folderId)
        }

        async getChildFolders(parentId: string | null) {
          const service = await this.initJsonService()
          return service.getChildFolders(parentId)
        }

        async getFolderPath(folderId: string) {
          const service = await this.initJsonService()
          return service.getFolderPath(folderId)
        }

        async getDashboards(userId: string, companyId: string, options?: any) {
          const service = await this.initJsonService()
          return service.getDashboards(userId, companyId, options)
        }

        async getDashboard(dashboardId: string) {
          const service = await this.initJsonService()
          return service.getDashboard(dashboardId)
        }

        async getDashboardsByFolder(folderId: string, userId: string) {
          const service = await this.initJsonService()
          return service.getDashboardsByFolder(folderId, userId)
        }

        async getDashboardCard(dashboardId: string) {
          const service = await this.initJsonService()
          return service.getDashboardCard(dashboardId)
        }

        async saveDashboard(dashboard: Dashboard) {
          const service = await this.initJsonService()
          return service.saveDashboard(dashboard)
        }

        async deleteDashboard(dashboardId: string) {
          const service = await this.initJsonService()
          return service.deleteDashboard(dashboardId)
        }

        async saveDashboardPermissions(dashboardId: string, permissions: any) {
          const service = await this.initJsonService()
          return service.saveDashboardPermissions(dashboardId, permissions)
        }

        async quickShareDashboard(dashboardId: string, userIds: string[], expiryDate?: string) {
          const service = await this.initJsonService()
          return service.quickShareDashboard(dashboardId, userIds, expiryDate)
        }

        async getAuditLog(options?: any) {
          const service = await this.initJsonService()
          return service.getAuditLog(options)
        }
      })()
    } else {
      console.log('🔷 [useDashboardService] Using Mock Data Service')
      // Fallback to old mock service
      dashboardServiceInstance = new MockDashboardService()
    }
  }

  return dashboardServiceInstance!
}

/**
 * Initialize dashboard service
 * Call this in plugin or main.ts
 */
export const initializeDashboardService = (
  service: IDashboardService
) => {
  dashboardServiceInstance = service
}
