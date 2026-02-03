# Dashboard Discover Page - Wireframe

> **Purpose:** Two-pane file explorer navigation for Dashboard discovery (50+ dashboards)  
> **Target User:** Regular employees browsing accessible dashboards by folder  
> **Navigation Model:** Folder Tree (Left) + Dashboard Grid (Right) - File Explorer Style  
> **Last Updated:** 2024-01-28  

---

## 🎯 Key Principle

**📌 Only folders with accessible dashboards are shown in sidebar**
- Approach 2: Show Only Accessible Folders
- Cleaner UX, no confusing "locked" states
- User only sees what they can access

---

## 📐 Page Layout (Two-Pane Model)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STREAMHUB DASHBOARD                                │
├──────────────────────┬───────────────────────────────────────────────────┤
│                      │                                                    │
│   LEFT PANE:         │      RIGHT PANE:                                 │
│   FOLDER TREE        │      MAIN CONTENT (Dashboard Grid)               │
│   (Sidebar)          │                                                    │
│                      │  ┌──────────────────────────────────────────────┐
│  🏠 Dashboard Home   │  │  Breadcrumb:                                 │
│                      │  │  🏠 > Sales > Regional Reports               │
│  📂 Sales ↓          │  │                                              │
│  ├─ 📂 Reports      │  ├──────────────────────────────────────────────┤
│  │  ├─ Dashboard 1  │  │  Search in folder: [🔍            ] [Sort ▼] │
│  │  ├─ Dashboard 2  │  │                                              │
│  │  └─ Dashboard 3  │  ├──────────────────────────────────────────────┤
│  ├─ 📂 Regional     │  │  📊 4 Dashboards Found                       │
│  │  ├─ Dashboard 4  │  │                                              │
│  │  └─ Dashboard 5  │  │  ┌──────────────────┐  ┌──────────────────┐│
│  │                  │  │  │ Regional         │  │ Regional Sales   ││
│  ├─ 📂 Analytics    │  │  │ Performance 📈   │  │ Map 🗺️            ││
│  │  └─ Dashboard 6  │  │  │                  │  │                  ││
│  │                  │  │  │ You can: View ✓  │  │ You can: View ✓  ││
│  📂 Finance ↓       │  │  │ [Open →]         │  │ [Open →]         ││
│  ├─ 📂 Budget       │  │  └──────────────────┘  └──────────────────┘│
│  │  ├─ Dashboard 7  │  │                                              │
│  │  └─ Dashboard 8  │  │  ┌──────────────────┐  ┌──────────────────┐│
│  │                  │  │  │ Regional         │  │ Regional         ││
│  └─ 📂 Payroll      │  │  │ Forecast 📉      │  │ Breakdown        ││
│     ├─ Dashboard 9  │  │  │                  │  │ (own by you)     ││
│     └─ Dashboard 10 │  │  │ You can: View ✓  │  │ You can:         ││
│                      │  │  │ [Open →]         │  │ View ✓ Edit ✓    ││
│  📂 Operations      │  │  │                  │  │ [Open →]         ││
│  ├─ 📂 Inventory    │  │  └──────────────────┘  └──────────────────┘│
│  │  └─ Dashboard 11 │  │                                              │
│  └─ 📂 Supply Chain │  │  [Scroll to load more...]                   │
│     └─ Dashboard 12 │  │                                              │
│                      │  └──────────────────────────────────────────────┘
│  [HR not shown]     │
│  [No accessible    │
│   dashboards]       │
│                      │
└──────────────────────┴───────────────────────────────────────────────────┘
```

---

## 📋 Sidebar Component (Left Pane)

### **Folder Tree Structure**

```
┌─────────────────────────────────────┐
│  DASHBOARD FOLDERS                  │
│                                     │
│  🏠 Dashboard Home ←─ Home page     │
│                                     │
│  📂 Sales                           │
│  ├─ 📂 Reports                      │
│  ├─ 📂 Regional                     │
│  └─ 📂 Analytics                    │
│     (Only shown because user        │
│      has access to dashboards)      │
│                                     │
│  📂 Finance                         │
│  ├─ 📂 Budget                       │
│  └─ 📂 Payroll                      │
│     (Shown - user is finance group) │
│                                     │
│  📂 Operations                      │
│  ├─ 📂 Inventory                    │
│  └─ 📂 Supply Chain                 │
│     (Shown - role has access)       │
│                                     │
│  [HR] ✗ Hidden                      │
│  ├─ No accessible dashboards        │
│  └─ User cannot see this folder     │
│                                     │
│  [Engineering] ✗ Hidden             │
│  ├─ Dashboard requires role:admin   │
│  └─ User does not have role         │
│                                     │
└─────────────────────────────────────┘

Notes:
✅ Only folders with accessible content shown
❌ Empty or restricted folders hidden
⭐ User doesn't need to see full structure
```

### **Folder Selection Behavior (with Smart Collapse)**

```
User clicks "Sales > Regional Reports" folder (4 levels deep)

