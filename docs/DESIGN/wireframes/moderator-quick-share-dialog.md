# Moderator Quick Share Dialog - Wireframe

> **Purpose:** Quick sharing dialog for Moderators to grant temporary direct access  
> **Target User:** Moderators sharing dashboard with specific users  
> **Interaction Model:** Modal/Drawer Dialog (from Dashboard Discover Page)  
> **Last Updated:** 2024-02-03  

---

## 🎯 Key Principle

**📌 Quick Share = Simple, Fast, Modal-Based**
- For Moderators only (own dashboards)
- Limited to Layer 1: Direct Access (users only)
- Set expiry dates for temporary access
- No complex 3-layer permission logic
- Opens as modal/drawer from Discover page

---

## 📐 Dialog Layout

### **Option A: Modal Dialog (Center Screen)**

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ Quick Share - Sales East Performance                  [X]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Share this dashboard with specific users:                 │
│                                                             │
│  Search & Add Users:                                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🔍 Type name or email...                            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ☐ Somchai (somchai@company.com)                           │
│  ☐ Nattha (nattha@company.com)                             │
│  ☐ Teerak (teerak@company.com)                             │
│  ☐ Janine (janine@company.com)                             │
│  ☐ [View More Users]                                       │
│                                                             │
│  Selected Users: 2                                          │
│  ✓ Somchai (somchai@company.com) [X]                       │
│  ✓ Finance Group (finance@groups) [X]                      │
│                                                             │
│  Access Expiry:                                             │
│  ◉ No expiry (permanent access)                             │
│  ○ 7 days from now (until 2024-02-10)                      │
│  ○ 30 days from now (until 2024-03-04)                     │
│  ○ 90 days from now (until 2024-05-03)                     │
│  ○ Custom date: [📅 2024-03-15] [Confirm]                 │
│                                                             │
│  ℹ️  This grants direct access to these users only.        │
│      No changes to company-wide permissions.               │
│                                                             │
│  [Share] [Cancel]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### **Option B: Drawer Dialog (Right Slide)**

```
Dashboard Page                    Quick Share Drawer
                ├─────────────────────────────────┐
                │ ⚡ Quick Share               [X] │
                ├─────────────────────────────────┤
                │                                 │
                │ Sales East Performance          │
                │                                 │
                │ Search users:                   │
                │ [🔍           ]                │
                │                                 │
                │ ☐ Somchai                       │
                │ ☐ Nattha                        │
                │ ☐ Teerak                        │
                │ ☐ Janine                        │
                │                                 │
                │ Selected: 2                     │
                │ ✓ Somchai [X]                   │
                │ ✓ Finance Group [X]             │
                │                                 │
                │ Expiry:                         │
                │ ◉ No expiry                     │
                │ ○ 7 days                        │
                │ ○ 30 days                       │
                │ ○ 90 days                       │
                │ ○ Custom [📅]                   │
                │                                 │
                │ [Share] [Cancel]                │
                └─────────────────────────────────┘
```

**Use Modal for clarity, Drawer for less disruption.**

---

## 🔄 Quick Share Workflow

### **Step 1: User Click [Share] Button**

In Dashboard Discover Page, Moderator clicks [Share]:

```
Dashboard Card (Right Pane):
┌──────────────────────────┐
│ Sales East               │
│ Performance 📈           │
│                          │
│ By: You (Moderator)      │
│ Updated: Today           │
│                          │
│ [Open →]                 │
│ [Edit] [Share] [Delete]  │
│         ↓
│      Clicks [Share]
│         ↓
│    Dialog opens
│
└──────────────────────────┘
```

---

### **Step 2: Search & Select Users**

```
Dialog opens: "⚡ Quick Share"

User types in search: [som...]

Results shown:
├─ ☐ Somchai (somchai@company.com)
├─ ☐ Sombat (sombat@company.com)
└─ ☐ Somkid (somkid@company.com)

User checks: Somchai
Result: ✓ Somchai added to "Selected Users"
```

---

### **Step 3: Set Expiry (Optional)**

```
Access Expiry options:

◉ No expiry (permanent access)
   └─ User has access forever
   
○ 7 days from now (until 2024-02-10)
   └─ Temporary, short-term sharing
   
○ 30 days from now (until 2024-03-04)
   └─ Monthly project or temporary role
   
○ 90 days from now (until 2024-05-03)
   └─ Quarterly access or internship period
   
○ Custom date: [📅 2024-03-15]
   └─ Specific end date (e.g., contract ends)
   
Moderator selects: "30 days from now"
```

