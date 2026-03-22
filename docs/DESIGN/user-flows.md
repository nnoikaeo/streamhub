# User Flow Diagrams

> **Document Status:** UI/UX Design Document  
> **Last Updated:** 2026-03-22 (v2.0)
> **Document Owner:** Development Team

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [USER Role Flow](#user-role-flow)
3. [MODERATOR Role Flow](#moderator-role-flow)
4. [ADMIN Role Flow](#admin-role-flow)
5. [Authentication Flow](#authentication-flow)
6. [Invitation Acceptance Flow](#invitation-acceptance-flow)
7. [Company Switching Flow](#company-switching-flow)
8. [Permission Denied Scenarios](#permission-denied-scenarios)

---

## 🎯 Overview

This document outlines the user flows for StreamHub Dashboard Management System across three roles:

- **USER**: View-only access to assigned dashboards
- **MODERATOR**: Create and manage folders, create/edit dashboards in assigned folders
- **ADMIN**: Full system access including company, user, and permission management

**Key Principles:**
- All users must authenticate via Google OAuth
- Access is permission-based (not company-based for resources)
- Admins have global cross-company access
- Users see dashboards based on **3-layer permission model** (see [Roles & Permissions Guide > Permission Structure](../GUIDES/roles-and-permissions.md#-permission-structure))
- Moderators manage folders via `assignedFolders` array
- **Moderators have 2 views:** Viewer mode (like User) and Manager mode (like limited Admin) — see [Moderator Dual-View Model](../GUIDES/roles-and-permissions.md#-moderator-dual-view-model)
- **Tag system** provides cross-cutting dashboard categorization — Folder = physical location, Tag = logical grouping
- All roles can **filter dashboards by tags** via the "View All" page
- Sidebar navigation is **role-based** — see [Sidebar Navigation Wireframe](wireframes/sidebar-navigation.md)

**📌 Note:** For complete permission structure details, access logic, and Firestore security rules, refer to [Roles & Permissions Guide](../GUIDES/roles-and-permissions.md) - the single source of truth for all role and permission definitions.

---

## 👤 USER Role Flow

A regular user (Employee) can view dashboards within their company and those shared with them.

```
┌─────────────┐
│   START     │
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  StreamHub Login Page   │
│  (app/pages/login.vue)  │
└──────┬──────────────────┘
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
  ┌─────────┐          ┌──────────────┐
  │ Already │          │ Not logged   │
  │ Logged  │          │ in (OAuth)   │
  │  In?    │          │  Required    │
  └────┬────┘          └──────┬───────┘
       │                      │
       │ YES                  │ AUTHENTICATE
       │                      ▼
       │              ┌──────────────────────┐
       │              │ Google OAuth Login   │
       │              │ (Firebase Auth)      │
       │              └──────┬───────────────┘
       │                     │
       │    ┌────────────────┘
       │    │
       ▼    ▼
┌──────────────────────────┐
│  Load User Profile       │
│  - email                 │
│  - displayName           │
│  - role: "user"          │
│  - company: "STTH"       │
│  - permissions           │
└──────┬───────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│  Sidebar Navigation (User)                              │
│                                                         │
│  ▾ Dashboard                                            │
│    ├ View All   → /dashboard/discover?view=all          │
│    └ Search     → /dashboard/discover?mode=search       │
│                                                         │
│  (No Admin menu, No Folder Tree in sidebar)             │
└──────┬──────────────────────────────────────────────────┘
       │
       ├──── "View All" ────────────────────────────────┐
       │                                                │
       ▼                                                │
┌─────────────────────────────────────────┐             │
│  Dashboard View All Page                │             │
│  (app/pages/dashboard/discover)         │             │
│                                         │             │
│  🔍 Search dashboards...                │             │
│                                         │             │
│  Tag Filter:                            │             │
│  [Sales] [Finance] [KPI] [Monthly]      │             │
│                                         │             │
│  Folder Filter:                         │             │
│  [All Folders ▾]                        │             │
│                                         │             │
│  Dashboard list (grouped by folder):    │             │
│  ┌─ Sales ───────────────────┐          │             │
│  │ 📊 Sales Report           │          │             │
│  │ 📊 Revenue Monthly        │          │             │
│  └───────────────────────────┘          │             │
│  ┌─ Finance ─────────────────┐          │             │
│  │ 📊 Expense Report         │          │             │
│  └───────────────────────────┘          │             │
│                                         │             │
│  Lazy Load: loads 12 items at a time    │             │
│  Intersection Observer triggers next    │             │
│  batch when user scrolls to bottom      │             │
└──────┬──────────────────────────────────┘             │
       │                                                │
       │  "Search" ─────────────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│  View Dashboard      │
│  (embedded Looker)   │
│                      │
│  - Visualizations    │
│  - Reports           │
│  - Metrics           │
│  - Tags displayed    │
│    [Sales] [KPI]     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────┐
│  View Dashboard Details  │
│  - Title                 │
│  - Description           │
│  - Tags (read-only)      │
│  - Created by            │
│  - Last updated          │
│  - Refresh data          │
└──────┬───────────────────┘
       │
       ├──YES──────────────────────┐
       │                           │
       │ Feedback or Issues?       │ NO
       │                           │
       ▼                           ▼
┌────────────────────┐      ┌──────────────┐
│ Report Issue/      │      │ Back to      │
│ Leave Feedback     │      │ Dashboard    │
│ (Contact Admin)    │      │ List         │
└──────┬─────────────┘      └──────┬───────┘
       │                           │
       └─────────────┬─────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  View Profile  │
            │  - Settings    │
            │  - Preferences │
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │ Logout (Google)│
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │  Back to Login │
            │     (END)      │
            └────────────────┘
```

### USER Flow Decision Points

| Decision Point | Outcome | Next Step |
|---|---|---|
| **Has Google Account?** | ✅ Yes | Authenticate and load profile |
| | ❌ No | Show Google Sign-In button |
| **Has View Permission?** | ✅ Yes | Display dashboard in list |
| | ❌ No | Hide dashboard from list |
| **Tag filter selected?** | ✅ Yes | Show only dashboards with matching tags |
| | ❌ No (All) | Show all accessible dashboards |
| **Folder filter selected?** | ✅ Yes | Show only dashboards in selected folder |
| | ❌ No (All) | Show dashboards from all folders |
| **More dashboards to load?** | ✅ Yes | Lazy load next 12 items on scroll |
| | ❌ No | Show "all loaded" indicator |
| **Expired Session?** | ✅ Yes | Refresh token / Re-authenticate |
| | ❌ No | Continue using app |

**📝 Note:** Permission checking uses 3-layer model (direct, company-scoped, restrictions). See [Roles & Permissions Guide > Access Logic](../GUIDES/roles-and-permissions.md#-access-logic) for details.

---

## 👨‍💼 MODERATOR Role Flow (Dual-View Model)

A moderator (Team Lead) has **2 views**: Viewer mode and Manager mode.
See [Moderator Dual-View Model](../GUIDES/roles-and-permissions.md#-moderator-dual-view-model) for permission details.

```
┌──────────────────────┐
│   START (Browser)    │
│  Moderator Login     │
└──────┬───────────────┘
       │
       ▼
┌────────────────────────────┐
│ Authentication Flow        │
│ (Same as USER flow)        │
│ role: "moderator"          │
│ company: "STTH"            │
└──────┬─────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Sidebar Navigation (Moderator)                      │
│                                                      │
│  ▾ Dashboard           ← View 1 (Viewer)            │
│    ├ View All                                        │
│    └ Search                                          │
│                                                      │
│  ▾ Manage Folders      ← View 2 (Manager)           │
│    ├ 📁 Sales (assigned)                             │
│    └ 📁 Finance (assigned)                           │
│                                                      │
│  (No Admin menu)                                     │
└──────┬─────────────────────┬─────────────────────────┘
       │                     │
  Click "Dashboard"     Click "Manage Folders"
       │                     │
       ▼                     ▼

═══════════════════════════════════════════════════════
  VIEW 1: VIEWER MODE (Same as User)
═══════════════════════════════════════════════════════

┌─────────────────────────────────────────┐
│  Dashboard View All Page                │
│  (app/pages/dashboard/discover)         │
│                                         │
│  🔍 Search dashboards...                │
│                                         │
│  Tag Filter:                            │
│  [Sales] [Finance] [KPI] [Monthly]      │
│                                         │
│  Folder Filter:                         │
│  [All Folders ▾]                        │
│                                         │
│  Dashboard list (read-only):            │
│  - View dashboards with access          │
│  - Filter by tag (multi-select)         │
│  - Filter by folder (dropdown)          │
│  - Lazy load (12 items per batch)       │
│  - NO edit/create/delete buttons        │
│                                         │
│  Tags displayed on each card:           │
│  [Sales] [Monthly] [KPI]               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌──────────────────────┐
│  View Dashboard      │
│  (embedded Looker)   │
│  - Read-only         │
│  - Tags shown        │
│  - No edit actions   │
└──────────────────────┘

═══════════════════════════════════════════════════════
  VIEW 2: MANAGER MODE (Limited Admin)
═══════════════════════════════════════════════════════

┌─────────────────────────────────────────┐
│  Check: Is folder in assignedFolders?   │
│                                         │
│  assignedFolders = ["Sales", "Finance"] │
└──────┬───────────────┬──────────────────┘
       │               │
      YES              NO
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────────┐
│ Show Manager │  │ Show View-Only   │
│ UI (CRUD)    │  │ (like View 1)    │
└──────┬───────┘  │ 🔒 Not assigned  │
       │          └──────────────────┘
       ▼
┌─────────────────────────────────────────┐
│  Folder Management Page                 │
│  (app/pages/manage/explorer)            │
│                                         │
│  📁 Sales > Dashboard List              │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ + New Dashboard   + New Subfolder  │ │
│  └────────────────────────────────────┘ │
│                                         │
│  Subfolders:                            │
│  📁 Q1 Report  [✏️ Edit] [🗑️ Delete]   │
│  📁 Q2 Report  [✏️ Edit] [🗑️ Delete]   │
│                                         │
│  Dashboards:                            │
│  📊 Sales Report                        │
│     Tags: [Sales][Monthly][KPI]         │
│     [✏️ Edit] [🗑️ Delete] [👁️ View]    │
│                                         │
│  📊 Revenue Monthly                     │
│     Tags: [Sales][Finance]              │
│     [✏️ Edit] [🗑️ Delete] [👁️ View]    │
└──────┬──────────────────────────────────┘
       │
       ├───── Create/Edit Dashboard ──────────────┐
       │                                          │
       ▼                                          │
┌─────────────────────────────────────────┐       │
│  Dashboard Form (Create/Edit)           │       │
│                                         │       │
│  Title:       [                    ]    │       │
│  Description: [                    ]    │       │
│  Looker URL:  [https://...         ]    │       │
│                                         │       │
│  Tags:                                  │       │
│  [Sales ✕] [Monthly ✕] [+ Add tag]     │       │
│  ┌─────────────────────────────┐        │       │
│  │ Select from existing tags:  │        │       │
│  │  ○ Finance                  │        │       │
│  │  ○ KPI                      │        │       │
│  │  ○ Quarterly                │        │       │
│  │  ──────────────             │        │       │
│  │  ⚠️ Need new tag?           │        │       │
│  │  Contact Admin              │        │       │
│  └─────────────────────────────┘        │       │
│                                         │       │
│  Move to folder:                        │       │
│  [Sales ▾] (only assignedFolders)       │       │
│                                         │       │
│  Permissions: [Edit permissions...]     │       │
│                                         │       │
│  [💾 Save]  [Cancel]                    │       │
└──────┬──────────────────────────────────┘       │
       │                                          │
       └──────────────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────────┐
                  │ View Profile /    │
                  │ Settings / Logout │
                  │ (END)             │
                  └───────────────────┘
```

### MODERATOR Flow Decision Points

| Decision Point | Outcome | Next Step |
|---|---|---|
| **Which sidebar menu clicked?** | Dashboard | Enter View 1 (Viewer mode) |
| | Manage Folders | Enter View 2 (Manager mode) |
| **Folder in assignedFolders?** | ✅ Yes | Show full CRUD UI |
| | ❌ No | Show read-only (View 1 behavior) |
| **Tag filter selected? (View 1)** | ✅ Yes | Filter dashboards by tags |
| | ❌ No | Show all accessible dashboards |
| **Can edit dashboard? (View 2)** | ✅ Yes (in assigned) | Show edit/delete/tag-assign buttons |
| | ❌ No | Show view-only mode |
| **Need new tag?** | Tag exists | Select from existing tags |
| | Tag missing | Contact Admin (cannot create) |
| **Move dashboard?** | Target in assigned | Allow move |
| | Target not assigned | Block move (🔒) |

**📝 Note:** Dashboard permissions are checked using 3-layer model. See [Roles & Permissions Guide > Permission Structure](../GUIDES/roles-and-permissions.md#-dashboard-access-structure) for details.

---

## 🔑 ADMIN Role Flow

An admin (System Administrator) has full control over companies, users, folders, and dashboards.

```
┌──────────────────────┐
│   START (Browser)    │
│  Admin Login         │
└──────┬───────────────┘
       │
       ▼
┌────────────────────────────┐
│ Authentication Flow        │
│ (Same as USER flow)        │
│ role: "admin"              │
│ company: "STTH" (home)     │
│ (but global access)        │
└──────┬─────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Admin Overview Page             │
│  (app/pages/admin/overview.vue)  │
│                                 │
│  Quick Stats:                   │
│  - Total companies              │
│  - Total users                  │
│  - Total dashboards             │
│  - Recent activity              │
└──────┬──────────────────────────┘
       │
       ├─────────────────────────────────────────┐
       │                                         │
       ▼                                         │
┌─────────────────────────────┐                │
│ Navigate Admin Menu         │                │
│                             │                │
│  1. Overview                │                │
│  2. Companies               │                │
│  3. Regions & Biz Groups    │                │
│  4. User Groups             │                │
│  5. Users                   │                │
│  6. Invitations             │                │
│  7. Explorer (Folder Tree)  │                │
│  8. Dashboards              │                │
│  9. Folders                 │                │
│ 10. Tags                    │                │
└──────┬──────────────────────┘                │
       │                                       │
       ├──────────────────────────────────────┤
       │  │  │  │  │  │  │  │  │  │           │
       ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼  ▼           │
       
   ┌─────────────────────────────────────────────────────────────┐
   │ 1. COMPANIES MANAGEMENT                                     │
   │    (app/pages/admin/companies)                              │
   └─────────────────────────────────────────────────────────────┘
       │
       ▼
   ┌──────────────────────────┐
   │ View All Companies       │
   │                          │
   │ - Company code           │
   │ - Name                   │
   │ - Location               │
   │ - Employee count         │
   │ - Status (active/inactive)
   │ - Actions (edit/delete)  │
   └────────┬─────────────────┘
            │
            ├────────────────┬──────────────┐
            │                │              │
            ▼                ▼              ▼
      ┌──────────┐    ┌─────────────┐  ┌────────────┐
      │ Create   │    │ Edit        │  │ Delete     │
      │ New      │    │ Company     │  │ Company    │
      │ Company  │    │             │  │            │
      │          │    │ - Name      │  │ - Confirm  │
      │ - Code   │    │ - Location  │  │ - Cascade  │
      │ - Name   │    │ - Status    │  │   delete?  │
      │ - Loc    │    │ - Metadata  │  │            │
      │ - Meta   │    └──────┬──────┘  └──────┬─────┘
      └────┬─────┘           │                 │
           │                 │                 │
           └────────┬────────┴────────┬────────┘
                    │                 │
                    ▼                 ▼
            ┌──────────────────────────────────┐
            │ Back to Companies List           │
            │ (Changes applied)                │
            └──────┬───────────────────────────┘
                   │
                   │
   ┌────────────────────────────────────────────────────────────┐
   │ 2. USERS MANAGEMENT                                        │
   │    (app/pages/admin/users)                                 │
   └────────────────────────────────────────────────────────────┘
            │
            ▼
      ┌──────────────────────────┐
      │ View All Users           │
      │ (Filter by company)      │
      │                          │
      │ - Email                  │
      │ - Display Name           │
      │ - Role                   │
      │ - Company                │
      │ - Status                 │
      │ - Last login             │
      │ - Actions                │
      └────────┬─────────────────┘
               │
               ├──────────────┬─────────┬────────────┐
               │              │         │            │
               ▼              ▼         ▼            ▼
         ┌──────────┐  ┌──────────┐  ┌────────┐  ┌────────┐
         │ Invite   │  │ Edit     │  │ Remove │  │ Resend │
         │ New User │  │ User     │  │ User   │  │ Invite │
         │          │  │          │  │        │  │        │
         │ - Email  │  │ - Role   │  │ - Conf │  │ Email  │
         │ - Role   │  │ - Company│  │ - Del  │  │ link   │
         │ - Company│  │ - Status │  │ - Arch │  │        │
         │ - Send   │  └────┬─────┘  └────┬───┘  └───┬────┘
         │   invite │       │             │           │
         └────┬─────┘       │             │           │
              │             │             │           │
              └─────────────┴─────────────┴───────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │ Back to Users List           │
              │ (Changes applied)            │
              └──────┬─────────────────────────┘
                     │
                     │
   ┌────────────────────────────────────────────────────────────┐
   │ 3. FOLDERS MANAGEMENT                                      │
   │    (app/pages/admin/folders)                               │
   └────────────────────────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────────────────┐
              │ View All Folders         │
              │ (Across all companies)   │
              │                          │
              │ - Folder Name            │
              │ - Created by             │
              │ - Assigned Moderators    │
              │ - Subfolder count        │
              │ - Dashboard count        │
              │ - Actions                │
              └────────┬─────────────────┘
                       │
                       ├──────────────┬──────────────┐
                       │              │              │
                       ▼              ▼              ▼
                 ┌──────────┐  ┌──────────┐  ┌──────────┐
                 │ Create   │  │ Edit     │  │ Delete   │
                 │ Folder   │  │ Folder   │  │ Folder   │
                 │          │  │          │  │          │
                 │ - Name   │  │ - Name   │  │ - Confirm│
                 │ - Desc   │  │ - Desc   │  │ - Warn   │
                 │ - Assign │  │ - Assign │  │ - Move   │
                 │   mods   │  │   mods   │  │   dash?  │
                 │ - Perms  │  │ - Perms  │  │          │
                 └────┬─────┘  └────┬─────┘  └────┬─────┘
                      │             │             │
                      └─────────────┴─────────────┘
                                    │
                                    ▼
                        ┌──────────────────────────┐
                        │ Back to Folders List     │
                        │ (Changes applied)        │
                        └──────┬───────────────────┘
                               │
                               │
   ┌────────────────────────────────────────────────────────────┐
   │ 4. DASHBOARDS MANAGEMENT                                   │
   │    (app/pages/admin/dashboards)                            │
   └────────────────────────────────────────────────────────────┘
                               │
                               ▼
                        ┌──────────────────────────┐
                        │ View All Dashboards      │
                        │ (Across all companies)   │
                        │ (Filter by folder)       │
                        │                          │
                        │ - Title                  │
                        │ - Folder                 │
                        │ - Created by             │
                        │ - Permissions            │
                        │ - Status                 │
                        │ - Actions                │
                        └────────┬─────────────────┘
                                 │
                                 ├──────┬──────┬────────┐
                                 │      │      │        │
                                 ▼      ▼      ▼        ▼
                           ┌────────┐  ┌────┐ ┌──────┐
                           │ View   │  │Edit│ │Delete│
                           │        │  │    │ │      │
                           │ - URL  │  │Perm│ │Confirm
                           │ - Perms│  │    │ │Delete
                           │ - Meta │  │    │ │Archive
                           └───┬────┘  └──┬─┘ └───┬──┘
                               │          │       │
                               └──────────┴───────┘
                                       │
                                       ▼
                            ┌──────────────────────────┐
                            │ Back to Dashboards List  │
                            │ (Changes applied)        │
                            └──────┬───────────────────┘
                                   │
                                   │
   ┌────────────────────────────────────────────────────────────┐
   │ 5. TAGS MANAGEMENT (NEW)                                   │
   │    (app/pages/admin/tags)                                  │
   └────────────────────────────────────────────────────────────┘
                               │
                               ▼
                        ┌──────────────────────────┐
                        │ View All Tags            │
                        │                          │
                        │ - Tag Name               │
                        │ - Color                  │
                        │ - Description            │
                        │ - Dashboard count        │
                        │ - Status (active/inactive)
                        │ - Actions (edit/delete)  │
                        └────────┬─────────────────┘
                                 │
                                 ├──────┬──────┬────────┐
                                 │      │      │        │
                                 ▼      ▼      ▼        ▼
                           ┌────────┐ ┌────────┐ ┌──────────┐
                           │ Create │ │ Edit   │ │ Delete   │
                           │ Tag    │ │ Tag    │ │ Tag      │
                           │        │ │        │ │          │
                           │ - Name │ │ - Name │ │ - Confirm│
                           │ - Color│ │ - Color│ │ - Warn:  │
                           │ - Desc │ │ - Desc │ │   N dash-│
                           │        │ │        │ │   boards │
                           │        │ │        │ │   will   │
                           │        │ │        │ │   lose   │
                           │        │ │        │ │   this   │
                           │        │ │        │ │   tag    │
                           └───┬────┘ └───┬────┘ └────┬─────┘
                               │          │           │
                               └──────────┴───────────┘
                                          │
                                          ▼
                              ┌──────────────────────────┐
                              │ Back to Tags List        │
                              │ (Changes applied)        │
                              └──────┬───────────────────┘
                                     │
                                     │
   ┌────────────────────────────────────────────────────────────┐
   │ 6. INVITATIONS                                             │
   │    (app/pages/admin/invitations/index.vue)                 │
   └────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                              ┌──────────────────────────┐
                              │ View All Invitations     │
                              │                          │
                              │ - Email                  │
                              │ - Role assigned          │
                              │ - Company                │
                              │ - Status (pending/       │
                              │   accepted/expired)      │
                              │ - Sent date              │
                              │ - Actions (resend/cancel)│
                              └────────┬─────────────────┘
                                       │
                                       ├──────────────┬────────────┐
                                       ▼              ▼            ▼
                                 ┌──────────┐  ┌──────────┐  ┌──────────┐
                                 │ Invite   │  │ Resend   │  │ Cancel   │
                                 │ New User │  │ Existing │  │ Invite   │
                                 │          │  │ Invite   │  │          │
                                 │ - Email  │  │ - New    │  │ - Confirm│
                                 │ - Role   │  │   email  │  │          │
                                 │ - Company│  │   link   │  │          │
                                 └────┬─────┘  └────┬─────┘  └────┬─────┘
                                      └─────────────┴─────────────┘
                                                    │
                                                    ▼
                                     ┌──────────────────────────┐
                                     │ Back to Invitations List │
                                     └──────┬───────────────────┘
                                            │
                                            │
   ┌────────────────────────────────────────────────────────────┐
   │ 7. REGIONS & BUSINESS GROUPS                               │
   │    (app/pages/admin/regions/index.vue)                     │
   └────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                                     ┌──────────────────────────┐
                                     │ View All Regions         │
                                     │                          │
                                     │ - Region/Group name      │
                                     │ - Companies in region    │
                                     │ - Actions (create/edit/  │
                                     │   delete)                │
                                     └──────┬───────────────────┘
                                            │
                                            ▼
                                     ┌──────────────────────────┐
                                     │ Create / Edit Region     │
                                     │ - Name, description      │
                                     │ - Assign companies       │
                                     └──────┬───────────────────┘
                                            │
                                            │
   ┌────────────────────────────────────────────────────────────┐
   │ 8. USER GROUPS                                             │
   │    (app/pages/admin/groups/index.vue)                      │
   └────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                                     ┌──────────────────────────┐
                                     │ View All User Groups     │
                                     │                          │
                                     │ - Group name             │
                                     │ - Member count           │
                                     │ - Company scope          │
                                     │ - Actions (create/edit/  │
                                     │   delete)                │
                                     └──────┬───────────────────┘
                                            │
                                            │
   ┌────────────────────────────────────────────────────────────┐
   │ 9. EXPLORER (FOLDER TREE)                                  │
   │    (app/pages/admin/explorer/[[folderId]].vue)             │
   └────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                                     ┌──────────────────────────┐
                                     │ Browse Folder Tree       │
                                     │ (All companies)          │
                                     │                          │
                                     │ Default: root folders    │
                                     │ Click folder → navigate  │
                                     │   into subfolder         │
                                     │                          │
                                     │ Per folder/dashboard:    │
                                     │ - Edit / Delete          │
                                     │ - Assign moderators      │
                                     │ - Manage permissions     │
                                     └──────┬───────────────────┘
                                            │
                                            ▼
                                     ┌──────────────────────────┐
                                     │ View Profile / Logout    │
                                     └────────┬─────────────────┘
                                              │
                                              ▼
                                     ┌────────────────────────┐
                                     │ End Session            │
                                     │ (END)                  │
                                     └────────────────────────┘
```

### ADMIN Flow Decision Points

| Decision Point | Outcome | Next Step |
|---|---|---|
| **Global Admin?** | ✅ Yes | Access all companies |
| **Can create company?** | ✅ Yes | Show creation form |
| **Delete company?** | ✅ Confirmed | Cascade delete users/folders/dashboards |
| | ❌ Cancelled | Stay on company list |
| **Modify user role?** | ✅ Yes | Update DB + re-authenticate |
| | ❌ No (Permission denied) | Show error message |
| **Invite status?** | pending | Show resend/cancel actions |
| | accepted | Read-only display |
| | expired | Show resend option |
| **Delete tag?** | ✅ Confirmed | Remove tag from all dashboards + delete tag |
| | ❌ Cancelled | Stay on tags list |
| **Tag in use by dashboards?** | ✅ Yes (N dashboards) | Show warning with count before delete |
| | ❌ No | Allow immediate delete |

---

## 🔐 Authentication Flow

All three roles follow the same authentication flow:

```
┌──────────────────────────┐
│  User visits /           │
│  (app/pages/index.vue)   │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────┐
│  Check Firebase Auth Status    │
│  (useAuth composable)          │
└──────┬────────┬────────────────┘
       │        │
       │YES     │NO
       │        │
       ▼        ▼
   ┌────┐  ┌──────────────────────────┐
   │Auto│  │ Show Login Page           │
   │Load│  │ - Google Sign-In Button   │
   │Pro-│  │ - "Sign in with Google"   │
   │file│  │                          │
   └──┬─┘  └──────┬───────────────────┘
     │            │
     │            │ User clicks
     │            │ "Sign in"
     │            │
     │            ▼
     │   ┌──────────────────────────┐
     │   │ Firebase Google OAuth    │
     │   │ - Opens Google login     │
     │   │ - User authenticates     │
     │   │ - Returns ID token       │
     │   └──────┬───────────────────┘
     │          │
     │          ▼
     │   ┌──────────────────────────┐
     │   │ Create/Update Firebase   │
     │   │ User (by UID)            │
     │   └──────┬───────────────────┘
     │          │
     │          ▼
     │   ┌──────────────────────────┐
     │   │ Check /api/mock/users    │
     │   │ by user UID              │
     │   │ - Check if user exists   │
     │   └──────┬───────────────────┘
     │          │
     │          ├───YES──────┐
     │          │            │NO
     │          ▼            ▼
     │    ┌──────────┐  ┌──────────────┐
     │    │User found│  │Check pending │
     │    │Load role,│  │invitation    │
     │    │company,  │  │(/api/mock/   │
     │    │perms     │  │invitations)  │
     │    └────┬─────┘  └──────┬───────┘
     │         │               │
     └─────────┴───────────────┘
             │
             ▼
    ┌──────────────────────────┐
    │ Check User Status        │
    │ (isActive: true?)        │
    └──────┬─────┬──────────────┘
           │     │
           YES   NO (deactivated)
           │     │
           ▼     ▼
    ┌────────┐  ┌──────────────────────┐
    │ Route to│  │ Show access denied   │
    │home page│  │ message              │
    │by role  │  │ - Contact admin      │
    │         │  │ - Logout option      │
    └────┬────┘  └──────┬───────────────┘
         │               │
         ├USER ──────────┤
         │               │
         ├MODERATOR ─────┤
         │               │
         ├ADMIN ─────────┤
         │               │
         ▼               │
    ┌────────────────┐   │
    │Route Successful│   │
    │Home page loaded│   │
    └────────────────┘   │
                         ▼
                    ┌────────────────┐
                    │Show Error Page │
                    │or Login again  │
                    └────────────────┘
```

---

## 🎫 Invitation Acceptance Flow

New users without accounts are invited by Admin and access StreamHub via a one-time invitation link.

**Route:** `/invite/accept?code={invitationCode}`  
**Page:** `app/pages/invite/accept.vue`  
**Layout:** Custom (no default layout)  
**Middleware:** None — public, no auth required

```
┌─────────────────────────────────────────┐
│  User opens invitation email link       │
│  /invite/accept?code=ABC123             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  PHASE 1: Verify Invitation Code        │
│  GET /api/mock/invitations/verify       │
│      ?code={code}                       │
└──────┬──────────────────────────────────┘
       │
       ├─── expired ──────────────────────┐
       │                                  │
       ├─── cancelled ────────────────────┤
       │                                  │
       ├─── already_accepted ─────────────┤
       │                                  │
       ├─── invalid ──────────────────────┤
       │                                  ▼
       │                          ┌──────────────────────┐
       │                          │  Show Error State    │
       │                          │  (cannot proceed)    │
       │                          └──────────────────────┘
       │
       ▼ valid
┌─────────────────────────────────────────┐
│  PHASE 2: Email Matching                │
│  Is current user signed in?             │
└──────┬──────────────────────────────────┘
       │
       ├─── signed in + email matches ────────────────────┐
       │                                                  ▼
       │                                         ┌──────────────────┐
       │                                         │ Status = valid   │
       │                                         │ → Accept button  │
       │                                         └──────┬───────────┘
       ├─── not signed in ─────────────┐               │
       │                               │               │
       └─── email mismatch ────────────┤               │
                                       ▼               │
                               ┌──────────────────┐    │
                               │ Prompt to sign   │    │
                               │ in with matching │    │
                               │ email account    │    │
                               └──────────────────┘    │
                                                        │
                                                        ▼
                               ┌──────────────────────────────────┐
                               │  PHASE 3: Accept Invitation      │
                               │  User clicks "Accept" button     │
                               │                                  │
                               │  POST /api/mock/invitations/     │
                               │       accept                     │
                               │  Body: {                         │
                               │    invitationCode,               │
                               │    uid, email,                   │
                               │    displayName, photoURL         │
                               │  }                               │
                               └──────┬───────────────────────────┘
                                      │
                                      ├─── ERROR ─────┐
                                      │               ▼
                                      │       ┌──────────────┐
                                      │       │ Show error   │
                                      │       │ message      │
                                      │       └──────────────┘
                                      │
                                      ▼ SUCCESS
                               ┌──────────────────────────────────┐
                               │  Update authStore.user           │
                               │  - role + company from invite    │
                               │  - Init permissionsStore         │
                               └──────┬───────────────────────────┘
                                      │
                                      ▼ (after 2s delay)
                               ┌──────────────────────────────────┐
                               │  Redirect to                     │
                               │  /dashboard/discover             │
                               └──────────────────────────────────┘
```

### Invitation Status States

| Status | Meaning | UI |
|--------|---------|-----|
| `valid` | Active and unused | Show Accept button |
| `expired` | Code has expired | Show expired message |
| `cancelled` | Cancelled by Admin | Show cancelled message |
| `already_accepted` | Already used once | Show "already accepted" |
| `invalid` | Code not found | Show "invalid code" |
| `email_mismatch` | Signed in with wrong email | Prompt to switch account |

---

## 🔄 Company Switching Flow

For MODERATOR and ADMIN users who work across companies:

```
┌──────────────────────────┐
│ User at Dashboard Home   │
│ (Current company: STTH)  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ See Company Selector     │
│ (Top navbar dropdown)    │
│                          │
│ - Current: STTH          │
│ - Click to change        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Show Company List        │
│ (Only accessible ones)   │
│                          │
│ For ADMIN:               │
│ - All 10+ companies      │
│                          │
│ For MODERATOR:           │
│ - Companies with         │
│   assigned folders       │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Select Different Company │
│ e.g., STTN              │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Update Context:          │
│ - Store company in      │
│   localStorage/Pinia    │
│ - Update user context   │
│ - Refresh data          │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Dashboard Home           │
│ Now showing STTN data    │
│ - Folders for STTN       │
│ - Dashboards for STTN    │
│ - Moderators for STTN    │
│ - Users for STTN         │
└──────────────────────────┘
```

---

## ❌ Permission Denied Scenarios

📌 **For detailed permission checking logic, see [Roles & Permissions Guide > Access Logic](../GUIDES/roles-and-permissions.md#-access-logic) and [Use Cases & Examples](../GUIDES/roles-and-permissions.md#-use-cases--examples).**

### Scenario 1: USER Tries to View Protected Dashboard

```
┌──────────────────────────┐
│ User clicks dashboard    │
│ (No view permission)     │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Check Permissions        │
│ (3-layer model:          │
│  direct, company,        │
│  restrictions)           │
│                          │
│ User role = "user"       │
│ NO MATCH in any layer ❌ │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Show Error:              │
│ "Access Denied"          │
│                          │
│ "You don't have         │
│  permission to view     │
│  this dashboard"        │
│                          │
│ - Contact admin         │
│ - Back to home          │
└──────────────────────────┘
```

### Scenario 2: MODERATOR Tries to Edit Unassigned Folder

```
┌──────────────────────────┐
│ Moderator views folder   │
│ (not in assignedFolders) │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Check Assignment:        │
│ folder_id = "folder_101" │
│                          │
│ user.assignedFolders =   │
│ ["folder_50", "folder_51"]
│                          │
│ NO MATCH ❌              │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Show View-Only Mode      │
│                          │
│ - Hide edit buttons      │
│ - Hide delete buttons    │
│ - Hide create buttons    │
│ - Show message:          │
│   "Read-only access"     │
│ - "Request access" btn   │
└──────────────────────────┘
```

### Scenario 3: MODERATOR Tries to Delete Admin-Only Dashboard

```
┌──────────────────────────┐
│ Moderator tries to       │
│ delete dashboard         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Check Dashboard Perms:   │
│ dashboard.permissions =  │
│ {                        │
│   "role:admin":          │
│   ["view", "edit",       │
│    "delete"]             │
│ }                        │
│                          │
│ User role = "moderator"  │
│ NO DELETE PERMISSION ❌  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Show Warning:            │
│                          │
│ "Delete Not Allowed"     │
│                          │
│ "You can edit but not   │
│  delete this dashboard. │
│  Contact admin for      │
│  deletion."             │
│                          │
│ - [Cancel]              │
│ - [OK]                  │
└──────────────────────────┘
```

---

## 📊 Flow Summary Table

| Role | Entry Point | Sidebar Menus | Main Actions | Tag Actions | Key Checks | Restrictions |
|---|---|---|---|---|---|---|
| **USER** | `/dashboard/discover` | Dashboard (Home, View All) | View dashboards, Filter by tag/folder | View tags, Filter | `dashboard.permissions` | View-only, no management |
| **MODERATOR (View 1)** | `/dashboard/discover` | Dashboard (Home, View All) | Same as User | View tags, Filter | `dashboard.permissions` | Read-only |
| **MODERATOR (View 2)** | `/manage/explorer` | Manage (Explorer) | CRUD dashboards/subfolders in assigned folders | Assign/unassign tags | `assignedFolders` | Only assigned folders, cannot create tags |
| **ADMIN** | `/admin/overview` | Dashboard + Admin (10 pages) | Full CRUD all entities + Tag management | Full CRUD tags, Assign to any | `canAccessAdmin` permission | None (global access) |
| **INVITE** | `/invite/accept?code=...` | None (custom layout) | Accept invitation, become active user | — | Invitation code validity + email match | One-time use only |

---

## 🎯 Next Steps

1. **Wireframes** (completed)
   - ✅ [Dashboard Discover Page](./wireframes/dashboard-discover-page.md)
   - ✅ [Dashboard View Page](./wireframes/dashboard-view-page.md)
   - ✅ [Sidebar Navigation](./wireframes/sidebar-navigation.md)
   - ✅ [Tag Management Page](./wireframes/tag-management-page.md)
   - ✅ [Admin Permission Management](./wireframes/admin-permission-management-page.md)
   - ✅ [Moderator Quick Share Dialog](./wireframes/moderator-quick-share-dialog.md)

2. **Pending wireframes**
   - [ ] Regions & Business Groups page (Admin)
   - [ ] User Groups page (Admin)
   - [ ] Company Selector component

3. **Implementation tracking** — see [Development Roadmap](../OPERATIONS/roadmap.md)

---

## 📚 Related Documents

- **[Roles & Permissions Guide](../GUIDES/roles-and-permissions.md)** ⭐ Single Source of Truth for permission logic
  - [Permission Structure](../GUIDES/roles-and-permissions.md#-permission-structure)
  - [Access Logic](../GUIDES/roles-and-permissions.md#-access-logic)
  - [Use Cases & Examples](../GUIDES/roles-and-permissions.md#-use-cases--examples)
  - [Firestore Security Rules](../GUIDES/roles-and-permissions.md#-firestore-security-rules)
- [Database Schema](../GUIDES/database-schema.md)
- [Company Management Guide](../GUIDES/company-management.md)
- [Development Roadmap](../OPERATIONS/roadmap.md)

---

**Document Maintainer:** Development Team  
**Last Updated:** 2026-03-22  
**Version:** 2.0