Step 1: Breadcrumb Update
└─ Calculate full path: 🏠 > Sales > Regional > Reports
└─ Show in breadcrumb (can click any level to jump)

Step 2: Sidebar Smart Collapse
├─ Current path is [Sales, Regional, Reports]
├─ EXPAND: Sales (in path) ↓
│  EXPAND: Regional (in path) ↓
│    EXPAND: Reports (selected) ↓
│      Show dashboards in Reports
│    COLLAPSE: Other folders under Regional
│  COLLAPSE: Other folders under Sales

Result in Sidebar:
📂 Sales ↓
├─ 📂 Regional ↓
│  ├─ 📂 Reports ← SELECTED
│  │  ├─ Dashboard 1
│  │  ├─ Dashboard 2
│  │  └─ Dashboard 3
│  └─ 📂 Analytics (collapsed)
└─ 📂 Operations (collapsed)

Step 3: Check Access
└─ Loop through all dashboards in Reports folder
   ├─ Dashboard A: User can access? ✅ YES
   ├─ Dashboard B: User can access? ✅ YES
   ├─ Dashboard C: User can access? ❌ NO (restricted)
   ├─ Dashboard D: User can access? ✅ YES
   └─ Count: 3 accessible

Step 4: Update Main Area
├─ Show breadcrumb: "🏠 > Sales > Regional > Reports"
├─ Display search box (scoped to folder)
└─ Show 3 accessible dashboards in grid

Result:
✅ Sidebar never overflows (max 3-4 levels expanded)
✅ Breadcrumb shows full path clearly
✅ Only accessible dashboards shown
✅ Clean experience, no clutter
```

---

## 📊 Main Content Area (Right Pane)

### **Header with Breadcrumb**

```
┌──────────────────────────────────────────┐
│  🏠 > Sales > Regional Reports            │
│                                          │
│  Breadcrumb allows quick navigation up   │
│  Click any part to jump to that folder   │
└──────────────────────────────────────────┘
```

### **Search & Controls (Folder-Scoped)**

```
┌──────────────────────────────────────────┐
│  Search: [🔍 Find in "Regional Reports"] │
│                                          │
│  [Sort: Newest ▼]  [View: Grid ▼]       │
│                                          │
│  Results: 4 dashboards found            │
└──────────────────────────────────────────┘

Features:
- Search is scoped to current folder
- Sort options: Newest, A-Z, Favorites
- View options: Grid, List, Compact
```

### **Dashboard Cards in Folder Context**

```
When in "Sales > Regional Reports" folder:

┌──────────────────────────┐
│                          │
│  Regional Performance    │
│  📈                      │
│                          │
│  Created by: John        │
│  Updated: 1 day ago      │
│                          │
│  Access via:             │
│  ✓ Company-scoped        │
│    (role: user)          │
│                          │
│  You can: View           │
│                          │
│  [Open →]                │
│                          │
└──────────────────────────┘

Notes:
- Still shows "Access via" (which layer)
- Shows available permissions
- Card indicates it's in Sales/Regional folder
```

---

## 🔄 Navigation Flows

### **Flow 1: Browse by Folder**

```
1. User enters Dashboard Discover Page
   └─ Sidebar shows accessible folders

2. Clicks "Sales" folder
   ├─ Sidebar expands to show subfolders
   ├─ Main area still shows "Dashboard Home" (all dashboards)
   └─ Can click subfolder or use breadcrumb

3. Clicks "Sales > Regional Reports" subfolder
   ├─ Breadcrumb updates: "🏠 > Sales > Regional"
   ├─ Main area shows 4 dashboards in this folder
   ├─ Search is scoped to folder
   └─ All displayed dashboards are accessible

4. Clicks [Open] on "Regional Performance"
   └─ Navigate to Dashboard View Page
   └─ See [Dashboard View Page Wireframe](./dashboard-view-page.md)
```

### **Flow 2: Search Within Folder**

```
1. User is viewing "Sales > Regional Reports" (4 dashboards)

2. Types "forecast" in search box
   ├─ Filter dashboards in folder
   ├─ Show only dashboards matching search
   └─ Still respects permission (only accessible ones shown)

3. Results: 1 dashboard found
   └─ Display "Regional Forecast"
```

### **Flow 3: Home View (All Accessible Dashboards)**

```
1. User clicks "🏠 Dashboard Home" or "Dashboard Discover"
   ├─ Right pane shows all accessible dashboards
   ├─ No folder filtering (shows across all folders)
   ├─ User can search globally
   └─ Helpful "quick access" view
```

---

---

## 🔐 Permission Checking Logic (Sidebar + Main Area)

### **How Folders Appear/Disappear**

```javascript
// Sidebar: Show folder only if has accessible dashboards
function shouldShowFolder(folder, user) {
  // Get all dashboards in this folder (including subfolders)
  const allDashboardsInFolder = getAllDashboardsRecursive(folder)
  
  // Check if user can access ANY dashboard
  return allDashboardsInFolder.some(dashboard => 
    user.hasAccess(dashboard)  // 3-layer permission check
  )
}

