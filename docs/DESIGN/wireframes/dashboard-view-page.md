# Dashboard View Page - Wireframe

> **Purpose:** Display individual dashboard with Looker Studio embed + navigation options  
> **Target User:** Users viewing and interacting with dashboards  
> **Navigation Context:** From Dashboard Discover Page or direct URL  
> **Last Updated:** 2024-01-28  

---

## 📐 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STREAMHUB DASHBOARD                                │
├──────────────────────┬───────────────────────────────────────────────────┤
│                      │                                                    │
│   LEFT PANE:         │      RIGHT PANE:                                 │
│   CONTEXT NAV        │      MAIN DASHBOARD AREA                         │
│   (Optional)         │                                                    │
│                      │  Breadcrumb & Header                             │
│  Current folder:     │  ┌──────────────────────────────────────────────┐
│  Sales > Regional    │  │ 🏠 > Sales > Regional Reports                │
│                      │  │                                              │
│  Related dashboards: │  │ Regional Performance Dashboard                │
│  (in same folder)    │  │ Created by: John | Updated: 1 day ago        │
│                      │  │                                              │
│  • Dashboard 1 ▶     │  │ Share: [  ]  Edit: [  ]  More: [...]       │
│  • Dashboard 2 ▶     │  ├──────────────────────────────────────────────┤
│  • Dashboard 3 ▶     │  │                                              │
│  (highlighted)       │  │  [Embedded Looker Studio]                   │
│  • Dashboard 4 ▶     │  │                                              │
│                      │  │  ┌────────────────────────────────────────┐ │
│  Previous / Next:    │  │  │                                        │ │
│  ◀ Prev | Next ▶    │  │  │     📊 DASHBOARD VISUALIZATION        │ │
│                      │  │  │     (Looker Studio Embed)             │ │
│                      │  │  │                                        │ │
│  [Back to folder]    │  │  │                                        │ │
│  [Back to all]       │  │  │                                        │ │
│                      │  │  │                                        │ │
│                      │  │  │  (Interactive charts, filters, etc.)   │ │
│                      │  │  │                                        │ │
│                      │  │  └────────────────────────────────────────┘ │
│                      │  │                                              │
│                      │  │ [Scroll down for full dashboard]             │
│                      │  │                                              │
│                      │  └──────────────────────────────────────────────┘
│                      │
└──────────────────────┴───────────────────────────────────────────────────┘
```

---

## 📋 Header Section (After Breadcrumb)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🏠 > Sales > Regional Reports                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Regional Performance Dashboard 📈                                       │
│                                                                          │
│  Created by: John Admin                                                 │
│  Last updated: 1 day ago                                               │
│  Dashboard ID: dash-12345 (Copy) 📋                                     │
│                                                                          │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────┐      │
│  │ 👁️ View Only │ 🔗 Share     │ ⚙️ Settings  │ ⋮ More Options   │      │
│  └──────────────┴──────────────┴──────────────┴──────────────────┘      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

Elements:
- Breadcrumb: Navigate back to folders
- Dashboard title with icon
- Creator info + last updated
- Action buttons: View/Edit mode, Share, Settings
- More options (bookmark, download, print, etc.)
```

---

## 🎨 Main Content Area (Embedded Dashboard)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    LOOKER STUDIO EMBEDDED REPORT                         │
│                                                                          │
│  [Loading...] or [Full Screen ⛶] [Refresh 🔄] [Export ...]            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │               📊 Interactive Looker Dashboard                    │   │
│  │                                                                  │   │
│  │  Filter: [Region ▼]  [Date Range ▼]  [Category ▼]              │   │
│  │                                                                  │   │
│  │  ┌────────────────────────┐  ┌────────────────────────┐        │   │
│  │  │ Sales by Region 📈     │  │ Top Products 📊       │        │   │
│  │  │                        │  │                        │        │   │
│  │  │  [Chart Area]          │  │  [Chart Area]          │        │   │
│  │  │                        │  │                        │        │   │
│  │  └────────────────────────┘  └────────────────────────┘        │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ Sales Trend (Last 12 Months) 📉                          │  │   │
│  │  │                                                           │  │   │
│  │  │  [Line Chart Area]                                       │  │   │
│  │  │                                                           │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │ Detailed Data Table 📋                                   │  │   │
│  │  │                                                           │  │   │
│  │  │ [Table with data...]                                    │  │   │
│  │  │                                                           │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [Scroll to see more content]                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

