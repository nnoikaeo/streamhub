# Moderator Quick Share Dialog

> **Purpose:** Quick sharing dialog for moderators to grant temporary direct access to dashboards
> **Users:** Moderators (own dashboards only)
> **Interaction:** Modal dialog from Dashboard Discover Page
> **Last Updated:** 2026-02-13
> **Version:** 4.0 (Consolidated with Single Source of Truth)

---

## 🎯 Key Principle

**Quick Share = Simple, Fast, Modal-Based**
- For Moderators only (own dashboards)
- Limited to Layer 1: Direct Access only
- Set expiry dates for temporary access
- No complex 3-layer permission logic

---

## 🏗️ Dialog Structure

### Modal Dialog (Center Screen)

```
┌──────────────────────────────────────┐
│ ⚡ Quick Share                    [X]│
├──────────────────────────────────────┤
│ Share: Sales East Performance        │
│                                      │
│ Search users:                        │
│ [🔍 Type name...]                    │
│                                      │
│ ☐ Somchai (somchai@company.com)    │
│ ☐ Nattha (nattha@company.com)      │
│ ☐ Teerak (teerak@company.com)      │
│                                      │
│ Selected: 1                          │
│ ✓ Somchai (somchai@company.com) [X]│
│                                      │
│ Access Expiry:                       │
│ ◉ No expiry                          │
│ ○ 7 days (until 2024-02-20)         │
│ ○ 30 days (until 2024-03-14)        │
│ ○ 90 days (until 2024-05-13)        │
│ ○ Custom [📅]                        │
│                                      │
│ ℹ️  Grants Layer 1 direct access    │
│                                      │
│ [Share] [Cancel]                     │
│                                      │
└──────────────────────────────────────┘
```

---

## 🎨 Dialog Features

### Header
- Quick share icon (⚡)
- Dashboard name
- Close button [X]

### User Search (Auto-Complete)
- Search by name or email
- Shows matching users/groups
- Auto-complete as user types
- Filter active users only

### Selected Users Section
- Shows all selected items with count
- Easy removal: Click [X]
- Shows email for clarity

### Expiry Options
- **No expiry** - Permanent access
- **7 days** - Short-term sharing
- **30 days** - Monthly project access
- **90 days** - Quarterly or internship access
- **Custom date** - Specific end date with date picker

### Info Banner
```
ℹ️  This grants direct access to these users only.
    No changes to company-wide permissions.
    Access shown in Admin > Permission Management.
    Expires automatically (or permanent if selected).
```

### Action Buttons
- **[Share]** - Validate and save to Firestore
- **[Cancel]** - Discard changes

---

## 🔄 Moderator Workflow

1. **Open Dashboard Discover Page**
   - Find dashboard they own

2. **Click [Share] Button**
   - Quick Share Dialog opens

3. **Search & Select Users**
   - Type name or email
   - Check users/groups to select

4. **Set Expiry**
   - Choose duration or custom date
   - Shows calculated end date

5. **Click [Share]**
   - Adds to Layer 1: Direct Access
   - Shows success message
   - Dialog closes

---

## 🔐 Permission Model

### What Quick Share Does
✅ Adds users to Layer 1: Direct > Users
✅ Sets optional expiry date
✅ Moderator remains as owner

### What Quick Share Does NOT Do
❌ Modify Layer 2 (company-scoped)
❌ Modify Layer 3 (restrictions)
❌ Grant admin-level access
❌ Set role-based access
❌ Revoke other's access

**Full Details:** See [roles-and-permissions.md](../../GUIDES/roles-and-permissions.md)

---

## 🎯 Moderator Capabilities

### Moderators CAN:
- Share their own dashboards
- Grant Layer 1 direct access
- Set expiry dates (7/30/90 days or custom)
- View who they've shared with

### Moderators CANNOT:
- Access admin panel
- Modify company-scoped permissions
- Revoke others' access
- Grant role-based access

**For complex permissions → Admin Panel needed**

---

## 💬 Variations

### Share with Multiple Users
- Select multiple users
- All get same expiry date
- Success shows count: "Shared with 3 users"

### Share with Groups
- Can select user groups
- "Grants access to 8 members"
- New members added later also get access

### Custom Expiry Date
- Select: ○ Custom date
- Click [📅] to open date picker
- Shown as: "Custom date: 2024-03-15"

---

## 🔀 Success & Error States

### Success: Share Completed
```
✅ Shared with 2 users

Details:
├─ Somchai - Expires: 2024-03-04
└─ Finance Group - Expires: 2024-03-04

[✓ Done] [Share with more]
```

### Error: No Selection
```
⚠️ Please select at least one user or group to share with.
[OK]
```

### Error: User Not Found
```
🔍 No users found matching "xyz"

Try:
- Typing a different name
- Using email address
- Checking spelling
```

---

## 📱 Responsive Design

- **Desktop (>1024px):** Modal centered, 500-600px width
- **Tablet (768-1024px):** Drawer from right, 70% width
- **Mobile (<768px):** Full-screen modal, 90% width

**Details:** See [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md)

---

## 🔗 Related Documents

| Document | Purpose | Link |
|----------|---------|------|
| **Discover Page** | Where [Share] button lives | [dashboard-discover-page.md](./dashboard-discover-page.md) |
| **Admin Permissions** | Full permission management (admin only) | [admin-permission-management-page.md](./admin-permission-management-page.md) |
| **Permissions Guide** | Complete permission logic | [roles-and-permissions.md](../../GUIDES/roles-and-permissions.md) |
| **Design System** | Colors, spacing, responsive | [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) |

---

## ✨ Key Differences from v3.x

- ✅ Consolidated from 564 lines to ~280 lines (50% reduction)
- ✅ Removed verbose workflow and scenario examples
- ✅ Removed implementation checklists
- ✅ Kept Modal only (removed Drawer option)
- ✅ Simplified variations section
- ✅ Removed code examples
- ✅ Added cross-references (Single Source of Truth)
- ✅ Focused on essential structure and features

---

**Created:** 2024-02-03
**Updated:** 2026-02-13 (v4.0 - Consolidated & Simplified)
**Designer:** Development Team
**Version:** 4.0