// Example:
Folder "Sales"
├─ Dashboard 1: ✅ User can access (role:user)
├─ Dashboard 2: ✅ User can access (group:finance)
├─ Dashboard 3: ❌ User cannot access (role:admin)
├─ Dashboard 4: ✅ User can access
└─ Result: ✅ SHOW FOLDER (has ≥1 accessible)

Folder "HR"
├─ Dashboard A: ❌ User cannot access
├─ Dashboard B: ❌ User cannot access
└─ Result: ❌ HIDE FOLDER (no accessible dashboards)
```

### **When Folder is Clicked**

```javascript
function onFolderClick(folder) {
  // Get all dashboards in folder
  const allDashboards = getAllDashboardsInFolder(folder)
  
  // Filter to only accessible ones
  const accessibleDashboards = allDashboards.filter(dash => 
    user.hasAccess(dash)  // 3-layer check
  )
  
  // Display accessible dashboards in main area
  displayDashboardsInMainArea(accessibleDashboards)
  
  // Note: Inaccessible dashboards are not shown
  // No "locked" icons, no permission errors
  // Clean UX: user only sees what they can access
}

// Example:
User clicks "Sales > Regional Reports" folder

Dashboards in folder:
├─ Dashboard A: ✅ Accessible (role:user)
├─ Dashboard B: ✅ Accessible (group:finance)
├─ Dashboard C: ❌ NOT ACCESSIBLE (expired)
├─ Dashboard D: ✅ Accessible (direct uid)

Main area displays: Dashboard A, B, D only
(C is hidden - no notification, no error)
```

### **3-Layer Permission Check (Per Dashboard)**

```
For each dashboard displayed:

Layer 1: Direct Access (OR logic)
├─ Is uid:{userId} in access.direct? ✅ YES → Allow
├─ Is role:{userRole} in access.direct? ✅ YES → Allow
└─ Is group:{userGroup} in access.direct? ✅ YES → Allow

Layer 2: Company-Scoped (AND logic)
├─ Does access.company[userCompany] exist?
└─ If yes, AND (role OR group match)? ✅ YES → Allow

Layer 3: Restrictions (Explicit Deny)
├─ Is uid in restrictions.revoke? ❌ YES → DENY
└─ Is uid expiry past now? ❌ YES → DENY

Final Result:
(Layer1 OR Layer2) AND NOT(Restrictions) = AccessGranted
```

---

## 📋 Real-World Example

### **User: Somchai**

```
Profile:
├─ uid: "somchai"
├─ role: "user"
├─ company: "STTH"
└─ groups: ["finance", "operations"]

System has 5 folders with 20 total dashboards:
1. Sales (6 dashboards)
2. Finance (6 dashboards)
3. HR (3 dashboards)
4. Operations (3 dashboards)
5. Executive (2 dashboards)
```

### **Sidebar Shows:**

```
📂 Sales ✅ (3 accessible, 3 hidden)
├─ 📂 Reports ✅
│  ├─ Dashboard 1 (role:user in STTH)
│  └─ Dashboard 2 (role:user in STTH)
└─ 📂 Regional ✅
   └─ Dashboard 3 (role:user in STTH)

📂 Finance ✅ (4 accessible, 2 hidden)
├─ 📂 Budget ✅
│  └─ Dashboard 4 (group:finance in STTH)
└─ 📂 Payroll ✅
   ├─ Dashboard 5 (group:finance in STTH)
   └─ Dashboard 6 (direct: uid:somchai)

📂 Operations ✅ (2 accessible, 1 hidden)
├─ 📂 Reports ✅
│  ├─ Dashboard 7 (group:operations in STTH)
│  └─ Dashboard 8 (group:operations in STTH)

[HR] ❌ Hidden - No accessible dashboards
[Executive] ❌ Hidden - Requires role:admin
```

### **When Clicking "Finance > Budget":**

```
Dashboards in folder: 3 total
├─ Dashboard A: ✅ User can access (group:finance)
├─ Dashboard B: ❌ Expired (restriction.expiry past)
└─ Dashboard C: ❌ Revoked (restriction.revoke includes somchai)

Main area shows: 1 dashboard (only A)
└─ Dashboard B and C are completely hidden
   (No notification, no "locked" icons)
```

### **When Clicking "Sales > Reports":**

```
Dashboards in folder: 2 total
├─ Dashboard 1: ✅ User can access (role:user in STTH)
└─ Dashboard 2: ✅ User can access (role:user in STTH)

Main area shows: 2 dashboards
└─ All accessible, clean display
```

---

## 🎨 Component Breakdown

### **1. Header Section**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                        ┌─────────────────────┐│
│  │ 🏠 Logo  │  Dashboard Discovery                   │👤 somchai  ⚙️ ⬇️   ││
│  └──────────┘                                        └─────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘

Elements:
- Logo/Navigation back
- Page title with status (optional: "Role: USER")
- User profile dropdown (settings, logout)
```

