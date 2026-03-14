# Moderator Dual-View Implementation Plan

> **Created:** 2026-03-14
> **Purpose:** Step-by-step prompts สำหรับให้ Sonnet ดำเนินการ
> **Prerequisite:** Phase 5 Step 1-6 ต้องเสร็จแล้ว

---

## Overview

Moderator มี 2 มุมมอง:
- **View 1 (Viewer)** — เหมือน User ดู dashboards ผ่านเมนู "Dashboard" → ทำเสร็จแล้วใน Phase 5
- **View 2 (Manager)** — จัดการ dashboards ใน folders ที่ถูก assign ผ่านเมนู "Manage Folders" → **ต้องทำ**

```
Moderator Sidebar:
┌──────────────────────┐
│ ▾ Dashboard          │  ← View 1: ✅ ทำแล้ว
│   ├ ดูทั้งหมด         │
│   └ ค้นหา            │
│                      │
│ ▾ Manage Folders     │  ← View 2: ❌ ต้องทำ
│   ├ 📁 East (2)      │  ← assigned folders + dashboard count
│   │  ├ Q1            │
│   │  └ Q2            │
│   └ 📁 Budget (1)    │
│     └ 2024           │
└──────────────────────┘
```

## Dependencies

```
Step 1 (Composable) → Step 2 (Sidebar) → Step 3 (Page)
```

---

## Step 1: Moderator Composables

**Branch:** `feat/moderator-composables`

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/composables/useAdminFolders.ts (ดู pattern folder composable — มี fetchFolders, buildFolderTree, getChildFolders, getFolderPath)
- app/composables/useAdminDashboards.ts (ดู pattern dashboard composable)
- app/composables/useAdminResource.ts (ดู generic pattern — AdminResourceConfig interface)
- app/stores/auth.ts (ดู UserData interface — ปัจจุบันไม่มี assignedFolders)
- app/stores/dashboard.ts (ดู folder/dashboard state)
- app/types/dashboard.ts (ดู Folder interface ที่มี assignedModerators: string[])
- .data/folders.json (ดูข้อมูลจริง — มี assignedModerators array บน folder)
- .data/dashboards.json (ดู folderId field บน dashboard)

ข้อมูลสำคัญ:
- folders.json มี field `assignedModerators: string[]` บนแต่ละ folder
- เช่น folder "East" มี assignedModerators: ["user_somchai_mod"]
- หมายความว่า user_somchai_mod ดูแล folder East ได้
- ไม่ต้องเพิ่ม assignedFolders บน User — ใช้ Folder.assignedModerators เป็น source of truth

ทำ 2 อย่าง:

1. สร้าง `app/composables/useModeratorFolders.ts`:
   Purpose: ดึง folders ที่ moderator คนปัจจุบันถูก assign

   ```typescript
   export function useModeratorFolders() {
     const authStore = useAuthStore()
     const { folders, fetchFolders } = useAdminFolders()

     // computed: กรองเฉพาะ folders ที่ user ปัจจุบันอยู่ใน assignedModerators
     const assignedFolders = computed(() => {
       const uid = authStore.user?.uid
       if (!uid) return []
       return folders.value.filter(f =>
         f.assignedModerators?.includes(uid)
       )
     })

     // computed: สร้าง folder tree จาก assigned folders
     // ถ้า folder มี parent ที่ไม่ได้ assign → แสดงเฉพาะ assigned folder เป็น root
     const assignedFolderTree = computed(() => {
       // ใช้ buildFolderTree logic จาก useAdminFolders
       // แต่ filter เฉพาะ assigned folders + children ของมัน
     })

     // function: นับ dashboards ใน folder
     const getDashboardCount = (folderId: string) => { ... }

     // function: เช็คว่า folder นี้ moderator จัดการได้ไหม
     const canManageFolder = (folderId: string) => {
       // เช็คว่า folderId อยู่ใน assignedFolders หรือเป็น subfolder ของ assigned folder
     }

     return {
       assignedFolders,
       assignedFolderTree,
       fetchFolders,
       getDashboardCount,
       canManageFolder,
       loading: computed(() => /* ... */)
     }
   }
   ```

   สำคัญ: moderator ต้องจัดการ subfolder ภายใน assigned folder ได้ด้วย
   เช่น ถูก assign folder "Sales Reports" → ต้องเห็น/จัดการ "East", "West" ที่เป็น children ด้วย

