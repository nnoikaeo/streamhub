# 🔐 Roles & Permissions Guide

**StreamHub Role-Based Access Control (RBAC) System**

---

## 📊 Role Hierarchy

```
┌─────────────────────────────────────────┐
│              ADMIN (最高)               │
│  └─ Manage everything in the system    │
├─────────────────────────────────────────┤
│           MODERATOR (中等)              │
│  └─ Manage dashboards in assigned     │
│     folders only                       │
├─────────────────────────────────────────┤
│            USER (基本)                  │
│  └─ View dashboards (read-only)       │
└─────────────────────────────────────────┘
```

---

## 👤 Role Definitions

### 1️⃣ USER (สิทธิ์พื้นฐาน)

**คำจำกัดความ:** พนักงานทั่วไปที่สามารถดู Dashboard ตามสิทธิ์ที่กำหนด

**สิทธิ์:**
- ✅ ดู (View) Dashboard ที่มีสิทธิ์เข้าถึง
- ✅ ดู Profile ตนเอง
- ❌ เปลี่ยนรหัสผ่าน
- ❌ ส่งออกข้อมูล (Export)
- ❌ สร้าง Dashboard
- ❌ แก้ไข Dashboard
- ❌ กำหนดสิทธิ์
- ❌ จัดการผู้ใช้อื่น
- ❌ สร้าง Folder

**ตัวอย่าง:**
```
👤 User: "สมชาย" (Company: STTH)
├── Company: STTH
├── Role: User
└── Can view:
    ├── STTH Sales Dashboard (shared to company)
    ├── Group Overview (shared to all)
    └── My Performance (shared individually)

But CANNOT:
├── Edit STTH Sales Dashboard
├── Create new dashboard
├── Add users
└── Manage folders
```

**Use Case:**
- 📱 ตัวแทนขาย (Sales Rep)
- 💰 Staff บัญชี (Accounting Staff)
- 👥 เจ้าหน้าที่ (Officer)
- ⚙️ วิศวกร (Engineer)

---

### 2️⃣ MODERATOR (สิทธิ์กลาง)

**คำจำกัดความ:** หัวหน้าหรือเจ้าหน้าที่ที่สามารถสร้าง/แก้ไข Dashboard และ Subfolder ในโฟลเดอร์ที่ Admin มอบหมาย

**สิทธิ์:**
- ✅ ดู (View) Dashboard ทั้งหมด (ในสิทธิ์ของตัวเอง)
- ✅ **สร้าง Subfolder ใหม่** (ในโฟลเดอร์ที่อนุญาต)
- ✅ **แก้ไข Subfolder** (ในโฟลเดอร์ที่อนุญาต)
- ✅ **ลบ Subfolder** (ในโฟลเดอร์ที่อนุญาต)
- ✅ **กำหนดสิทธิ์ Subfolder** (ในโฟลเดอร์ที่อนุญาต)
- ✅ **สร้าง Dashboard ใหม่** (ในโฟลเดอร์ที่อนุญาต)
- ✅ **แก้ไข Dashboard** (ในโฟลเดอร์ที่อนุญาต)
- ✅ **ลบ Dashboard** (ในโฟลเดอร์ที่อนุญาต)
- ✅ **กำหนดสิทธิ์ Dashboard** (ในโฟลเดอร์ที่อนุญาต)
- ✅ ดูรายงาน (Reports)
- ❌ เชิญ User
- ❌ ลบ User
- ❌ เปลี่ยน Role User
- ❌ เข้าถึงโฟลเดอร์อื่น (นอกเหนือจากที่มอบหมาย)

**ตัวอย่าง:**
```
👤 User: "นายหา" (Company: STTH)
├── Company: STTH
├── Role: Moderator
├── Assigned Folders: ["Operations", "Reports"]
└── Can:
    ├── ✅ View all dashboards (in STTH folders)
    ├── ✅ Create new subfolder in assigned folders
    ├── ✅ Edit subfolder in assigned folders
    ├── ✅ Delete subfolder in assigned folders
    ├── ✅ Set permissions for subfolder
    ├── ✅ Create new dashboard in assigned folders
    ├── ✅ Edit Dashboard
    ├── ✅ Delete Dashboard
    ├── ✅ Set permissions for Dashboard
    ├── ❌ Access other company folders (STTN, STCS, etc.)
    ├── ❌ Create folders at company level
    └── ❌ Invite new users
```