### **2. Welcome & Status Bar**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Welcome, Somchai! 👋                                                        │
│                                                                               │
│  Your accessible dashboards (2 found)                                        │
│  ├─ 2 of 10 total dashboards                                                │
│  ├─ Company: STTH                                                           │
│  └─ Groups: Finance, Operations                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Shows:
- User greeting with name
- Dashboard count summary
- User's company context
- User's group memberships
```

### **3. Search & Filter Bar**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 [Type to search...]     │ Filter By ▼         │ Sort By ▼             │
│                              │ • All (2)            │ • Newest              │
│                              │ • By Role (1)        │ • A-Z                 │
│                              │ • By Group (1)       │ • Last Opened         │
│                              │ • Direct Access (0)  │ • Favorites           │
└─────────────────────────────────────────────────────────────────────────────┘

Features:
- Real-time search by dashboard name/description
- Filter by access type (role, group, direct)
- Sort options (newest, alphabetical, frequency)
```

### **4. Dashboard Cards (Grid View)**

```
┌──────────────────────────┐
│                          │
│   STTH Sales Dashboard   │  ← Dashboard Name
│   📈                     │  ← Icon/Preview
│                          │
│ ─────────────────────── │
│ Created by: Admin        │  ← Creator info
│ Last updated: 1 day ago  │  ← Metadata
│                          │
│ Access Reason:           │  ← Why user can access
│ ✓ Company-scoped         │     (which layer granted access)
│   (role: user)           │
│                          │
│ Permissions:             │
│ 👁️  View Only            │
│                          │
│         [Open →]         │  ← CTA Button
│                          │
└──────────────────────────┘

┌──────────────────────────┐
│                          │
│   Finance Summary        │  
│   💰                     │  
│                          │
│ ─────────────────────── │
│ Created by: Somchai      │
│ Last updated: Today      │
│                          │
│ Access Reason:           │  ← GROUP-BASED ACCESS
│ ✓ Company-scoped         │
│   (group: finance)       │
│                          │
│ Permissions:             │
│ 👁️  View                 │
│ ✏️  Edit                 │
│                          │
│         [Open →]         │
│                          │
└──────────────────────────┘

Card Contents:
- Dashboard name + icon
- Creator name + timestamp
- Access reason (which permission layer)
- Available actions (view/edit)
- Open button
```

### **5. Empty/Limited States**

```
# Case 1: User has NO accessible dashboards
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                          📭 No Dashboards Found                              │
│                                                                               │
│                   You don't have access to any dashboards yet.               │
│                                                                               │
│                    ✉️  Please contact your admin to request access           │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

# Case 2: User has limited access (1-2 dashboards)
┌─────────────────────────────────────────────────────────────────────────────┐
│ You have access to 1 dashboard (out of 3 available)                         │
│                                                                               │
│ Other dashboards you might be interested in:                                │
│ • Executive Summary (Admin only)                                            │
│ • HR Analytics (role: moderator)                                            │
│ • Contact admin@streamhub.com to request access                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **6. Permission Info Banner**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ℹ️  How Permissions Work                                                   │
│                                                                               │
│  Dashboards are filtered based on your access rights using:                │
│  • 🎯 Direct access: Specific user or group assignments                     │
│  • 🏢 Company-scoped: Your role within your company (STTH)                  │
│  • ✋ Restrictions: Time-based or revoked access                            │
│                                                                               │
│  See [Roles & Permissions Guide](../GUIDES/roles-and-permissions.md) for   │
│  more details about how access is determined.                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Interactions & Flows

### **Flow 1: Click "Open" Button**

```
User clicks [Open →] on Dashboard Card
       │
       ▼
Check access permission again (confirm still valid)
       │
       ├─ ✅ Access confirmed
       │   └─→ Redirect to /dashboard/{dashboardId}
       │
       └─ ❌ Access denied (revoked/expired)
           └─→ Show "Access Denied" error
               └─→ Back to Dashboard Discover Page
```

### **Flow 2: Search for Dashboard**

```
User types in search box: "Sales"
       │
       ▼
Filter dashboards by name/description
       │
       ▼
Re-apply permission filter (only show accessible ones)
       │
       ▼
Update card display with matched dashboards
```

### **Flow 3: Filter by Access Type**

```
User clicks "Filter By" → "By Group"
       │
       ▼
Show only dashboards where user's groups grant access
       │
