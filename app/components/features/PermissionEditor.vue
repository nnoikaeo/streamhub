<template>
  <div class="permission-editor">
    <!-- Tabs -->
    <div class="permission-tabs">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        type="button"
        class="permission-tab"
        :class="{ 'permission-tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span class="permission-tab__count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Tab 1: Direct Access -->
    <div v-show="activeTab === 'direct'" class="permission-layer">
      <div class="pe-selector">
        <div class="pe-selector__label">
          สิทธิ์ตรง
          <span class="pe-selector__count">{{ directCount }} รายการ</span>
        </div>
        <div class="pe-selector__panels">
          <!-- Column 1: Type Toggle -->
          <div class="panel panel--type">
            <div class="panel__header">ประเภท</div>
            <div class="panel__body">
              <button
                type="button"
                class="type-item"
                :class="{ 'type-item--active': directMode === 'users' }"
                @click="directMode = 'users'; directSearch = ''"
              >
                ผู้ใช้
                <span class="type-item__count">{{ availableUsersForDirect.length }}</span>
              </button>
              <button
                type="button"
                class="type-item"
                :class="{ 'type-item--active': directMode === 'groups' }"
                @click="directMode = 'groups'; directSearch = ''"
              >
                กลุ่ม
                <span class="type-item__count">{{ availableGroupsForDirect.length }}</span>
              </button>
            </div>
          </div>

          <!-- Column 2: Available Items -->
          <div class="panel panel--items">
            <div class="panel__header">
              {{ directMode === 'users' ? 'ผู้ใช้' : 'กลุ่ม' }}
              <span class="panel__header-count">({{ directMode === 'users' ? filteredDirectUsers.length : filteredDirectGroups.length }})</span>
            </div>
            <div class="panel__search">
              <input
                v-model="directSearch"
                type="text"
                class="panel__search-input"
                :placeholder="directMode === 'users' ? 'ค้นหาชื่อ หรืออีเมล...' : 'ค้นหาชื่อกลุ่ม...'"
              />
            </div>
            <div class="panel__body">
              <!-- Users mode -->
              <template v-if="directMode === 'users'">
                <button
                  v-for="user in filteredDirectUsers"
                  :key="user.uid"
                  type="button"
                  class="user-item"
                  @click="addDirectUser(user.uid)"
                >
                  <div class="user-item__info">
                    <span class="user-item__name">{{ user.name }}</span>
                    <span class="user-item__email">{{ user.company }}</span>
                  </div>
                  <span class="user-item__add">+</span>
                </button>
                <div v-if="filteredDirectUsers.length === 0" class="panel__empty">
                  {{ directSearch ? 'ไม่พบผู้ใช้ที่ตรงกัน' : 'ไม่มีผู้ใช้ที่เพิ่มได้' }}
                </div>
              </template>
              <!-- Groups mode -->
              <template v-else>
                <button
                  v-for="group in filteredDirectGroups"
                  :key="group.id"
                  type="button"
                  class="user-item"
                  @click="addDirectGroup(group.id)"
                >
                  <div class="user-item__info">
                    <span class="user-item__name">{{ group.name }}</span>
                    <span class="user-item__email">{{ group.members.length }} สมาชิก</span>
                  </div>
                  <span class="user-item__add">+</span>
                </button>
                <div v-if="filteredDirectGroups.length === 0" class="panel__empty">
                  {{ directSearch ? 'ไม่พบกลุ่มที่ตรงกัน' : 'ไม่มีกลุ่มที่เพิ่มได้' }}
                </div>
              </template>
            </div>
          </div>

          <!-- Column 3: Granted Direct Permissions -->
          <div class="panel panel--selected">
            <div class="panel__header">
              สิทธิ์ที่ให้แล้ว
              <button
                v-if="directCount > 0"
                type="button"
                class="panel__clear-btn"
                @click="clearAllDirect"
              >
                ล้างทั้งหมด
              </button>
            </div>
            <div class="panel__body">
              <!-- Users -->
              <div
                v-for="uid in localAccess.direct.users"
                :key="`user-${uid}`"
                class="selected-item"
              >
                <div class="selected-item__info">
                  <span class="selected-item__icon">👤</span>
                  <div class="selected-item__text">
                    <span class="selected-item__name">{{ getUserName(uid) }}</span>
                    <span class="selected-item__company">{{ getUserCompany(uid) }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="selected-item__remove"
                  @click="removeDirectUser(uid)"
                  aria-label="ลบสิทธิ์"
                >
                  ✕
                </button>
              </div>
              <!-- Groups -->
              <div
                v-for="gid in localAccess.direct.groups"
                :key="`group-${gid}`"
                class="selected-item"
              >
                <div class="selected-item__info">
                  <span class="selected-item__icon">👥</span>
                  <div class="selected-item__text">
                    <span class="selected-item__name">{{ getGroupName(gid) }}</span>
                    <span class="selected-item__company">{{ getGroupMemberCount(gid) }} สมาชิก</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="selected-item__remove"
                  @click="removeDirectGroup(gid)"
                  aria-label="ลบสิทธิ์"
                >
                  ✕
                </button>
              </div>
              <div v-if="directCount === 0" class="panel__empty">
                คลิกรายการเพื่อเพิ่มสิทธิ์
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Company-Scoped -->
    <div v-show="activeTab === 'company'" class="permission-layer">
      <div class="pe-selector">
        <div class="pe-selector__label">
          ตามบริษัท
          <span class="pe-selector__count">{{ companyTotalGroups }} กลุ่ม</span>
        </div>
        <div class="pe-selector__panels">
          <!-- Column 1: Companies -->
          <div class="panel panel--company">
            <div class="panel__header">บริษัท</div>
            <div class="panel__body">
              <button
                v-for="company in activeCompanies"
                :key="company.code"
                type="button"
                class="company-item"
                :class="{ 'company-item--active': selectedCompanyCode === company.code }"
                @click="selectedCompanyCode = company.code; companySearch = ''"
              >
                {{ company.code }}
                <span class="company-item__count">{{ getCompanyGroupCount(company.code) }}</span>
              </button>
              <div v-if="activeCompanies.length === 0" class="panel__empty">
                ไม่มีบริษัทที่ใช้งาน
              </div>
            </div>
          </div>

          <!-- Column 2: Groups for selected company (checkboxes) -->
          <div class="panel panel--items">
            <div class="panel__header">
              กลุ่ม{{ selectedCompanyCode ? ` · ${selectedCompanyCode}` : '' }}
              <span class="panel__header-count">({{ filteredCompanyGroups.length }})</span>
            </div>
            <div class="panel__search">
              <input
                v-model="companySearch"
                type="text"
                class="panel__search-input"
                placeholder="ค้นหาชื่อกลุ่ม..."
              />
            </div>
            <div class="panel__body">
              <!-- "ทั้งหมด" = unrestricted mode: ทุก role เข้าถึงได้ ไม่จำกัดกลุ่ม -->
              <label v-if="selectedCompanyCode" class="group-checkbox group-checkbox--all">
                <input
                  type="checkbox"
                  class="group-checkbox__input"
                  :checked="isCompanyUnrestricted(selectedCompanyCode)"
                  @change="toggleCompanyUnrestricted(selectedCompanyCode)"
                />
                <span class="group-checkbox__name">ทั้งหมด</span>
                <span class="group-checkbox__members">ไม่จำกัดกลุ่ม</span>
              </label>
              <label
                v-for="group in filteredCompanyGroups"
                :key="group.id"
                class="group-checkbox"
              >
                <input
                  type="checkbox"
                  class="group-checkbox__input"
                  :checked="isGroupInCompany(selectedCompanyCode, group.id)"
                  :disabled="isCompanyUnrestricted(selectedCompanyCode)"
                  @change="toggleCompanyGroup(selectedCompanyCode, group.id)"
                />
                <span class="group-checkbox__name">{{ group.name }}</span>
                <span class="group-checkbox__members">{{ group.members.length }} สมาชิก</span>
              </label>
              <div v-if="filteredCompanyGroups.length === 0" class="panel__empty">
                {{ companySearch ? 'ไม่พบกลุ่มที่ตรงกัน' : (selectedCompanyCode ? 'ไม่มีกลุ่ม' : 'เลือกบริษัทก่อน') }}
              </div>
            </div>
          </div>

          <!-- Column 3: Summary of all company permissions -->
          <div class="panel panel--selected">
            <div class="panel__header">สรุปสิทธิ์ทุกบริษัท</div>
            <div class="panel__body">
              <template v-for="(companyData, companyCode) in localAccess.company" :key="companyCode">
                <div v-if="companyData.groups.length > 0" class="company-summary">
                  <div class="company-summary__header">{{ companyCode }}</div>
                  <!-- Unrestricted mode -->
                  <div v-if="companyData.groups.includes('*')" class="selected-item selected-item--unrestricted">
                    <div class="selected-item__info">
                      <span class="selected-item__icon">🌐</span>
                      <div class="selected-item__text">
                        <span class="selected-item__name">ทั้งหมด (ไม่จำกัดกลุ่ม)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="selected-item__remove"
                      @click="toggleCompanyUnrestricted(companyCode as string)"
                      aria-label="ลบสิทธิ์"
                    >
                      ✕
                    </button>
                  </div>
                  <!-- Individual groups -->
                  <template v-else>
                    <div
                      v-for="gid in companyData.groups"
                      :key="`${companyCode}-${gid}`"
                      class="selected-item"
                    >
                      <div class="selected-item__info">
                        <span class="selected-item__icon">👥</span>
                        <div class="selected-item__text">
                          <span class="selected-item__name">{{ getGroupName(gid) }}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        class="selected-item__remove"
                        @click="removeCompanyGroup(companyCode as string, gid)"
                        aria-label="ลบสิทธิ์"
                      >
                        ✕
                      </button>
                    </div>
                  </template>
                </div>
              </template>
              <div v-if="companyTotalGroups === 0" class="panel__empty">
                เลือกกลุ่มจากบริษัท
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Restrictions -->
    <div v-if="showRestrictions" v-show="activeTab === 'restrictions'" class="permission-layer">
      <div class="pe-selector">
        <div class="pe-selector__label">
          ข้อจำกัด
          <span class="pe-selector__count">{{ restrictionCount }} รายการ</span>
        </div>
        <div class="pe-selector__panels">
          <!-- Column 1: Restriction Type Toggle -->
          <div class="panel panel--type">
            <div class="panel__header">ประเภท</div>
            <div class="panel__body">
              <button
                type="button"
                class="type-item"
                :class="{ 'type-item--active': restrictionMode === 'revoke' }"
                @click="restrictionMode = 'revoke'; restrictionSearch = ''"
              >
                ระงับ
                <span class="type-item__count">{{ localRestrictions.revoke.length }}</span>
              </button>
              <button
                type="button"
                class="type-item"
                :class="{ 'type-item--active': restrictionMode === 'expiry' }"
                @click="restrictionMode = 'expiry'; restrictionSearch = ''"
              >
                หมดอายุ
                <span class="type-item__count">{{ Object.keys(localRestrictions.expiry).length }}</span>
              </button>
            </div>
          </div>

          <!-- Column 2: User list -->
          <div class="panel panel--items">
            <div class="panel__header">
              ผู้ใช้
              <span class="panel__header-count">({{ filteredRestrictionUsers.length }})</span>
            </div>
            <div class="panel__search">
              <input
                v-model="restrictionSearch"
                type="text"
                class="panel__search-input"
                placeholder="ค้นหาชื่อ หรืออีเมล..."
              />
            </div>
            <div class="panel__body">
              <button
                v-for="user in filteredRestrictionUsers"
                :key="user.uid"
                type="button"
                class="user-item"
                @click="handleRestrictionClick(user.uid)"
              >
                <div class="user-item__info">
                  <span class="user-item__name">{{ user.name }}</span>
                  <span class="user-item__email">{{ user.company }}</span>
                </div>
                <span class="user-item__add">+</span>
              </button>
              <div v-if="filteredRestrictionUsers.length === 0" class="panel__empty">
                {{ restrictionSearch ? 'ไม่พบผู้ใช้ที่ตรงกัน' : 'ไม่มีผู้ใช้ที่เพิ่มได้' }}
              </div>
            </div>
          </div>

          <!-- Column 3: Current restrictions -->
          <div class="panel panel--selected">
            <div class="panel__header">
              ข้อจำกัดทั้งหมด
              <button
                v-if="restrictionCount > 0"
                type="button"
                class="panel__clear-btn"
                @click="clearAllRestrictions"
              >
                ล้างทั้งหมด
              </button>
            </div>
            <div class="panel__body">
              <!-- Revoked users -->
              <div
                v-for="uid in localRestrictions.revoke"
                :key="`revoke-${uid}`"
                class="selected-item selected-item--danger"
              >
                <div class="selected-item__info">
                  <span class="selected-item__icon">❌</span>
                  <div class="selected-item__text">
                    <span class="selected-item__name">{{ getUserName(uid) }}</span>
                    <span class="selected-item__company">ระงับการเข้าถึง</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="selected-item__remove"
                  @click="removeRevoke(uid)"
                  aria-label="ลบข้อจำกัด"
                >
                  ✕
                </button>
              </div>
              <!-- Expiry users -->
              <div
                v-for="(date, uid) in localRestrictions.expiry"
                :key="`expiry-${uid}`"
                class="selected-item selected-item--warning"
              >
                <div class="selected-item__info">
                  <span class="selected-item__icon">⏰</span>
                  <div class="selected-item__text">
                    <span class="selected-item__name">{{ getUserName(uid as string) }}</span>
                    <span class="selected-item__company">หมดอายุ: {{ formatDate(date) }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="selected-item__remove"
                  @click="removeExpiry(uid as string)"
                  aria-label="ลบข้อจำกัด"
                >
                  ✕
                </button>
              </div>
              <div v-if="restrictionCount === 0" class="panel__empty">
                ไม่มีข้อจำกัด
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mini Popup for Restriction Details -->
    <Teleport to="body">
      <div v-if="showRestrictionPopup" class="restriction-overlay" @click.self="showRestrictionPopup = false">
        <div class="restriction-popup">
          <div class="restriction-popup__header">
            {{ restrictionMode === 'revoke' ? 'ระงับการเข้าถึง' : 'ตั้งวันหมดอายุ' }}
          </div>
          <div class="restriction-popup__body">
            <div class="restriction-popup__user">
              {{ getUserName(pendingRestrictionUid) }}
            </div>
            <template v-if="restrictionMode === 'revoke'">
              <label class="restriction-popup__label">เหตุผล (ไม่บังคับ)</label>
              <input
                v-model="popupReason"
                type="text"
                class="restriction-popup__input"
                placeholder="เหตุผลในการระงับ..."
              />
            </template>
            <template v-else>
              <label class="restriction-popup__label">วันหมดอายุ</label>
              <input
                v-model="popupExpiryDate"
                type="date"
                class="restriction-popup__input"
              />
            </template>
          </div>
          <div class="restriction-popup__actions">
            <button
              type="button"
              class="theme-btn theme-btn--secondary"
              @click="showRestrictionPopup = false"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              class="theme-btn"
              :class="restrictionMode === 'revoke' ? 'theme-btn--danger' : 'theme-btn--primary'"
              @click="restrictionMode === 'revoke' ? confirmRevoke() : confirmExpiry()"
            >
              {{ restrictionMode === 'revoke' ? 'ระงับ' : 'ตั้งวันหมดอายุ' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * PermissionEditor — 3-Column Pattern Permission Management
 *
 * 3-Layer Permission Model:
 *   Tab 1: Direct Access (users + groups)
 *   Tab 2: Company-Scoped (groups per company)
 *   Tab 3: Restrictions (revoke + expiry) — Admin only
 *
 * Logic: (Layer1 OR Layer2) AND NOT(Layer3) = Access Granted
 *
 * Emits update:permissions on every change. Parent page owns Save/Reset.
 */

import { ref, computed, watch, onMounted } from 'vue'
import type { User, AccessControl, AccessRestrictions } from '~/types/dashboard'
import type { AdminGroup, Company } from '~/types/admin'

interface Props {
  dashboardId: string
  allUsers?: User[]
  allGroups?: AdminGroup[]
  allCompanies?: Company[]
  currentPermissions: {
    access: AccessControl
    restrictions: AccessRestrictions
  }
  showRestrictions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  allUsers: () => [],
  allGroups: () => [],
  allCompanies: () => [],
  showRestrictions: true,
})

const emit = defineEmits<{
  'update:permissions': [permissions: { access: AccessControl; restrictions: AccessRestrictions }]
}>()

// ── Helpers ──

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function getUserName(uid: string): string {
  return props.allUsers.find((u) => u.uid === uid)?.name ?? 'Unknown'
}

function getUserCompany(uid: string): string {
  return props.allUsers.find((u) => u.uid === uid)?.company ?? ''
}

function getGroupName(gid: string): string {
  return props.allGroups.find((g) => g.id === gid)?.name ?? gid
}

function getGroupMemberCount(gid: string): number {
  return props.allGroups.find((g) => g.id === gid)?.members.length ?? 0
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('th-TH')
}

// ── Local state (deep cloned from props) ──

const localAccess = ref<AccessControl>(deepClone(props.currentPermissions.access))
const localRestrictions = ref<AccessRestrictions>(deepClone(props.currentPermissions.restrictions))

watch(
  () => props.currentPermissions,
  (newVal) => {
    localAccess.value = deepClone(newVal.access)
    localRestrictions.value = deepClone(newVal.restrictions)
  },
  { deep: true },
)

function emitUpdate() {
  emit('update:permissions', {
    access: deepClone(localAccess.value),
    restrictions: deepClone(localRestrictions.value),
  })
}

// ── Tabs ──

type TabId = 'direct' | 'company' | 'restrictions'
const activeTab = ref<TabId>('direct')

const visibleTabs = computed(() => {
  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'direct', label: 'สิทธิ์ตรง', count: directCount.value },
    { id: 'company', label: 'ตามบริษัท', count: companyTotalGroups.value },
  ]
  if (props.showRestrictions) {
    tabs.push({ id: 'restrictions', label: 'ข้อจำกัด', count: restrictionCount.value })
  }
  return tabs
})

// ── Tab 1: Direct Access ──

const directMode = ref<'users' | 'groups'>('users')
const directSearch = ref('')

const directCount = computed(
  () => localAccess.value.direct.users.length + localAccess.value.direct.groups.length,
)

const availableUsersForDirect = computed(() =>
  props.allUsers.filter((u) => !localAccess.value.direct.users.includes(u.uid)),
)

const filteredDirectUsers = computed(() => {
  if (!directSearch.value) return availableUsersForDirect.value
  const q = directSearch.value.toLowerCase()
  return availableUsersForDirect.value.filter(
    (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  )
})

const availableGroupsForDirect = computed(() =>
  props.allGroups.filter((g) => !localAccess.value.direct.groups.includes(g.id)),
)

const filteredDirectGroups = computed(() => {
  if (!directSearch.value) return availableGroupsForDirect.value
  const q = directSearch.value.toLowerCase()
  return availableGroupsForDirect.value.filter(
    (g) =>
      g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q),
  )
})

function addDirectUser(uid: string) {
  if (!localAccess.value.direct.users.includes(uid)) {
    localAccess.value.direct.users.push(uid)
    emitUpdate()
  }
}

function removeDirectUser(uid: string) {
  localAccess.value.direct.users = localAccess.value.direct.users.filter((u) => u !== uid)
  emitUpdate()
}

function addDirectGroup(gid: string) {
  if (!localAccess.value.direct.groups.includes(gid)) {
    localAccess.value.direct.groups.push(gid)
    emitUpdate()
  }
}

function removeDirectGroup(gid: string) {
  localAccess.value.direct.groups = localAccess.value.direct.groups.filter((g) => g !== gid)
  emitUpdate()
}

function clearAllDirect() {
  localAccess.value.direct.users = []
  localAccess.value.direct.groups = []
  emitUpdate()
}

// ── Tab 2: Company-Scoped ──

const selectedCompanyCode = ref('')
const companySearch = ref('')

const activeCompanies = computed(() => props.allCompanies.filter((c) => c.isActive))

const companyTotalGroups = computed(() =>
  Object.values(localAccess.value.company).reduce((sum, cd) => {
    if (cd.groups.includes('*')) return sum + 1 // unrestricted counts as 1
    return sum + cd.groups.length
  }, 0),
)

function getCompanyGroupCount(code: string): number | string {
  if (isCompanyUnrestricted(code)) return '✓'
  return localAccess.value.company[code]?.groups.length ?? 0
}

function isGroupInCompany(code: string, gid: string): boolean {
  return localAccess.value.company[code]?.groups.includes(gid) ?? false
}

const filteredCompanyGroups = computed(() => {
  if (!companySearch.value) return props.allGroups
  const q = companySearch.value.toLowerCase()
  return props.allGroups.filter(
    (g) =>
      g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q),
  )
})

