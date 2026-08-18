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
  SaveFolderPermissionsRequest,
  FolderPermissionsResponse,
  SavePermissionsResponse,
  AccessControl,
  AccessRestrictions,
  AuditLogEntry,
} from '~/types/dashboard'

// Type-only: the implementations stay lazily imported at runtime, but the
// delegating wrappers below need their signatures to typecheck the handoff.
import type { FirestoreService } from './useFirestoreService'
import type { JSONMockService } from './useJSONMockService'

// ============================================================================
// SERVICE INTERFACE
// ============================================================================

/** Listing options accepted by `getDashboards` across every implementation. */
export interface DashboardQueryOptions {
  folderId?: string
  limit?: number
  offset?: number
  search?: string
  includeArchived?: boolean
}

/** Why a user can see a dashboard — layer 1 is a direct grant, layer 2 a company one. */
export interface AccessReason {
  hasAccess: boolean
  layer?: 1 | 2
  grantedBy?: 'user' | 'role' | 'group' | 'company'
  grantName?: string
}

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
    options?: DashboardQueryOptions
  ): Promise<GetDashboardsResponse>

  /**
   * Get dashboard by ID
   */
  getDashboard(dashboardId: string): Promise<Dashboard | null>

  /**
   * Get embed URL for a dashboard (requires authentication + access check)
   */
  getDashboardEmbedUrl(dashboardId: string): Promise<string | null>

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
  ): Promise<AccessReason>

  // ========== PERMISSION MANAGEMENT (ADMIN) ==========

  /**
   * Save full permission settings for dashboard
   * Only accessible to Admin role
   */
  saveDashboardPermissions(
    _request: SavePermissionsRequest
  ): Promise<SavePermissionsResponse>

  /**
   * Get current permissions for dashboard
   */
  getDashboardPermissions(dashboardId: string): Promise<{
    access: AccessControl
    restrictions: AccessRestrictions
  }>

  /**
   * Get who actually has access to dashboard (expanded view)
   */
  getAccessibleUsers(dashboardId: string): Promise<User[]>

  // ========== FOLDER PERMISSIONS ==========

  /**
   * Save folder-level permissions
   */
  saveFolderPermissions(
    request: SaveFolderPermissionsRequest
  ): Promise<SavePermissionsResponse>

  /**
   * Get current permissions for a folder
   */
  getFolderPermissions(
    folderId: string
  ): Promise<FolderPermissionsResponse>

  /**
   * Resolve effective users (deduplicated) from access rules
   */
  resolveEffectiveUsers(
    access: AccessControl,
    restrictions: AccessRestrictions,
    allUsers: User[],
    allGroups: { id: string; members: string[] }[]
  ): Promise<User[]>

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
    const { isFirestore: useFirestore } = useServiceMode()

    if (useFirestore) {
      // ===== Firestore (production) =====
      console.log('🔥 [useDashboardService] Using Firestore Service')
      dashboardServiceInstance = new (class implements IDashboardService {
        private firestoreService: FirestoreService | null = null

        async initFirestoreService() {
          if (!this.firestoreService) {
            const module = await import('~/composables/useFirestoreService')
            this.firestoreService = new module.FirestoreService()
          }
          return this.firestoreService
        }

        // Delegate all methods to firestoreService
        async getCurrentUser() {
          const service = await this.initFirestoreService()
          return service.getCurrentUser()
        }

        async getUser(uid: string) {
          const service = await this.initFirestoreService()
          return service.getUser(uid)
        }

        async getFolders(userId: string, companyId: string) {
          const service = await this.initFirestoreService()
          return service.getFolders(userId, companyId)
        }

        async getFolder(folderId: string) {
          const service = await this.initFirestoreService()
          return service.getFolder(folderId)
        }

        async getChildFolders(parentId: string | null) {
          const service = await this.initFirestoreService()
          return service.getChildFolders(parentId)
        }

        async getFolderPath(folderId: string) {
          const service = await this.initFirestoreService()
          return service.getFolderPath(folderId)
        }

        async getDashboards(userId: string, companyId: string, options?: DashboardQueryOptions) {
          const service = await this.initFirestoreService()
          return service.getDashboards(userId, companyId, options)
        }

        async getDashboard(dashboardId: string) {
          const service = await this.initFirestoreService()
          return service.getDashboard(dashboardId)
        }

        async getDashboardEmbedUrl(dashboardId: string) {
          const service = await this.initFirestoreService()
          return service.getDashboardEmbedUrl(dashboardId)
        }

        async getDashboardsByFolder(folderId: string, userId: string) {
          const service = await this.initFirestoreService()
          return service.getDashboardsByFolder(folderId, userId)
        }

        async getDashboardCard(dashboardId: string, currentUserId: string) {
          const service = await this.initFirestoreService()
          return service.getDashboardCard(dashboardId, currentUserId)
        }

        async createDashboard(name: string, folderId: string, userId: string, description?: string) {
          const service = await this.initFirestoreService()
          return service.createDashboard(name, folderId, userId, description)
        }

        async updateDashboard(dashboard: Dashboard) {
          const service = await this.initFirestoreService()
          return service.updateDashboard(dashboard)
        }

        async deleteDashboard(dashboardId: string) {
          const service = await this.initFirestoreService()
          return service.deleteDashboard(dashboardId)
        }

        async getDashboardPermissions(dashboardId: string) {
          const service = await this.initFirestoreService()
          return service.getDashboardPermissions(dashboardId)
        }

        async saveDashboardPermissions(request: SavePermissionsRequest) {
          const service = await this.initFirestoreService()
          return service.saveDashboardPermissions(request)
        }

        async getAuditLog(dashboardId: string, limit?: number) {
          const service = await this.initFirestoreService()
          return service.getAuditLog(dashboardId, limit)
        }

        async canAccessDashboard(dashboardId: string, userId: string) {
          const service = await this.initFirestoreService()
          return service.canAccessDashboard(dashboardId, userId)
        }

        async saveFolderPermissions(request: SaveFolderPermissionsRequest) {
          const service = await this.initFirestoreService()
          return service.saveFolderPermissions(request)
        }

        async getFolderPermissions(folderId: string) {
          const service = await this.initFirestoreService()
          return service.getFolderPermissions(folderId)
        }

        async resolveEffectiveUsers(
          access: AccessControl,
          restrictions: AccessRestrictions,
          allUsers: User[],
          allGroups: { id: string; members: string[] }[]
        ) {
          const service = await this.initFirestoreService()
          return service.resolveEffectiveUsers(access, restrictions, allUsers, allGroups)
        }

        async getAccessReason(dashboardId: string, userId: string) {
          const service = await this.initFirestoreService()
          return service.getAccessReason(dashboardId, userId)
        }

        async getAccessibleUsers(dashboardId: string) {
          const service = await this.initFirestoreService()
          return service.getAccessibleUsers(dashboardId)
        }

        async getDirectAccessUsers(dashboardId: string) {
          const service = await this.initFirestoreService()
          return service.getDirectAccessUsers(dashboardId)
        }

        async removeDirectAccess(dashboardId: string, userId: string) {
          const service = await this.initFirestoreService()
          return service.removeDirectAccess(dashboardId, userId)
        }

        async archiveDashboard(dashboardId: string) {
          const service = await this.initFirestoreService()
          return service.archiveDashboard(dashboardId)
        }

        async unarchiveDashboard(dashboardId: string) {
          const service = await this.initFirestoreService()
          return service.unarchiveDashboard(dashboardId)
        }
      })()
    } else {
      // ===== JSON Mock (development default) =====
      console.log('🔷 [useDashboardService] Using JSON Mock Service')
      // Use dynamic import approach for lazy loading
      dashboardServiceInstance = new (class implements IDashboardService {
        private jsonService: JSONMockService | null = null

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

        async getDashboards(userId: string, companyId: string, options?: DashboardQueryOptions) {
          const service = await this.initJsonService()
          return service.getDashboards(userId, companyId, options)
        }

        async getDashboard(dashboardId: string) {
          const service = await this.initJsonService()
          return service.getDashboard(dashboardId)
        }

        async getDashboardEmbedUrl(dashboardId: string) {
          const service = await this.initJsonService()
          return service.getDashboardEmbedUrl(dashboardId)
        }

        async getDashboardsByFolder(folderId: string, userId: string) {
          const service = await this.initJsonService()
          return service.getDashboardsByFolder(folderId, userId)
        }

        async getDashboardCard(dashboardId: string, currentUserId: string) {
          const service = await this.initJsonService()
          return service.getDashboardCard(dashboardId, currentUserId)
        }

        async createDashboard(name: string, folderId: string, userId: string, description?: string) {
          const service = await this.initJsonService()
          return service.createDashboard(name, folderId, userId, description)
        }

        async updateDashboard(dashboard: Dashboard) {
          const service = await this.initJsonService()
          return service.updateDashboard(dashboard)
        }

        async deleteDashboard(dashboardId: string) {
          const service = await this.initJsonService()
          return service.deleteDashboard(dashboardId)
        }

        async getDashboardPermissions(dashboardId: string) {
          const service = await this.initJsonService()
          return service.getDashboardPermissions(dashboardId)
        }

        async saveDashboardPermissions(request: SavePermissionsRequest) {
          const service = await this.initJsonService()
          return service.saveDashboardPermissions(request)
        }

        async getAuditLog(dashboardId: string, limit?: number) {
          const service = await this.initJsonService()
          return service.getAuditLog(dashboardId, limit)
        }

        async canAccessDashboard(dashboardId: string, userId: string) {
          const service = await this.initJsonService()
          return service.canAccessDashboard(dashboardId, userId)
        }

        async saveFolderPermissions(request: SaveFolderPermissionsRequest) {
          const service = await this.initJsonService()
          return service.saveFolderPermissions(request)
        }

        async getFolderPermissions(folderId: string) {
          const service = await this.initJsonService()
          return service.getFolderPermissions(folderId)
        }

        async resolveEffectiveUsers(
          access: AccessControl,
          restrictions: AccessRestrictions,
          allUsers: User[],
          allGroups: { id: string; members: string[] }[]
        ) {
          const service = await this.initJsonService()
          return service.resolveEffectiveUsers(access, restrictions, allUsers, allGroups)
        }

        async getAccessReason(dashboardId: string, userId: string) {
          const service = await this.initJsonService()
          return service.getAccessReason(dashboardId, userId)
        }

        async getAccessibleUsers(dashboardId: string) {
          const service = await this.initJsonService()
          return service.getAccessibleUsers(dashboardId)
        }

        async getDirectAccessUsers(dashboardId: string) {
          const service = await this.initJsonService()
          return service.getDirectAccessUsers(dashboardId)
        }

        async removeDirectAccess(dashboardId: string, userId: string) {
          const service = await this.initJsonService()
          return service.removeDirectAccess(dashboardId, userId)
        }

        async archiveDashboard(dashboardId: string) {
          const service = await this.initJsonService()
          return service.archiveDashboard(dashboardId)
        }

        async unarchiveDashboard(dashboardId: string) {
          const service = await this.initJsonService()
          return service.unarchiveDashboard(dashboardId)
        }
      })()
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
