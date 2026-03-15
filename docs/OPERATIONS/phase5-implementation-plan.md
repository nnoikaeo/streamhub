# Phase 5 Implementation Plan — Tag System & Sidebar Restructure

> **Created:** 2026-03-14
> **Purpose:** Step-by-step prompts สำหรับให้ Sonnet ดำเนินการ
> **Strategy:** แต่ละ Step = 1 feature branch → PR → merge to develop

---

## Dependencies Flow

```
Step 1 (Foundation) → Step 2 (Store) → Step 3 (Components) → Step 4 (Admin Page)
                                      ↘                    ↗
                                        Step 5 (Integration)
                                                             → Step 6 (Sidebar)
```

- Step 1-2 ต้องทำก่อน (foundation)
- Step 3-5 ทำต่อเนื่อง (tag features)
- Step 6 ทำได้อิสระหลัง Step 2 (sidebar ไม่ขึ้นกับ tag UI)

---

## Step 1: Tag Foundation

**Branch:** `feat/tag-foundation`

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/types/dashboard.ts
- app/types/admin.ts
- .data/dashboards.json
- .data/groups.json (ดูโครงสร้างเป็นตัวอย่าง)
- server/api/mock/groups/ (ดูโครงสร้าง API mock เป็นตัวอย่าง)
- docs/GUIDES/database-schema.md (section Tags Collection)

จากนั้นทำ 4 อย่าง:

1. สร้างไฟล์ `app/types/tag.ts` — Tag interface:
   ```typescript
   export interface Tag {
     id: string
     name: string
     slug: string
     color: string
     description: string
     createdBy: string
     isActive: boolean
     createdAt: string
     updatedAt: string
   }
   ```

2. เพิ่ม field `tags: string[]` ใน Dashboard interface ที่ `app/types/dashboard.ts`
   (default เป็น [] — ไม่กระทบของเดิม)

3. สร้างไฟล์ `.data/tags.json` — mock data 8 tags:
   ```json
   [
     { "id": "tag_sales", "name": "Sales", "slug": "sales", "color": "#F59E0B", "description": "Sales-related dashboards", "createdBy": "61JSdbE674TqRBHHUu9ezdzFul93", "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" },
     { "id": "tag_finance", "name": "Finance", "slug": "finance", "color": "#3B82F6", "description": "Finance reports", "createdBy": "61JSdbE674TqRBHHUu9ezdzFul93", "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" },
     { "id": "tag_kpi", "name": "KPI", "slug": "kpi", "color": "#10B981", "description": "KPI tracking", "createdBy": "61JSdbE674TqRBHHUu9ezdzFul93", "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" },
     { "id": "tag_monthly", "name": "Monthly", "slug": "monthly", "color": "#F97316", "description": "Monthly reports", "createdBy": "61JSdbE674TqRBHHUu9ezdzFul93", "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" },
     { "id": "tag_quarterly", "name": "Quarterly", "slug": "quarterly", "color": "#8B5CF6", "description": "Quarterly reports", "createdBy": "61JSdbE674TqRBHHUu9ezdzFul93", "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" },
     { "id": "tag_planning", "name": "Planning", "slug": "planning", "color": "#6B7280", "description": "Planning & strategy", "createdBy": "61JSdbE674TqRBHHUu9ezdzFul93", "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" },
     { "id": "tag_ops", "name": "Operations", "slug": "ops", "color": "#06B6D4", "description": "Operations dashboards", "createdBy": "61JSdbE674TqRBHHUu9ezdzFul93", "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" },
     { "id": "tag_hr", "name": "HR", "slug": "hr", "color": "#EC4899", "description": "Human resources", "createdBy": "61JSdbE674TqRBHHUu9ezdzFul93", "isActive": true, "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" }
   ]
   ```

4. สร้าง Mock API endpoints (ดู server/api/mock/groups/ เป็นแบบ):
   - `server/api/mock/tags/index.get.ts` — GET all tags
   - `server/api/mock/tags/index.post.ts` — POST create tag
   - `server/api/mock/tags/[id].get.ts` — GET single tag
   - `server/api/mock/tags/[id].put.ts` — PUT update tag
   - `server/api/mock/tags/[id].delete.ts` — DELETE tag