Features:
- Embedded Looker Studio report (interactive)
- Filters at top (region, date range, etc.)
- Multiple visualizations (charts, tables)
- Full-screen mode option
- Refresh button
- Responsive to screen size
```

---

## 🧭 Left Sidebar Navigation (Optional But Recommended)

### **Option A: Minimal (Back Buttons Only)**

```
┌─────────────────────────────┐
│                             │
│  Current Folder:            │
│  Sales > Regional Reports   │
│                             │
│  ─────────────────────────  │
│                             │
│  [◀ Back to Folder]         │
│  [◀ Back to All Dashboards] │
│                             │
└─────────────────────────────┘
```

---

### **Option B: Enhanced (Quick Navigation)**

```
┌─────────────────────────────┐
│  Folder Context             │
│  ─────────────────────────  │
│                             │
│  📂 Sales > Regional Reports │
│                             │
│  Other dashboards in folder │
│  (click to switch quickly)   │
│  ─────────────────────────  │
│                             │
│  • Monthly Sales            │
│  • Regional Performance ✓   │
│    (currently viewing)      │
│  • Regional Forecast        │
│  • Regional Breakdown       │
│                             │
│  ─────────────────────────  │
│  Navigation                 │
│  ─────────────────────────  │
│                             │
│  ◀ Previous Dashboard       │
│  Next Dashboard ▶           │
│                             │
│  ─────────────────────────  │
│                             │
│  [◀ Back to Folder]         │
│  [◀ Back to All]            │
│                             │
└─────────────────────────────┘
```

**Recommended: Option B** (Better UX - quick switching)

---

## 🔄 Dashboard Navigation Options

### **Option 1: Sidebar Quick Navigation (Recommended)**

```
User is viewing: "Regional Performance Dashboard"

Sidebar shows:
📂 Sales > Regional Reports
├─ Monthly Sales → [Click to Switch ▶]
├─ Regional Performance → [Currently Viewing ✓]
├─ Regional Forecast → [Click to Switch ▶]
└─ Regional Breakdown → [Click to Switch ▶]

When user clicks "Regional Forecast":
├─ Permission check (confirm still accessible)
├─ Update URL: /dashboard/dash-regional-forecast
├─ Reload Looker embed for new dashboard
├─ Update header info
├─ Highlight "Regional Forecast" in sidebar
└─ Maintain scroll position (optional)

Benefits:
✅ Quick switch without leaving page
✅ See related dashboards
✅ Know folder context
✅ No loading page transitions
```

---

### **Option 2: Prev/Next Navigation**

```
Dashboards in current folder (in order):
1. Monthly Sales
2. Regional Performance (CURRENT)
3. Regional Forecast
4. Regional Breakdown

Navigation buttons:
[◀ Previous]  Regional Performance  [Next ▶]
└─ Goes to #1          (current)        └─ Goes to #3

Click "Next ▶":
├─ Switch to "Regional Forecast"
├─ Load its dashboard
└─ Update navigation buttons for #3
   [◀ Previous]  Regional Forecast  [Next ▶]
   └─ #2                (current)        └─ #4

Benefits:
✅ Linear navigation through folder
✅ Simple interface
✅ Good for sequential viewing
```

---

### **Option 3: Breadcrumb + Folder Link**

```
User at: "Sales > Regional Reports > Regional Performance"

Breadcrumb:
🏠 > Sales > Regional Reports > Regional Performance

Options:
- Click "Regional Reports" → back to folder view
- Click "Sales" → back to Sales folder
- Click "🏠" → back to all dashboards

Then user can:
├─ Select different dashboard from folder list
├─ Or navigate to different folder
└─ Return to original dashboard