2. สร้าง `app/composables/useModeratorDashboards.ts`:
   Purpose: ดึง dashboards ที่อยู่ใน folders ที่ moderator จัดการได้

   ```typescript
   export function useModeratorDashboards() {
     const { canManageFolder } = useModeratorFolders()
     const { dashboards, fetchDashboards } = useAdminDashboards()

     // computed: กรอง dashboards ที่อยู่ใน assigned folders
     const manageableDashboards = computed(() => {
       return dashboards.value.filter(d => canManageFolder(d.folderId))
     })

     // function: ดึง dashboards ของ folder เฉพาะ
     const getDashboardsByFolder = (folderId: string) => {
       return manageableDashboards.value.filter(d => d.folderId === folderId)
     }

     // CRUD — delegate ไป useAdminDashboards แต่เช็ค permission ก่อน
     const createDashboard = async (data: Partial<Dashboard>) => {
       if (!canManageFolder(data.folderId!)) throw new Error('No permission')
       return useAdminDashboards().createDashboard(data)
     }

     const updateDashboard = async (id: string, data: Partial<Dashboard>) => { ... }
     const deleteDashboard = async (id: string) => { ... }

     return {
       manageableDashboards,
       getDashboardsByFolder,
       fetchDashboards,
       createDashboard,
       updateDashboard,
       deleteDashboard,
       loading: computed(() => /* ... */)
     }
   }
   ```

ห้ามแก้ไขไฟล์อื่นนอกเหนือจากที่ระบุ
```

---

## Step 2: Sidebar Manage Folders Accordion

**Branch:** `feat/moderator-sidebar`
**ต้องทำหลัง:** Step 1

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/composables/useRoleNavigation.ts (ดูโครงสร้าง — มี manageFoldersMenuGroup ที่ items: [] ว่างอยู่)
- app/composables/useModeratorFolders.ts (สร้างใน Step 1 — มี assignedFolderTree, getDashboardCount)
- app/components/layouts/UnifiedSidebar.vue (ดูว่า sidebar render accordions อย่างไร)
- app/components/admin/AdminAccordion.vue (ดู pattern accordion component)
- app/stores/dashboard.ts (ดู isFoldersAccordionOpen, toggleFoldersAccordion)
- docs/DESIGN/wireframes/sidebar-navigation.md (section 2: Moderator — ดู wireframe เป้าหมาย)

ข้อมูลสำคัญ:
- useRoleNavigation.ts มี manageFoldersMenuGroup อยู่แล้ว แต่ items เป็น array ว่าง
- UnifiedSidebar.vue มี 2 accordions: Dashboard + Admin
- ต้องเพิ่ม accordion ที่ 3 สำหรับ "Manage Folders" (moderator only)
- Accordions ต้องเป็น mutually exclusive (เปิดอันหนึ่ง ปิดอันอื่น)
- Manage Folders ต้องแสดง folder tree + dashboard count badges

ทำ 3 อย่าง:

1. อัปเดต `app/composables/useRoleNavigation.ts`:
   - Import useModeratorFolders
   - ใน manageFoldersMenuGroup:
     - ดึง assignedFolderTree จาก useModeratorFolders()
     - map เป็น SidebarMenuItem[] พร้อม:
       - label: folder.name
       - icon: 'i-heroicons-folder' (หรือ icon ที่ใช้ใน codebase)
       - path: `/manage/folders/${folder.id}`
       - badge: getDashboardCount(folder.id)
       - children: subfolder items (ถ้ามี) ด้วย path เดียวกัน

   ตัวอย่าง output สำหรับ moderator "Somchai":
   ```
   {
     id: 'manage-folders',
     label: 'จัดการโฟลเดอร์',
     items: [
       {
         label: 'East',
         icon: 'i-heroicons-folder',
         path: '/manage/folders/folder_sales_reports_east',
         badge: 2,
         children: [
           { label: 'Q1', path: '/manage/folders/folder_q1' },
           { label: 'Q2', path: '/manage/folders/folder_q2' }
         ]
       },
       {
         label: 'Budget',
         icon: 'i-heroicons-folder',
         path: '/manage/folders/folder_finance_budget',
         badge: 1
       }
     ]
   }
   ```

2. อัปเดต `app/components/layouts/UnifiedSidebar.vue`:
   - เพิ่ม accordion ที่ 3 สำหรับ Manage Folders (อยู่ระหว่าง Dashboard กับ Admin)
   - แสดงเฉพาะเมื่อ role === 'moderator' (ใช้ showManageFolders จาก useRoleNavigation)
   - ใช้ dashboard store: isFoldersAccordionOpen สำหรับ control
   - Render items เป็น tree structure:
     - folder items ที่มี children → แสดง expand/collapse
     - แต่ละ item มี badge แสดงจำนวน dashboards
     - click item → navigate ไป /manage/folders/:id
   - อัปเดต mutually exclusive logic:
     - เปิด Manage Folders → ปิด Dashboard + Admin
     - เปิด Dashboard → ปิด Manage Folders + Admin
     - เปิด Admin → ปิด Dashboard + Manage Folders

3. อัปเดต `app/stores/dashboard.ts` (ถ้าจำเป็น):
   - เพิ่ม isManageFoldersAccordionOpen state (ถ้ายังไม่มี)
   - หรือ reuse isFoldersAccordionOpen ที่มีอยู่แล้ว
   - อัปเดต initializeAccordionStates:
     - route เป็น /manage/* → เปิด Manage Folders accordion
     - route เป็น /dashboard/* → เปิด Dashboard accordion
     - route เป็น /admin/* → เปิด Admin accordion

ห้ามแก้ไขไฟล์อื่นนอกเหนือจากที่ระบุ
```

