<template>
  <div class="permission-editor">
    <!-- Tabs for Permission Layers -->
    <div class="permission-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="permission-tab"
        :class="{ 'permission-tab-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="permission-content">
      <!-- Layer 1: Direct Access -->
      <div v-show="activeTab === 'direct'" class="permission-layer">
        <h3 class="layer-title">Direct User Access</h3>
        <p class="layer-description">Grant direct access to individual users or groups</p>

        <!-- Add User Form -->
        <div class="permission-form">
          <div class="form-group">
            <label>Select Users</label>
            <select v-model="selectedDirectUser" class="form-input">
              <option value="">Choose a user...</option>
              <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.email }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Expiry (Optional)</label>
            <input v-model="directExpiry" type="date" class="form-input" />
          </div>

          <button type="button" class="add-permission-btn" @click="addDirectAccess">
            Add User
          </button>
        </div>

        <!-- Direct Access List -->
        <div v-if="directAccess.length > 0" class="permission-list">
          <div v-for="access in directAccess" :key="`direct-${access.userId}`" class="permission-item">
            <div class="permission-info">
              <span class="permission-user">{{ getUserName(access.userId) }}</span>
              <span v-if="access.expiryDate" class="permission-expiry">
                Expires: {{ formatDate(access.expiryDate) }}
              </span>
            </div>
            <button
              type="button"
              class="remove-permission-btn"
              @click="removeDirectAccess(access.userId)"
            >
              Remove
            </button>
          </div>
        </div>
        <p v-else class="empty-list">No direct access granted yet</p>
      </div>

      <!-- Layer 2: Company-Scoped Access -->
      <div v-show="activeTab === 'company'" class="permission-layer">
        <h3 class="layer-title">Company-Scoped Access</h3>
        <p class="layer-description">Grant access to users by role or company</p>

        <!-- Add Company Access Form -->
        <div class="permission-form">
          <div class="form-group">
            <label>Company</label>
            <select v-model="selectedCompany" class="form-input">
              <option value="">Choose a company...</option>
              <option value="streamvoice">StreamVoice</option>
            </select>
          </div>

          <div class="form-group">
            <label>Role</label>
            <select v-model="selectedRole" class="form-input">
              <option value="">Choose a role...</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>

          <button type="button" class="add-permission-btn" @click="addCompanyAccess">
            Add Role Access
          </button>
        </div>

        <!-- Company Access List -->
        <div v-if="companyAccess.length > 0" class="permission-list">
          <div v-for="access in companyAccess" :key="`company-${access.roleId}`" class="permission-item">
            <div class="permission-info">
              <span class="permission-user">{{ access.roleId }} @ {{ access.companyId }}</span>
            </div>
            <button
              type="button"
              class="remove-permission-btn"
              @click="removeCompanyAccess(access.roleId)"
            >
              Remove
            </button>
          </div>
        </div>
        <p v-else class="empty-list">No company-scoped access granted yet</p>
      </div>

      <!-- Layer 3: Restrictions -->
      <div v-show="activeTab === 'restrictions'" class="permission-layer">
        <h3 class="layer-title">Access Restrictions</h3>
        <p class="layer-description">Explicitly deny access or set global restrictions</p>

        <!-- Add Restriction Form -->
        <div class="permission-form">
          <div class="form-group">
            <label>Deny Access For User</label>
            <select v-model="selectedDenyUser" class="form-input">
              <option value="">Choose a user...</option>
              <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.email }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Reason (Optional)</label>
            <input
              v-model="denyReason"
              type="text"
              placeholder="Why is this user denied?"
              class="form-input"
            />
          </div>

          <button type="button" class="add-restriction-btn" @click="addRestriction">
            Add Restriction
          </button>
        </div>

        <!-- Restrictions List -->
        <div v-if="restrictions.length > 0" class="permission-list">
          <div v-for="restriction in restrictions" :key="`restrict-${restriction.userId}`" class="permission-item restriction-item">
            <div class="permission-info">
              <span class="permission-user">❌ {{ getUserName(restriction.userId) }}</span>
              <span v-if="restriction.reason" class="restriction-reason">{{ restriction.reason }}</span>
            </div>
            <button
              type="button"
              class="remove-restriction-btn"
              @click="removeRestriction(restriction.userId)"
            >
              Remove
            </button>
          </div>
        </div>
        <p v-else class="empty-list">No restrictions in place</p>
      </div>
    </div>

    <!-- Summary -->
    <div class="permission-summary">
      <div class="summary-stat">
        <span class="stat-label">Direct Users:</span>
        <span class="stat-value">{{ directAccess.length }}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Role Access:</span>
        <span class="stat-value">{{ companyAccess.length }}</span>
      </div>
      <div class="summary-stat">
        <span class="stat-label">Restrictions:</span>
        <span class="stat-value">{{ restrictions.length }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="permission-actions">
      <button type="button" class="action-btn action-cancel" @click="$emit('cancel')">
        Cancel
      </button>
      <button type="button" class="action-btn action-save" @click="handleSave">
        Save Changes
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { type User, type DirectAccess, type CompanyAccess, type AccessRestrictions } from '~/types/dashboard'

/**
 * PermissionEditor - Admin panel permission management UI
 *
 * 3-Layer Permission Model:
 *
 * Layer 1: Direct Access
 * - Individual users with optional expiry
 *
 * Layer 2: Company-Scoped
 * - Role-based access (admin, moderator, user)
 *
 * Layer 3: Restrictions
 * - Explicit deny rules (override other layers)
 *
 * Logic: (Layer1 OR Layer2) AND NOT(Layer3) = Access Granted
 *
 * Features:
 * - Tabbed interface for 3 layers
 * - Add/remove permissions
 * - Summary statistics
 * - Save/cancel actions
 *
 * Events:
 * - save: User saved permission changes
 * - cancel: User cancelled editing
 *
 * Usage:
 * <PermissionEditor
 *   :dashboard-id="dashboardId"
 *   :available-users="allUsers"
 *   :current-permissions="permissions"
 *   @save="handleSavePermissions"
 *   @cancel="handleCancel"
 * />
 */

const props = defineProps({
  /**
   * Dashboard ID
   */
  dashboardId: {
    type: String,
    required: true,
  },

  /**
   * Available users to grant access
   */
  availableUsers: {
    type: Array as () => User[],
    required: true,
  },

  /**
   * Current permissions (for initialization)
   */
  currentPermissions: {
    type: Object,
    default: () => ({
      directAccess: [],
      companyAccess: [],
      restrictions: [],
    }),
  },
})

const emit = defineEmits<{
  save: [permissions: { directAccess: DirectAccess[]; companyAccess: CompanyAccess[]; restrictions: AccessRestrictions[] }]
  cancel: []
}>()

// Tab management
const activeTab = ref('direct')
const tabs = [
  { id: 'direct', label: 'Direct Access (Layer 1)' },
  { id: 'company', label: 'Company-Scoped (Layer 2)' },
  { id: 'restrictions', label: 'Restrictions (Layer 3)' },
]

// Layer 1: Direct Access
const selectedDirectUser = ref('')
const directExpiry = ref('')
const directAccess = ref<DirectAccess[]>(props.currentPermissions.directAccess || [])

// Layer 2: Company-Scoped
const selectedCompany = ref('')
const selectedRole = ref('')
const companyAccess = ref<CompanyAccess[]>(props.currentPermissions.companyAccess || [])

// Layer 3: Restrictions
const selectedDenyUser = ref('')
const denyReason = ref('')
const restrictions = ref<AccessRestrictions[]>(props.currentPermissions.restrictions || [])

/**
 * Get user name by ID
 */
const getUserName = (userId: string): string => {
  return props.availableUsers.find((u) => u.id === userId)?.name || 'Unknown User'
}

/**
 * Format date
 */
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString()
}

