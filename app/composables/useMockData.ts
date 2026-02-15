/**
 * Mock Data for Dashboard Management System
 * Includes: Users, Folders, Dashboards with 3-layer permissions
 * 
 * Usage:
 * import { mockUsers, mockFolders, mockDashboards } from '~/composables/useMockData'
 * 
 * Later: Can switch to real Firebase API without changing components
 */

import type {
  User,
  Folder,
  Dashboard,
  AccessControl,
  AccessRestrictions,
} from '~/types/dashboard'

// ============================================================================
// MOCK COMPANIES
// ============================================================================

export interface Company {
  code: string
  name: string
  country: string
  isActive: boolean
}

export const mockCompanies: Company[] = [
  {
    code: 'STTH',
    name: 'บริษัท สทรีมวอช (ประเทศไทย) จำกัด',
    country: 'Thailand',
    isActive: true,
  },
  {
    code: 'STTN',
    name: 'บริษัท สทรีมวอช เทคโนโลยี จำกัด',
    country: 'Thailand',
    isActive: true,
  },
  {
    code: 'STCS',
    name: 'บริษัท สทรีมวอช คลีนนิ่ง โซลูชั่น จำกัด',
    country: 'Thailand',
    isActive: true,
  },
  {
    code: 'STNR',
    name: 'บริษัท สทรีมวอช (นครราชสีมา) จำกัด',
    country: 'Thailand',
    isActive: true,
  },
  {
    code: 'STPT',
    name: 'บริษัท สทรีมวอช (พัทยา) จำกัด',
    country: 'Thailand',
    isActive: true,
  },
  {
    code: 'STPK',
    name: 'บริษัท สทรีมวอช (ภูเก็ต) จำกัด',
    country: 'Thailand',
    isActive: false,
  },
]

// ============================================================================
// MOCK USERS
// ============================================================================

export const mockUsers: User[] = [
  {
    uid: '61JSdbE674TqRBHHUu9ezdzFul93',
    email: 'it.streamwash@gmail.com',
    name: 'IT STTH',
    role: 'admin',
    company: 'STTH',
    groups: [],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    uid: 'user_somchai_mod',
    email: 'somchai@streamwash.com',
    name: 'Somchai Moderator',
    role: 'moderator',
    company: 'STTH',
    groups: ['sales', 'finance'],
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    uid: 'user_nattha_mod',
    email: 'nattha@streamwash.com',
    name: 'Nattha Moderator',
    role: 'moderator',
    company: 'STTH',
    groups: ['finance'],
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    uid: 'user_teerak_user',
    email: 'teerak@streamwash.com',
    name: 'Teerak User',
    role: 'user',
    company: 'STTH',
    groups: ['sales'],
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    uid: 'user_janine_user',
    email: 'janine@streamwash.com',
    name: 'Janine User',
    role: 'user',
    company: 'STTH',
    groups: ['finance', 'operations'],
    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    uid: 'user_sombat_user',
    email: 'sombat@streamwash.com',
    name: 'Sombat User',
    role: 'user',
    company: 'STTH',
    groups: ['operations'],
    isActive: true,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-02-01'),
  },
]

// ============================================================================
// MOCK GROUPS
// ============================================================================

export const mockGroups = {
  sales: {
    name: 'Sales',
    members: ['user_somchai_mod', 'user_teerak_user'],
    description: 'Sales team members',
  },
  finance: {
    name: 'Finance',
    members: ['user_somchai_mod', 'user_nattha_mod', 'user_janine_user'],
    description: 'Finance team members',
  },
  operations: {
    name: 'Operations',
    members: ['user_janine_user', 'user_sombat_user'],
    description: 'Operations team members',
  },
}

// ============================================================================
// MOCK FOLDER HIERARCHY
// ============================================================================