**Use Case:**
- 🏢 หัวหน้าแผนก (Department Head)
- 📊 Data Analyst
- 📈 Report Manager
- 💼 Team Lead

---

### 3️⃣ ADMIN (สิทธิ์สูงสุด)

**คำจำกัดความ:** ผู้บริหาร IT/ระบบ ที่สามารถจัดการทุกสิ่งในระบบ (ทั้ง company ได้)

**สิทธิ์:**
- ✅ **ดู Dashboard ทั้งหมด** (ทุก company)
- ✅ **สร้าง/แก้ไข/ลบ Dashboard** (ทุก Folder)
- ✅ **กำหนดสิทธิ์ Dashboard** (ทุกอย่าง)
- ✅ **สร้าง Folder ใหม่** (ทุก company)
- ✅ **แก้ไข/ลบ Folder** (ทุก company)
- ✅ **กำหนดสิทธิ์ Folder** ให้ Moderator
- ✅ **เชิญ User ใหม่** (ทั้ง company)
- ✅ **แก้ไข User** (ชื่อ, Email, Profile)
- ✅ **เปลี่ยน Role User** (User → Moderator → Admin)
- ✅ **ลบ User**
- ✅ **ดู Activity Logs** (ทั้งระบบ, ทั้ง company)
- ✅ **ดู System Settings**
- ✅ **ดู Usage Analytics** (ทั้ง company)

**ตัวอย่าง:**
```
👤 User: "เจ้านาย" (Admin)
├── Company: N/A (Global access)
├── Role: Admin
├── Access: All folders and users across all companies
└── Can:
    ├── ✅ Create new folders for any company
    ├── ✅ Assign folders to Moderators
    ├── ✅ Invite new users to any company
    ├── ✅ Delete users from any company
    ├── ✅ Change any user role
    ├── ✅ View all dashboards (all companies)
    ├── ✅ Create/Edit/Delete dashboards (all companies)
    ├── ✅ Set any permissions
    ├── ✅ View activity logs (all companies)
    ├── ✅ Configure system settings
    └── ✅ View usage analytics (all companies)
```

**Use Case:**
- 👨‍💼 IT Administrator
- 👨‍💻 System Manager
- 📊 CTO / Technical Lead
- 🔐 Security Officer

---

## 📋 Permission Matrix

| **Dashboard & Folder Operations** | **USER** | **MODERATOR** | **ADMIN** |
|---|:---:|:---:|:---:|
| View dashboards (own company) | ✅ | ✅ | ✅ |
| View dashboards (other companies) | ❌ | ❌ | ✅ |
| Create dashboard | ❌ | ✅ (*) | ✅ |
| Edit dashboard | ❌ (if assigned) | ✅ (*) | ✅ |
| Delete dashboard | ❌ | ✅ (*) | ✅ |
| Create subfolder | ❌ | ✅ (*) | ✅ |
| Manage subfolder | ❌ | ✅ (*) | ✅ |
| Create folder (company-level) | ❌ | ❌ | ✅ |
| Edit folder (company-level) | ❌ | ❌ | ✅ |
| Delete folder (company-level) | ❌ | ❌ | ✅ |
| Assign folder to moderator | ❌ | ❌ | ✅ |

| **User & Company Management** | **USER** | **MODERATOR** | **ADMIN** |
|---|:---:|:---:|:---:|
| View users in own company | ❌ | ✅ | ✅ |
| View users in other companies | ❌ | ❌ | ✅ |
| Invite user to own company | ❌ | ✅ | ✅ |
| Invite user to other companies | ❌ | ❌ | ✅ |
| Change user role (within company) | ❌ | ❌ | ✅ |
| Remove user from company | ❌ | ❌ | ✅ |
| Create new company | ❌ | ❌ | ✅ |
| Assign company admins | ❌ | ❌ | ✅ |

| **System & Audit** | **USER** | **MODERATOR** | **ADMIN** |
|---|:---:|:---:|:---:|
| View activity log (own company) | ❌ | ✅ | ✅ |
| View activity log (all companies) | ❌ | ❌ | ✅ |
| View system settings | ❌ | ❌ | ✅ |
| Configure Looker Studio integrations | ❌ | ❌ | ✅ |