/**
 * Add direct access
 */
const addDirectAccess = () => {
  if (!selectedDirectUser.value) return

  const exists = directAccess.value.some((a) => a.userId === selectedDirectUser.value)
  if (!exists) {
    directAccess.value.push({
      userId: selectedDirectUser.value,
      expiryDate: directExpiry.value || undefined,
    })
  }

  selectedDirectUser.value = ''
  directExpiry.value = ''
}

/**
 * Remove direct access
 */
const removeDirectAccess = (userId: string) => {
  directAccess.value = directAccess.value.filter((a) => a.userId !== userId)
}

/**
 * Add company access
 */
const addCompanyAccess = () => {
  if (!selectedCompany.value || !selectedRole.value) return

  const exists = companyAccess.value.some(
    (a) => a.companyId === selectedCompany.value && a.roleId === selectedRole.value,
  )
  if (!exists) {
    companyAccess.value.push({
      companyId: selectedCompany.value,
      roleId: selectedRole.value,
    })
  }

  selectedCompany.value = ''
  selectedRole.value = ''
}

/**
 * Remove company access
 */
const removeCompanyAccess = (roleId: string) => {
  companyAccess.value = companyAccess.value.filter((a) => a.roleId !== roleId)
}

/**
 * Add restriction
 */
const addRestriction = () => {
  if (!selectedDenyUser.value) return

  const exists = restrictions.value.some((r) => r.userId === selectedDenyUser.value)
  if (!exists) {
    restrictions.value.push({
      userId: selectedDenyUser.value,
      reason: denyReason.value || undefined,
    })
  }

  selectedDenyUser.value = ''
  denyReason.value = ''
}