---

## Step 3: Manage Folders Page + Dashboard CRUD

**Branch:** `feat/moderator-manage-page`
**ต้องทำหลัง:** Step 2

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/pages/admin/folders/index.vue (ดู pattern admin folder page — มี DataTable, FormModal, ConfirmDialog)
- app/pages/admin/dashboards/index.vue (ดู pattern admin dashboard page)
- app/components/admin/forms/DashboardForm.vue (ดูฟอร์ม dashboard — ต้องเพิ่ม TagSelector)
- app/components/features/TagSelector.vue (ดูว่าใช้ props อะไร)
- app/composables/useModeratorFolders.ts (สร้างใน Step 1)
- app/composables/useModeratorDashboards.ts (สร้างใน Step 1)
- app/composables/useAdminBreadcrumbs.ts (ดู pattern breadcrumb)
- app/stores/permissions.ts (ดู canAssignTags)
- app/stores/tags.ts (ดู tag store)
- app/composables/useAdminTags.ts (ดู fetchTags)
- docs/GUIDES/roles-and-permissions.md (section Moderator Dual-View — ดู Manager Mode capabilities)

ข้อมูลสำคัญ:
- Moderator Manager Mode ทำได้:
  ✅ ดู dashboards ใน assigned folders
  ✅ สร้าง/แก้ไข/ลบ dashboards ใน assigned folders
  ✅ สร้าง subfolders ใน assigned folders
  ✅ Assign tags ให้ dashboards (เลือกจาก tags ที่มีอยู่ สร้างใหม่ไม่ได้)
  ❌ สร้าง/แก้ไข/ลบ tags (admin only)
  ❌ จัดการ users
  ❌ เข้าถึง admin pages

- Route pattern: /manage/folders/:folderId
- DashboardForm ต้องเพิ่ม TagSelector สำหรับ assign tags
- TagSelector ใช้ prop `canCreateTag=false` สำหรับ moderator

ทำ 3 อย่าง:

1. สร้าง `app/pages/manage/folders/[folderId].vue`:
   ทำตาม pattern คล้าย admin/dashboards/index.vue แต่ scoped เฉพาะ folder ที่เลือก

   Page Structure:
   ```
   ┌──────────────────────────────────────────────────────────┐
   │ 📁 Manage: East                                          │
   │ Sales > Reports > East                    [+ สร้าง Dashboard]│
   ├──────────────────────────────────────────────────────────┤
   │                                                          │
   │ Subfolders:                                              │
   │ ┌────────┐ ┌────────┐                                   │
   │ │ 📁 Q1   │ │ 📁 Q2   │  [+ สร้าง Subfolder]            │
   │ └────────┘ └────────┘                                   │
   │                                                          │
   │ Dashboards (2):                              🔍 Search   │
   │ ┌────────────────────────────────────────────────────┐  │
   │ │ Name              │ Tags        │ Updated   │ Actions│  │
   │ │ East Performance  │ Sales, KPI  │ 2 days    │ ✏️ 🗑️ │  │
   │ │ East Revenue      │ Sales       │ 1 week    │ ✏️ 🗑️ │  │
   │ └────────────────────────────────────────────────────┘  │
   └──────────────────────────────────────────────────────────┘
   ```

   Components ที่ใช้:
   - PageLayout หรือ AppLayout สำหรับ layout
   - Breadcrumb แสดง folder path
   - DataTable แสดง dashboards (columns: name, tags, updatedAt, actions)
   - FormModal สำหรับ create/edit dashboard
   - ConfirmDialog สำหรับ delete
   - TagBadge ใน DataTable column สำหรับแสดง tags

   Logic:
   - onMounted: เช็ค canManageFolder(folderId) → ถ้าไม่ได้ redirect ไป /dashboard/discover
   - fetchDashboards + fetchFolders + fetchTags
   - getDashboardsByFolder(folderId) สำหรับแสดงใน DataTable
   - getChildFolders(folderId) สำหรับแสดง subfolders

   CRUD:
   - Create Dashboard: เปิด FormModal ที่ folderId locked เป็น folder ปัจจุบัน
   - Edit Dashboard: เปิด FormModal ที่มี data เดิม
   - Delete Dashboard: เปิด ConfirmDialog
   - Create Subfolder: เปิด FormModal แบบง่ายๆ (name + description)

2. อัปเดต `app/components/admin/forms/DashboardForm.vue`:
   เพิ่ม TagSelector ในฟอร์ม

   - เพิ่ม prop: `showTagSelector?: boolean` (default: false — เพื่อไม่กระทบ admin page เดิม)
   - เพิ่ม prop: `canCreateTag?: boolean` (default: false)
   - เพิ่ม prop: `availableTags?: Tag[]` (default: [])
   - ถ้า showTagSelector=true → แสดง TagSelector component ใต้ folder dropdown
   - TagSelector props:
     - modelValue: form.tags (string[])
     - availableTags: availableTags prop
     - canCreateTag: canCreateTag prop
   - Handle @update:modelValue → อัปเดต form.tags

   สำคัญ: field `tags` ต้องเพิ่มใน form state (default: [])
   ถ้า mode เป็น edit → ใส่ dashboard.tags เดิม
   ถ้า mode เป็น create → ใส่ []

3. อัปเดต `nuxt.config.ts` (ถ้าจำเป็น):
   - เพิ่ม SSR disable สำหรับ `/manage/**` routes (เหมือนที่ทำกับ `/admin/**`)
   เช่น:
   ```typescript
   routeRules: {
     '/admin/**': { ssr: false },
     '/manage/**': { ssr: false }
   }
   ```

ห้ามแก้ไขไฟล์อื่นนอกเหนือจากที่ระบุ
ระวังไม่ให้แก้ logic ใน DashboardForm เดิมพัง — เพิ่ม TagSelector โดยมี showTagSelector prop เป็น gate
```

---

## Estimated Effort

| Step | Scope | Files | Complexity |
|------|-------|-------|-----------|
| 1 | Composables | 2 files (new) | ⭐⭐ Medium |
| 2 | Sidebar | 2-3 files (update) | ⭐⭐ Medium |
| 3 | Pages + Form | 2-3 files (new + update) | ⭐⭐⭐ High |

---

## Checklist หลังทำเสร็จ

- [ ] Moderator login → sidebar แสดง "Manage Folders" accordion พร้อม assigned folders
- [ ] Click folder ใน sidebar → navigate ไป /manage/folders/:id
- [ ] หน้า manage แสดง dashboards ใน folder + subfolders
- [ ] สร้าง dashboard ใหม่ใน assigned folder ได้
- [ ] แก้ไข dashboard + assign tags ได้ (เลือกจาก existing tags, สร้างใหม่ไม่ได้)
- [ ] ลบ dashboard ใน assigned folder ได้
- [ ] สร้าง subfolder ใน assigned folder ได้
- [ ] เปิด Manage Folders accordion → Dashboard accordion ปิดอัตโนมัติ (mutually exclusive)
- [ ] User role login → ไม่เห็น Manage Folders accordion
- [ ] Admin role login → ไม่เห็น Manage Folders accordion (admin ใช้ Explorer แทน)
- [ ] เข้า /manage/folders/:id ด้วย folder ที่ไม่ได้ assign → redirect กลับ
