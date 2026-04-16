# Implementation Plan: Edit User Form — Groups + Moderator Folder Picker

> **Feature:** เพิ่ม Groups multi-select และ Moderator Folder Picker ใน Edit User modal
> **Approved:** 2026-04-16
> **Branch:** `feat/edit-user-form-groups-folders`
> **Wireframe:** [admin-user-management-page.md](../DESIGN/wireframes/admin-user-management-page.md)

---

## Background

ปัจจุบัน Edit User modal (`UserForm.vue`) มีแค่ 4 fields: email, name, company, role
ต้องการเพิ่ม:
1. **Email — disabled** ใน edit mode (email เปลี่ยนไม่ได้ เพราะผูกกับ Firebase Auth)
2. **Groups — multi-select** (ปัจจุบันจัดการแยกผ่าน `/admin/groups` แต่ไม่มีใน user form)
3. **Moderator Folder Picker** — แสดงเฉพาะเมื่อ role = moderator; เลือก folders ที่ moderator จัดการได้

---

## Data Model

### User (Firestore: `users/{uid}`)
```ts
{
  uid: string
  email: string       // read-only — set by Firebase Auth
  name: string
  role: 'user' | 'moderator' | 'admin'
  company: string
  groups: string[]    // array of group names e.g. ["sales", "finance"]
  isActive: boolean
}
```

### Folder (Firestore: `folders/{folderId}`)
```ts
{
  id: string
  name: string
  parentId?: string | null
  isActive: boolean
  assignedModerators?: string[]  // UIDs of moderators who manage this folder
}
```

### AdminGroup (Firestore: `groups/{id}`)
```ts
{
  id: string
  name: string        // this is what gets stored in User.groups[]
  isActive: boolean
  members: string[]   // UIDs
}
```

---

## Save Mechanism

เมื่อ Admin กด "บันทึก" มี 2 ส่วน:

### Part 1 — updateDoc(`users/{uid}`)
```ts
{ name, company, role, groups }
```

### Part 2 — updateDoc folder documents (only when role involves folder changes)

**Case A: role เปลี่ยนเป็น moderator (หรือยังเป็น moderator)**
- หา folders ที่ checked = true → เพิ่ม uid เข้า `assignedModerators` (ถ้ายังไม่มี)
- หา folders ที่ checked = false แต่เคยมี uid → ลบ uid ออกจาก `assignedModerators`

**Case B: role เปลี่ยนจาก moderator → user หรือ admin**
- ลบ uid ออกจาก `assignedModerators` ของทุก folder ที่เคย assign ไว้ (cleanup)

**Case C: role เป็น user หรือ admin (ไม่เปลี่ยน)**
- ไม่มี folder write

---

## Implementation Steps

### Step 1 — Disable email field ใน edit mode
**File:** `app/components/admin/forms/UserForm.vue`
- เพิ่ม `:disabled="isEditMode"` ใน `<FormField>` สำหรับ email
- เพิ่ม visual indicator (lock icon หรือ disabled styling)

### Step 2 — เพิ่ม Groups multi-select
**File:** `app/components/admin/forms/UserForm.vue`
- Import `useAdminGroups` → fetch รายชื่อ group ที่ `isActive = true`
- เพิ่ม `groups: string[]` ใน `formData` (initialValues จาก `props.user?.groups || []`)
- เพิ่ม `<FormField type="multi-select">` สำหรับ groups
  - Options: `AdminGroup[]` filtered by `isActive`
  - Value: `string[]` ของ group name
  - Display: tag chips แต่ละรายการ + ✕ ลบ

### Step 3 — เพิ่ม Moderator Folder Picker
**File:** `app/components/admin/forms/UserForm.vue`
- Import `useAdminFolders` → fetch folders ที่ `isActive = true`
- เพิ่ม `selectedFolderIds: string[]` เป็น local state (ไม่ได้เก็บใน User document)
- Pre-populate: หา folders ที่ `assignedModerators` contains `props.user?.uid`
- แสดง `<FolderCheckboxTree>` component (ดู Step 3b) เฉพาะเมื่อ `formData.role === 'moderator'`
- emit `selectedFolderIds` ออกมาพร้อม submit

**File:** `app/components/admin/forms/FolderCheckboxTree.vue` (new component)
- Props: `folders: Folder[]`, `modelValue: string[]` (selected IDs)
- Render folder tree ด้วย indentation ตาม parentId
- Checkbox แต่ละ folder เป็น independent (ไม่ cascade)

### Step 4 — อัปเดต submit payload
**File:** `app/components/admin/forms/UserForm.vue`
- emit ข้อมูลใหม่: `{ ...userFields, groups, selectedFolderIds, previousRole }`

### Step 5 — อัปเดต handleSaveUser ใน page
**File:** `app/pages/admin/users/index.vue`
- แยก save logic:
  1. `updateUser(uid, { name, company, role, groups })`
  2. `updateFolderAssignments(uid, selectedFolderIds, previousRole, allFolders)`

### Step 6 — เพิ่ม updateFolderAssignments helper
**File:** `app/composables/useAdminUsers.ts` หรือ `app/utils/folderAssignment.ts`
```ts
async function updateFolderAssignments(
  uid: string,
  newFolderIds: string[],
  previousRole: string,
  currentRole: string,
  allFolders: Folder[]
): Promise<void>
```
- ถ้า previousRole = moderator และ currentRole ≠ moderator → cleanup uid จากทุก folder
- ถ้า currentRole = moderator → diff และ update เฉพาะ folder ที่เปลี่ยน

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `app/components/admin/forms/UserForm.vue` | Modify | Disable email, add groups + folder picker |
| `app/components/admin/forms/FolderCheckboxTree.vue` | **Create** | Folder tree checkbox component |
| `app/pages/admin/users/index.vue` | Modify | handleSaveUser — split into user + folder updates |
| `app/composables/useAdminUsers.ts` | Modify | หรือสร้าง util สำหรับ folder assignment |

---

## Out of Scope

- Bulk edit
- Groups page integration (admin/groups ยังแยก)
- Permission inheritance cascade
- Validation บน folder selection (optional assignment)

---

## Test Cases ที่ต้องเพิ่มใน manual-test-plan.md

| TC | Test Case |
|----|-----------|
| 3.2.6a | Edit user — disable email field |
| 3.2.6b | Edit user — change groups |
| 3.2.6c | Edit moderator — assign folders |
| 3.2.6d | Edit moderator → change role to user — cleanup folder assignments |
| 3.2.6e | Edit user — role picker เปลี่ยนจาก user → moderator — folder section appears |

---

**Created:** 2026-04-16
**Status:** Approved — Ready to implement