Example:
├─ ✅ Finance Summary (group: finance)
├─ ❌ Sales Dashboard (no group match)
└─ ❌ Admin Only (no group match)
```

---

## 📱 Responsive Design Notes (Desktop-First)

### **Desktop-First Strategy (Primary Focus)**

Since StreamHub is enterprise/business dashboard tool primarily used on desktop:
- **PRIMARY**: Desktop (> 1024px) - Full featured
  - Sidebar with smart collapse + breadcrumb
  - Supports 4-5 level deep hierarchies
  - Full grid with 2-3 columns
  
- **SECONDARY**: Tablet (768px - 1024px) - Simplified
  - Sidebar still available (smaller width)
  - Breadcrumb more prominent
  - 2-column dashboard grid
  
- **TERTIARY**: Mobile (< 768px) - Basic navigation
  - Sidebar hidden (hamburger menu)
  - Breadcrumb primary navigation
  - 1-column list view

### **Desktop (> 1024px) - FULL EXPERIENCE**

```
┌─────────────────────────────────────┐
│ Header: Logo, Title, User Menu      │
├──────────┬──────────────────────────┤
│          │ Breadcrumb + Search      │
│ Sidebar  │ (Full width, desktop)    │
│ (250px)  ├──────────────────────────┤
│          │ Dashboard Grid           │
│ Smart    │ (2-3 columns)            │
│ Collapse │ Lots of space for cards  │
│          │                          │
│ 4-5      │ [Card] [Card] [Card]     │
│ levels   │ [Card] [Card] [Card]     │
│ deep     │ [Card] [Card]            │
│          │                          │
│          │ [Load More...]           │
└──────────┴──────────────────────────┘

Features:
✅ Sidebar shows full folder tree (smart collapsed)
✅ Breadcrumb shows exact location
✅ Large dashboard cards with full info
✅ Spacious layout (room for lots of dashboards)
✅ Easy to read folder names (not truncated)
✅ Perfect for 4-5 level hierarchies
```

### **Tablet (768px - 1024px) - OPTIMIZED**

```
┌────────────────────────────────────┐
│ Header: Logo, Menu, User          │
├────────┬─────────────────────────┤
│        │ Breadcrumb + Search     │
│Sidebar │ (Full width)            │
│(200px) ├─────────────────────────┤
│        │ Dashboard Grid          │
│Smaller │ (2 columns)             │
│width   │ Smaller cards           │
│        │                         │
│        │ [Card] [Card]           │
│        │ [Card] [Card]           │
│        │ [Card] [Card]           │
│        │ [Load More...]          │
└────────┴─────────────────────────┘

Changes from Desktop:
- Sidebar width reduced to 200px
- Dashboard cards slightly smaller
- Still shows folder names (not too truncated)
- Breadcrumb takes more priority
```

### **Mobile (< 768px) - HAMBURGER MENU**

```
┌────────────────────────────────────┐
│☰ Logo          Title          👤   │
├────────────────────────────────────┤
│ 🏠 > Sales > Regional > Reports   │
│ (Scrollable breadcrumb)            │
├────────────────────────────────────┤
│ Search: [Find...]    [Sort ▼]     │
├────────────────────────────────────┤
│ [Dashboard Card]                   │
│ [Dashboard Card]                   │
│ [Dashboard Card]                   │
│ [Load More...]                     │
└────────────────────────────────────┘

When user clicks ☰ (Hamburger):
┌────────────────────────────────────┐
│☰ Menu        [X] Close             │
├────────────────────────────────────┤
│ 📂 Sales ↓                         │
│ ├─ 📂 Regional ↓                   │
│ │  ├─ 📂 Reports                   │
│ │  │  (Dashboard A, B, C)          │
│ │  └─ 📂 Analytics                 │
│ └─ 📂 Operations                   │
│                                    │
│ 📂 Finance ↓                       │
│ ├─ 📂 Budget                       │
│ └─ 📂 Payroll                      │
│                                    │
│ [Close Menu]                       │
└────────────────────────────────────┘

Features:
- Sidebar shown in overlay/modal
- User can browse folders
- Click folder to view in main area
- Close menu to see dashboards
```

---

## 🌳 Handling Deep Hierarchies (4-5 Levels)

### **Problem: Deep Folder Trees in Sidebar**

With 4-5 folder depth levels, the sidebar can become:
- Text truncation (folder names cut off)
- Vertical overflow (requires scrolling)
- Hard to navigate (too many click levels)
- Difficult to see current location

### **Solution: Hybrid Model (Sidebar + Smart Collapse + Breadcrumb)**

```
Strategy:
1. Sidebar shows: Current path ONLY (smart collapse)
   └─ Only expands 2-3 levels at a time
   └─ Auto-collapses sibling branches

2. Breadcrumb shows: Full path
   └─ 🏠 > Sales > Regional > Reports > Q4 Analytics
   └─ Click any level to jump there

3. Current folder: Fully expanded
   └─ User can see subfolders to drill down

Result:
✅ Sidebar never overflows (max 3 visible levels)
✅ Breadcrumb shows exact location
✅ Users can navigate efficiently
✅ Works for unlimited depth
```

### **Smart Sidebar Collapse/Expand Behavior**

```
Example: 5-Level Deep Hierarchy

LEVEL 1 (Root)
├─ 📂 Sales ↓
│  └─ LEVEL 2
│     ├─ 📂 North ↓
│     │  └─ LEVEL 3
│     │     ├─ 📂 Q4 2024 ↓
│     │     │  └─ LEVEL 4
│     │     │     ├─ 📂 Analytics ← SELECTED
│     │     │     │  └─ LEVEL 5
│     │     │     │     ├─ Dashboard A
│     │     │     │     └─ Dashboard B
│     │     │     └─ 📂 Reports (collapsed)
│     │     └─ 📂 Q3 2024 (collapsed)
│     └─ 📂 South (collapsed)
└─ 📂 Finance (collapsed)