export const mockFolders: Folder[] = [
  // Root level folders
  {
    id: 'folder_sales',
    name: 'Sales',
    parentId: null,
    company: 'STTH',
    description: 'All sales-related dashboards',
    createdBy: 'user-1',  // Somchai (admin)
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    updatedBy: 'user-1',
  },
  {
    id: 'folder_finance',
    name: 'Finance',
    parentId: null,
    company: 'STTH',
    description: 'Financial reports and dashboards',
    createdBy: 'user-1',  // Somchai (admin)
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    updatedBy: 'user-1',
  },
  {
    id: 'folder_operations',
    name: 'Operations',
    parentId: null,
    company: 'STTH',
    description: 'Operational dashboards',
    createdBy: 'user-1',  // Somchai (admin)
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    updatedBy: 'user-1',
  },
  {
    id: 'folder_hr',
    name: 'HR',
    parentId: null,
    company: 'STTH',
    description: 'Human resources dashboards',
    createdBy: 'user-1',  // Somchai (admin)
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    updatedBy: 'user-1',
  },

  // Level 2: Under Sales
  {
    id: 'folder_sales_reports',
    name: 'Monthly',
    parentId: 'folder_sales',
    company: 'STTH',
    description: 'Sales reports',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    updatedBy: 'user_it_admin',
  },
  {
    id: 'folder_sales_regional',
    name: 'Regional',
    parentId: 'folder_sales',
    company: 'STTH',
    description: 'Regional sales analysis',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    updatedBy: 'user_it_admin',
  },

  // Level 3: Under Sales > Reports
  {
    id: 'folder_sales_reports_east',
    name: 'East',
    parentId: 'folder_sales_reports',
    company: 'STTH',
    description: 'Eastern region reports',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'user_it_admin',
  },
  {
    id: 'folder_sales_reports_west',
    name: 'West',
    parentId: 'folder_sales_reports',
    company: 'STTH',
    description: 'Western region reports',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'user_it_admin',
  },

  // Level 3: Under Sales > Regional
  {
    id: 'folder_sales_regional_north',
    name: 'North',
    parentId: 'folder_sales_regional',
    company: 'STTH',
    description: 'Northern region',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'user_it_admin',
  },
  {
    id: 'folder_sales_regional_south',
    name: 'South',
    parentId: 'folder_sales_regional',
    company: 'STTH',
    description: 'Southern region',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'user_it_admin',
  },

  // Level 4: Under Sales > Regional > North
  {
    id: 'folder_sales_regional_north_2024',
    name: 'Q1 2024',
    parentId: 'folder_sales_regional_north',
    company: 'STTH',
    description: 'Q1 2024 Northern region',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    updatedBy: 'user_it_admin',
  },

  // Level 2: Under Finance
  {
    id: 'folder_finance_budget',
    name: 'Budget',
    parentId: 'folder_finance',
    company: 'STTH',
    description: 'Budget tracking',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    updatedBy: 'user_it_admin',
  },
  {
    id: 'folder_finance_payroll',
    name: 'Payroll',
    parentId: 'folder_finance',
    company: 'STTH',
    description: 'Payroll reports',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    updatedBy: 'user_it_admin',
  },

  // Level 3: Under Finance > Budget
  {
    id: 'folder_finance_budget_2024',
    name: '2024',
    parentId: 'folder_finance_budget',
    company: 'STTH',
    description: '2024 budget',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'user_it_admin',
  },
  {
    id: 'folder_finance_budget_2025',
    name: '2025',
    parentId: 'folder_finance_budget',
    company: 'STTH',
    description: '2025 budget',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    updatedBy: 'user_it_admin',
  },

  // Level 2: Under Operations
  {
    id: 'folder_operations_inventory',
    name: 'Inventory',
    parentId: 'folder_operations',
    company: 'STTH',
    description: 'Inventory management',
    createdBy: 'user_it_admin',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    updatedBy: 'user_it_admin',
  },
]

// ============================================================================
// MOCK DASHBOARDS (with 3-layer permissions)
// ============================================================================

