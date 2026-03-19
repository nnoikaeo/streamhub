<template>
  <div class="permission-editor">
    <!-- ═══ Tab Header (when restrictions enabled) ═══ -->
    <div v-if="showRestrictions" class="pe-tabs">
      <button
        type="button"
        class="pe-tabs__btn"
        :class="{ 'pe-tabs__btn--active': activeTab === 'grants' }"
        @click="activeTab = 'grants'"
      >
        จัดการสิทธิ์
        <span class="pe-tabs__badge">{{ totalGrantCount }}</span>
      </button>
      <button
        type="button"
        class="pe-tabs__btn"
        :class="{ 'pe-tabs__btn--active': activeTab === 'restrictions' }"
        @click="activeTab = 'restrictions'"
      >
        ข้อจำกัด
        <span class="pe-tabs__badge" :class="{ 'pe-tabs__badge--danger': restrictionCount > 0 && activeTab !== 'restrictions' }">{{ restrictionCount }}</span>
      </button>
    </div>

    <!-- ═══ Access Grant Section (Unified 3-Column) ═══ -->
    <div v-show="!showRestrictions || activeTab === 'grants'" class="pe-section">
      <div v-if="!showRestrictions" class="pe-section__label">
        จัดการสิทธิ์
        <span class="pe-section__count">{{ totalGrantCount }} รายการ</span>
      </div>
      <div class="pe-section__panels">
        <!-- Column 1: Type Selector -->
        <div class="panel panel--type">
          <div class="panel__header">ประเภท</div>
          <div class="panel__body">
            <button
              type="button"
              class="type-item"
              :class="{ 'type-item--active': grantMode === 'users' }"
              @click="grantMode = 'users'; grantSearch = ''"
            >
              <span class="type-item__label">👤 ผู้ใช้</span>
              <span class="type-item__count">{{ localAccess.direct.users.length }}</span>
            </button>
            <button
              type="button"
              class="type-item"
              :class="{ 'type-item--active': grantMode === 'groups' }"
              @click="grantMode = 'groups'; grantSearch = ''"
            >
              <span class="type-item__label">👥 กลุ่ม</span>
              <span class="type-item__count">{{ localAccess.direct.groups.length }}</span>
            </button>
            <button
              type="button"
              class="type-item"
              :class="{ 'type-item--active': grantMode === 'companies' }"
              @click="grantMode = 'companies'; grantSearch = ''"
            >
              <span class="type-item__label">🏢 บริษัท</span>
              <span class="type-item__count">{{ localAccess.company.length }}</span>
            </button>
          </div>
        </div>

        <!-- Column 2: Available Items -->
        <div class="panel panel--items">
          <div class="panel__header">
            {{ column2Header }}
            <span class="panel__header-count">({{ column2Count }})</span>
          </div>
          <div class="panel__search">
            <input
              v-model="grantSearch"
              type="text"
              class="panel__search-input"
              :placeholder="grantMode === 'users' ? 'ค้นหาชื่อ หรืออีเมล...' : grantMode === 'groups' ? 'ค้นหาชื่อกลุ่ม...' : 'ค้นหารหัสหรือชื่อบริษัท...'"
            />
          </div>
          <div class="panel__body">
            <!-- Users mode -->
            <template v-if="grantMode === 'users'">
              <button
                v-for="u in filteredUsers"
                :key="u.uid"
                type="button"
                class="user-item"
                :class="{ 'user-item--added': isUserAdded(u.uid) }"
                @click="toggleDirectUser(u.uid)"
              >
                <div class="user-item__info">
                  <span class="user-item__name">{{ u.name }}</span>
                  <span class="user-item__email">{{ u.company }}</span>
                </div>
                <span v-if="isUserAdded(u.uid)" class="user-item__check">✓</span>
                <span v-else class="user-item__add">+</span>
              </button>
              <div v-if="filteredUsers.length === 0" class="panel__empty">
                {{ grantSearch ? 'ไม่พบผู้ใช้ที่ตรงกัน' : 'ไม่มีผู้ใช้' }}
              </div>
            </template>
            <!-- Groups mode -->
            <template v-else-if="grantMode === 'groups'">
              <button
                v-for="g in filteredGroups"
                :key="g.id"
                type="button"
                class="user-item"
                :class="{ 'user-item--added': isGroupAdded(g.id) }"
                @click="toggleDirectGroup(g.id)"
              >
                <div class="user-item__info">
                  <span class="user-item__name">{{ g.name }}</span>
                  <span class="user-item__email">{{ g.members.length }} สมาชิก</span>
                </div>
                <span v-if="isGroupAdded(g.id)" class="user-item__check">✓</span>
                <span v-else class="user-item__add">+</span>
              </button>
              <div v-if="filteredGroups.length === 0" class="panel__empty">
                {{ grantSearch ? 'ไม่พบกลุ่มที่ตรงกัน' : 'ไม่มีกลุ่ม' }}
              </div>
            </template>
            <!-- Companies mode -->
            <template v-else>
              <!-- ทั้งหมด row (hidden when search is active and doesn't include "ทั้งหมด") -->
              <button
                v-if="!grantSearch || 'ทั้งหมด'.includes(grantSearch.toLowerCase())"
                type="button"
                class="user-item user-item--all"
                :class="{ 'user-item--added': isAllCompaniesSelected }"
                @click="toggleAllCompanies"
              >
                <div class="user-item__info">
                  <span class="user-item__name">ทั้งหมด</span>
                  <span class="user-item__email">ทุกบริษัท · {{ totalAllCompanyUsers }} คน</span>
                </div>
                <span v-if="isAllCompaniesSelected" class="user-item__check">✓</span>
                <span v-else class="user-item__add">+</span>
              </button>
              <button
                v-for="c in filteredCompanies"
                :key="c.code"
                type="button"
                class="user-item"
                :class="{ 'user-item--added': isCompanySelected(c.code) || isAllCompaniesSelected }"
                :disabled="isAllCompaniesSelected"
                @click="!isAllCompaniesSelected && toggleCompany(c.code)"
              >
                <div class="user-item__info">
                  <span class="user-item__name">{{ c.code }}</span>
                  <span class="user-item__email">{{ c.name }} · {{ getCompanyUserCount(c.code) }} คน</span>
                </div>
                <span v-if="isCompanySelected(c.code) || isAllCompaniesSelected" class="user-item__check">✓</span>
                <span v-else class="user-item__add">+</span>
              </button>
              <div v-if="filteredCompanies.length === 0 && !((!grantSearch || 'ทั้งหมด'.includes(grantSearch.toLowerCase())))" class="panel__empty">
                {{ grantSearch ? 'ไม่พบบริษัทที่ตรงกัน' : 'ไม่มีบริษัทที่ใช้งาน' }}
              </div>
            </template>
          </div>
        </div>

        <!-- Column 3: All Granted Permissions (Unified) -->
        <div class="panel panel--selected">
          <div class="panel__header">
            สิทธิ์ที่ให้แล้ว
            <button
              v-if="totalGrantCount > 0"
              type="button"
              class="panel__clear-btn"
              @click="clearAllGrants"
            >
              ล้างทั้งหมด
            </button>
          </div>
          <div class="panel__body">
            <!-- Direct Users -->
            <div
              v-for="uid in localAccess.direct.users"
              :key="`user-${uid}`"
              class="selected-item"
            >
              <div class="selected-item__info">
                <span class="selected-item__icon">👤</span>
                <div class="selected-item__text">
                  <span class="selected-item__name">{{ getUserName(uid) }}</span>
                  <span class="selected-item__badge">สิทธิ์ตรง · {{ getUserCompany(uid) }}</span>
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
            <!-- Direct Groups -->
            <div
              v-for="gid in localAccess.direct.groups"
              :key="`group-${gid}`"
              class="selected-item"
            >
              <div class="selected-item__info">
                <span class="selected-item__icon">👥</span>
                <div class="selected-item__text">
                  <span class="selected-item__name">{{ getGroupName(gid) }}</span>
                  <span class="selected-item__badge">สิทธิ์ตรง(กลุ่ม) · {{ getGroupMemberCount(gid) }} คน</span>
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
            <!-- Companies -->
            <div
              v-for="code in localAccess.company"
              :key="`company-${code}`"
              class="selected-item"
            >
              <div class="selected-item__info">
                <span class="selected-item__icon">🏢</span>
                <div class="selected-item__text">
                  <span class="selected-item__name">{{ code === 'ALL' ? 'ทั้งหมด' : code }}</span>
                  <span class="selected-item__badge">
                    {{ code === 'ALL' ? `ตามบริษัท (ทุกบริษัท · ${totalAllCompanyUsers} คน)` : `ตามบริษัท (${getCompanyUserCount(code)} คน)` }}
                  </span>
                </div>
              </div>
              <button
                type="button"
                class="selected-item__remove"
                @click="removeCompany(code)"
                aria-label="ลบสิทธิ์"
              >
                ✕
              </button>
            </div>
            <div v-if="totalGrantCount === 0" class="panel__empty">
              คลิกรายการเพื่อเพิ่มสิทธิ์
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Restrictions Section (Admin only) ═══ -->
    <div v-if="showRestrictions" v-show="activeTab === 'restrictions'" class="pe-section pe-section--restrictions">
      <div class="pe-section__panels">
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
              <span class="type-item__label">ระงับ</span>
              <span class="type-item__count">{{ localRestrictions.revoke.length }}</span>
            </button>
            <button
              type="button"
              class="type-item"
              :class="{ 'type-item--active': restrictionMode === 'expiry' }"
              @click="restrictionMode = 'expiry'; restrictionSearch = ''"
            >
              <span class="type-item__label">หมดอายุ</span>
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
              v-for="u in filteredRestrictionUsers"
              :key="u.uid"
              type="button"
              class="user-item"
              @click="handleRestrictionClick(u.uid)"
            >
              <div class="user-item__info">
                <span class="user-item__name">{{ u.name }}</span>
                <span class="user-item__email">{{ u.company }}</span>
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
                  <span class="selected-item__badge">ระงับการเข้าถึง</span>
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
                  <span class="selected-item__badge">หมดอายุ: {{ formatDate(date) }}</span>
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
 * PermissionEditor — Unified 3-Column Permission Management (v6.0)
 *
 * Single 3-column panel (no tabs):
 *   Column 1: Type selector (ผู้ใช้ / กลุ่ม / บริษัท)
 *   Column 2: Searchable item list
 *   Column 3: All granted permissions (unified with badges)
 *
 * Restrictions: Separate section below (Admin only)
 *
 * Logic: (Layer1_Direct OR Layer2_Company) AND NOT(Layer3_Restrictions) = Access Granted
 *
 * Emits update:permissions on every change. Parent page owns Save/Reset.
 */

import { ref, computed, watch } from 'vue'
import type { User, AccessControl, AccessRestrictions } from '~/types/dashboard'
import type { AdminGroup, Company } from '~/types/admin'

interface Props {
  permissions: {
    access: AccessControl
    restrictions: AccessRestrictions
  }
  allUsers?: User[]
  allGroups?: AdminGroup[]
  allCompanies?: Company[]
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

function getCompanyUserCount(code: string): number {
  return props.allUsers.filter((u) => u.company === code).length
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('th-TH')
}

// ── Local state (deep cloned from props) ──

const localAccess = ref<AccessControl>(deepClone(props.permissions.access))
const localRestrictions = ref<AccessRestrictions>(deepClone(props.permissions.restrictions))

watch(
  () => props.permissions,
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

// ── Unified Grant Section ──

type GrantMode = 'users' | 'groups' | 'companies'
const grantMode = ref<GrantMode>('users')
const grantSearch = ref('')
const activeTab = ref<'grants' | 'restrictions'>('grants')

const totalGrantCount = computed(
  () =>
    localAccess.value.direct.users.length +
    localAccess.value.direct.groups.length +
    localAccess.value.company.length,
)

const column2Header = computed(() => {
  if (grantMode.value === 'users') return 'ผู้ใช้'
  if (grantMode.value === 'groups') return 'กลุ่ม'
  return 'บริษัท'
})

const column2Count = computed(() => {
  if (grantMode.value === 'users') return filteredUsers.value.length
  if (grantMode.value === 'groups') return filteredGroups.value.length
  return filteredCompanies.value.length
})

// ── Users ──

function isUserAdded(uid: string): boolean {
  return localAccess.value.direct.users.includes(uid)
}

const filteredUsers = computed(() => {
  let list = props.allUsers
  if (grantSearch.value) {
    const q = grantSearch.value.toLowerCase()
    list = list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }
  return list
})

function toggleDirectUser(uid: string) {
  if (isUserAdded(uid)) {
    removeDirectUser(uid)
  } else {
    localAccess.value.direct.users.push(uid)
    emitUpdate()
  }
}

function removeDirectUser(uid: string) {
  localAccess.value.direct.users = localAccess.value.direct.users.filter((u) => u !== uid)
  emitUpdate()
}

// ── Groups ──

function isGroupAdded(gid: string): boolean {
  return localAccess.value.direct.groups.includes(gid)
}

const filteredGroups = computed(() => {
  let list = props.allGroups
  if (grantSearch.value) {
    const q = grantSearch.value.toLowerCase()
    list = list.filter(
      (g) =>
        g.name.toLowerCase().includes(q) || (g.description ?? '').toLowerCase().includes(q),
    )
  }
  return list
})

function toggleDirectGroup(gid: string) {
  if (isGroupAdded(gid)) {
    removeDirectGroup(gid)
  } else {
    localAccess.value.direct.groups.push(gid)
    emitUpdate()
  }
}

function removeDirectGroup(gid: string) {
  localAccess.value.direct.groups = localAccess.value.direct.groups.filter((g) => g !== gid)
  emitUpdate()
}

// ── Companies ──

const ALL_COMPANIES = 'ALL'

const activeCompanies = computed(() => props.allCompanies.filter((c) => c.isActive))

const filteredCompanies = computed(() => {
  let list = activeCompanies.value
  if (grantSearch.value) {
    const q = grantSearch.value.toLowerCase()
    list = list.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    )
  }
  return list
})

const isAllCompaniesSelected = computed(() =>
  localAccess.value.company.includes(ALL_COMPANIES),
)

const totalAllCompanyUsers = computed(() => {
  const activeCodes = new Set(activeCompanies.value.map((c) => c.code))
  return props.allUsers.filter((u) => activeCodes.has(u.company)).length
})

function isCompanySelected(code: string): boolean {
  return localAccess.value.company.includes(code)
}

function toggleCompany(code: string) {
  if (isCompanySelected(code)) {
    removeCompany(code)
  } else {
    localAccess.value.company.push(code)
    emitUpdate()
  }
}

function toggleAllCompanies() {
  if (isAllCompaniesSelected.value) {
    removeCompany(ALL_COMPANIES)
  } else {
    // Remove individual company selections and add ALL sentinel
    localAccess.value.company = localAccess.value.company.filter(
      (c) => !activeCompanies.value.some((ac) => ac.code === c),
    )
    localAccess.value.company.push(ALL_COMPANIES)
    emitUpdate()
  }
}

function removeCompany(code: string) {
  localAccess.value.company = localAccess.value.company.filter((c) => c !== code)
  emitUpdate()
}

// ── Clear all grants ──

function clearAllGrants() {
  localAccess.value.direct.users = []
  localAccess.value.direct.groups = []
  localAccess.value.company = []
  emitUpdate()
}

// ── Restrictions Section ──

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
</script>

<style scoped>
.permission-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 1.5rem);
}