Display Logic:
- Sales: Show (has accessible dashboards) ✅
- North: Show (current path) ✅
- Q4 2024: Show (current path) ✅
- Analytics: Show (selected) ✅
- Dashboard A,B: Show (in folder) ✅
- South: Collapse (not in current path) 🔽
- Finance: Collapse (not in current path) 🔽
- Q3 2024: Collapse (not in current path) 🔽

Breadcrumb (Top):
🏠 > Sales > North > Q4 2024 > Analytics

User can:
- Click "Sales" in breadcrumb → Jump to Sales level
- Click "Q4 2024" in breadcrumb → Jump to Q4 level
- Expand "Q3 2024" in sidebar → See that branch
```

### **Visual: Different Depth Scenarios**

```
# Scenario 1: User at 2-Level Deep
Breadcrumb: 🏠 > Sales > Reports

Sidebar:
📂 Sales ↓
├─ 📂 Reports ← CURRENT
│  ├─ Dashboard 1
│  ├─ Dashboard 2
│  └─ Dashboard 3
└─ 📂 Regional

Result: Clean, 2 levels visible ✅


# Scenario 2: User at 4-Level Deep
Breadcrumb: 🏠 > Sales > North > Q4 2024

Sidebar:
📂 Sales ↓
├─ 📂 North ↓
│  ├─ 📂 Q4 2024 ← CURRENT
│  │  ├─ Dashboard A
│  │  └─ Dashboard B
│  └─ 📂 Q3 2024
└─ 📂 South

Result: Still clean, shows current path + siblings ✅


# Scenario 3: User at 5-Level Deep
Breadcrumb: 🏠 > Sales > North > Q4 > Analytics

Sidebar:
📂 Sales ↓
├─ 📂 North ↓
│  ├─ 📂 Q4 2024 ↓
│  │  ├─ 📂 Analytics ← CURRENT
│  │  │  ├─ Dashboard X
│  │  │  └─ Dashboard Y
│  │  └─ 📂 Reports
│  └─ 📂 Q3 2024
└─ 📂 South

Result: Still fits in viewport, max 3 expanded levels ✅
```

### **Implementation: Smart Expand/Collapse Logic**

```javascript
function shouldExpandFolder(folder, currentPath) {
  // Expand if folder is in the current path OR is current folder
  const folderPath = getPathToFolder(folder)
  const isInCurrentPath = currentPath.includes(folder.id)
  const isCurrentFolder = currentPath[currentPath.length - 1] === folder.id
  
  return isInCurrentPath || isCurrentFolder
}

function getSidebarFolders(allFolders, currentPath) {
  // Start from root, expand only folders in current path
  return allFolders.map(folder => ({
    ...folder,
    isExpanded: shouldExpandFolder(folder, currentPath),
    // Recursively apply to children
    children: folder.children.map(child => ({
      ...child,
      isExpanded: shouldExpandFolder(child, currentPath),
      // And so on for deeper levels
    }))
  }))
}

// Example:
const currentPath = ["Sales", "North", "Q4", "Analytics"]
const sidebar = getSidebarFolders(allFolders, currentPath)
// Result: Only shows Sales > North > Q4 > Analytics expanded
// Other branches (South, Q3, Reports) remain collapsed
```

### **Breadcrumb + Sidebar Working Together**

```
User's Mental Model:
┌──────────────────────────────────────┐
│ Breadcrumb: Shows exact location     │
│ 🏠 > Sales > North > Q4 > Analytics  │
│ (Can click any level to jump)        │
│                                      │
│ Sidebar: Shows navigation tree       │
│ (Smart collapse - not overwhelming)  │
│                                      │
│ Main area: Show current folder       │
│ (Dashboards in "Analytics")          │
└──────────────────────────────────────┘

Example Flow:
1. User clicks "Q4 2024" in breadcrumb
   └─ Immediately jump to Q4 view
   └─ Sidebar updates to show Q4's subfolders
   └─ Main area shows Q4's dashboards

2. User clicks "Sales" in breadcrumb
   └─ Jump to Sales root level
   └─ Sidebar shows Sales' direct subfolders
   └─ Main area shows all Sales dashboards

3. User clicks folder in sidebar
   └─ Navigate down to that folder
   └─ Breadcrumb extends: 🏠 > Sales > North > Q4 > Analytics > Q4 YTD
   └─ Sidebar updates (smart collapse of siblings)
   └─ Main area shows dashboards in Q4 YTD folder
```

---

## 🔐 Permission Checking Details (On This Page)

### **When Page Loads:**

```javascript
1. Load current user data
   ├─ uid: "somchai"
   ├─ role: "user"
   ├─ company: "STTH"
   └─ groups: ["finance"]