**Legend:**
- ✅ = Allowed
- ❌ = Not allowed
- (*) = Only in assigned folders within own company

---

## 🗂️ Folder-Based Access Control (Company-Scoped)

### What is Folder?

**Folder** คือการจัดกลุ่ม Dashboards ภายในแต่ละบริษัท (Company):

```
Companies
├── STTH (Streamwash Thailand)
│   └── Folders (created by Admin)
│       ├── Operations
│       │   ├── Operations Dashboard
│       │   ├── Performance Report
│       │   └── Daily Analytics
│       ├── Management
│       │   ├── Executive Dashboard
│       │   └── KPI Report
│       └── Reports
│           ├── Monthly Report
│           └── Quarterly Report
│
├── STTN (Streamwash Laos)
│   └── Folders
│       ├── Operations
│       ├── Finance
│       └── Reports
│
├── STCS (Streamwash Cambodia)
│   └── Folders (...)
│
└── ... (other companies)
```

### Admin assigns Folders to Moderators:

```
👤 Admin (Global)
  ├── Creates Folder: "Operations" for STTH
  ├── Assigns Folder to: สมชาย (STTH Moderator)
  │
  ├── Creates Folder: "Finance" for STTH
  ├── Assigns Folder to: นางสาว ก. (STTH Moderator)
  │
  └── Creates Folder: "Operations" for STTN
      └── Assigns Folder to: Mr. Phoumy (STTN Moderator)

👤 Moderator: สมชาย (Company: STTH)
  ├── Assigned Folder: Operations (STTH)
  ├── Can manage:
  │   ├── Create/Edit/Delete dashboards in Operations folder
  │   ├── Set permissions for dashboards
  │   └── View all dashboards in STTH
  └── Cannot:
      ├── Access STTN, STCS (other company) folders
      ├── Create top-level folders
      └── Manage other companies
```

---

## 🔄 Typical Workflow (Company-Based)

### Scenario 1: Admin Sets Up Folder for STTH Company

```
1. เจ้านาย (Global Admin) creates Folder structure for STTH company
   ├── Folder: "Operations" (company: "STTH")
   ├── Folder: "Finance" (company: "STTH")
   └── Folder: "Reports" (company: "STTH")

2. Admin assigns "Operations" folder to สมชาย (STTH Moderator)
   └── สมชาย: {userId: "uid1234", company: "STTH"}

3. Admin assigns "Finance" folder to นางสาว ก. (STTH Moderator)
   └── นางสาว ก.: {userId: "uid5678", company: "STTH"}

4. สมชาย logs in → sees only "Operations" folder (assigned)
5. สมชาย CANNOT see Finance folder (assigned to different moderator)
6. สมชาย CANNOT see STTN company folders
```

### Scenario 2: Moderator Creates Dashboard in Assigned Folder

```
1. สมชาย (STTH Moderator) creates "Monthly Operations Report"
   ├── title: "Monthly Operations Report"
   ├── company: "STTH"  // Automatically set
   ├── folderId: "folder_stth_operations"
   └── createdBy: "uid1234"

2. สมชาย sets permissions:
   └── company:STTH → view (all STTH users can view)
   └── uid:uid1234 → edit (สมชาย can edit)
   └── role:admin → edit, delete (admins can fully manage)

3. STTH users see dashboard in their dashboard list
4. STTN users CANNOT see this dashboard (different company)
5. Admin can see and manage this dashboard (global access)
```

### Scenario 3: User Requests Dashboard Access from Another Company

```
1. สุนัย (User at STTH) asks if he can see STTN's Finance Dashboard
2. Answer: ❌ NO
   - สุนัย is in company: "STTH"
   - Dashboard is in company: "STTN"
   - Moderators can only manage dashboards in their assigned company
   - Only Admin can view cross-company dashboards

3. Admin CAN view and manage dashboards across all companies:
   - Admin sees: STTH dashboards, STTN dashboards, STCS dashboards, etc.
   - Admin can create/edit/delete in any company folder
```

### Scenario 4: Promoting Moderator to Admin

```
1. เจ้านาย (Admin) decides to promote สมชาย from Moderator to Admin
   └── Change: role: "moderator" → role: "admin"
   └── Change: company: "STTH" → company: null (global access)

2. สมชาย's access changes:
   ├── Can now manage all companies (STTH, STTN, STCS, etc.)
   ├── Can create/edit/delete folders at company level
   ├── Can invite users to any company
   └── Can view activity logs for all companies

3. Previous assignment to "Operations" folder is irrelevant now
   └── สมชาย has access to ALL folders in ALL companies
```