5. อัปเดต `.data/dashboards.json` — เพิ่ม field `tags: []` ให้ dashboard ที่มีอยู่
   ใส่ tag IDs ตัวอย่างให้บาง dashboard เช่น:
   - Sales-related dashboards → ["tag_sales", "tag_monthly"]
   - Finance dashboards → ["tag_finance", "tag_kpi"]
   - อื่นๆ ให้ tags เป็น [] ก็ได้

ห้ามแก้ไขไฟล์อื่นนอกเหนือจากที่ระบุ
```

---

## Step 2: Tag Store & Permissions

**Branch:** `feat/tag-store`
**ต้องทำหลัง:** Step 1

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/stores/dashboard.ts (ดู pattern การสร้าง Pinia store)
- app/stores/permissions.ts (ดู role permissions mapping)
- app/composables/useAdminGroups.ts (ดู pattern composable สำหรับ CRUD)
- app/types/tag.ts (สร้างใน Step 1)

จากนั้นทำ 3 อย่าง:

1. สร้าง `app/stores/tags.ts` — Pinia store สำหรับ Tag:
   ทำตาม pattern เดียวกับ dashboard.ts

   State:
   - tags: Tag[]
   - selectedTagIds: string[] (สำหรับ filter)
   - isLoading: boolean
   - error: string | null

   Actions:
   - setTags(tags: Tag[])
   - addTag(tag: Tag)
   - updateTag(id: string, data: Partial<Tag>)
   - removeTag(id: string)
   - toggleTagFilter(tagId: string) — toggle tag ใน selectedTagIds
   - clearTagFilter() — reset selectedTagIds เป็น []

   Getters:
   - activeTags — tags ที่ isActive === true
   - getTagById(id) — หา tag จาก id
   - getTagsByIds(ids: string[]) — หา tags หลายตัว
   - isTagSelected(tagId) — เช็คว่า tag ถูกเลือกอยู่ไหม

2. อัปเดต `app/stores/permissions.ts`:
   เพิ่ม 2 permissions ใน FeaturePermissions interface:
   - canManageTags: boolean (Admin only — CRUD tags)
   - canAssignTags: boolean (Admin + Moderator — assign tags to dashboards)

   อัปเดต ROLE_PERMISSIONS:
   - admin: canManageTags: true, canAssignTags: true
   - moderator: canManageTags: false, canAssignTags: true
   - user: canManageTags: false, canAssignTags: false

3. สร้าง `app/composables/useAdminTags.ts`:
   ทำตาม pattern เดียวกับ useAdminGroups.ts

   - fetchTags() — GET /api/mock/tags → store.setTags()
   - createTag(data) — POST /api/mock/tags → store.addTag()
   - updateTag(id, data) — PUT /api/mock/tags/:id → store.updateTag()
   - deleteTag(id) — DELETE /api/mock/tags/:id → store.removeTag()
   - return { tags, loading, error, fetchTags, createTag, updateTag, deleteTag }

ห้ามแก้ไขไฟล์อื่นนอกเหนือจากที่ระบุ
```

---

## Step 3: Tag UI Components

**Branch:** `feat/tag-ui-components`
**ต้องทำหลัง:** Step 2

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/components/ui/Badge.vue (ดู pattern UI component)
- app/components/features/DashboardCard.vue (ดูการใช้ Badge)
- app/stores/tags.ts (สร้างใน Step 2)
- app/types/tag.ts (สร้างใน Step 1)
- docs/DESIGN/wireframes/tag-management-page.md (ดู wireframe)
- assets/css/theme.css (ดู .theme-badge classes)

จากนั้นสร้าง 3 components:

1. สร้าง `app/components/features/TagBadge.vue`:
   Purpose: แสดง tag chip บน dashboard card

   Props:
   - tag: Tag (required)
   - size: 'sm' | 'md' (default: 'sm')
   - removable: boolean (default: false)

   Events:
   - @remove — emit เมื่อกดปุ่ม ✕

   Template:
   - แสดงจุดสี (●) + ชื่อ tag
   - ถ้า removable=true แสดงปุ่ม ✕
   - Style: background เป็น tag.color ที่ opacity 15%, text เป็น tag.color, border 1px solid tag.color
   - size sm: font-size 12px, padding 2px 8px, border-radius 12px
   - size md: font-size 14px, padding 4px 12px, border-radius 14px