Benefits:
✅ Context awareness
✅ Easy folder navigation
✅ No sidebar clutter
```

---

## ⭐ Recommended Solution: Option 1 + Option 3

**Combine both for best UX:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header with Breadcrumb                                                  │
│ 🏠 > Sales > Regional Reports > Regional Performance                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
├──────────────────────┬─────────────────────────────────────────────┤
│  Left Sidebar        │  Main Content                               │
│  (Optional)          │  [Looker Dashboard]                         │
│                      │                                             │
│  📂 Regional Reports │                                             │
│                      │                                             │
│  • Monthly Sales     │                                             │
│  • Regional Perf ✓   │                                             │
│  • Regional Forecast │                                             │
│  • Regional Break    │                                             │
│                      │                                             │
│  [◀ Back to Folder]  │                                             │
│                      │                                             │
└──────────────────────┴─────────────────────────────────────────────┘
```

**User actions:**
1. **Quick switch:** Click "Regional Forecast" in sidebar
2. **Back to folder:** Click "[◀ Back to Folder]" button
3. **Navigate folders:** Click breadcrumb
4. **Back to all:** Click "[◀ Back to All Dashboards]"

---

## 🔐 Permission & Access Check

### **When Dashboard View Loads:**

```javascript
// User clicks [Open] on a dashboard from Discover Page
// URL changes to: /dashboard/{dashboardId}

Step 1: Permission Check
├─ Fetch dashboard data from Firestore
├─ Check: Does user still have access?
│  ├─ Layer 1: Direct access?
│  ├─ Layer 2: Company-scoped?
│  ├─ Layer 3: Restrictions?
├─ Result: ✅ YES → Proceed
└─ Result: ❌ NO → Show error (see below)

Step 2: Load Dashboard
├─ Get Looker Studio embed URL
├─ Get dashboard metadata (title, creator, updated)
├─ Render page with Looker embed

Step 3: Display Related Dashboards
├─ Get dashboards in same folder
├─ Filter to only accessible ones
├─ Display in sidebar with highlights

Step 4: Render Complete
├─ User sees dashboard with navigation options
├─ Can switch to related dashboards
└─ Can go back to folder/all views
```

---

### **Access Denied Scenario:**

```
User tries to access: /dashboard/dash-admin-only
  │
  └─ Permission check: ❌ DENIED
      ├─ Reason: role:admin only, user is "user"
      │
      ▼
┌──────────────────────────────────────┐
│  ❌ Access Denied                    │
│                                      │
│  You don't have permission to view   │
│  this dashboard.                     │
│                                      │
│  Reason:                             │
│  • Dashboard requires admin role     │
│  • Your role: user                   │
│                                      │
│  Options:                            │
│  • [← Back to Dashboards]            │
│  • Contact admin for access          │
│                                      │
│  Contact: admin@streamhub.com        │
└──────────────────────────────────────┘
```

---

## 🔄 Navigation Flow Diagram

```
Dashboard Discover Page
    │
    └─ User clicks [Open] on dashboard
        │
        ▼
    Permission Check
    ├─ ✅ YES → Load Dashboard
    │   └─ Display dashboard with Looker embed
    │   └─ Show sidebar with related dashboards
    │   └─ User can:
    │       ├─ View current dashboard
    │       ├─ Click related dashboard in sidebar
    │       │   └─ Quick switch (load new dashboard)
    │       ├─ Click breadcrumb to go to folder
    │       │   └─ Back to Discover Page (folder view)
    │       ├─ Click [◀ Back to All]
    │       │   └─ Back to Discover Page (all dashboards)
    │       └─ Interact with Looker charts/filters
    │
    └─ ❌ NO → Access Denied Error
        └─ Show error message with options
```

---

## 💡 Key UX Decisions

### **Should User Stay in Current Folder View?**

```
✅ YES (Recommended)

Reason:
1. Context awareness - User knows they're in "Sales > Regional"
2. Related items - See other dashboards in same folder
3. Quick navigation - Switch between related dashboards easily
4. Logical grouping - Stay with similar content

UX Flow:
Discover Page (folder: Regional Reports)
    ↓
Click dashboard
    ↓
View Dashboard (still in Regional Reports context)
    ↓
Click sidebar: "Regional Forecast"
    ↓
View different dashboard (same folder context)
```

---

### **Should Sidebar Auto-Hide on Mobile?**

