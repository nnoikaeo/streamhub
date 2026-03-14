# Tag Management & Tag Filter Wireframe

> **Purpose:** Admin tag CRUD management + Tag filter/assignment UI for all roles
> **Related:** [User Flows](../user-flows.md), [Roles & Permissions](../../GUIDES/roles-and-permissions.md), [Database Schema](../../GUIDES/database-schema.md)
> **Last Updated:** 2026-03
> **Version:** 1.0

---

## Overview

The Tag system has 3 distinct UI surfaces:

1. **Tag Filter** — All roles use on "View All" page (read-only filtering)
2. **Tag Assignment** — Moderator (Manager mode) + Admin use when editing dashboards
3. **Tag Management** — Admin-only page for CRUD operations on tags

---

## 1. Tag Filter (All Roles — "View All" Page)

Used on `/dashboard/discover` page for filtering dashboards by tags.

```
┌──────────────────────────────────────────────────────────────┐
│  Dashboard > View All                                        │
│                                                              │
│  🔍 Search dashboards...                                     │
│                                                              │
│  ── Tag Filter ──                                            │
│  ┌─────────┐ ┌──────────┐ ┌───────┐ ┌──────────┐ ┌───────┐│
│  │● Sales  │ │  Finance │ │  KPI  │ │  Monthly │ │  Ops  ││
│  │ (active)│ │          │ │       │ │  (active)│ │       ││
│  └─────────┘ └──────────┘ └───────┘ └──────────┘ └───────┘│
│  ▲ selected (filled)       ▲ unselected (outline)           │
│                                                              │
│  ── Folder Filter ──                                         │
│  [All Folders ▾]  Showing: 8 dashboards with "Sales" AND    │
│                   "Monthly" tags                             │
│                                                              │
│  ┌─ Sales ──────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  ┌────────────────────┐  ┌────────────────────┐     │   │
│  │  │ 📊 Sales Report     │  │ 📊 Revenue Monthly  │     │   │
│  │  │                    │  │                    │     │   │
│  │  │ [Sales] [Monthly]  │  │ [Sales] [Monthly]  │     │   │
│  │  │ [KPI]              │  │ [Finance]          │     │   │
│  │  │                    │  │                    │     │   │
│  │  │ Updated: 2 days ago│  │ Updated: 1 week ago│     │   │
│  │  └────────────────────┘  └────────────────────┘     │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Finance ────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  ┌────────────────────┐                              │   │
│  │  │ 📊 Budget Overview  │                              │   │
│  │  │                    │                              │   │
│  │  │ [Finance][Monthly] │                              │   │
│  │  │                    │                              │   │
│  │  └────────────────────┘                              │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ⏳ Loading more...  (Intersection Observer sentinel)        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Tag Filter Behavior

```
User selects tag chips:
    │
    ▼
