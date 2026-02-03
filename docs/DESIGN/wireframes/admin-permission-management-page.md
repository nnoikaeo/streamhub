# Admin Permission Management Page - Wireframe

> **Purpose:** Centralized admin panel for managing all dashboard & folder permissions  
> **Target User:** Admins managing 3-layer access control (Direct, Company-Scoped, Restrictions)  
> **Navigation Model:** Sidebar Navigation + Full 3-Layer Permission Editor  
> **Last Updated:** 2024-02-03  

---

## 🎯 Key Principle

**📌 Admin Panel = Dedicated space for complex permission management**
- Separate from Discover page (not cluttered)
- Full 3-layer UI visible and editable
- Admin-only access with audit trail
- Support for bulk operations and complex rules

---

## 📐 Page Layout (Admin Dashboard)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STREAMHUB ADMIN PANEL                                 │
├──────────────────────┬───────────────────────────────────────────────────┤
│                      │                                                    │
│  LEFT PANE:          │      RIGHT PANE:                                 │
│  ADMIN SIDEBAR       │      PERMISSION EDITOR                           │
│  (Navigation Menu)   │                                                    │
│                      │  ┌──────────────────────────────────────────────┐
│  🏠 Dashboard        │  │ MANAGE ACCESS: Sales East Performance         │
│  📋 Folders          │  │ 📊 Dashboard (Owner: John)                   │
│  👥 Users            │  │                                              │
│  ✏️  Roles           │  ├──────────────────────────────────────────────┤
│  🔐 Permissions      │  │ LAYER 1: DIRECT ACCESS                      │
│  ├─ Direct Access    │  │                                              │
│  ├─ Company-Scoped   │  │ [✓] Users: [+]                              │
│  └─ Restrictions     │  │    ├─ somchai (uid) [Delete]               │
│                      │  │    ├─ nattha (uid) [Delete]                │
│  📊 Reports          │  │    └─ [+ Add More Users]                   │
│  📅 Audit Log        │  │                                              │
│                      │  │ [✓] Roles: [+]                              │
│  [User Profile]      │  │    ├─ moderator [Delete]                  │
│  [Logout]            │  │    └─ [+ Add More Roles]                   │
│                      │  │                                              │
│                      │  │ [✓] Groups: [+]                             │
│                      │  │    ├─ sales [Delete]                       │
│                      │  │    ├─ finance [Delete]                     │
│                      │  │    └─ [+ Add More Groups]                  │
│                      │  │                                              │
│                      │  ├──────────────────────────────────────────────┤
│                      │  │ LAYER 2: COMPANY-SCOPED ACCESS              │
│                      │  │                                              │
│                      │  │ Company: [STTH ▼]  [+ Add Company]          │
│                      │  │                                              │
│                      │  │ 📌 STTH Company Settings:                   │
│                      │  │                                              │
│                      │  │ Roles (can access this dashboard):          │
│                      │  │ ☑️ user        ☐ moderator    ☐ admin      │
│                      │  │                                              │
│                      │  │ Groups (can access this dashboard):         │
│                      │  │ ☑️ sales       ☑️ finance      ☐ operations │
│                      │  │                                              │
│                      │  ├─ Company: [Other Co ▼]                      │
│                      │  │                                              │
│                      │  │ 📌 Other Co Company Settings:                │
│                      │  │                                              │
│                      │  │ Roles:                                       │
│                      │  │ ☑️ user        ☐ moderator    ☐ admin      │
│                      │  │                                              │
│                      │  │ Groups:                                      │
│                      │  │ ☐ sales       ☐ finance      ☐ operations │
│                      │  │                                              │
│                      │  ├──────────────────────────────────────────────┤
│                      │  │ LAYER 3: RESTRICTIONS (DENY)                 │
│                      │  │                                              │
│                      │  │ [✓] Revoked Access: [+]                     │
│                      │  │    ├─ teerak (uid) [Restore]               │
│                      │  │    └─ [+ Revoke More Users]                │
│                      │  │                                              │
│                      │  │ [✓] Expiry Dates: [+]                       │
│                      │  │    ├─ somchai (uid) - Expires: 2024-03-15  │
│                      │  │    │  [Edit] [Remove]                       │
│                      │  │    ├─ nattha (uid) - Expires: 2024-04-01   │
│                      │  │    │  [Edit] [Remove]                       │
│                      │  │    └─ [+ Add Expiry Date]                   │
│                      │  │                                              │
│                      │  ├──────────────────────────────────────────────┤
│                      │  │ [💾 Save Changes] [↻ Reset] [🗑️ Delete Dashboard] │
│                      │  │                                              │
│                      │  └──────────────────────────────────────────────┘
│                      │                                                    │
└──────────────────────┴───────────────────────────────────────────────────┘
```

---

## 📋 Left Sidebar (Admin Navigation)

```
┌─────────────────────────────────────┐
│        ADMIN PANEL MENU             │
├─────────────────────────────────────┤
│                                     │
│ 🏠 Home                             │
│                                     │
│ ━━━━ MANAGEMENT ━━━━               │
│ 📊 Dashboards                       │
│    Search: [🔍         ]            │
│    [Sales East Perf.] ← CURRENT    │
│    [Finance Summary]                │
│    [Budget Report]                  │
│    [View All Dashboards]            │
│                                     │
│ 📋 Folders                          │
│    [Sales]                          │
│    [Finance]                        │
│    [View All Folders]               │
│                                     │
│ 👥 Users                            │
│    [Manage Users & Roles]           │
│                                     │
│ ✏️  Roles & Permissions             │
│    [Manage Roles]                   │
│    [View Permissions]               │
│                                     │
│ ━━━ SETTINGS ━━━                   │
│ 🏢 Companies                        │
│    [Add/Edit Companies]             │
│                                     │
│ 🔐 Access Control Settings          │
│    [Security Settings]              │
│                                     │
│ 📊 Reports & Audit                  │
│    [View Access Reports]            │
│    [Audit Log]                      │
│    [Permission Changes Log]         │
│                                     │
│ ━━━ PROFILE ━━━                    │
│ 👤 John (Admin)                     │
│ [Account Settings]                  │
│ [Logout]                            │
│                                     │
└─────────────────────────────────────┘