2. Fetch all dashboards from Firestore
   ├─ Dashboard 1: "STTH Sales"
   ├─ Dashboard 2: "Finance Summary"
   ├─ Dashboard 3: "Admin Only"
   └─ ... more dashboards

3. For each dashboard, check permission using 3-layer model
   │
   ├─ Layer 1: Direct (uid/role/group standalone)?
   ├─ Layer 2: Company-scoped (role/group + company AND)?
   ├─ Layer 3: Restrictions (revoke/expiry)?
   │
   └─ Store result: [accessible[], hidden[]]

4. Display only accessible dashboards
   ├─ ✅ STTH Sales (Layer 2: role:user + company:STTH)
   ├─ ✅ Finance Summary (Layer 2: group:finance + company:STTH)
   └─ ❌ Admin Only (Layer 1: role:admin - NO MATCH)
```

### **Why Dashboard X Shows/Hides:**

```
STTH Sales Dashboard
├─ access.direct? NO
├─ access.company[STTH].role:user? ✅ YES
├─ restrictions.revoke[somchai]? NO
├─ restrictions.expiry[somchai]? NO
└─ Result: ✅ SHOW

Finance Summary
├─ access.direct? NO
├─ access.company[STTH].group:finance? ✅ YES (somchai in finance)
├─ restrictions.revoke[somchai]? NO
├─ restrictions.expiry[somchai]? NO
└─ Result: ✅ SHOW

Admin Only
├─ access.direct.role:admin? NO (somchai is user, not admin)
├─ access.company[STTH]? NO
├─ Result: ❌ HIDE
```

---

## 🎯 Key Features

| Feature | Purpose | Implementation |
|---------|---------|-----------------|
| **Permission Filtering** | Show only accessible dashboards | Check 3-layer model for each dashboard |
| **Access Reason Display** | Help user understand WHY they see each dashboard | Show which permission layer granted access |
| **Search** | Find dashboard quickly | Client-side filter on dashboard name/desc |
| **Sort Options** | Organize dashboards by relevance | Newest, A-Z, Last Opened, Favorites |
| **Info Banner** | Educate users about permission system | Link to roles-and-permissions.md |
| **Empty States** | Handle cases where user has no access | Clear messaging + contact admin CTA |

---

## 📋 Component Implementation Checklist

- [ ] Create `DashboardDiscoverPage.vue`
  - [ ] Header with user greeting
  - [ ] Search & filter bar
  - [ ] Dashboard grid container
  
- [ ] Create `DashboardCard.vue` component
  - [ ] Display dashboard info
  - [ ] Show access reason (permission layer)
  - [ ] Display available actions (view/edit)
  - [ ] Open button

- [ ] Create `PermissionFilter.ts` composable
  - [ ] Implement 3-layer permission check
  - [ ] Filter dashboards by user access
  - [ ] Return accessible dashboards

- [ ] Create `DashboardDiscoverPage.spec.ts` tests
  - [ ] Test permission filtering
  - [ ] Test search functionality
  - [ ] Test sorting
  - [ ] Test empty states

---

## 🎬 User Experience Flow

```
👤 User Login
    │
    ▼
📊 Dashboard Discover Page Loads
    │
    ├─ Show: "Loading your dashboards..."
    │
    ▼
🔐 Permission Check (3-layer)
    │
    ├─ Loop through all dashboards
    ├─ Apply permission logic
    ├─ Separate into: accessible vs hidden
    │
    ▼
✅ Page Renders
    │
    ├─ Show user's accessible dashboards
    ├─ Display access reason for each
    ├─ Provide search/filter options
    │
    ▼
📍 User Actions
    │
    ├─ [Open] → View dashboard
    ├─ [Search] → Find specific dashboard
    ├─ [Filter] → See only certain types
    ├─ [Sort] → Organize list
    │
    ▼
✨ Dashboard Display
```

---

## � Important Notes (Approach 2: Show Only Accessible)

### **Why Hide Restricted Folders?**

```
❌ NOT RECOMMENDED: Show all folders with [Locked] icons
├─ Cluttered UI
├─ Confusing for users
├─ "Why can't I open this?"
└─ Poor UX

✅ RECOMMENDED: Show only accessible folders
├─ Clean sidebar
├─ Clear user intent
├─ Only see what's relevant
└─ No confusion about permissions
```

### **What if Folder Becomes Empty Later?**

```
Scenario: User had access to Sales dashboard
         But access is revoked/expired

Before revocation:
└─ Sidebar shows: 📂 Sales ✓

After revocation:
└─ Sidebar: Sales folder disappears
   (No dashboards accessible in it)

User Experience:
- Next time they visit the page
- Sidebar refreshes and shows updated folders
- No confusing [Locked] status
```

### **Permission Checking Happens:**

```
✅ When Page Loads
├─ All folders checked for accessible dashboards
├─ Build sidebar with accessible folders only
└─ Populate main area based on navigation

