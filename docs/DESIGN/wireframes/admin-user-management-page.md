# Admin User Management Page

> **Purpose:** Manage users across all companies (Edit, Delete, Toggle Active, Filter)
> **Users:** Admin role only
> **Current Implementation:** `app/pages/admin/users/index.vue`
> **Last Updated:** 2026-04-16
> **Version:** 2.0

---

## Key Principle

**User Management = Search, Filter, Edit, Delete, Toggle Active**
- View all users with company/role/status filters
- Edit user info: name, company, role, groups, moderator folders
- New users are invited via `/admin/invitations` only (no direct create here)
- Every user record is backed by a real Firebase Auth UID

---

## Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│  จัดการผู้ใช้                                               │
├──────────────────────────────────────────────────────────────┤
│  [ค้นหาตามอีเมล หรือ ชื่อ...]  [บทบาท▼] [บริษัท▼] [สถานะ▼] │
│  [🔄 ล้างตัวกรอง]                                            │
├──────────────────────────────────────────────────────────────┤
│  ชื่อ            บทบาท    บริษัท   กลุ่ม     สถานะ  จัดการ  │
│  IT Streamwash   admin    STTH     -         ●      ✏️ 🗑️   │
│  Survey Streams  user     ORAY     operations ●     ✏️ 🗑️   │
│  Nattha Mod.     moderator STTH    finance    ●     ✏️ 🗑️   │
│  Nopphol Noi.    moderator INFE    sales      ●     ✏️ 🗑️   │
├──────────────────────────────────────────────────────────────┤
│  แสดง 1–7 จาก 7 รายการ          [← ก่อนหน้า] [1] [ถัดไป →] │
└──────────────────────────────────────────────────────────────┘
```

**Note:** ไม่มีปุ่ม "เพิ่มผู้ใช้ใหม่" — การสร้าง user ใหม่ใช้ `/admin/invitations`

---

## Edit User Modal (v2.0 — Approved 2026-04-16)

```
┌──────────────────────────────────────────────────┐
│  แก้ไขผู้ใช้                                  ✕ │
├──────────────────────────────────────────────────┤
│                                                    │
│  อีเมล *                                         │
│  ┌────────────────────────────────────────────┐  │
│  │ 🔒 survey.streamwash@gmail.com             │  │ ← disabled (read-only)
│  └────────────────────────────────────────────┘  │
│                                                    │
│  ชื่อจริง *                                      │
│  ┌────────────────────────────────────────────┐  │
│  │ Survey Streamwash                          │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  บริษัท                                          │
│  ┌────────────────────────────────────────────┐  │
│  │ ORAY (Hub) - บริษัท ออลซิ่ง เนส ฯ      ▼ │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  บทบาท                                           │
│  ┌────────────────────────────────────────────┐  │
│  │ Moderator                               ▼  │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  ╔══ แสดงเฉพาะเมื่อ บทบาท = Moderator ══════╗  │
│  ║  โฟลเดอร์ที่จัดการได้                      ║  │
│  ║  ┌──────────────────────────────────────┐  ║  │
│  ║  │ ☑  Sales Reports                    │  ║  │
│  ║  │ ☐  Finance Reports                  │  ║  │
│  ║  │     ├── ☐  Q1 Reports               │  ║  │
│  ║  │     └── ☐  Q2 Reports               │  ║  │
│  ║  │ ☐  Operations                       │  ║  │
│  ║  └──────────────────────────────────────┘  ║  │
│  ╚═════════════════════════════════════════════╝  │
│                                                    │
│  กลุ่ม                                           │
│  ┌────────────────────────────────────────────┐  │
│  │ [sales ✕] [operations ✕]  + เพิ่มกลุ่ม ▼ │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│                      [ ยกเลิก ]  [ บันทึก ]      │
└──────────────────────────────────────────────────┘
```

### Field Behavior

| Field | Create | Edit | Notes |
|-------|--------|------|-------|
| อีเมล | — | disabled (read-only) | Email is set by Firebase Auth, cannot change |
| ชื่อจริง | required | editable | |
| บริษัท | required | editable | Grouped by region |
| บทบาท | required | editable | admin / moderator / user |
| โฟลเดอร์ที่จัดการได้ | — | editable | แสดงเฉพาะเมื่อ role = moderator |
| กลุ่ม | — | editable | Multi-select จาก AdminGroup list |

---

## Save Mechanism (Approved 2026-04-16)

เมื่อกด "บันทึก" จะมี write operations แยกกัน 2 ส่วน:

### Part 1 — Update User document
```
users/{uid}  ← updateDoc
  name, company, role, groups
```

### Part 2 — Update Folder documents (moderator only)
```
folders/{folderId}  ← updateDoc (for each changed folder)
  assignedModerators: [...] (add/remove uid)
```

**Scenarios:**
- Role เปลี่ยนจาก `moderator` → `user`/`admin`: ลบ uid ออกจาก `assignedModerators` ของทุก folder ที่เคย assign
- Role ยังคงเป็น `moderator`: diff folder checkboxes → เพิ่ม/ลบ uid เฉพาะ folder ที่เปลี่ยน
- Role ไม่ใช่ `moderator`: ไม่มี folder write

---

## Folder Picker UI Spec

- **แสดง:** เฉพาะ folder ที่ `isActive = true`
- **Layout:** Tree hierarchy โดยแสดง indentation ตาม `parentId`
- **Pre-select:** โหลด folders ที่มี `assignedModerators` contains `user.uid` อยู่แล้ว
- **Checkbox behavior:** parent checkbox เป็น independent (ไม่ cascade ไป children)

---

## Groups UI Spec

- **Data source:** `useAdminGroups` — fetch รายชื่อ `AdminGroup` ทั้งหมด
- **Store:** `User.groups: string[]` เก็บ **ชื่อ** group (ไม่ใช่ ID) — เช่น `["sales", "finance"]`
- **UI:** multi-select tag input — เลือกจาก dropdown, แสดงเป็น tag + ✕ ลบแต่ละรายการ
- **Filter:** แสดงเฉพาะ group ที่ `isActive = true`

---

## Related Documents

| Document | Link |
|----------|------|
| Implementation Plan | [edit-user-form-plan.md](../../OPERATIONS/edit-user-form-plan.md) |
| Roles & Permissions Guide | [roles-and-permissions.md](../../GUIDES/roles-and-permissions.md) |
| Permission Management Wireframe | [admin-permission-management-page.md](./admin-permission-management-page.md) |

---

**Created:** 2026-02-14
**Updated:** 2026-04-16
**Version:** 2.0 — Remove create, add groups + moderator folder picker to edit modal