/**
 * "ทั้งหมด" (unrestricted) mode for company access.
 * When active, groups array contains ['*'] meaning all roles in this company
 * can access the dashboard — no group restriction.
 *
 * Flow:
 * - Click "ทั้งหมด" → clears all individual groups, sets groups to ['*']
 * - Click "ทั้งหมด" again → removes '*', clears company entry
 * - While '*' is active, individual group checkboxes are disabled
 * - Click any individual group → only works when '*' is NOT active
 */
function isCompanyUnrestricted(code: string): boolean {
  return localAccess.value.company[code]?.groups.includes('*') ?? false
}

function toggleCompanyUnrestricted(companyCode: string) {
  if (!companyCode) return
  if (isCompanyUnrestricted(companyCode)) {
    // Turn off unrestricted → remove company entry
    delete localAccess.value.company[companyCode]
  } else {
    // Turn on unrestricted → clear individual groups, set ['*']
    localAccess.value.company[companyCode] = { roles: [], groups: ['*'] }
  }
  emitUpdate()
}

function toggleCompanyGroup(companyCode: string, gid: string) {
  if (!companyCode) return
  // Block if unrestricted mode is active
  if (isCompanyUnrestricted(companyCode)) return

  if (!localAccess.value.company[companyCode]) {
    localAccess.value.company[companyCode] = { roles: [], groups: [] }
  }
  const groups = localAccess.value.company[companyCode].groups
  const idx = groups.indexOf(gid)
  if (idx === -1) {
    groups.push(gid)
  } else {
    groups.splice(idx, 1)
  }
  // Clean up empty entry
  if (
    groups.length === 0 &&
    localAccess.value.company[companyCode].roles.length === 0
  ) {
    delete localAccess.value.company[companyCode]
  }
  emitUpdate()
}