---

## 🔐 Database Structure

### Users Collection

```firestore
/users
  ├── uid1234
  │   ├── email: "somchai@stth.com"
  │   ├── displayName: "สมชาย"
  │   ├── photoURL: "https://..."
  │   ├── role: "moderator"  // "user" | "moderator" | "admin"
  │   ├── company: "STTH"    // Company code (STTH, STTN, STCS, etc.)
  │   ├── assignedFolders: ["operations", "reports"]  // Moderator only
  │   ├── createdAt: 2024-01-21
  │   └── isActive: true
  │
  ├── uid5678
  │   ├── email: "admin@streamwash.com"
  │   ├── displayName: "เจ้านาย"
  │   ├── role: "admin"
  │   ├── company: null      // Admin has global access
  │   ├── assignedFolders: [] // Admin has access to all
  │   └── ...
  │
  └── uid9012
      ├── email: "user@stth.com"
      ├── displayName: "สุนัย"
      ├── role: "user"
      ├── company: "STTH"
      ├── assignedFolders: [] // User doesn't use this
      └── ...
```

### Folders Collection

```firestore
/folders
  ├── folder_stth_operations
  │   ├── name: "Operations"
  │   ├── company: "STTH"           // REQUIRED: Company ownership
  │   ├── description: "Operations Dashboards for STTH"
  │   ├── createdBy: "admin_id"
  │   ├── assignedModerators: [
  │   │   {
  │   │     userId: "uid1234",
  │   │     name: "สมชาย",
  │   │     permissions: ["view", "create", "edit", "delete", "manage_perms"]
  │   │   }
  │   │ ]
  │   ├── createdAt: 2024-01-20
  │   └── subfolders: [
  │       {
  │         id: "subfolder_stth_operations_daily",
  │         name: "Daily Reports",
  │         createdBy: "uid1234",
  │         permissions: {...}
  │       },
  │       {
  │         id: "subfolder_stth_operations_weekly",
  │         name: "Weekly Reports",
  │         createdBy: "uid1234",
  │         permissions: {...}
  │       }
  │     ]
  │
  ├── folder_stth_finance
  │   ├── name: "Finance"
  │   ├── company: "STTH"
  │   ├── assignedModerators: [
  │   │   {
  │   │     userId: "uid5678",
  │   │     name: "นางสาว ก."
  │   │   }
  │   │ ]
  │   └── ...
  │
  ├── folder_sttn_operations
  │   ├── name: "Operations"
  │   ├── company: "STTN"           // Different company
  │   ├── assignedModerators: [
  │   │   {
  │   │     userId: "uid9999",
  │   │     name: "Mr. Phoumy"
  │   │   }
  │   │ ]
  │   └── ...
  │
  └── ... (other companies: STCS, STNR, STPT, STPK, etc.)
```

**Key Point:** Each folder must have a `company` field to ensure data isolation between companies!

### Dashboards Collection

```firestore
/dashboards
  ├── dash_stth_ops_daily
  │   ├── title: "STTH Daily Operations Report"
  │   ├── description: "Daily operations performance"
  │   ├── company: "STTH"          // REQUIRED: Company ownership
  │   ├── folderId: "folder_stth_operations"
  │   ├── lookerUrl: "https://lookerstudio.google.com/..."
  │   ├── createdBy: "uid1234"
  │   ├── permissions: {
  │   │   "role:user": ["view"],
  │   │   "role:moderator": ["view", "edit"],
  │   │   "role:admin": ["view", "edit", "delete"],
  │   │   "uid:1234": ["view", "edit", "delete"],  // Owner
  │   │   "company:STTH": ["view"]
  │   │ }
  │   ├── createdAt: 2024-01-21
  │   └── updatedAt: 2024-01-21
  │
  ├── dash_stth_finance_budget
  │   ├── title: "STTH Budget vs Actual"
  │   ├── company: "STTH"
  │   ├── folderId: "folder_stth_finance"
  │   ├── permissions: {
  │   │   "role:moderator": ["view"],
  │   │   "role:admin": ["view", "edit", "delete"],
  │   │   "company:STTH": ["view"]
  │   │ }
  │   └── ...
  │
  ├── dash_sttn_ops_daily
  │   ├── title: "STTN Daily Operations Report"
  │   ├── company: "STTN"          // Different company
  │   ├── folderId: "folder_sttn_operations"
  │   ├── createdBy: "uid9999"
  │   ├── permissions: {
  │   │   "company:STTN": ["view"]  // Only STTN users can view
  │   │ }
  │   └── ...
  │
  └── ... (other companies dashboards)
```