Features:
✅ Quick search dashboard list
✅ Navigation to all admin functions
✅ Clear section separation
✅ Audit trail access
✅ User profile section
```

---

## 📊 Right Main Area (Permission Editor)

### **Header Section**

```
┌──────────────────────────────────────────────────────────────────┐
│ MANAGE ACCESS: Sales East Performance                            │
│                                                                  │
│ 📊 Dashboard (Type: Sales)                                       │
│ Owner: John (Moderator)                                          │
│ Created: 2024-01-15                                              │
│ Last Modified: 2024-02-01                                        │
│                                                                  │
│ Current Access: 4 users + 3 groups (multiple layers)             │
└──────────────────────────────────────────────────────────────────┘

Shows:
- Dashboard name & type
- Owner information
- Dashboard creation/modified dates
- Quick stats on current access
```

---

### **Layer 1: Direct Access (Standalone Users/Roles/Groups)**

```
┌──────────────────────────────────────────────────────────────────┐
│ ✅ LAYER 1: DIRECT ACCESS (Immediate, No Company Requirement)   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Users with direct access:                                        │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [+] Add User    (Grant direct access to specific user)     │ │
│ │                                                            │ │
│ │ ✓ somchai (uid: user@company.com)                          │ │
│ │   └─ Granted: 2024-01-20 by Admin                          │ │
│ │   └─ [Details] [Edit] [Delete]                            │ │
│ │                                                            │ │
│ │ ✓ nattha (uid: nattha@company.com)                         │ │
│ │   └─ Granted: 2024-01-25 by Admin                          │ │
│ │   └─ [Details] [Edit] [Delete]                            │ │
│ │                                                            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Roles with direct access:                                        │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [+] Add Role    (Any user with this role can access)       │ │
│ │                                                            │ │
│ │ ✓ moderator                                               │ │
│ │   └─ Granted: 2024-01-20 by Admin                          │ │
│ │   └─ [Details] [Edit] [Delete]                            │ │
│ │   └─ Applies to: 5 users in system                         │ │
│ │                                                            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Groups with direct access:                                       │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [+] Add Group   (Any user in this group can access)        │ │
│ │                                                            │ │
│ │ ✓ sales                                                   │ │
│ │   └─ Granted: 2024-01-15 by Admin                          │ │
│ │   └─ [Details] [Edit] [Delete]                            │ │
│ │   └─ Members: 12 users                                     │ │
│ │                                                            │ │
│ │ ✓ finance                                                 │ │
│ │   └─ Granted: 2024-01-18 by Admin                          │ │
│ │   └─ [Details] [Edit] [Delete]                            │ │
│ │   └─ Members: 8 users                                      │ │
│ │                                                            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Logic: (user_uid OR user_role OR user_group) = Access Granted   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### **Layer 2: Company-Scoped Access (Company + Role/Group)**