function removeCompanyGroup(companyCode: string, gid: string) {
  if (!localAccess.value.company[companyCode]) return
  localAccess.value.company[companyCode].groups = localAccess.value.company[
    companyCode
  ].groups.filter((g) => g !== gid)
  if (
    localAccess.value.company[companyCode].groups.length === 0 &&
    localAccess.value.company[companyCode].roles.length === 0
  ) {
    delete localAccess.value.company[companyCode]
  }
  emitUpdate()
}

// ── Tab 3: Restrictions ──

const restrictionMode = ref<'revoke' | 'expiry'>('revoke')
const restrictionSearch = ref('')
const showRestrictionPopup = ref(false)
const pendingRestrictionUid = ref('')
const popupReason = ref('')
const popupExpiryDate = ref('')

const restrictionCount = computed(
  () =>
    localRestrictions.value.revoke.length +
    Object.keys(localRestrictions.value.expiry).length,
)

const filteredRestrictionUsers = computed(() => {
  const excludeUids = [
    ...localRestrictions.value.revoke,
    ...Object.keys(localRestrictions.value.expiry),
  ]
  let list = props.allUsers.filter((u) => !excludeUids.includes(u.uid))
  if (restrictionSearch.value) {
    const q = restrictionSearch.value.toLowerCase()
    list = list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }
  return list
})

