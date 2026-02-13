# Dashboard View Page

> **Purpose:** Display individual dashboard with Looker Studio embed and related dashboards
> **Users:** All roles with dashboard access (USER, MODERATOR, ADMIN)
> **Current Implementation:** `app/pages/dashboard/view.vue` using AppLayout + TwoPaneLayout
> **Last Updated:** 2026-02-13
> **Version:** 4.0 (Consolidated with Single Source of Truth)

---

## 🎯 Key Principle

**Display dashboard with context and related content**
- Embedded dashboard visualization (Looker Studio)
- Dashboard metadata and access information
- Related dashboards from same folder for quick switching
- Clean error and loading states

---

## 🏗️ Page Structure

### Layout & Components

**Main Layout:**
- Uses: `AppLayout` (no sidebar)
- Uses: `TwoPaneLayout` (left sidebar + right content)
- Header: `DashboardViewHeader` (breadcrumb, actions)

**Key Components:**
- `DashboardViewHeader` - Breadcrumb, dashboard title, action buttons
- `TwoPaneLayout` - Two-pane composition (sidebar + main)
- `QuickShareDialog` - Share dialog for moderators

**Sidebar Width:** 320px

---

## 📂 Left Sidebar: Dashboard Info

### Dashboard Metadata Section

```
┌────────────────────────────────┐
│  Dashboard Info                │
│                                │
│  Description:                  │
│  [Dashboard description text]  │
│                                │
│  Owner: John Admin             │
│  Created: Feb 13, 2026         │
│  Updated: Feb 13, 2026         │
└────────────────────────────────┘
```

**Shows:**
- Description (if available)
- Owner name
- Created and updated dates

### Access Status Section

```
┌────────────────────────────────┐
│  Access Status                 │
│                                │
│  [🌐 Public]  or  [🔒 Private] │
│                                │
│  Access via:                   │
│  ✓ Company-scoped (role: user) │
└────────────────────────────────┘
```

**Shows:**
- Public/Restricted badge
- Access reason (which permission layer granted access)

### Related Dashboards Section

```
┌────────────────────────────────┐
│  Related Dashboards            │
│  (Same Folder)                 │
│                                │
│  • Sales Report                │
│  • Sales Map                   │
│  • Sales Forecast              │
│  • Regional Performance        │
│  • Regional Breakdown          │
└────────────────────────────────┘
```

**Features:**
- Shows up to 5 dashboards from same folder
- Click to switch to another dashboard
- No page reload (smooth navigation via router.push)
- Only shows accessible dashboards (permission-filtered)

---

## 🎨 Main Content Area

### Header Section (DashboardViewHeader)

```
🏠 > Sales > Regional > Reports > Regional Performance

Regional Performance Dashboard 📈
Created by: John Admin | Updated: 1 day ago

[🔗 Share] [⚙️ Settings] [⋮ More]
```

**Elements:**
- Breadcrumb navigation (click to navigate back)
- Dashboard title with icon
- Creator info and timestamp
- Action buttons (role-based)

### Looker Studio Embed

```
┌──────────────────────────────────┐
│                                  │
│  [Full Screen ⛶] [Refresh 🔄]   │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │   Looker Studio Dashboard  │  │
│  │   (Interactive charts,     │  │
│  │    filters, tables, etc.)  │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  [Scroll down for more content]  │
└──────────────────────────────────┘
```

**Features:**
- Embedded iframe (Looker Studio)
- Interactive visualizations
- Filters and controls
- Full-screen mode option
- Responsive sizing
- Loading state while embedding

### Loading State

```
┌──────────────────────────────┐
│                              │
│        [Spinner]             │
│                              │
│    Loading dashboard...      │
│                              │
└──────────────────────────────┘
```

### Error State

```
┌──────────────────────────────┐
│  ❌ Error Loading Dashboard  │
│                              │
│  Dashboard not found or      │
│  access denied.              │
│                              │
│  [← Go Back]                 │
└──────────────────────────────┘
```

---

## 🔐 Permission & Access

**3-Layer Permission Check:**

1. **Layer 1: Direct Access**
   - Specific uid, role, or group assignment