```
┌──────────────────────────────────────────────────────────────────┐
│ ✅ LAYER 2: COMPANY-SCOPED ACCESS (Company + Role OR Group)      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Company: [STTH ▼]  [+ Add Another Company]                      │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ STTH Company Access Settings                              │ │
│ │                                                            │ │
│ │ Users in STTH who CAN access:                             │ │
│ │ [All with these roles/groups]                             │ │
│ │                                                            │ │
│ │ Roles in STTH:                                             │ │
│ │ ☑️ user        (✓ Can access)                              │ │
│ │ ☑️ moderator   (✓ Can access)                              │ │
│ │ ☐ admin        (✗ Cannot access)                           │ │
│ │                                                            │ │
│ │ Groups in STTH:                                            │ │
│ │ ☑️ sales       (✓ Can access) - 12 members                │ │
│ │ ☑️ finance     (✓ Can access) - 8 members                 │ │
│ │ ☐ operations   (✗ Cannot access) - 5 members              │ │
│ │ ☐ hr           (✗ Cannot access) - 3 members              │ │
│ │                                                            │ │
│ │ Summary: 27 users in STTH can access this dashboard        │ │
│ │ [View matching users] [Edit settings]                     │ │
│ │                                                            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Company: [Other Co ▼]                                            │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Other Co Company Access Settings                          │ │
│ │                                                            │ │
│ │ Roles in Other Co:                                         │ │
│ │ ☑️ user        (✓ Can access)                              │ │
│ │ ☐ moderator   (✗ Cannot access)                           │ │
│ │ ☐ admin        (✗ Cannot access)                           │ │
│ │                                                            │ │
│ │ Groups in Other Co:                                        │ │
│ │ ☐ sales       (✗ Cannot access)                           │ │
│ │ ☐ finance     (✗ Cannot access)                           │ │
│ │                                                            │ │
│ │ Summary: 5 users in Other Co can access this dashboard     │ │
│ │ [View matching users] [Edit settings]                     │ │
│ │                                                            │ │
│ │ [Delete this company access] [+ Add Company]              │ │
│ │                                                            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Logic: (company + (role OR group)) = Access Granted             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### **Layer 3: Restrictions (Explicit Deny & Expiry)**

```
┌──────────────────────────────────────────────────────────────────┐
│ ❌ LAYER 3: RESTRICTIONS (Explicit Deny + Time-Based Revocation) │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Revoked Access (Explicit Deny):                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [+] Revoke User Access                                    │ │
│ │                                                            │ │
│ │ ✗ teerak (uid)                                             │ │
│ │   └─ Revoked: 2024-01-30 by Admin                          │ │
│ │   └─ Reason: "Left company - request from HR"              │ │
│ │   └─ [Restore] [Delete]                                   │ │
│ │                                                            │ │
│ │ ✗ janine (uid)                                             │ │
│ │   └─ Revoked: 2024-02-01 by Admin                          │ │
│ │   └─ Reason: "Role changed"                                │ │
│ │   └─ [Restore] [Delete]                                   │ │
│ │                                                            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Time-Based Expiry:                                               │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ [+] Add Expiry Date    (Temporary access)                 │ │
│ │                                                            │ │
│ │ ⏰ somchai (uid)                                            │ │
│ │   └─ Expires: 2024-03-15 (40 days remaining)              │ │
│ │   └─ Granted as: Direct access (temp)                     │ │
│ │   └─ [Edit expiry] [Extend] [Remove]                      │ │
│ │                                                            │ │
│ │ ⏰ nattha (uid)                                             │ │
│ │   └─ Expires: 2024-04-01 (59 days remaining)              │ │
│ │   └─ Granted as: Group member (finance)                   │ │
│ │   └─ [Edit expiry] [Extend] [Remove]                      │ │
│ │                                                            │ │
│ │ ⏰ finance group                                            │ │
│ │   └─ Expires: 2024-05-20 (107 days remaining)             │ │
│ │   └─ Affects: 8 members in STTH                            │ │
│ │   └─ [Edit expiry] [Extend] [Remove]                      │ │
│ │                                                            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Logic: (revoked OR expired) = Access Denied                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Action Buttons

