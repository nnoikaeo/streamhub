/**
 * JSON Mock Service
 * Implements IDashboardService interface by fetching from /api/mock/* endpoints
 *
 * Usage:
 * const service = new JSONMockService()
 * const dashboards = await service.getDashboards(userId, companyId)
 */

import { getAccessibleDashboards } from '~/composables/useMockData'
import type {
  User,
  Dashboard,
  Folder,
  GetDashboardsResponse,
  GetFoldersResponse,
  AuditLogEntry,
  IDashboardService,
} from '~/types/dashboard'

export class JSONMockService implements IDashboardService {
  private baseURL = '/api/mock'
  private DEBUG = true

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

      const response = await $fetch(`${this.baseURL}/users/${uid}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        const user = response.data as User
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

      const response = await $fetch(`${this.baseURL}/folders`, {
        method: 'GET',
        query: {
          uid: userId,
          company: companyId,
        },
      })

      if (response.success && response.data) {
        this.log(`✅ getFolders: Got ${response.data.length} folders`)

        return {
          folders: response.data as Folder[],
          total: response.data.length,
          hasMore: false,
        }
      }

      this.log('⚠️ getFolders: No data in response')
      return { folders: [], total: 0, hasMore: false }
    } catch (error) {
      console.error('❌ [JSONMockService] getFolders error:', error)
      return { folders: [], total: 0, hasMore: false }
    }
  }

  /**
   * Get single folder by ID
   */
  async getFolder(folderId: string): Promise<Folder | null> {
    try {
      this.log('getFolder:', folderId)

      const response = await $fetch(`${this.baseURL}/folders/${folderId}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        return response.data as Folder
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

      const response = await $fetch(`${this.baseURL}/folders`, {
        method: 'GET',
        query: {
          parentId: parentId || 'root',
        },
      })

      if (response.success && response.data) {
        return response.data as Folder[]
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
      const response = await $fetch(`${this.baseURL}/folders`, {
        method: 'GET',
      })

      if (!response.success || !response.data) {
        return []
      }

      const allFolders = response.data as Folder[]
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

      const response = await $fetch(`${this.baseURL}/dashboards`, {
        method: 'GET',
        query,
      })

      if (response.success && response.data) {
        const dashboards = response.data as Dashboard[]

        this.log(`✅ getDashboards: Got ${dashboards.length} dashboards for company ${companyId}`)

        return {
          dashboards,
          total: dashboards.length,
          hasMore: false,
        }
      }

      this.log('⚠️ getDashboards: No data in response')
      return { dashboards: [], total: 0, hasMore: false }
    } catch (error) {
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

      const response = await $fetch(`${this.baseURL}/dashboards/${dashboardId}`, {
        method: 'GET',
      })

      if (response.success && response.data) {
        return response.data as Dashboard
      }

      return null
    } catch (error) {
      console.error('❌ [JSONMockService] getDashboard error:', error)
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

      const response = await $fetch(`${this.baseURL}/dashboards`, {
        method: 'GET',
        query: {
          folderId,
          uid: userId,
        },
      })

      if (response.success && response.data) {
        return response.data as Dashboard[]
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
  async getDashboardCard(dashboardId: string): Promise<any> {
    try {
      this.log('getDashboardCard:', dashboardId)

      const dashboard = await this.getDashboard(dashboardId)

      if (!dashboard) {
        return null
      }

      return {
        ...dashboard,
        cardData: {
          viewCount: Math.floor(Math.random() * 1000),
          lastViewed: new Date().toISOString(),
        },
      }
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

      const response = await $fetch(`${this.baseURL}/dashboards`, {
        method: 'POST',
        body: {
          action: dashboard.id ? 'update' : 'create',
          data: dashboard,
        },
      })

      if (response.success && response.data) {
        this.log('saveDashboard: Saved', dashboard.id)
        return response.data as Dashboard
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
  async deleteDashboard(dashboardId: string): Promise<boolean> {
    try {
      this.log('deleteDashboard:', dashboardId)

      const response = await $fetch(`${this.baseURL}/dashboards/${dashboardId}`, {
        method: 'DELETE',
      })

      if (response.success && response.deleted) {
        this.log('deleteDashboard: Deleted', dashboardId)
        return true
      }

      return false
    } catch (error) {
      console.error('❌ [JSONMockService] deleteDashboard error:', error)
      return false
    }
  }

  /**
   * Save permissions (not implemented in mock, just logs)
   */
  async saveDashboardPermissions(
    dashboardId: string,
    permissions: any
  ): Promise<boolean> {
    try {
      this.log('saveDashboardPermissions:', { dashboardId, permissions })
      console.log(
        '📝 [JSONMockService] Permissions saved (mock implementation)'
      )
      return true
    } catch (error) {
      console.error(
        '❌ [JSONMockService] saveDashboardPermissions error:',
        error
      )
      return false
    }
  }

  /**
   * Quick share dashboard (not implemented in mock, just logs)
   */
  async quickShareDashboard(
    dashboardId: string,
    userIds: string[],
    expiryDate?: string
  ): Promise<boolean> {
    try {
      this.log('quickShareDashboard:', { dashboardId, userIds, expiryDate })
      console.log(
        '📝 [JSONMockService] Dashboard shared (mock implementation)'
      )
      return true
    } catch (error) {
      console.error('❌ [JSONMockService] quickShareDashboard error:', error)
      return false
    }
  }

  /**
   * Get audit log (not implemented in mock)
   */
  async getAuditLog(options?: any): Promise<AuditLogEntry[]> {
    try {
      this.log('getAuditLog called')
      console.log('📝 [JSONMockService] Returning empty audit log (mock)')
      return []
    } catch (error) {
      console.error('❌ [JSONMockService] getAuditLog error:', error)
      return []
    }
  }
}

/**
 * Export singleton instance of JSONMockService
 */
export function useJSONMockService(): JSONMockService {
  return new JSONMockService()
}