┌─────────────────────────────────────────┐
│ No tags selected (default)              │
│ → Show all accessible dashboards        │
│                                         │
│ 1 tag selected: [Sales]                 │
│ → Show dashboards that have "Sales" tag │
│                                         │
│ 2+ tags selected: [Sales] + [Monthly]   │
│ → AND logic: dashboards must have       │
│   BOTH "Sales" AND "Monthly" tags       │
│                                         │
│ Clear all: click active tag to deselect │
│ → Returns to showing all dashboards     │
└─────────────────────────────────────────┘
```

### Tag Chip States

```
┌──────────────────────────────────────────┐
│                                          │
│  Unselected (outline):                   │
│  ┌─────────┐                             │
│  │ ○ Sales │  border: tag color          │
│  └─────────┘  bg: transparent            │
│               text: tag color            │
│                                          │
│  Selected (filled):                      │
│  ┌─────────┐                             │
│  │● Sales  │  bg: tag color              │
│  └─────────┘  text: white                │
│               border: tag color          │
│                                          │
│  Hover:                                  │
│  ┌─────────┐                             │
│  │ ○ Sales │  bg: tag color (10% opacity)│
│  └─────────┘  cursor: pointer            │
│                                          │
└──────────────────────────────────────────┘
```

---

## 2. Tag Assignment (Moderator Manager Mode + Admin)

Used when creating/editing a dashboard in assigned folders or admin panel.

### Tag Selector Component

```
┌──────────────────────────────────────────────────────────────┐
│  ✏️ Edit Dashboard: Sales Report                             │
│                                                              │
│  Title:       [Sales Report              ]                   │
│  Description: [Monthly sales overview    ]                   │
│  Looker URL:  [https://looker.example/123]                   │
│                                                              │
│  ── Tags ──                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │  Current tags:                                          ││
│  │  ┌─────────┐ ┌──────────┐ ┌───────┐                   ││
│  │  │ Sales ✕ │ │ Monthly ✕│ │ KPI ✕ │  [+ Add tag]      ││
│  │  └─────────┘ └──────────┘ └───────┘                   ││
│  │   ▲ click ✕ to remove                                   ││
│  │                                                         ││
│  │  ┌─────────────────────────────────────────────┐        ││
│  │  │ 🔍 Search tags...                            │        ││
│  │  │                                             │        ││
│  │  │  Available tags:                            │        ││
│  │  │  ┌──┐                                       │        ││
│  │  │  │✓ │ ● Sales         (already assigned)    │        ││
│  │  │  │✓ │ ● Monthly       (already assigned)    │        ││
│  │  │  │✓ │ ● KPI           (already assigned)    │        ││
│  │  │  │  │ ● Finance       (click to add)        │        ││
│  │  │  │  │ ● Planning      (click to add)        │        ││
│  │  │  │  │ ● Quarterly     (click to add)        │        ││
│  │  │  │  │ ● Ops           (click to add)        │        ││
│  │  │  └──┘                                       │        ││
│  │  │                                             │        ││
│  │  │  ──────────────────────                     │        ││
│  │  │  ⚠️ Need a new tag? Contact Admin           │ ← Mod  ││
│  │  │  [+ Create new tag]                         │ ← Admin││
│  │  └─────────────────────────────────────────────┘        ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  [💾 Save]  [Cancel]                                        │
└──────────────────────────────────────────────────────────────┘
```

### Differences by Role

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  MODERATOR (Manager Mode):                                   │
│  - Can add/remove tags from dashboards in assigned folders   │
│  - Selects from existing tags only                           │
│  - Shows "Need a new tag? Contact Admin" message             │
│  - Cannot create new tags                                    │
│                                                              │
│  ADMIN:                                                      │
│  - Can add/remove tags from any dashboard                    │
│  - Selects from existing tags                                │
│  - Shows "+ Create new tag" button (inline creation)         │
│  - Can create tags directly from the selector                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Admin Inline Tag Creation (from Tag Selector)

```
┌─────────────────────────────────────────────┐
│ 🔍 Search tags...  "newtagname"             │
│                                             │
│  No matching tags found.                    │
│                                             │
│  [+ Create "newtagname" as new tag]         │
│                                             │
│  ┌─────────────────────────────────┐        │
│  │ Create Tag:                     │        │
│  │ Name:  [newtagname         ]    │        │
│  │ Color: [🟡🔵🟢🟠🟣⚪ ▾]        │        │
│  │ Desc:  [                   ]    │        │
│  │                                 │        │
│  │ [Create]  [Cancel]              │        │
│  └─────────────────────────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 3. Tag Management Page (Admin Only)

Admin-only page at `/admin/tags` for full tag CRUD.

### Tag List View

```
┌──────────────────────────────────────────────────────────────┐
│  Admin > Tags                                                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [+ Create Tag]                        🔍 Search tags... │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Total: 8 tags                                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Tag          Color   Dashboards  Status    Actions     │ │
│  │ ──────────────────────────────────────────────────     │ │
│  │ ● Sales      🟡      5           Active    [✏️][🗑️]  │ │
│  │ ● Finance    🔵      3           Active    [✏️][🗑️]  │ │
│  │ ● KPI        🟢      8           Active    [✏️][🗑️]  │ │
│  │ ● Monthly    🟠      4           Active    [✏️][🗑️]  │ │
│  │ ● Quarterly  🟣      1           Active    [✏️][🗑️]  │ │
│  │ ● Planning   ⚪      2           Active    [✏️][🗑️]  │ │
│  │ ● Ops        🔵      1           Active    [✏️][🗑️]  │ │
│  │ ● HR         🟢      0           Active    [✏️][🗑️]  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Create/Edit Tag Dialog

```
┌──────────────────────────────────────────┐
│  ✏️ Edit Tag                        [✕]  │
│                                          │
│  Name:                                   │
│  [Sales                            ]     │
│                                          │
│  Slug (auto-generated):                  │
│  [sales                            ]     │
│  (used for URL and internal reference)   │
│                                          │
│  Color:                                  │
│  ┌──────────────────────────────────┐    │
│  │ 🟡 🔵 🟢 🟠 🟣 ⚪ 🔴 ⚫         │    │
│  │ ▲ selected                       │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Description:                            │
│  [Sales-related dashboards and     ]     │
│  [reports                          ]     │
│                                          │
│  Status:                                 │
│  (●) Active  ( ) Inactive               │
│                                          │
│  ── Preview ──                           │
│  ┌─────────┐                             │
│  │● Sales  │  ← how it looks in UI      │
│  └─────────┘                             │
│                                          │
│  [💾 Save]  [Cancel]                     │
└──────────────────────────────────────────┘
```

### Delete Tag Confirmation

```
┌──────────────────────────────────────────┐
│  ⚠️ Delete Tag                      [✕]  │
│                                          │
│  Are you sure you want to delete         │
│  the tag "Sales"?                        │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ ⚠️ Warning:                      │    │
│  │                                  │    │
│  │ This tag is currently used by    │    │
│  │ 5 dashboards. Deleting it will   │    │
│  │ remove the tag from all          │    │
│  │ dashboards.                      │    │
│  │                                  │    │
│  │ Affected dashboards:             │    │
│  │ - Sales Report                   │    │
│  │ - Revenue Monthly                │    │
│  │ - Q1 Performance                 │    │
│  │ - ... and 2 more                 │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [🗑️ Delete Tag]  [Cancel]              │
│                                          │
└──────────────────────────────────────────┘
```

---

## 4. Tag Badge Component (All Roles)

Displayed on dashboard cards, dashboard detail pages, and list views.

```
┌──────────────────────────────────────────┐
│  Dashboard Card:                         │
│  ┌────────────────────────────┐          │
│  │ 📊 Sales Report             │          │
│  │                            │          │
│  │ Monthly sales performance  │          │
│  │ metrics and KPIs           │          │
│  │                            │          │
│  │ ┌───────┐ ┌────────┐ ┌──┐ │          │
│  │ │ Sales │ │Monthly │ │KPI│ │          │
│  │ └───────┘ └────────┘ └──┘ │          │
│  │ ▲ tag badges (colored)     │          │
│  │                            │          │
│  │ Updated: 2 days ago        │          │
│  └────────────────────────────┘          │
│                                          │
│  Tag Badge Styles:                       │
│  ┌───────┐  Small (default):             │
│  │ Sales │  font-size: 12px              │
│  └───────┘  padding: 2px 8px             │
│             border-radius: 12px          │
│             bg: tag color (15% opacity)  │
│             text: tag color              │
│             border: 1px solid tag color  │
│                                          │
│  Max display: 3 tags + "+N more"         │
│  ┌───────┐ ┌────────┐ ┌──┐ ┌────┐      │
│  │ Sales │ │Monthly │ │KPI│ │ +2 │      │
│  └───────┘ └────────┘ └──┘ └────┘      │
│                          ▲ tooltip shows  │
│                            remaining tags │
└──────────────────────────────────────────┘
```

---

## 5. Component Summary

| Component | Used By | Purpose |
|---|---|---|
| **TagFilter** | All roles (View All page) | Tag chip multi-select filter |
| **TagBadge** | All roles (cards, lists, detail) | Display tag on dashboard |
| **TagSelector** | Moderator (Manager) + Admin | Add/remove tags on dashboard edit |
| **TagManager** | Admin only (/admin/tags) | Full CRUD page for tags |
| **TagCreateDialog** | Admin only (inline or page) | Create/edit tag form dialog |
| **TagDeleteDialog** | Admin only | Delete confirmation with impact warning |

---

## Related Documents

- [Sidebar Navigation](./sidebar-navigation.md) — Role-based sidebar design
- [User Flows](../user-flows.md) — Flow diagrams including tag flows
- [Database Schema](../../GUIDES/database-schema.md) — Tags collection structure
- [Roles & Permissions](../../GUIDES/roles-and-permissions.md) — Tag permission matrix
- [Component Architecture](../COMPONENT_ARCHITECTURE.md) — Component hierarchy

---

**Created:** 2026-03-14
**Designer:** Development Team
**Version:** 1.0