```
At bottom of permission editor:

[💾 Save Changes]      - Save all modifications to dashboard access
                         Shows: "Updating permissions..." then success message
                         
[↻ Reset]              - Discard changes and reload from database
                         Asks: "Discard unsaved changes?"
                         
[🗑️ Delete Dashboard]  - Delete this dashboard entirely
                         Asks: "Are you sure? This cannot be undone."
                         Forces confirmation with password

[📋 Change Log]        - View history of permission changes
                         Shows: Who changed what and when
                         
[👁️ Preview Access]    - See which users actually have access now
                         Shows: Expanded list of all users + source (Layer 1/2/3)
```

---

## 🔄 Admin Workflows

### **Workflow 1: Grant Direct Access to User**

```
Admin clicks [+ Add User] in Layer 1
       │
       ▼
Modal opens: "Grant Direct Access"
├─ Search user: [somchai...]
├─ Select: somchai (user@company.com)
├─ [Grant Access]
       │
       ▼
User added to Layer 1: Users list
├─ ✓ somchai
└─ [Delete]
       │
       ▼
Admin clicks [Save Changes]
       │
       ▼
✅ Permission saved to Firestore
```

---

### **Workflow 2: Set Company-Wide Role Access**

```
Admin navigates to: Layer 2 - STTH Company
       │
       ▼
Checks "moderator" role checkbox
├─ Before: ☐ moderator (unchecked)
├─ After: ☑️ moderator (checked)
       │
       ▼
System shows: "5 moderators in STTH will get access"
       │
       ▼
Admin clicks [Save Changes]
       │
       ▼
✅ All moderators in STTH can now access dashboard
```

---

### **Workflow 3: Revoke Temporary Access**

```
Admin sees in Layer 3 - Expiry Dates:
├─ ⏰ somchai expires 2024-03-15 (temp access)
│
Admin clicks [Edit expiry]
│
Modal opens:
├─ Current expiry: 2024-03-15
├─ Options:
│  ├─ ☑️ Extend (new date: [2024-04-15])
│  ├─ ☐ Remove expiry (permanent access)
│  ├─ ☐ Revoke access (explicit deny)
│
Admin selects: [Remove expiry] → Permanent access
│
[Save]
│
✅ somchai now has permanent access
```