2. สร้าง `app/components/features/TagFilter.vue`:
   Purpose: tag filter bar แบบ multi-select chips บนหน้า "View All"

   Props:
   - tags: Tag[] (all available tags)
   - selectedTagIds: string[] (currently selected)
   - loading: boolean (default: false)

   Events:
   - @update:selectedTagIds — emit array ของ tag IDs ที่เลือก

   Template:
   - แสดง chips แนวนอน scrollable
   - แต่ละ chip: click เพื่อ toggle select/deselect
   - Unselected: outline style (border เป็น tag color, bg transparent)
   - Selected: filled style (bg เป็น tag color, text white)
   - Hover: bg tag color ที่ 10% opacity

   Logic:
   - click tag ที่ยังไม่เลือก → เพิ่มเข้า selectedTagIds
   - click tag ที่เลือกอยู่ → เอาออกจาก selectedTagIds
   - ใช้ AND logic: dashboards ต้องมีทุก tag ที่เลือก

3. สร้าง `app/components/features/TagSelector.vue`:
   Purpose: dropdown เลือก/ลบ tags ในฟอร์ม edit dashboard

   Props:
   - modelValue: string[] (current tag IDs)
   - availableTags: Tag[]
   - canCreateTag: boolean (default: false — เฉพาะ admin)

   Events:
   - @update:modelValue — emit เมื่อ tags เปลี่ยน
   - @create-tag — emit ชื่อ tag ใหม่ที่ต้องการสร้าง

   Template:
   - ด้านบน: แสดง current tags เป็น TagBadge ที่ removable=true
   - ปุ่ม [+ Add tag] → เปิด dropdown
   - Dropdown มี search input + checkbox list ของ available tags
   - ถ้า canCreateTag=true: แสดงปุ่ม [+ Create "xxx"] ที่ท้าย dropdown
   - ถ้า canCreateTag=false: แสดง "Need a new tag? Contact Admin"

ใช้ <style scoped> สำหรับ layout/spacing
ใช้ CSS variables จาก theme (var(--color-*), var(--spacing-*))
ห้าม hardcode สี — ยกเว้น tag.color ที่มาจาก data
ห้ามแก้ไขไฟล์อื่นนอกเหนือจากที่ระบุ
```

---

## Step 4: Tag Admin Page

**Branch:** `feat/tag-admin-page`
**ต้องทำหลัง:** Step 3

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/pages/admin/groups/index.vue (ดู pattern admin page ที่มี CRUD)
- app/composables/useRoleNavigation.ts (source of truth ของ admin menu items)
- app/components/admin/forms/GroupForm.vue (ดู pattern form)
- app/components/admin/ConfirmDialog.vue (ดู confirm dialog)
- app/composables/useAdminTags.ts (สร้างใน Step 2)
- app/components/features/TagBadge.vue (สร้างใน Step 3)
- docs/DESIGN/wireframes/tag-management-page.md (section 3: Tag Management)

จากนั้นทำ 4 อย่าง:

1. สร้าง `app/pages/admin/tags/index.vue`:
   ทำตาม pattern เดียวกับ admin/groups/index.vue

   Structure:
   - ใช้ PageLayout component
   - Header: ชื่อ "Tags" + ปุ่ม [+ Create Tag]
   - ช่อง Search/Filter
   - DataTable แสดง: Tag (name + color badge), Description, Dashboards (count), Status, Actions (edit/delete)
   - กด Create/Edit → เปิด FormModal
   - กด Delete → เปิด ConfirmDialog

   หมายเหตุ: ใช้ useAdminTags() composable สำหรับ CRUD operations
   ใช้ usePermissionsStore().can('canManageTags') สำหรับ guard

2. สร้าง `app/components/admin/forms/TagForm.vue`:
   ทำตาม pattern เดียวกับ GroupForm.vue

   Fields:
   - name: text input (required)
   - slug: text input (auto-generate จาก name, editable)
   - color: color picker หรือ preset swatches (8 สี)
   - description: textarea
   - isActive: toggle/checkbox

   Preview section: แสดง TagBadge ของ tag ที่กำลัง edit

3. อัปเดต `app/composables/useRoleNavigation.ts`:
   เพิ่มเมนู Tags ใน adminMenuGroup items (ระหว่าง Groups กับ Permissions)
   ```typescript
   { path: '/admin/tags', label: 'แท็ก', icon: '🏷️' }
   ```
   หมายเหตุ: `AdminSidebar.vue` ถูกลบแล้ว — admin menu items ทั้งหมดอยู่ใน `useRoleNavigation.ts`

ห้ามแก้ไขไฟล์อื่นนอกเหนือจากที่ระบุ
```