```
Desktop (> 1024px):
├─ Sidebar visible
├─ Main content: ~75% width
└─ Looker dashboard: responsive

Tablet (768px - 1024px):
├─ Sidebar collapsible (hamburger toggle)
├─ Collapsed: Show only icons
├─ Main content: expands when sidebar hidden

Mobile (< 768px):
├─ Sidebar hidden by default
├─ Hamburger menu to open
├─ Dashboard takes full width
├─ Modal/drawer for navigation
```

---

## 📋 Implementation Details

### **Dashboard View Page Structure**

```vue
<template>
  <div class="dashboard-view">
    <!-- Header with Breadcrumb -->
    <header>
      <Breadcrumb :path="breadcrumbPath" />
      <DashboardHeader :dashboard="currentDashboard" />
      <ActionButtons :dashboard="currentDashboard" />
    </header>

    <!-- Two-pane layout -->
    <div class="layout">
      <!-- Left: Sidebar Navigation -->
      <aside class="sidebar" v-if="!isMobileHidden">
        <FolderContext :folder="currentFolder" />
        <RelatedDashboards 
          :dashboards="accessibleDashboardsInFolder"
          :current="currentDashboard"
          @select="switchDashboard"
        />
        <NavigationButtons 
          @back-folder="goBackToFolder"
          @back-all="goBackToAll"
        />
      </aside>

      <!-- Right: Main Content -->
      <main class="content">
        <!-- Looker Studio Embed -->
        <div class="looker-embed" v-if="!loading">
          <LookerEmbed :url="lookerUrl" />
        </div>
        
        <!-- Loading State -->
        <div v-else class="loading">
          Loading dashboard...
        </div>

        <!-- Error State -->
        <div v-if="error" class="error">
          <AccessDeniedError :reason="error" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Get dashboard ID from route
const dashboardId = route.params.id

// 2. Fetch dashboard + check permission
onMounted(async () => {
  const dashboard = await fetchDashboard(dashboardId)
  
  if (!userCanAccess(dashboard)) {
    error.value = "Access Denied"
    return
  }
  
  currentDashboard.value = dashboard
  
  // 3. Get related dashboards in folder
  const folder = await fetchFolder(dashboard.folderId)
  const accessible = folder.dashboards.filter(d => userCanAccess(d))
  accessibleDashboardsInFolder.value = accessible
})

// 4. Handle dashboard switch
function switchDashboard(newDashboard) {
  // Permission check again
  if (!userCanAccess(newDashboard)) {
    error.value = "Access Denied"
    return
  }
  
  // Update current dashboard
  currentDashboard.value = newDashboard
  
  // Update URL (without page reload)
  router.push(`/dashboard/${newDashboard.id}`)
  
  // Update Looker embed
  lookerUrl.value = newDashboard.lookerUrl
}
</script>
```

---

## 🎯 Action Buttons (Header)

```
┌─────────────────────────────────────────────────────┐
│ 👁️ View Only │ 🔗 Share │ ⚙️ Settings │ ⋮ More     │
└─────────────────────────────────────────────────────┘

Button Details:

1. 👁️ View Mode (disabled for USER role)
   └─ Indicates: "You have VIEW ONLY access"
   └─ MODERATOR can click to toggle edit mode (if permission)

2. 🔗 Share
   └─ Opens share modal
   ├─ Share dashboard with users/groups
   ├─ Manage permissions
   └─ Copy share link

3. ⚙️ Settings
   └─ Dashboard metadata
   ├─ Edit title (if owner/mod)
   ├─ Edit description
   ├─ Manage folder
   └─ View history

4. ⋮ More Options
   └─ Additional actions
   ├─ Bookmark / Add to favorites
   ├─ Download PDF
   ├─ Print
   ├─ Duplicate (if permission)
   ├─ Move to folder (if permission)
   └─ Delete (if owner/admin)
```

---

## 📊 Related Dashboard Sidebar

### **Display Logic:**