---

### **Step 4: Confirm & Share**

```
Before clicking [Share]:

✓ Somchai (somchai@company.com)
Expiry: 30 days from now (2024-03-04)

ℹ️  This grants direct access only to selected users.
    No other permissions are affected.

[Share] [Cancel]

Moderator clicks [Share]
       │
       ▼
✅ Permissions saved
├─ somchai added to Layer 1: Direct > Users
├─ Expiry set to 2024-03-04
└─ Success message shown
       │
       ▼
Dialog closes
Discover Page shows updated access info
```

---

## 🎨 Dialog Components

### **Header Section**

```
⚡ Quick Share - [Dashboard Name]          [X]

Shows:
- Icon indicating quick/temporary action
- Dashboard name being shared
- Close button (X)
```

---

### **Search Bar (Auto-Complete)**

```
🔍 Type name or email...

Features:
- Auto-complete as user types
- Shows: Name + Email
- Filter: Only show active users
- Can search by first/last name or email
- Shows groups as well (for group sharing)

Results shown live below:
☐ Somchai (somchai@company.com)
☐ Nattha (nattha@company.com)
```

---

### **Selected Users Section**

```
Selected Users: 2

✓ Somchai (somchai@company.com)  [X]
✓ Finance Group (finance@groups) [X]

Features:
- Shows all selected users/groups
- Count displayed
- Easy to remove: Click [X]
- Shows email for clarity
```

---

### **Expiry Options**

```
Access Expiry:

◉ No expiry (permanent access)
○ 7 days from now (until 2024-02-10)
○ 30 days from now (until 2024-03-04)
○ 90 days from now (until 2024-05-03)
○ Custom date: [📅 2024-03-15]

Features:
- Radio buttons (only one selected)
- Shows calculated end dates
- Custom date picker available
- Clear explanation of each option
```

---

### **Info Banner**

```
ℹ️  This grants direct access to these users only.
    No changes to company-wide permissions.
    Access will be shown in Admin > Permission Management.
    Expires automatically (or set to permanent).
```

---

### **Action Buttons**

```
[Share] [Cancel]

[Share]:
- Validates selections
- Saves to Firestore
- Shows success/error message
- Closes dialog

[Cancel]:
- Discards changes
- Closes dialog
- No changes made
```

---

## 📋 Variations

### **Share with Both Users & Groups**

```
☐ Somchai (user)
☐ Finance Group (group)
☐ Sales Team (group)

Selected: 3
✓ Somchai (user) [X]
✓ Finance Group (group) [X]

All selected items get same expiry date.
```

---

### **Custom Expiry Date**

```
Moderator selects: ○ Custom date

Then sees: [📅 2024-03-15]

Can click calendar to pick date:
├─ Previous month: [<]
├─ Current month display
├─ Next month: [>]
├─ Select day: Clickable dates 1-31
└─ Confirm selection

Selected date shows: "Custom date: 2024-03-15"
```

---

### **Share to Group**

```
Search: [fina...]

Results:
├─ ☐ Somchai (user)
├─ ☐ Nattha (user)
├─ ☐ Finance Group (group) ← Group indicated
└─ ☐ Finance Manager (role)

User checks: Finance Group

Result:
✓ Finance Group (finance@groups.company.com) [X]

ℹ️  This grants access to 8 members of Finance Group.
    Current members shown: [View Members]
    New members added later will also get access.
```

---

## 🔄 Success & Error States

### **Success: Share Completed**

```
Dialog shows:
✅ Shared with 2 users

Details:
├─ Somchai - Expires: 2024-03-04
└─ Finance Group - Expires: 2024-03-04

[✓ Done] [Share with more]

Click [✓ Done] to close dialog
Click [Share with more] to add more users (new dialog)
```

---

### **Error: Invalid Selection**

```
[Share] button clicked with no users selected:

⚠️ Please select at least one user or group to share with.

[OK]
```

---

### **Error: User Not Found**

```
Typed: [special_character_@@@@]

🔍 No users found matching "[special_character_@@@@]"

Try:
- Typing a different name
- Using email address
- Checking spelling
```

---

## 📱 Responsive Design

### **Desktop (> 1024px)**
Modal centered on screen, full width 500-600px

### **Tablet (768-1024px)**
Drawer from right side, 70% width

### **Mobile (< 768px)**
Full-screen drawer or modal (90% width)

---

## 🔐 Permission Model

