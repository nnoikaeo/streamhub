import { defineStore } from 'pinia'
import type { UserData } from './auth'

/**
 * Permission definitions for different features
 * Maps feature names to required roles
 */
export interface FeaturePermissions {
  canViewDashboards: boolean
  canCreateDashboard: boolean
  canEditDashboard: boolean
  canDeleteDashboard: boolean
  canShareDashboard: boolean
  canCreateFolder: boolean
  canEditFolder: boolean
  canDeleteFolder: boolean
  canAccessAdmin: boolean
  canManageUsers: boolean
}

/**
 * Role-based permission mappings
 * Defines what permissions each role has
 */
const ROLE_PERMISSIONS: Record<string, Partial<FeaturePermissions>> = {
  admin: {
    canViewDashboards: true,
    canCreateDashboard: true,
    canEditDashboard: true,
    canDeleteDashboard: true,
    canShareDashboard: true,
    canCreateFolder: true,
    canEditFolder: true,
    canDeleteFolder: true,
    canAccessAdmin: true,
    canManageUsers: true,
  },
  editor: {
    canViewDashboards: true,
    canCreateDashboard: true,
    canEditDashboard: true,
    canDeleteDashboard: true,
    canShareDashboard: true,
    canCreateFolder: true,
    canEditFolder: true,
    canDeleteFolder: false,
    canAccessAdmin: false,
    canManageUsers: false,
  },
  viewer: {
    canViewDashboards: true,
    canCreateDashboard: false,
    canEditDashboard: false,
    canDeleteDashboard: false,
    canShareDashboard: false,
    canCreateFolder: false,
    canEditFolder: false,
    canDeleteFolder: false,
    canAccessAdmin: false,
    canManageUsers: false,
  },
  user: {
    canViewDashboards: true,
    canCreateDashboard: false,
    canEditDashboard: false,
    canDeleteDashboard: false,
    canShareDashboard: false,
    canCreateFolder: false,
    canEditFolder: false,
    canDeleteFolder: false,
    canAccessAdmin: false,
    canManageUsers: false,
  },
}

/**
 * Permissions Store - Strategy 4 Implementation
 *
 * Manages access control for UI components and features based on user role
 *
 * Usage in components:
 * ```typescript
 * const permissions = usePermissionsStore()
 *
 * // Check single permission
 * <button v-if="permissions.canCreateDashboard">Create Dashboard</button>
 *
 * // Check multiple permissions
 * <div v-if="permissions.has(['canEditDashboard', 'canShareDashboard'])">
 *   Edit & Share Actions
 * </div>
 * ```
 */
export const usePermissionsStore = defineStore('permissions', () => {
  const currentUser = ref<UserData | null>(null)
  const userRole = ref<string>('user')
  const permissions = ref<FeaturePermissions>({
    canViewDashboards: false,
    canCreateDashboard: false,
    canEditDashboard: false,
    canDeleteDashboard: false,
    canShareDashboard: false,
    canCreateFolder: false,
    canEditFolder: false,
    canDeleteFolder: false,
    canAccessAdmin: false,
    canManageUsers: false,
  })

  /**
   * Initialize permissions based on user data
   * Called when user logs in or when auth state changes
   */
  const initializePermissions = (user: UserData | null) => {
    if (!user) {
      // Reset permissions for logged out user
      currentUser.value = null
      userRole.value = 'user'
      permissions.value = {
        canViewDashboards: false,
        canCreateDashboard: false,
        canEditDashboard: false,
        canDeleteDashboard: false,
        canShareDashboard: false,
        canCreateFolder: false,
        canEditFolder: false,
        canDeleteFolder: false,
        canAccessAdmin: false,
        canManageUsers: false,
      }
      return
    }

    currentUser.value = user
    userRole.value = user.role || 'user'

    // Get permissions for this role
    const rolePerms = ROLE_PERMISSIONS[userRole.value] || ROLE_PERMISSIONS.user
    permissions.value = {
      canViewDashboards: rolePerms.canViewDashboards ?? false,
      canCreateDashboard: rolePerms.canCreateDashboard ?? false,
      canEditDashboard: rolePerms.canEditDashboard ?? false,
      canDeleteDashboard: rolePerms.canDeleteDashboard ?? false,
      canShareDashboard: rolePerms.canShareDashboard ?? false,
      canCreateFolder: rolePerms.canCreateFolder ?? false,
      canEditFolder: rolePerms.canEditFolder ?? false,
      canDeleteFolder: rolePerms.canDeleteFolder ?? false,
      canAccessAdmin: rolePerms.canAccessAdmin ?? false,
      canManageUsers: rolePerms.canManageUsers ?? false,
    }
  }

  /**
   * Check if user has a single permission
   * @param permission - Permission to check
   * @returns true if user has permission
   *
   * Usage: if (can('canCreateDashboard')) { ... }
   */
  const can = (permission: keyof FeaturePermissions): boolean => {
    return permissions.value[permission] ?? false
  }

  /**
   * Check if user has all permissions in a list
   * @param permissionList - Array of permissions to check
   * @returns true if user has all permissions
   *
   * Usage: if (has(['canEditDashboard', 'canShareDashboard'])) { ... }
   */
  const hasAll = (permissionList: (keyof FeaturePermissions)[]): boolean => {
    return permissionList.every((permission) => permissions.value[permission] ?? false)
  }

  /**
   * Check if user has any permission in a list
   * @param permissionList - Array of permissions to check
   * @returns true if user has at least one permission
   *
   * Usage: if (hasAny(['canEditDashboard', 'canDeleteDashboard'])) { ... }
   */
  const hasAny = (permissionList: (keyof FeaturePermissions)[]): boolean => {
    return permissionList.some((permission) => permissions.value[permission] ?? false)
  }

  /**
   * Get all current permissions as object
   * @returns Current permissions object
   */
  const getAllPermissions = (): FeaturePermissions => {
    return { ...permissions.value }
  }

  /**
   * Check if user is admin
   */
  const isAdmin = computed(() => userRole.value === 'admin')

  /**
   * Check if user is editor
   */
  const isEditor = computed(() => userRole.value === 'editor' || userRole.value === 'admin')

  /**
   * Check if user can modify content (create/edit/delete)
   */
  const canModifyContent = computed(() => {
    return permissions.value.canCreateDashboard || permissions.value.canEditDashboard
  })

  return {
    // State
    currentUser,
    userRole,
    permissions,

    // Methods
    initializePermissions,
    can,
    hasAll,
    hasAny,
    getAllPermissions,

    // Computed
    isAdmin,
    isEditor,
    canModifyContent,
  }
})