/* ── Tabs ── */
.pe-tabs {
  display: flex;
  gap: 0;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md, 0.5rem);
  overflow: hidden;
  width: fit-content;
}

.pe-tabs__btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-primary, white);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast, 150ms ease-in-out);
  font-family: inherit;
}

.pe-tabs__btn + .pe-tabs__btn {
  border-left: 1px solid var(--color-border-default);
}

.pe-tabs__btn:hover:not(.pe-tabs__btn--active) {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.pe-tabs__btn--active {
  background-color: var(--color-primary);
  color: white;
}

.pe-tabs__badge {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background-color: var(--color-neutral-200, #e5e7eb);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
}

.pe-tabs__btn--active .pe-tabs__badge {
  color: var(--color-primary);
  background-color: rgba(255, 255, 255, 0.9);
}

.pe-tabs__badge--danger {
  color: var(--color-error, #dc2626);
  background-color: #fef2f2;
}

/* ── Section wrapper ── */
.pe-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.pe-section__label {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 0.5rem);
}

.pe-section__count {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-primary);
  background-color: var(--color-primary-lightest);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.pe-section__count--danger {
  color: var(--color-error, #dc2626);
  background-color: #fef2f2;
}

.pe-section__panels {
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

.type-item__label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

/* ── Column 2: User/Group/Company items ── */
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

.user-item--added {
  background-color: var(--color-primary-lightest);
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

.user-item__check {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-primary);
  flex-shrink: 0;
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

.selected-item__badge {
  font-size: 0.7rem;
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
  .pe-section__panels {
    grid-template-columns: 1fr;
    grid-template-rows: auto 200px 150px;
    height: auto;
  }

  .panel + .panel {
    border-left: none;
    border-top: 1px solid var(--color-border-default);
  }

  .panel--type .panel__body {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.5rem;
  }

  .type-item {
    width: auto;
    flex-shrink: 0;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm, 0.375rem);
  }
}
</style>