---

## Step 5: Dashboard Integration

**Branch:** `feat/tag-dashboard-integration`
**ต้องทำหลัง:** Step 3

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/components/features/DashboardCard.vue (ดูโครงสร้าง card)
- app/pages/dashboard/discover.vue (ดูหน้า "View All")
- app/stores/tags.ts (สร้างใน Step 2)
- app/stores/dashboard.ts (ดู dashboard data)
- app/components/features/TagBadge.vue (สร้างใน Step 3)
- app/components/features/TagFilter.vue (สร้างใน Step 3)
- app/composables/useAdminTags.ts (สร้างใน Step 2)

จากนั้นทำ 2 อย่าง:

1. อัปเดต `app/components/features/DashboardCard.vue`:
   - เพิ่ม prop `tags?: Tag[]` (optional เพื่อไม่กระทบของเดิม)
   - ในส่วน card content: แสดง TagBadge สำหรับแต่ละ tag
   - จำกัดแสดงสูงสุด 3 tags + "+N more" ถ้ามีเกิน 3
   - วาง tags ไว้ใต้ description, เหนือ updated date
   - ถ้า tags เป็น [] หรือ undefined ไม่ต้องแสดงอะไร

2. อัปเดต `app/pages/dashboard/discover.vue`:
   - Import และใช้ useTagStore()
   - Import และใช้ useAdminTags() เพื่อ fetchTags() ตอน onMounted
   - เพิ่ม TagFilter component ไว้เหนือ dashboard grid
     - pass tags จาก tagStore.activeTags
     - pass selectedTagIds จาก tagStore.selectedTagIds
     - handle @update:selectedTagIds → tagStore actions
   - เพิ่ม computed `filteredDashboards`:
     - ถ้า selectedTagIds ว่าง → แสดง dashboards ทั้งหมด
     - ถ้ามี selectedTagIds → filter dashboards ที่มี tags ครบทุก selectedTagIds (AND logic)
   - ส่ง tags data ไป DashboardCard:
     - map dashboard.tags (string[]) → Tag objects ผ่าน tagStore.getTagsByIds()
   - เพิ่มข้อความแสดงจำนวน: "Showing X dashboards" + ถ้ามี filter: "with tags: A, B"

ห้ามแก้ไขไฟล์อื่นนอกเหนือจากที่ระบุ
ระวังไม่ให้แก้ logic เดิมพัง — เพิ่มของใหม่โดยไม่เปลี่ยน behavior เดิม
```

---

## Step 6: Sidebar Restructure

**Branch:** `feat/sidebar-restructure`
**ต้องทำหลัง:** Step 4

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/components/layouts/UnifiedSidebar.vue (sidebar ปัจจุบัน)
- app/components/layouts/FolderAccordion.vue (folder tree component)
- app/components/admin/AdminAccordion.vue (admin menu component)
- app/composables/useRoleNavigation.ts (source of truth ของ menu items ทุก role)
- app/composables/useSidebarVisibility.ts (visibility logic)
- app/stores/permissions.ts (role checking)
- app/stores/auth.ts (user data)
- app/stores/dashboard.ts (folder/accordion state)
- docs/DESIGN/wireframes/sidebar-navigation.md (wireframe เป้าหมาย)

เป้าหมาย: Restructure sidebar ให้แสดงเมนูตาม role

### Role-Based Sidebar Design:

**USER:**
```
▾ Dashboard          ← เปิดอยู่เสมอ
  ├ View All         → /dashboard/discover
  └ Search           → /dashboard/discover?mode=search
```

**MODERATOR:**
```
▾ Dashboard          ← View 1: Viewer Mode
  ├ View All         → /dashboard/discover
  └ Search           → /dashboard/discover?mode=search