function handleRestrictionClick(uid: string) {
  pendingRestrictionUid.value = uid
  popupReason.value = ''
  popupExpiryDate.value = ''
  showRestrictionPopup.value = true
}

function confirmRevoke() {
  const uid = pendingRestrictionUid.value
  if (uid && !localRestrictions.value.revoke.includes(uid)) {
    localRestrictions.value.revoke.push(uid)
    emitUpdate()
  }
  showRestrictionPopup.value = false
}

function confirmExpiry() {
  const uid = pendingRestrictionUid.value
  if (uid && popupExpiryDate.value) {
    localRestrictions.value.expiry[uid] = new Date(popupExpiryDate.value)
    emitUpdate()
  }
  showRestrictionPopup.value = false
}

function removeRevoke(uid: string) {
  localRestrictions.value.revoke = localRestrictions.value.revoke.filter((u) => u !== uid)
  emitUpdate()
}

function removeExpiry(uid: string) {
  const newExpiry = { ...localRestrictions.value.expiry }
  delete newExpiry[uid]
  localRestrictions.value.expiry = newExpiry
  emitUpdate()
}

function clearAllRestrictions() {
  localRestrictions.value.revoke = []
  localRestrictions.value.expiry = {}
  emitUpdate()
}

// ── Lifecycle ──