**Key Point:** Each dashboard must have a `company` field to ensure proper filtering and access control!

---

## 🛠️ Implementation Checklist

### Database Setup
- [ ] Create `/folders` collection
- [ ] Add `folderId` field to `/dashboards`
- [ ] Add `role` field to `/users`
- [ ] Add `assignedFolders` field to `/users`
- [ ] Create permissions rules for Firestore

### Pinia Stores
- [ ] Create `stores/permissions.ts`
  ```typescript
  // Permission checking logic
  canViewDashboard(dashboardId)
  canCreateDashboard(folderId)
  canEditDashboard(dashboardId)
  canDeleteDashboard(dashboardId)
  canManageFolders()
  canInviteUsers()
  canChangeUserRole()
  ```

### Components
- [ ] `components/PermissionGuard.vue`
  - Check permission before showing component
- [ ] `components/RoleBadge.vue`
  - Display user role indicator
- [ ] `components/FolderManager.vue`
  - Manage folders (Admin only)
- [ ] `components/UserManager.vue`
  - Manage users (Admin only)

### Pages
- [ ] `pages/dashboard/admin/users.vue`
  - User management page (Admin only)
- [ ] `pages/dashboard/admin/folders.vue`
  - Folder management page (Admin only)
- [ ] `pages/dashboard/dashboards/manage.vue`
  - Moderator dashboard management

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can view own data
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId || 
                      isAdmin();
    }
    
    // Dashboard access control
    match /dashboards/{dashboardId} {
      allow read: if hasPermission(resource, 'view');
      allow write: if hasPermission(resource, 'edit');
      allow delete: if hasPermission(resource, 'delete');
    }
    
    // Folder access
    match /folders/{folderId} {
      allow read: if isAdmin() || 
                     isModerator(resource);
      allow write: if isAdmin();
    }
  }
}
```

---

## 📚 Summary Table

| ลักษณะ | User | Moderator | Admin |
|--------|------|-----------|-------|
| **ดู Dashboard** | ✅ (ตามสิทธิ์) | ✅ (ในโฟลเดอร์) | ✅ (ทั้งหมด) |
| **สร้าง Dashboard** | ❌ | ✅ (ในโฟลเดอร์) | ✅ |
| **แก้ไข Dashboard** | ❌ | ✅ (ในโฟลเดอร์) | ✅ |
| **ลบ Dashboard** | ❌ | ✅ (ในโฟลเดอร์) | ✅ |
| **สร้าง Subfolder** | ❌ | ✅ (ในโฟลเดอร์) | ✅ |
| **แก้ไข Subfolder** | ❌ | ✅ (ในโฟลเดอร์) | ✅ |
| **ลบ Subfolder** | ❌ | ✅ (ในโฟลเดอร์) | ✅ |
| **กำหนดสิทธิ์** | ❌ | ✅ (ในโฟลเดอร์) | ✅ |
| **สร้าง Folder** | ❌ | ❌ | ✅ |
| **จัดการ Folder** | ❌ | ❌ | ✅ |
| **แก้ไข User Profile** | ❌ | ❌ | ✅ |
| **เชิญ User** | ❌ | ❌ | ✅ |
| **ลบ User** | ❌ | ❌ | ✅ |
| **เปลี่ยน Role** | ❌ | ❌ | ✅ |
| **ดู Activity Log** | ❌ | ❌ | ✅ |

---

## 🎯 Next Steps

1. **Understand the hierarchy** ← You are here
2. **Design Firestore structure** (Phase 1)
3. **Create Pinia permission store** (Phase 1)
4. **Build UI components** (Phase 2)
5. **Implement role-based features** (Phase 2-3)
6. **Test all scenarios** (Phase 5)

**ข้อมูลนี้ชัดเจนไหม? มีคำถามไหม?** 🤔
