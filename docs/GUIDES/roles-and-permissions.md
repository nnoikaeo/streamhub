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
👤 User: "สมชาย" (Sales Department)
├── Department: Sales
├── Role: User
└── Can view:
    ├── Sales Dashboard (shared to dept)
    ├── Company Overview (shared to all)
    └── My Performance (shared individually)

But CANNOT:
├── Edit Sales Dashboard
├── Create new dashboard
├── Add users
└── Manage folders
```

**Use Case:**
- 📱 ตัวแทนขาย (Sales Rep)
- 💰 Staff บัญชี (Accounting Staff)
- 👥 เจ้าหน้าที่ HR (HR Officer)
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
👤 User: "นายหา" (Sales Department)
├── Department: Sales
├── Role: Moderator
├── Assigned Folders: ["Sales", "Reports"]
└── Can:
    ├── ✅ View all dashboards (in Sales folder)
    ├── ✅ Create new subfolder in Sales folder
    ├── ✅ Edit subfolder in Sales folder
    ├── ✅ Delete subfolder in Sales folder
    ├── ✅ Set permissions for subfolder in Sales folder
    ├── ✅ Create new dashboard in Sales folder
    ├── ✅ Edit Sales Dashboard
    ├── ✅ Delete Sales Dashboard
    ├── ✅ Set permissions for Sales Dashboard
    ├── ❌ Access Finance folder
    ├── ❌ Create Finance Dashboard
    └── ❌ Invite new users
```

**Use Case:**
- 🏢 หัวหน้าแผนก (Department Head)
- 📊 Data Analyst
- 📈 Report Manager
- 💼 Team Lead

---

### 3️⃣ ADMIN (สิทธิ์สูงสุด)

**คำจำกัดความ:** ผู้บริหาร IT/ระบบ ที่สามารถจัดการทุกสิ่งในระบบ

**สิทธิ์:**
- ✅ **ดู Dashboard ทั้งหมด**
- ✅ **สร้าง/แก้ไข/ลบ Dashboard** (ทุก Folder)
- ✅ **กำหนดสิทธิ์ Dashboard** (ทุกอย่าง)
- ✅ **สร้าง Folder ใหม่**
- ✅ **แก้ไข/ลบ Folder**
- ✅ **กำหนดสิทธิ์ Folder** ให้ Moderator
- ✅ **เชิญ User ใหม่**
- ✅ **แก้ไข User** (ชื่อ, Email, Profile)
- ✅ **เปลี่ยน Role User** (User → Moderator → Admin)
- ✅ **ลบ User**
- ✅ **ดู Activity Logs** (ทั้งระบบ)
- ✅ **ดู System Settings**
- ✅ **ดู Usage Analytics**

**ตัวอย่าง:**
```
👤 User: "เจ้านาย" (Admin)
├── Department: IT/Management
├── Role: Admin
├── Access: All folders and users
└── Can:
    ├── ✅ Create new folders
    ├── ✅ Assign folders to Moderators
    ├── ✅ Invite new users
    ├── ✅ Delete users
    ├── ✅ Change any user role
    ├── ✅ View all dashboards
    ├── ✅ Create dashboard anywhere
    ├── ✅ Edit any dashboard
    ├── ✅ Set any permissions
    ├── ✅ View activity logs
    └── ✅ Configure system settings
```

**Use Case:**
- 👨‍💼 IT Administrator
- 👨‍💻 System Manager
- 📊 CTO / Technical Lead
- 🔐 Security Officer

---

## 📋 Permission Matrix

```
┌──────────────────────┬────────┬──────────┬─────────┐
│ Feature              │ User   │ Moderator│ Admin   │
├──────────────────────┼────────┼──────────┼─────────┤
│ View Dashboard       │   ✅   │    ✅    │   ✅    │
│ Create Dashboard     │   ❌   │  ✅ (*)  │   ✅    │
│ Edit Dashboard       │   ❌   │  ✅ (*)  │   ✅    │
│ Delete Dashboard     │   ❌   │  ✅ (*)  │   ✅    │
│ Set Dashboard Perms  │   ❌   │  ✅ (*)  │   ✅    │
│ Create Subfolder     │   ❌   │  ✅ (*)  │   ✅    │
│ Edit Subfolder       │   ❌   │  ✅ (*)  │   ✅    │
│ Delete Subfolder     │   ❌   │  ✅ (*)  │   ✅    │
│ Set Subfolder Perms  │   ❌   │  ✅ (*)  │   ✅    │
│ Create Folder        │   ❌   │    ❌    │   ✅    │
│ Edit Folder          │   ❌   │    ❌    │   ✅    │
│ Delete Folder        │   ❌   │    ❌    │   ✅    │
│ Set Folder Perms     │   ❌   │    ❌    │   ✅    │
│ Invite User          │   ❌   │    ❌    │   ✅    │
│ Edit User Profile    │   ❌   │    ❌    │   ✅    │
│ Change User Role     │   ❌   │    ❌    │   ✅    │
│ Delete User          │   ❌   │    ❌    │   ✅    │
│ View Activity Log    │   ❌   │    ❌    │   ✅    │
│ View System Settings │   ❌   │    ❌    │   ✅    │
└──────────────────────┴────────┴──────────┴─────────┘

(*) = Only in assigned folders
```

---

## 🗂️ Folder-Based Access Control

### What is Folder?