onMounted(() => {
  const first = activeCompanies.value[0]
  if (first) {
    selectedCompanyCode.value = first.code
  }
})
</script>

<style scoped>
.permission-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.5rem);
}

/* ── Tabs ── */
.permission-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border-default);
  overflow-x: auto;
}

.permission-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-radius: var(--radius-md, 0.375rem) var(--radius-md, 0.375rem) 0 0;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast, 150ms ease-in-out);
  white-space: nowrap;
  font-family: inherit;
}

.permission-tab:hover {
  background-color: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-text-primary);
}

.permission-tab--active {
  background-color: var(--color-primary);
  color: white;
  font-weight: 600;
}

.permission-tab--active:hover {
  background-color: var(--color-primary);
  color: white;
}

.permission-tab__count {
  font-size: 0.75rem;
  font-weight: 600;
  background-color: var(--color-neutral-200, #e5e7eb);
  color: var(--color-text-secondary);
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
}

.permission-tab--active .permission-tab__count {
  background-color: rgba(255, 255, 255, 0.25);
  color: white;
}

/* ── PE Selector (3-column wrapper) ── */
.pe-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.pe-selector__label {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
}

.pe-selector__count {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-primary);
  background-color: var(--color-primary-lightest);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.pe-selector__panels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md, 0.5rem);
  overflow: hidden;
  height: 340px;
}

