/**
 * Dashboard & Folder Type Definitions
 * Matches Firestore schema and supports 3-layer permission model
 */

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  uid: string
  email: string
  name: string
  role: 'user' | 'moderator' | 'admin'
  company: string
  groups: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser extends User {
  // Additional auth-specific fields
  lastLogin?: Date
  photoURL?: string
}

// ============================================================================
// FOLDER & HIERARCHY TYPES
// ============================================================================

export interface Folder {
  id: string
  name: string
  parentId?: string | null // null = root folder
  description?: string
  createdBy: string // uid
  createdAt: Date
  updatedAt: Date
  updatedBy: string // uid
  assignedModerators?: string[] // UIDs of moderators who can manage this folder

  // Optional: for client-side hierarchy rendering
  children?: Folder[]
  level?: number // depth in hierarchy (0 = root)
}

export interface FolderPath {
  // Helper type: path from root to specific folder
  ids: string[]
  names: string[]
  folders: Folder[]
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface Dashboard {
  id: string
  name: string
  folderId: string // Which folder this dashboard belongs to
  type: 'looker' // Only Looker dashboards are supported
  description?: string
  
  // Looker-specific fields
  lookerDashboardId?: string
  lookerEmbedUrl?: string
  
  // Metadata
  owner: string // uid of creator
  createdAt: Date
  updatedAt: Date
  updatedBy: string // uid
  
  // Status
  isArchived: boolean
  archivedAt?: Date
  
  // Access control (3-layer permission model)
  access: AccessControl
  restrictions: AccessRestrictions
}

// ============================================================================
// 3-LAYER PERMISSION MODEL
// ============================================================================

/**
 * Layer 1: Direct Access
 * Logic: OR condition
 * If user.uid OR user.role OR user.group matches, user gets access
 */
export interface DirectAccess {
  users: string[] // Array of user UIDs
  roles: string[] // Array of role names
  groups: string[] // Array of group names
}

/**
 * Layer 2: Company-Scoped Access
 * Logic: AND condition (company + (role OR group))
 * User's company must match AND (user.role OR user.group) must match
 */
export interface CompanyAccess {
  [companyId: string]: {
    roles: string[] // Roles in this company that can access
    groups: string[] // Groups in this company that can access
  }
}

/**
 * Combined access control structure
 * Final logic: (Layer1 OR Layer2) AND NOT(Layer3_Restrictions)
 */
export interface AccessControl {
  direct: DirectAccess
  company: CompanyAccess
}

/**
 * Layer 3: Restrictions (Explicit Deny & Time-Based)
 * Logic: NOT condition
 * If user is revoked OR expired, access is denied (overrides Layer1 & Layer2)
 */
export interface AccessRestrictions {
  revoke: string[] // UIDs that are explicitly revoked
  expiry: {
    [userId: string]: Date // User ID -> expiration date
  }
}

// ============================================================================
// PERMISSION CHECK RESULT
// ============================================================================

export interface PermissionCheckResult {
  hasAccess: boolean
  reason?: 'layer1_direct' | 'layer2_company' | 'revoked' | 'expired' | 'no_match'
  grantedBy?: {
    layer: 1 | 2
    type: 'user' | 'role' | 'group' // What matched (layer1)
    name: string // Which role/group/user
  }
}

// ============================================================================
// DASHBOARD QUICK SHARE (Layer 1 Direct Only)
// ============================================================================

export interface QuickShareInput {
  selectedUsers: string[] // User UIDs to add
  expiryDate?: Date // Optional: When access expires
}

// ============================================================================
// DASHBOARD CARD (UI Representation)
// ============================================================================

export interface DashboardCardData extends Dashboard {
  // Additional UI-specific fields
  accessReason: {
    layer: 1 | 2 | 3
    type: 'user' | 'role' | 'group'
    name: string
  }
  isOwner: boolean // Current user is owner
  canEdit: boolean // Current user can edit
  canDelete: boolean // Current user can delete
  canShare: boolean // Current user can share (quick share)
  canManageAccess: boolean // Current user can manage full permissions (admin)
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export interface PaginationOptions {
  limit: number
  offset: number
  sortBy: 'name' | 'created' | 'updated'
  sortOrder: 'asc' | 'desc'
}

export interface DashboardFilterOptions {
  folderId?: string // Filter by folder
  accessLayer?: 1 | 2 | 3 // Filter by how user accessed it
  search?: string // Search by name/description
  archived?: boolean // Include archived dashboards
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GetDashboardsRequest {
  companyId: string
  userId: string
  folderId?: string
  pagination?: PaginationOptions
  filter?: DashboardFilterOptions
}

export interface GetDashboardsResponse {
  dashboards: Dashboard[]
  total: number
  hasMore: boolean
}

export interface GetFoldersRequest {
  companyId: string
  userId: string
}

export interface GetFoldersResponse {
  folders: Folder[]
  hierarchy: FolderPath[]
}

export interface SavePermissionsRequest {
  dashboardId: string
  access: AccessControl
  restrictions: AccessRestrictions
  updatedBy: string
}

export interface SavePermissionsResponse {
  success: boolean
  message?: string
  updatedAt: Date
}

// ============================================================================
// AUDIT LOG
// ============================================================================

export interface AuditLogEntry {
  id: string
  dashboardId: string
  action: 'permission_added' | 'permission_removed' | 'permission_modified' | 'dashboard_created' | 'dashboard_deleted'
  changedBy: string // uid
  changedAt: Date
  changes: {
    from?: AccessControl & AccessRestrictions
    to: AccessControl & AccessRestrictions
    description: string // Human-readable description
  }
}

// ============================================================================
// NOTIFICATION (For permission requests, etc.)
// ============================================================================

export interface NotificationMessage {
  id: string
  type: 'permission_request' | 'permission_granted' | 'access_revoked'
  recipientId: string // uid
  senderId: string // uid
  dashboardId: string
  dashboardName: string
  message: string
  action?: {
    type: 'edit_request' | 'share_notification'
    targetId?: string // For edit requests, who's requesting
  }
  isRead: boolean
  createdAt: Date
  expiresAt?: Date
}

// ============================================================================
// HELPER FUNCTIONS (Type Guards)
// ============================================================================

export function isDashboard(obj: any): obj is Dashboard {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.folderId === 'string'
  )
}

export function isFolder(obj: any): obj is Folder {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string'
  )
}

export function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.uid === 'string' &&
    typeof obj.email === 'string' &&
    ['user', 'moderator', 'admin'].includes(obj.role)
  )
}