**Folder** คือการจัดกลุ่ม Dashboards สำหรับแต่ละแผนก:

```
Folders (created by Admin)
├── Sales
│   ├── Sales Dashboard
│   ├── Revenue Report
│   └── Customer Analytics
├── Finance
│   ├── Budget vs Actual
│   ├── Cash Flow
│   └── Financial Reporting
├── HR
│   ├── Employee Analytics
│   ├── Leave Management
│   └── Salary Report
├── Engineer
│   ├── Project Status
│   ├── Sprint Analytics
│   └── Code Quality
└── Audit
    ├── Compliance Report
    ├── Risk Assessment
    └── Internal Audit
```

### Admin assigns Folders to Moderators:

```
👤 Admin (เจ้านาย)
  ├── Creates Folder: "Sales"
  ├── Assigns Folder to: สมชาย (Sales Moderator)
  │
  └── Creates Folder: "Finance"
      └── Assigns Folder to: นางสาว ก. (Finance Moderator)

👤 Moderator: สมชาย (Sales)
  ├── Assigned Folder: Sales
  ├── Can manage:
  │   ├── Create/Edit/Delete dashboards in Sales folder
  │   ├── Set permissions for Sales dashboards
  │   └── View all dashboards in Sales folder
  └── Cannot:
      ├── Access Finance folder
      ├── Create folders
      └── Manage other departments
```

---

## 🔄 Typical Workflow

### Scenario 1: Adding New Dashboard

```
1. Admin (เจ้านาย) creates Folder "Sales"
2. Admin assigns "Sales" folder to สมชาย (Moderator)
3. สมชาย logs in → sees "Sales" folder assigned
4. สมชาย creates "Monthly Sales Report" in Sales folder
5. สมชาย sets permissions:
   - Sales Users: View only
   - Sales Moderators (สมชาย): Edit
   - Admin: Full access
6. Sales Users can now view the dashboard
```

### Scenario 2: User Requests Dashboard Access

```
1. สุนัย (User) needs access to Sales Dashboard
2. สุนัย asks สมชาย (Sales Moderator)
3. สมชาย updates dashboard permissions:
   - Add: uid:sunai → view
4. สุนัย now sees dashboard in their list
```

### Scenario 3: Promoting Moderator to Admin

```
1. เจ้านาย (Admin) decides to promote สมชาย
2. เจ้านาย goes to User Management
3. Changes สมชาย's role: User → Admin
4. สมชาย now has full system access
```

---

## 🔐 Database Structure

### Users Collection

```firestore
/users
  ├── uid1234
  │   ├── email: "somchai@streamwash.com"
  │   ├── displayName: "สมชาย"
  │   ├── photoURL: "https://..."
  │   ├── role: "moderator"  // "user" | "moderator" | "admin"
  │   ├── department: "sales"
  │   ├── assignedFolders: ["sales", "reports"]  // Moderator only
  │   ├── createdAt: 2024-01-21
  │   └── isActive: true
  │
  ├── uid5678
  │   ├── email: "manager@streamwash.com"
  │   ├── displayName: "เจ้านาย"
  │   ├── role: "admin"
  │   ├── assignedFolders: [] // Admin has access to all
  │   └── ...
  │
  └── uid9012
      ├── email: "user@streamwash.com"
      ├── displayName: "สุนัย"
      ├── role: "user"
      ├── assignedFolders: [] // User doesn't use this
      └── ...
```

### Folders Collection

```firestore
/folders
  ├── folder_sales
  │   ├── name: "Sales"
  │   ├── description: "Sales Department Dashboards"
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
  │         id: "subfolder_sales_monthly",
  │         name: "Monthly Reports",
  │         createdBy: "uid1234",
  │         permissions: {...}
  │       },
  │       {
  │         id: "subfolder_sales_quarterly",
  │         name: "Quarterly Reports",
  │         createdBy: "uid1234",
  │         permissions: {...}
  │       }
  │     ]
  │
  └── folder_finance
      ├── name: "Finance"
      ├── assignedModerators: [
      │   {
      │     userId: "uid5678",
      │     name: "นางสาว ก."
      │   }
      │ ]
      └── subfolders: [
          {
            id: "subfolder_finance_budget",
            name: "Budget Planning",
            createdBy: "uid5678",
            permissions: {...}
          }
        ]
```

### Dashboards Collection

```firestore
/dashboards
  ├── dash_sales_monthly
  │   ├── title: "Sales Monthly Report"
  │   ├── description: "Monthly sales performance"
  │   ├── folderId: "folder_sales"
  │   ├── lookerUrl: "https://lookerstudio.google.com/..."
  │   ├── createdBy: "uid1234"
  │   ├── permissions: {
  │   │   "role:user": ["view"],
  │   │   "role:moderator": ["view", "edit"],
  │   │   "role:admin": ["view", "edit", "delete"],
  │   │   "uid:1234": ["view", "edit", "delete"],  // Owner
  │   │   "department:sales": ["view"]
  │   │ }
  │   ├── createdAt: 2024-01-21
  │   └── updatedAt: 2024-01-21
  │
  └── dash_finance_budget
      ├── title: "Budget vs Actual"
      ├── folderId: "folder_finance"
      ├── permissions: {
      │   "role:moderator": ["view"],
      │   "role:admin": ["view", "edit", "delete"],
      │   "department:finance": ["view"]
      │ }
      └── ...
```

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