✅ When Folder is Clicked
├─ All dashboards in folder checked
├─ Filter to accessible ones
└─ Display in main area

✅ Before Opening Dashboard
├─ Final permission check (confirm still valid)
├─ If revoked/expired → show error
└─ Otherwise → open dashboard
```

---

## 🔧 Implementation Checklist

### **Frontend Components**

- [ ] Create `FolderSidebar.vue`
  - [ ] Display folder tree (recursive)
  - [ ] Only show folders with accessible dashboards
  - [ ] **Smart collapse/expand:** Only expand folders in current path
  - [ ] Collapse sibling branches to prevent overflow
  - [ ] Handle folder expansion/collapse with animation
  - [ ] Highlight current folder
  - [ ] Show folder depth indicator (optional)

- [ ] Create `BreadcrumbNavigation.vue`
  - [ ] Show current path: 🏠 > Sales > Regional > Reports
  - [ ] Support 4-5 levels deep without truncation
  - [ ] Click any level to jump to that folder
  - [ ] Update when folder selected
  - [ ] Show scroll capability if very deep (optional)

- [ ] Create `DashboardGrid.vue`
  - [ ] Display accessible dashboards only
  - [ ] Show access reason (which permission layer)
  - [ ] Handle [Open] button clicks
  - [ ] Responsive grid layout (2-3 columns desktop, 2 tablet, 1 mobile)

- [ ] Create `FolderScopedSearch.vue`
  - [ ] Search within selected folder
  - [ ] Respects permission (only show accessible)
  - [ ] Live filtering
  - [ ] Works at any folder depth

### **Utility Functions for Deep Hierarchies**

- [ ] `calculateCurrentPath(folderId)`
  - [ ] Return array of folder IDs from root to current
  - [ ] Example: ["Sales", "North", "Q4", "Analytics"]

- [ ] `shouldExpandFolder(folder, currentPath)`
  - [ ] Return true if folder is in current path or is current folder
  - [ ] Used for smart collapse/expand logic

- [ ] `getSidebarFolders(allFolders, currentPath)`
  - [ ] Return folders with smart expand/collapse applied
  - [ ] Prevents sidebar overflow for deep hierarchies
  - [ ] Recursive function for nested folders

- [ ] `getVisibleBreadcrumb(currentPath)`
  - [ ] Convert path IDs to readable folder names
  - [ ] Example: ["Sales", "North", "Q4"] → "🏠 > Sales > North > Q4"

### **Permission Functions**

- [ ] `filterAccessibleFolders(allFolders, user)`
  - [ ] Check each folder recursively
  - [ ] Return only folders with accessible dashboards
  - [ ] Works with nested folders at any depth

- [ ] `filterAccessibleDashboards(dashboards, user)`
  - [ ] Apply 3-layer permission check
  - [ ] Return accessible ones only

- [ ] `hasAccess(dashboard, user)`
  - [ ] Layer 1: Direct (uid/role/group)
  - [ ] Layer 2: Company-scoped
  - [ ] Layer 3: Restrictions
  - [ ] Return boolean

### **Data Flow**

- [ ] Load user data on app startup
- [ ] Fetch all folders on page load (with hierarchy structure)
- [ ] Build sidebar with accessible folders (smart collapse applied)
- [ ] Show default view (🏠 Dashboard Home)
- [ ] Handle folder clicks:
  - [ ] Calculate new path
  - [ ] Update breadcrumb
  - [ ] Update sidebar (smart collapse)
  - [ ] Fetch dashboards in new folder
  - [ ] Apply permission filter
  - [ ] Update main area
- [ ] Handle breadcrumb clicks (jump to level):
  - [ ] Update current path
  - [ ] Refresh sidebar with smart collapse
  - [ ] Refresh main area with new folder
- [ ] Handle search → filter results
- [ ] Handle dashboard opens → permission check

### **Responsive Implementation**

- [ ] Desktop (> 1024px): Full sidebar with smart collapse
- [ ] Tablet (768-1024px): Sidebar reduced width, breadcrumb prominent
- [ ] Mobile (< 768px): Hamburger menu for sidebar, breadcrumb scrollable

---

## 📚 Related Documents

- [Roles & Permissions Guide](../GUIDES/roles-and-permissions.md) - Complete permission logic
  - [Permission Structure](../GUIDES/roles-and-permissions.md#-permission-structure)
  - [Access Logic](../GUIDES/roles-and-permissions.md#-access-logic)
  - [Use Cases & Examples](../GUIDES/roles-and-permissions.md#-use-cases--examples)
- [Dashboard View Page](./dashboard-view-page.md) - Display dashboard after clicking Open
- [User Flows](../user-flows.md) - Complete USER flow diagram
- [Database Schema](../GUIDES/database-schema.md) - Dashboard & Folder structure

---

**Created:** 2024-01-27  
**Updated:** 2024-02-03 (Hybrid Model for Deep Hierarchies - Desktop-First)  
**Designer:** Development Team  
**Version:** 3.0 (Smart Collapse/Expand + 4-5 Level Support)