/* ── Panel shared ── */
.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-bg-primary);
}

.panel + .panel {
  border-left: 1px solid var(--color-border-default);
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border-default);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.panel__header-count {
  font-weight: 400;
}

.panel__search {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
  background-color: var(--color-bg-primary);
}

.panel__search-input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.85rem;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm, 0.375rem);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: inherit;
}

.panel__search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-lightest);
}

.panel__body {
  flex: 1;
  overflow-y: auto;
  background-color: var(--color-bg-primary);
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-dark) var(--color-bg-secondary);
}

.panel__empty {
  padding: 1.5rem 0.75rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.panel__clear-btn {
  font-size: 0.75rem;
  color: var(--color-error);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}

.panel__clear-btn:hover {
  text-decoration: underline;
}

/* ── Column 1: Type Toggle ── */
.type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color var(--transition-fast, 150ms ease-in-out);
  font-family: inherit;
}

.type-item:hover:not(.type-item--active) {
  background-color: var(--color-bg-secondary);
}

.type-item--active {
  background-color: var(--color-primary-lightest);
  color: var(--color-primary);
  font-weight: 600;
}

.type-item__count {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background-color: var(--color-neutral-200, #e5e7eb);
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
}

.type-item--active .type-item__count {
  background-color: var(--color-primary-lighter);
  color: var(--color-primary-dark);
}

/* ── Column 1: Company (reuse GroupForm pattern) ── */
.company-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color var(--transition-fast, 150ms ease-in-out);
  font-family: inherit;
}