2. **Layer 2: Company-Scoped**
   - Role or group access within user's company

3. **Layer 3: Restrictions**
   - Explicit deny or expiry dates

**Summary:**
- User must have access to view dashboard
- Access denied → show error state + "Go Back" button
- Permission re-checked when switching related dashboards
- Related dashboards filtered by permission

**Full Details:** See [docs/GUIDES/roles-and-permissions.md](../../GUIDES/roles-and-permissions.md)

---

## 🎯 Header Actions (Role-Based)

| Action | USER | MODERATOR<br/>(owner) | ADMIN |
|--------|------|----------------------|-------|
| View | ✅ | ✅ | ✅ |
| Share | ❌ | ✅ | ✅ |
| Edit Info | ❌ | ✅ | ✅ |
| Download | ✅ | ✅ | ✅ |
| Manage Permissions | ❌ | ❌ | ✅ |
| Archive | ❌ | ✅ | ✅ |

**Action Details:**
- **View:** Current state, read-only dashboard
- **Share:** Opens Quick Share dialog (direct access layer only)
- **Edit Info:** Edit dashboard name, description, folder
- **Download:** Export dashboard as PDF or image
- **Manage Permissions:** Full 3-layer permission UI (admin only)
- **Archive:** Archive dashboard (hide from discovery)

**See:** [dashboard-discover-page.md](./dashboard-discover-page.md) for complete role details

---

## 🔄 User Flow

```
1. User on Dashboard Discover page
   ↓
2. Clicks [Open] button on dashboard card
   ↓
3. Navigate to /dashboard/view/{dashboardId}
   ↓
4. Page loads, check permission (3-layer check)
   ├─ ✅ Access granted
   │  ├─ Load dashboard data from Firestore
   │  ├─ Load related dashboards (same folder)
   │  └─ Render page
   │
   └─ ❌ Access denied
      └─ Show error state + [Go Back]

5. User sees:
   - Header: Breadcrumb + dashboard title + actions
   - Left sidebar: Info + Access + Related dashboards
   - Main: Looker embed iframe

6. User can:
   - View interactive dashboard
   - Click breadcrumb to go back
   - Click related dashboard to switch
   - Use header actions (based on role)
   - Click [Go Back] in header to return
```

---

## 📱 Responsive Design

- **Desktop (>1024px):** Full sidebar (320px) + main content
- **Tablet (768-1024px):** Sidebar toggleable + main content
- **Mobile (<768px):** Sidebar hidden by default, full-width embed

**Detailed Patterns:** See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Implementation** | Actual Vue component | `app/pages/dashboard/view.vue` |
| **Discover Page** | Dashboard discovery page | [dashboard-discover-page.md](./dashboard-discover-page.md) |
| **Permissions** | 3-layer permission logic | [docs/GUIDES/roles-and-permissions.md](../../GUIDES/roles-and-permissions.md) |
| **Quick Share** | Share dialog details | [moderator-quick-share-dialog.md](./moderator-quick-share-dialog.md) |
| **Design System** | Colors, typography, responsive | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |
| **Components** | Component architecture | [COMPONENT_ARCHITECTURE.md](../COMPONENT_ARCHITECTURE.md) |
| **User Flows** | Complete user journeys | [user-flows.md](../user-flows.md) |

---

## ✨ Key Differences from v3.x

- ✅ Consolidated from 731 lines to ~300 lines (59% reduction)
- ✅ Removed folder tree sidebar descriptions (not in actual implementation)
- ✅ Updated to match actual view.vue implementation
- ✅ Clarified "Related Dashboards" (not "Quick Switch" panel)
- ✅ Removed detailed navigation options (kept what's implemented)
- ✅ Removed Vue code examples (see actual code)
- ✅ Removed duplicate permission logic (link to source instead)
- ✅ Removed implementation checklists (already done)
- ✅ Added cross-references (Single Source of Truth)
- ✅ Consistent structure with discover-page.md v4.0

---

**Created:** 2024-01-28
**Updated:** 2026-02-13 (v4.0 - Consolidated & Aligned with discover-page.md)
**Designer:** Development Team
**Version:** 4.0