### **What Quick Share Does (Layer 1 Direct Only)**

```
✅ ADDS:
├─ Users to Layer 1: Direct > Users list
├─ With optional expiry date
└─ Moderator remains as owner

❌ DOES NOT TOUCH:
├─ Layer 2: Company-scoped (unchanged)
├─ Layer 3: Restrictions (unchanged)
├─ Moderator cannot revoke others' access
├─ Cannot set group permissions
└─ Cannot set role-based access
```

---

### **Permission Check After Quick Share**

```
Dashboard: Sales East Performance

Before Quick Share:
Layer 1 (Direct):
├─ Users: [john_owner]
└─ Roles: [moderator]

After Moderator shares with Somchai (30 days):
Layer 1 (Direct):
├─ Users: [john_owner, somchai (expires 2024-03-04)]
└─ Roles: [moderator]

Result:
├─ Somchai can access (Layer 1 direct user)
├─ Expires 2024-03-04
├─ All moderators still can access (unchanged)
└─ Company-scoped access unchanged
```

---

## 💡 Moderator Limitations

**Moderators CAN:**
- Share their own dashboards
- Grant Layer 1 direct access only
- Set expiry dates
- View who they've shared with

**Moderators CANNOT:**
- Modify Layer 2 (company-scoped)
- Modify Layer 3 (restrictions/revoke)
- Grant admin-level access
- Set role-based access
- Change other Moderators' shares
- Access Admin Panel

**If complex permission needed → Admin Panel**

---

## 🎬 Moderator Workflow Example

```
Scenario: Moderator John wants to share dashboard with 
          intern Somchai (3-month internship)

Step 1: Open Dashboard Discover Page
        ├─ Sees "Sales East Performance" (owns it)
        
Step 2: Click [Share] button
        ├─ Dialog opens: "⚡ Quick Share"
        
Step 3: Search user
        ├─ Types: "som"
        ├─ Results: Somchai (somchai@company.com)
        ├─ Checks: ☐ Somchai → ✓ Somchai
        
Step 4: Set expiry
        ├─ Selects: ○ 90 days from now
        ├─ Shows: "until 2024-05-03" (end of internship)
        
Step 5: Click [Share]
        ├─ Dialog shows: ✅ Shared with 1 user
        ├─ Somchai added to direct access (Layer 1)
        ├─ Expires: 2024-05-03
        
Step 6: Dialog closes
        ├─ Somchai can now access the dashboard
        ├─ On 2024-05-03, access automatically expires
        
Step 7: (Optional) Later, if internship extends:
        ├─ John can open dialog again
        ├─ Search: Somchai
        ├─ Click [Extend] on existing entry
        ├─ Set new expiry: 2024-08-03
        
Result: ✅ Simple, quick sharing without Admin Panel
```

---

## 🔧 Implementation Checklist

### **Components Needed**

- [ ] `QuickShareDialog.vue` - Main dialog component
- [ ] `UserSearchInput.vue` - Search bar with autocomplete
- [ ] `UserSelectionList.vue` - List of selected users
- [ ] `ExpiryOptionSelector.vue` - Expiry radio buttons
- [ ] `CustomDatePicker.vue` - Date picker for custom expiry

### **Functions Needed**

- [ ] `searchUsers(query)` - Search users by name/email
- [ ] `addDirectAccessUser(dashboardId, userId, expiryDate)` - Add user
- [ ] `removeDirectAccessUser(dashboardId, userId)` - Remove user
- [ ] `validateSelection(selectedUsers)` - Ensure ≥1 selected
- [ ] `calculateExpiryDate(option)` - Calculate expiry based on option
- [ ] `saveQuickShare(dashboardId, users, expiry)` - Save to Firestore

### **Integration Points**

- [ ] Called from Dashboard Card's [Share] button
- [ ] Updates Firestore `dashboards/{id}/access.direct.users`
- [ ] Triggers permission refresh in parent page
- [ ] Accessible only to dashboard owner (Moderator role)

---

## 📚 Related Documents

- [Dashboard Discover Page](./dashboard-discover-page.md) - Where [Share] button lives
- [Admin Permission Management](./admin-permission-management-page.md) - Full permission UI (Admin only)
- [Roles & Permissions Guide](../GUIDES/roles-and-permissions.md) - Permission logic

---

**Created:** 2024-02-03  
**Version:** 1.0 (Moderator Quick Share Dialog)  
**Designer:** Development Team  
**Role:** Moderator (for own dashboards)