.company-item:hover:not(.company-item--active) {
  background-color: var(--color-bg-secondary);
}

.company-item--active {
  background-color: var(--color-primary-lightest);
  color: var(--color-primary);
  font-weight: 600;
}

.company-item__count {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background-color: var(--color-neutral-200, #e5e7eb);
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
}

.company-item--active .company-item__count {
  background-color: var(--color-primary-lighter);
  color: var(--color-primary-dark);
}

/* ── Column 2: User/Group items ── */
.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color var(--transition-fast, 150ms ease-in-out);
  font-family: inherit;
  gap: 0.5rem;
}

.user-item:hover {
  background-color: var(--color-bg-secondary);
}

.user-item:hover .user-item__add {
  opacity: 1;
}

.user-item__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.user-item__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-item__email {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-item__add {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary);
  opacity: 0;
  transition: opacity var(--transition-fast, 150ms ease-in-out);
  flex-shrink: 0;
}

/* ── Column 2: Group Checkbox (Tab 2) ── */
.group-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background-color var(--transition-fast, 150ms ease-in-out);
  font-family: inherit;
}

.group-checkbox:hover {
  background-color: var(--color-bg-secondary);
}

.group-checkbox__input {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.group-checkbox__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-checkbox__members {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.group-checkbox--all {
  border-bottom: 1px solid var(--color-border-default, #e5e7eb);
  padding-bottom: 0.625rem;
  margin-bottom: 0.25rem;
}

.group-checkbox--all .group-checkbox__name {
  font-weight: 600;
}

.group-checkbox__input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.group-checkbox__input:disabled + .group-checkbox__name {
  opacity: 0.5;
}

.selected-item--unrestricted .selected-item__name {
  color: var(--color-primary);
  font-weight: 600;
}

/* ── Column 3: Selected items ── */
.selected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.selected-item:last-child {
  border-bottom: none;
}

.selected-item--danger {
  background-color: #fef2f2;
}

.selected-item--warning {
  background-color: #fffbeb;
}

.selected-item__info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
}

.selected-item__icon {
  font-size: 0.875rem;
  flex-shrink: 0;
}

.selected-item__text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.selected-item__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selected-item__company {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.selected-item__remove {
  font-size: 0.75rem;
  color: var(--color-text-disabled);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.375rem;
  border-radius: var(--radius-sm, 0.375rem);
  transition: all var(--transition-fast, 150ms ease-in-out);
  flex-shrink: 0;
  font-family: inherit;
  line-height: 1;
}

.selected-item__remove:hover {
  background-color: #fee2e2;
  color: var(--color-error);
}

/* ── Company Summary (Tab 2 Column 3) ── */
.company-summary {
  border-bottom: 1px solid var(--color-border-default);
}

.company-summary:last-child {
  border-bottom: none;
}

.company-summary__header {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  background-color: var(--color-primary-lightest);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.company-summary .selected-item {
  border-bottom: 1px solid var(--color-border-light);
}

.company-summary .selected-item:last-child {
  border-bottom: none;
}

/* ── Restriction Popup ── */
.restriction-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.restriction-popup {
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-md, 0.5rem);
  box-shadow: var(--shadow-lg);
  width: 20rem;
  max-width: 90vw;
}

.restriction-popup__header {
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-light);
}

.restriction-popup__body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.restriction-popup__user {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  padding: 0.5rem;
  background-color: var(--color-bg-tertiary);
  border-radius: var(--radius-sm, 0.375rem);
}

.restriction-popup__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.restriction-popup__input {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm, 0.375rem);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: inherit;
}

.restriction-popup__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-lightest);
}

.restriction-popup__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border-light);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .pe-selector__panels {
    grid-template-columns: 1fr;
    grid-template-rows: auto 200px 150px;
    height: auto;
  }

  .panel + .panel {
    border-left: none;
    border-top: 1px solid var(--color-border-default);
  }

  .panel--type .panel__body,
  .panel--company .panel__body {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.5rem;
  }

  .type-item,
  .company-item {
    width: auto;
    flex-shrink: 0;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm, 0.375rem);
  }
}
</style>