---

### **Workflow 4: Bulk Add Group Access**

```
Admin navigates to: Layer 2 - STTH Company
│
Checks multiple groups:
├─ ☑️ sales
├─ ☑️ finance
├─ ☑️ operations
│
System shows: "25 users total (12 sales + 8 finance + 5 operations)"
│
Admin clicks [Save Changes]
│
✅ All members of these groups can access dashboard
```

---

### **Workflow 5: Temporarily Restrict User (During Investigation)**

```
Admin needs to block somchai temporarily
│
Admin clicks [+] in Layer 3 - Revoked Access
│
Modal opens: "Revoke Access"
├─ User: [somchai ▼]
├─ Reason: [Investigation ongoing...]
├─ [Revoke]
│
✅ somchai cannot access, even if in direct/layer2
│
Later, admin restores:
├─ Clicks [Restore] next to somchai
│
✅ Access restored
```

---

## 📊 Examples

### **Example 1: Public Dashboard (Wide Access)**

```
Layer 1 (Direct):
├─ Roles: [moderator] ✓

Layer 2 (Company-Scoped):
├─ STTH:
│  ├─ Roles: [user, moderator] ✓
│  └─ Groups: [sales, finance] ✓
├─ Other Co:
│  └─ Roles: [user] ✓

Layer 3 (Restrictions):
├─ Revoked: [none]
├─ Expiry: [none]

Result:
✅ All users in any company with "user" role
✅ All moderators anywhere
✅ All members of sales/finance groups in STTH
📊 Total accessible: ~50 users across 2 companies
```

---

### **Example 2: Restricted Dashboard (Admin Only)**

```
Layer 1 (Direct):
├─ Users: [john_admin] ✓
├─ Roles: [admin] ✓
├─ Groups: [none]

Layer 2 (Company-Scoped):
├─ STTH:
│  ├─ Roles: [admin] ✓
│  └─ Groups: [none]
├─ Other Co: [none]

Layer 3 (Restrictions):
├─ Revoked: [none]
├─ Expiry: [none]

Result:
✅ Admin users only
📊 Total accessible: 2-3 users (admins)
```

---

### **Example 3: Temporary Project Access**

```
Layer 1 (Direct):
├─ Groups: [project_team] ✓ (Expires: 2024-06-30)

Layer 2 (Company-Scoped):
├─ STTH:
│  └─ Roles: [none]

Layer 3 (Restrictions):
├─ Revoked: [none]
├─ Expiry: [project_team - 2024-06-30 (120 days)]

Result:
✅ All members of project_team can access
⏰ Expires 2024-06-30 (project end date)
📊 Total accessible: 8 users (during project)
```

---

## 🔐 Permission Checking Logic (Admin Panel)

### **When Admin Views Dashboard Permissions:**

```javascript
function loadDashboardPermissions(dashboardId) {
  // 1. Load dashboard doc
  const dashboard = getFromFirestore(`dashboards/${dashboardId}`)
  
  // 2. Extract 3 layers
  const layer1_direct = dashboard.access.direct
  const layer2_company = dashboard.access.company
  const layer3_restrictions = dashboard.restrictions
  
  // 3. For preview [Who actually has access]:
  const allUsers = getAllUsersInSystem()
  const accessibleUsers = allUsers.filter(user => {
    // Layer 1: Direct (OR logic)
    if (user.uid in layer1_direct.users) return true
    if (user.role in layer1_direct.roles) return true
    if (userGroups.some(g => g in layer1_direct.groups)) return true
    
    // Layer 2: Company-scoped (AND logic)
    if (layer2_company[user.company]) {
      const company = layer2_company[user.company]
      if (user.role in company.roles) return true
      if (userGroups.some(g => g in company.groups)) return true
    }
    
    // Layer 3: Restrictions (Deny)
    if (user.uid in layer3_restrictions.revoke) return false
    if (user.uid in layer3_restrictions.expiry) {
      if (isExpired(layer3_restrictions.expiry[user.uid])) return false
    }
    
    return false
  })
  
  return {
    layer1: layer1_direct,
    layer2: layer2_company,
    layer3: layer3_restrictions,
    preview: accessibleUsers
  }
}
```