▾ Manage Folders     ← View 2: Manager Mode
  ├ 📁 Sales (2)     → /manage/folders/folder_sales
  │  ├ Q1            → /manage/folders/folder_q1
  │  └ Q2            → /manage/folders/folder_q2
  └ 📁 Finance (1)   → /manage/folders/folder_finance
```

**ADMIN:**
```
▾ Dashboard
  ├ View All         → /dashboard/discover
  └ Search           → /dashboard/discover?mode=search

▾ Admin
  ├ Overview         → /admin/overview
  ├ Users            → /admin/users
  ├ Explorer         → /admin/explorer
  ├ Dashboards       → /admin/dashboards
  ├ Companies        → /admin/companies
  ├ Regions          → /admin/regions
  ├ Groups           → /admin/groups
  ├ Tags             → /admin/tags
  └ Permissions      → /admin/permissions
```

### สิ่งที่ต้องทำ:

1. สร้าง `app/composables/useRoleNavigation.ts`:
   - export function useRoleNavigation()
   - ใช้ useAuthStore() เพื่อดึง user role
   - ใช้ usePermissionsStore() เพื่อเช็คสิทธิ์
   - return computed `menuGroups: SidebarMenuGroup[]` ตาม role
   - interface SidebarMenuGroup { id, label, icon, items: SidebarMenuItem[], visible }
   - interface SidebarMenuItem { label, icon, to, badge?, children? }
   - สำหรับ moderator: ดึง assignedFolders จาก user data

2. อัปเดต `app/composables/useSidebarVisibility.ts`:
   - เปลี่ยนจาก showAdmin/showFolders → ใช้ useRoleNavigation() แทน
   - หรือ deprecate composable นี้ ถ้า useRoleNavigation ทำหน้าที่แทนได้ทั้งหมด

3. อัปเดต `app/components/layouts/UnifiedSidebar.vue`:
   - เปลี่ยนจาก hardcoded menu items → ใช้ menuGroups จาก useRoleNavigation()
   - render แต่ละ group เป็น accordion section
   - accordion เป็น mutually exclusive (เปิด group หนึ่ง → ปิด group อื่น)
   - Dashboard group: แสดง View All + Search
   - Admin group: แสดง admin menu items ทั้งหมด
   - Manage Folders group (moderator): แสดง assigned folders เป็น tree
   - เก็บ active state: highlight menu item ที่ตรงกับ current route

4. ลบ FolderAccordion/FolderTree ออกจาก sidebar (ถ้ายังมี):
   - User/Moderator ไม่ต้องเห็น folder tree ใน sidebar อีกแล้ว
   - Folder filter จะอยู่บนหน้า discover แทน (Step 5 ทำไปแล้ว)
   - Admin ใช้ Explorer page ที่มี folder tree ของตัวเอง

ระวัง: อย่าลบ component files (FolderAccordion.vue, FolderTree.vue)
เพราะอาจยังถูกใช้ที่อื่น — แค่เอาออกจาก sidebar
```

---

## วิธีใช้ Prompts

### ก่อนเริ่มแต่ละ Step:
```bash
git checkout develop
git pull origin develop
git checkout -b <branch-name>
```

### หลังทำเสร็จแต่ละ Step:
```bash
git add <files>
git commit -m "<conventional commit message>"
git push -u origin <branch-name>
# สร้าง PR → merge to develop
```

### Tips ลด Token:
1. Copy prompt ของ Step ที่ต้องการ ส่งให้ Sonnet ใน conversation ใหม่
2. ไม่ต้องส่ง context ก่อนหน้า — prompt มี context ครบ
3. ถ้า conversation หลุด ก็เริ่ม Step ถัดไปได้เลย
4. ถ้า Step ใดซับซ้อน แบ่ง prompt เป็น 2 ส่วนได้ (เช่น Step 6)

---

## Estimated Effort per Step

| Step | Scope | Files Changed | Complexity |
|------|-------|--------------|------------|
| 1 | Foundation | ~8 files (new) | ⭐ Low |
| 2 | Store | ~3 files | ⭐ Low |
| 3 | Components | ~3 files (new) | ⭐⭐ Medium |
| 4 | Admin Page | ~4 files | ⭐⭐ Medium |
| 5 | Integration | ~2 files | ⭐⭐ Medium |
| 6 | Sidebar | ~4 files | ⭐⭐⭐ High |

---

**Total:** ~24 files changed/created across 6 branches