/**
 * Remove restriction
 */
const removeRestriction = (userId: string) => {
  restrictions.value = restrictions.value.filter((r) => r.userId !== userId)
}

/**
 * Save permissions
 */
const handleSave = () => {
  emit('save', {
    directAccess: directAccess.value,
    companyAccess: companyAccess.value,
    restrictions: restrictions.value,
  })
}
</script>

<style scoped>
.permission-editor {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ========== TABS ========== */
.permission-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.permission-tab {
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  color: #6b7280;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: #1f2937;
  }

  &.permission-tab-active {
    border-color: #3b82f6;
    color: #3b82f6;
  }
}

/* ========== CONTENT ========== */
.permission-content {
  min-height: 300px;
}

.permission-layer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.layer-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.layer-description {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* ========== FORM ========== */
.permission-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.form-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.add-permission-btn {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #2563eb;
  }
}

.add-restriction-btn {
  padding: 0.5rem 1rem;
  background-color: #ef4444;
  color: #ffffff;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #dc2626;
  }
}

/* ========== PERMISSION LIST ========== */
.permission-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.375rem;
}

.permission-item.restriction-item {
  background-color: #fee2e2;
  border-color: #fecaca;
}

.permission-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.permission-user {
  font-weight: 500;
  font-size: 0.875rem;
  color: #1f2937;
}

.permission-expiry,
.restriction-reason {
  font-size: 0.8125rem;
  color: #6b7280;
}

.remove-permission-btn,
.remove-restriction-btn {
  padding: 0.375rem 0.75rem;
  background: none;
  border: 1px solid #9ca3af;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8125rem;
  color: #6b7280;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f3f4f6;
    border-color: #6b7280;
  }
}

.remove-restriction-btn:hover {
  background-color: #fecaca;
  border-color: #ef4444;
  color: #991b1b;
}

/* ========== EMPTY ========== */
.empty-list {
  margin: 0;
  padding: 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
}

/* ========== SUMMARY ========== */
.permission-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

/* ========== ACTIONS ========== */
.permission-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.action-btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-cancel {
  background-color: #e5e7eb;
  color: #1f2937;

  &:hover {
    background-color: #d1d5db;
  }
}

.action-save {
  background-color: #3b82f6;
  color: #ffffff;

  &:hover {
    background-color: #2563eb;
  }
}
</style>