---

## 🎨 Component Breakdown

### **1. Permission Layer Accordion**

Each layer can be expanded/collapsed:
- Layer 1 (Direct) - Expanded by default
- Layer 2 (Company-Scoped) - Collapsed by default
- Layer 3 (Restrictions) - Collapsed by default

User can click to expand/collapse any layer.

---

### **2. Permission Item Component**

```
┌────────────────────────────────────┐
│ ✓ somchai (uid)                    │
│   └─ Granted: 2024-01-20 by Admin  │
│   └─ [Details] [Edit] [Delete]     │
└────────────────────────────────────┘

Shows:
- Item type (user/role/group)
- Item name
- Metadata (granted date, granted by)
- Actions
```

---

### **3. Company Permissions Panel**

```
Company: [STTH ▼]

Roles checklist:
☑️ user        ☐ moderator    ☐ admin

Groups checklist:
☑️ sales       ☑️ finance      ☐ operations
```

---

### **4. Action Dialogs**

- "Add User" modal
- "Add Role" modal
- "Add Group" modal
- "Revoke User" modal
- "Set Expiry" modal
- Confirmation dialogs

---

## 📱 Responsive Design

- **Desktop (> 1024px):** Full sidebar + full editor
- **Tablet (768-1024px):** Collapsible sidebar + editor
- **Mobile (< 768px):** Not recommended (too complex)

---

## 🔧 Implementation Checklist

### **Components Needed**

- [ ] `AdminPanel.vue` - Main admin layout
- [ ] `AdminSidebar.vue` - Navigation menu
- [ ] `PermissionEditor.vue` - Main permission editor
- [ ] `Layer1Direct.vue` - Direct access section
- [ ] `Layer2CompanyScoped.vue` - Company-scoped section
- [ ] `Layer3Restrictions.vue` - Restrictions section
- [ ] `PermissionItem.vue` - Individual permission item
- [ ] `CompanyAccessCard.vue` - Company settings card
- [ ] `AddUserModal.vue` - Add user dialog
- [ ] `PermissionPreview.vue` - Who actually has access
- [ ] `AuditLog.vue` - Change history

### **Functions Needed**

- [ ] `loadDashboardPermissions(dashboardId)`
- [ ] `saveDashboardPermissions(dashboardId, permissions)`
- [ ] `addDirectAccess(dashboardId, type, value)` - Add user/role/group
- [ ] `removeDirectAccess(dashboardId, type, value)` - Remove access
- [ ] `setCompanyRoleAccess(dashboardId, company, role, granted)`
- [ ] `setCompanyGroupAccess(dashboardId, company, group, granted)`
- [ ] `revokeAccess(dashboardId, userId, reason)`
- [ ] `restoreAccess(dashboardId, userId)`
- [ ] `setExpiryDate(dashboardId, userId/groupId, expiryDate)`
- [ ] `calculateAccessibleUsers(dashboard)` - For preview
- [ ] `getAuditLog(dashboardId)` - Change history

---

## 📚 Related Documents

- [Roles & Permissions Guide](../GUIDES/roles-and-permissions.md) - Complete permission logic
- [Dashboard Discover Page](./dashboard-discover-page.md) - User browse view
- [Moderator Quick Share Dialog](./moderator-quick-share-dialog.md) - Quick share for moderators
- [Database Schema](../GUIDES/database-schema.md) - Permission data structure

---

**Created:** 2024-02-03  
**Version:** 1.0 (Admin Panel - Full 3-Layer Permission Management)  
**Designer:** Development Team  
**Role:** Admin Only