export const mockDashboards: Dashboard[] = [
  // ==================== EXAMPLE 1: Public Dashboard ====================
  // Accessible via: Layer 2 (company-scoped, role: user)
  {
    id: 'dash_sales_east_performance',
    name: 'Regional East Performance',
    folderId: 'folder_sales_reports_east',
    type: 'looker',
    description: 'Sales performance for East region',
    lookerDashboardId: 'dashboard_123_east_perf',
    lookerEmbedUrl: 'https://looker.streamvoice.com/dashboards/123',
    owner: 'user_it_admin',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
    updatedBy: 'user_it_admin',
    isArchived: false,

    access: {
      direct: {
        users: [],
        roles: ['moderator'], // All moderators can access
        groups: [],
      },
      company: {
        STTH: {
          roles: ['user', 'moderator'], // Users & moderators in STTH
          groups: ['sales'], // Sales group in STTH
        },
      },
    },
    restrictions: {
      revoke: [],
      expiry: {},
    },
  },

  // ==================== EXAMPLE 2: Owner-Edited + Quick Share ====================
  // Accessible via: Layer 1 (owner) + Layer 2 (company)
  {
    id: 'dash_finance_summary',
    name: 'Finance Summary',
    folderId: 'folder_finance',
    type: 'looker',
    description: 'Overall finance summary dashboard',
    lookerDashboardId: 'dashboard_456_finance',
    lookerEmbedUrl: 'https://looker.streamvoice.com/dashboards/456',
    owner: 'user_nattha_mod',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-02'),
    updatedBy: 'user_nattha_mod',
    isArchived: false,

    access: {
      direct: {
        users: [
          'user_somchai_mod', // Quick-shared with Somchai
          'user_teerak_user', // Quick-shared with Teerak
        ],
        roles: [],
        groups: [],
      },
      company: {
        STTH: {
          roles: ['user'],
          groups: ['finance'], // All finance members
        },
      },
    },
    restrictions: {
      revoke: [],
      expiry: {
        'user_teerak_user': new Date('2024-03-15'), // Teerak's access expires
      },
    },
  },

  // ==================== EXAMPLE 3: Admin Only ====================
  // Accessible via: Layer 1 (admin role only)
  {
    id: 'dash_hr_employee_data',
    name: 'Employee Data',
    folderId: 'folder_hr',
    type: 'looker',
    description: 'Sensitive employee information',
    lookerDashboardId: 'dashboard_789_hr',
    lookerEmbedUrl: 'https://looker.streamvoice.com/dashboards/789',
    owner: 'user_it_admin',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-01'),
    updatedBy: 'user_it_admin',
    isArchived: false,

    access: {
      direct: {
        users: [],
        roles: ['admin'], // Admin role only
        groups: [],
      },
      company: {}, // No company-wide access
    },
    restrictions: {
      revoke: [],
      expiry: {},
    },
  },

  // ==================== EXAMPLE 4: Restricted (User Revoked) ====================
  // Accessible via: Layer 2 BUT Layer 3 overrides
  {
    id: 'dash_budget_2024',
    name: 'Budget 2024',
    folderId: 'folder_finance_budget_2024',
    type: 'looker',
    description: '2024 budget tracking dashboard',
    lookerDashboardId: 'dashboard_budget_2024',
    lookerEmbedUrl: 'https://looker.streamvoice.com/dashboards/budget2024',
    owner: 'user_it_admin',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-02-01'),
    updatedBy: 'user_it_admin',
    isArchived: false,

    access: {
      direct: {
        users: [],
        roles: [],
        groups: [],
      },
      company: {
        STTH: {
          roles: ['user', 'moderator'],
          groups: ['finance'],
        },
      },
    },
    restrictions: {
      revoke: ['user_teerak_user'], // Teerak is explicitly revoked
      expiry: {}, // No time-based expiry
    },
  },

  // ==================== EXAMPLE 5: Temporary Project Access ====================
  // Accessible via: Layer 1 (direct group) with expiry
  {
    id: 'dash_project_q1_analytics',
    name: 'Project Q1 Analytics',
    folderId: 'folder_sales_regional_north_2024',
    type: 'custom',
    description: 'Q1 project analytics dashboard',
    owner: 'user_somchai_mod',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-02-01'),
    updatedBy: 'user_somchai_mod',
    isArchived: false,

    access: {
      direct: {
        users: [],
        roles: [],
        groups: ['project_q1'], // Specific project group
      },
      company: {},
    },
    restrictions: {
      revoke: [],
      expiry: {
        // All members of project_q1 group expire on project end date
        'project_q1': new Date('2024-06-30'),
      },
    },
  },

  // ==================== EXAMPLE 6: Multiple Layer Access ====================
  // Accessible via: Layer 1 OR Layer 2 (complex)
  {
    id: 'dash_sales_map',
    name: 'Regional Sales Map',
    folderId: 'folder_sales_regional',
    type: 'looker',
    description: 'Interactive sales map by region',
    lookerDashboardId: 'dashboard_sales_map',
    lookerEmbedUrl: 'https://looker.streamvoice.com/dashboards/sales_map',
    owner: 'user_it_admin',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-02-01'),
    updatedBy: 'user_it_admin',
    isArchived: false,

    access: {
      direct: {
        users: ['user_somchai_mod'], // Direct user access
        roles: ['moderator'], // All moderators
        groups: ['sales'], // All sales members
      },
      company: {
        STTH: {
          roles: ['user'], // All users in STTH
          groups: ['operations'], // Operations group in STTH
        },
      },
    },
    restrictions: {
      revoke: [],
      expiry: {},
    },
  },

  // ==================== EXAMPLE 7: Deep Hierarchy Dashboard ====================
  // Nested 4 levels deep (Sales > Reports > East > deeper)
  {
    id: 'dash_east_q1_forecast',
    name: 'East Q1 Forecast',
    folderId: 'folder_sales_reports_east',
    type: 'looker',
    description: 'Q1 forecast for East region',
    lookerDashboardId: 'dashboard_east_q1_forecast',
    lookerEmbedUrl: 'https://looker.streamvoice.com/dashboards/east_q1_forecast',
    owner: 'user_somchai_mod',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-02-01'),
    updatedBy: 'user_somchai_mod',
    isArchived: false,

    access: {
      direct: {
        users: [],
        roles: [],
        groups: [],
      },
      company: {
        STTH: {
          roles: ['user'],
          groups: ['sales'],
        },
      },
    },
    restrictions: {
      revoke: [],
      expiry: {},
    },
  },

  // ==================== EXAMPLE 8: Archived Dashboard ====================
  {
    id: 'dash_old_legacy',
    name: 'Legacy Dashboard (Archived)',
    folderId: 'folder_sales',
    type: 'looker',
    description: 'Old dashboard - no longer maintained',
    owner: 'user_it_admin',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-20'),
    updatedBy: 'user_it_admin',
    isArchived: true,
    archivedAt: new Date('2024-01-20'),

    access: {
      direct: {
        users: [],
        roles: [],
        groups: [],
      },
      company: {},
    },
    restrictions: {
      revoke: [],
      expiry: {},
    },
  },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get user by UID from mock data
 * Throws error if user not found (safe for production)
 * @throws Error if user not found in system
 */
export function getMockUserByUid(uid: string): User {
  const user = mockUsers.find((u) => u.uid === uid)

  if (!user) {
    const errorMessage = `User with UID "${uid}" not found in system. Please contact administrator to create an account.`
    console.error('❌ [useMockData]', errorMessage)
    throw new Error(errorMessage)
  }

  return user
}

/**
 * Get all folders by parent ID
 */
export function getMockFoldersByParent(parentId: string | null): Folder[] {
  return mockFolders.filter((f) => f.parentId === parentId)
}

/**
 * Get dashboard by ID
 */
export function getMockDashboardById(id: string): Dashboard | undefined {
  return mockDashboards.find((d) => d.id === id)
}

/**
 * Get all dashboards in a specific folder
 */
export function getMockDashboardsByFolder(folderId: string): Dashboard[] {
  return mockDashboards.filter((d) => d.folderId === folderId)
}

/**
 * Get folder by ID with hierarchy information
 */
export function getMockFolderById(id: string): Folder | undefined {
  return mockFolders.find((f) => f.id === id)
}

/**
 * Build folder hierarchy (parent -> children tree)
 */
export function buildFolderHierarchy(folders: Folder[]): Map<string, Folder[]> {
  const hierarchy = new Map<string, Folder[]>()

  for (const folder of folders) {
    const parentId = folder.parentId || 'root'
    if (!hierarchy.has(parentId)) {
      hierarchy.set(parentId, [])
    }
    hierarchy.get(parentId)!.push(folder)
  }

  return hierarchy
}

/**
 * Get folder path (from root to specific folder)
 */
export function getFolderPath(
  folderId: string,
  folders: Folder[]
): Folder[] {
  const path: Folder[] = []
  let currentId: string | null | undefined = folderId

  while (currentId) {
    const folder = folders.find((f) => f.id === currentId)
    if (!folder) break

    path.unshift(folder)
    currentId = folder.parentId
  }

  return path
}

/**
 * Get all dashboards accessible to a user
 * (Based on 3-layer permission model)
 */
export function getAccessibleDashboards(
  user: User,
  dashboards: Dashboard[]
): Dashboard[] {
  return dashboards.filter((dashboard) => {
    // Admins can see all dashboards (except they still respect explicit revocation for security)
    if (user.role === 'admin') {
      // Even admins are blocked by explicit revocation
      if (dashboard.restrictions.revoke.includes(user.uid)) {
        return false
      }
      return true
    }

    // Check if archived - non-admins cannot see archived dashboards
    // (admins already returned above)
    if (dashboard.isArchived) {
      return false
    }

    const access = dashboard.access
    const restrictions = dashboard.restrictions

    // Layer 3: Check restrictions first (explicit deny)
    if (restrictions.revoke.includes(user.uid)) {
      return false // User is explicitly revoked
    }

    const expiryDate = restrictions.expiry[user.uid]
    if (expiryDate) {
      if (new Date() > expiryDate) {
        return false // User's access has expired
      }
    }

    // Layer 1: Direct access (OR logic)
    if (access.direct.users.includes(user.uid)) {
      return true
    }

    if (access.direct.roles.includes(user.role)) {
      return true
    }

    for (const group of user.groups) {
      if (access.direct.groups.includes(group)) {
        return true
      }
    }

    // Layer 2: Company-scoped (AND logic: company + (role OR group))
    const companyAccess = access.company[user.company]
    if (companyAccess) {
      if (companyAccess.roles.includes(user.role)) {
        return true
      }

      for (const group of user.groups) {
        if (companyAccess.groups.includes(group)) {
          return true
        }
      }
    }

    return false
  })
}

// ============================================================================
// COMPANY HELPER FUNCTIONS
// ============================================================================

/**
 * Get company by code
 * @param code Company code (e.g., 'STTH', 'STTN')
 * @returns Company object or undefined
 */
export function getCompanyByCode(code: string): Company | undefined {
  return mockCompanies.find(company => company.code === code)
}

/**
 * Get all active companies
 * @returns Array of active companies
 */
export function getActiveCompanies(): Company[] {
  return mockCompanies.filter(company => company.isActive)
}