```javascript
// Get all dashboards in current folder
const dashboardsInFolder = folder.dashboards

// Filter to only accessible ones
const accessible = dashboardsInFolder.filter(d => 
  user.hasAccess(d)
)

// Sort by order (or name, or recent)
const sorted = accessible.sort((a, b) => 
  a.order - b.order
)

// Display in sidebar
// Highlight current dashboard
// Show count

Result:
📂 Regional Reports (4 dashboards)
• Monthly Sales
• Regional Performance ✓ (CURRENT)
• Regional Forecast
• Regional Breakdown
```

---

## 🚀 Responsive Behavior

```
Desktop (> 1024px)
┌──────────────┬─────────────────────────┐
│  Sidebar     │  Main Content (Looker)  │
│  (250px)     │  (Responsive)           │
└──────────────┴─────────────────────────┘

Tablet (768px - 1024px)
┌──────┬──────────────────────────────┐
│ ☰    │  Main Content (Looker)       │
│Side  │  (Sidebar collapsed)         │
│bar   │                              │
│ col  │  [Click ☰ to expand]         │
│lapse │                              │
└──────┴──────────────────────────────┘

Mobile (< 768px)
┌─────────────────────────────┐
│  Main Content (Full Width)  │
│  (Looker Dashboard)         │
│                             │
│  [☰ Menu for sidebar]       │
└─────────────────────────────┘

Mobile Menu (Overlay):
┌──────────────────────┐
│ [X]                  │
│                      │
│ 📂 Regional Reports  │
│ • Monthly Sales      │
│ • Regional Perf ✓    │
│ • Regional Forecast  │
│ • Regional Break     │
│                      │
│ [◀ Back to Folder]   │
│ [◀ Back to All]      │
│                      │
└──────────────────────┘
```

---

## ✅ Feature Checklist

- [ ] **Breadcrumb Navigation**
  - [ ] Show current path
  - [ ] Click to navigate back to folder/all

- [ ] **Dashboard Header**
  - [ ] Title, creator, last updated
  - [ ] Copy dashboard ID button

- [ ] **Action Buttons**
  - [ ] View/Edit mode toggle (for MODERATOR)
  - [ ] Share button
  - [ ] Settings button
  - [ ] More options menu

- [ ] **Sidebar Navigation**
  - [ ] Show related dashboards in folder
  - [ ] Highlight current dashboard
  - [ ] Click to switch dashboards
  - [ ] Back buttons

- [ ] **Looker Embed**
  - [ ] Embedded dashboard display
  - [ ] Full-screen mode
  - [ ] Refresh button
  - [ ] Responsive sizing

- [ ] **Permission Checking**
  - [ ] Check access on page load
  - [ ] Check again before switching dashboards
  - [ ] Show access denied error
  - [ ] Provide contact admin option

- [ ] **Mobile Responsive**
  - [ ] Sidebar collapses on tablet
  - [ ] Sidebar hidden on mobile
  - [ ] Hamburger menu for navigation
  - [ ] Dashboard takes full width

---

## 🔐 Permission-Based Features

### **For USER Role**

```
View Only:
✅ View dashboard
✅ Interact with Looker filters/charts
✅ View related dashboards in sidebar
✅ Navigate between dashboards in folder
❌ Edit dashboard
❌ Share dashboard
❌ Change settings
❌ Delete dashboard
```

### **For MODERATOR Role**

```
Can Edit (if created dashboard or has edit permission):
✅ View dashboard
✅ Edit dashboard metadata
✅ Change Looker embed URL
✅ Manage folder assignment
✅ Share dashboard
✅ Manage permissions
✅ Delete dashboard (with confirmation)
✅ Duplicate dashboard
```

### **For ADMIN Role**

```
Full Access:
✅ All MODERATOR actions
✅ Override any permission
✅ View audit logs
✅ Delete other users' dashboards
✅ Manage all dashboard settings
```

---

## 📚 Related Documents

- [Roles & Permissions Guide](../GUIDES/roles-and-permissions.md) - Permission checking logic
- [Dashboard Discover Page](./dashboard-discover-page.md) - Previous page flow
- [User Flows](../user-flows.md) - Complete user flow diagram
- [Database Schema](../GUIDES/database-schema.md) - Dashboard data structure

---

**Created:** 2024-01-28  
**Designer:** Development Team  
**Version:** 1.0
