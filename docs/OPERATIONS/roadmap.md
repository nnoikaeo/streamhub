# 🗺️ StreamHub Development Roadmap

**Project:** Dashboard Management System for Streamwash  
**Timeline:** 2 months  
**Team:** Solo Development  
**Strategy:** Features → QA → Deploy (iterative)

---

## 📊 Project Overview

### Organization Structure
- **Group Companies:** 10+ subsidiary companies (STTH, STTN, STCS, STNR, STPT, STPK, etc.)
- **Users:** 150+ employees across all companies
- **Role Levels:** User, Moderator, Admin

### Core Features

1. **Dashboard Embedding** 📈
   - Display Looker Studio dashboards
   - Role-based access control
   - Department filtering

2. **Users Management** 👥
   - CRUD operations (Create, Read, Update, Delete)
   - User invitations
   - Role assignment (User, Moderator, Admin)
   - Department assignment

3. **Dashboard Management** 📊
   - CRUD dashboards (Looker Studio embeds)
   - Access control (per department/role)
   - Dashboard preview
   - Sharing & permissions

---

## 📅 Development Phases (8 weeks)

### Phase 1: Core Infrastructure (Week 1-2)
**Goal:** Setup foundational features for multi-company architecture

- [x] Google Authentication
- [x] Dashboard Header Component
- [ ] **Setup Companies Collection** (feat/companies-setup)
  - Create companies collection in Firestore
  - Add all subsidiary company documents (STTH, STTN, STCS, etc.)
  - Create company management UI (admin only)

- [ ] **Configure Company-Based Access Control**
  - Add `company` field to users, folders, dashboards collections
  - Implement company-scoped filtering logic
  - Update auth store to include user.company

- [ ] **Sidebar Navigation** (feat/sidebar-nav)
- [ ] **Dashboard Layout wrapper**
- [ ] **Base styling & theme setup**
- [ ] **Firestore security rules for company isolation**

**Estimated Time:** 7-10 days (extended due to company architecture)

---

### Phase 2: Users & Folder Management (Week 3-5)
**Goal:** Full CRUD for users + company-scoped folders

- [ ] **Users List Page** (feat/users-list)
  - Table with filtering/search (company-scoped)
  - User data display (name, email, role, company)
  - Action buttons (edit, delete, view)

- [ ] **Add/Edit User Modal** (feat/user-form)
  - Form validation
  - Role assignment (User, Moderator, Admin)
  - Company assignment
  - Moderator folder assignment

- [ ] **User Invitations** (feat/user-invitations)
  - Bulk invite functionality (company-specific)
  - Email invitation system
  - Invitation tracking by company

- [ ] **Folder Management UI** (feat/folder-management)
  - Create folders (admin only, company-scoped)
  - Assign folders to moderators (admin only)
  - Manage subfolders

- [ ] **Role Management UI** (feat/roles)
  - Display user permissions
  - Change role interface
  - Show company scope limitations

**Estimated Time:** 12-14 days

---

### Phase 3: Dashboard Management (Week 5-7)
**Goal:** Create, edit, manage dashboards + company-scoped permissions

- [ ] **Dashboards List Page** (feat/dashboards-list)
  - Display available dashboards (company-scoped)
  - Filter by folder, company
  - Search functionality

- [ ] **Dashboard Creation Form** (feat/create-dashboard)
  - Looker Studio URL input
  - Title, description, icon
  - Company assignment
  - Folder assignment

- [ ] **Dashboard Edit Page** (feat/edit-dashboard)
  - Update dashboard info
  - Manage access permissions (company-based)
  - Preview embed

- [ ] **Access Control Settings** (feat/dashboard-permissions)
  - Role-based access matrix
  - Company-level permissions
  - User-specific permissions
  - User-specific sharing

- [ ] **Dashboard Viewer** (feat/dashboard-viewer)
  - Embed Looker Studio iframes
  - Role-based filtering
  - Responsive layout

**Estimated Time:** 10-12 days

---

### Phase 4: Looker Integration (Week 6-7)
**Goal:** Connect Looker Studio + advanced features

- [ ] **Looker Studio API Integration**
  - Fetch available reports
  - Auto-populate dashboards
  - Sync metadata

- [ ] **Dashboard Preview Widget** (feat/dashboard-preview)
  - Thumbnail generation
  - Quick view modal
  - Performance optimization

- [ ] **Advanced Filtering**
  - Department-based filtering
  - Role-based report visibility
  - Custom dashboard layouts

**Estimated Time:** 7-8 days

---

### Phase 5: Polish & Deployment (Week 7-8)
**Goal:** Testing, optimization, deploy to production

- [ ] **Testing & QA**
  - Manual testing all features
  - Cross-browser testing
  - Performance optimization
  - Bug fixes

- [ ] **Documentation**
  - Update GETTING-STARTED
  - Add feature guides
  - Create troubleshooting docs

- [ ] **Deployment**
  - Deploy to Firebase Hosting
  - Setup monitoring
  - Configure analytics

- [ ] **Post-Launch**
  - User feedback collection
  - Bug fixes
  - Minor improvements

**Estimated Time:** 5-7 days

---

## 🏗️ Architecture Plan

### Firestore Collections

```
/companies
  ├── stth
  │   ├── name: "Streamwash Thailand"
  │   ├── code: "STTH"
  │   ├── country: "Thailand"
  │   ├── isActive: boolean
  │   └── createdAt: timestamp
  │
  ├── sttn
  │   ├── name: "Streamwash Laos"
  │   ├── code: "STTN"
  │   └── ...
  │
  └── ... (STCS, STNR, STPT, STPK, and more)

/users
  ├── uid
  │   ├── email: string
  │   ├── displayName: string
  │   ├── photoURL: string
  │   ├── role: "user" | "moderator" | "admin"
  │   ├── company: string | null      // "STTH", "STTN", etc., null for admins
  │   ├── assignedFolders: array      // For moderators only
  │   ├── createdAt: timestamp
  │   ├── isActive: boolean
  │   └── lastLogin: timestamp

/folders
  ├── folderId
  │   ├── name: string
  │   ├── company: string             // REQUIRED: "STTH", "STTN", etc.
  │   ├── description: string
  │   ├── createdBy: uid
  │   ├── createdAt: timestamp
  │   ├── assignedModerators: array
  │   ├── subfolders: array
  │   └── isActive: boolean

/dashboards
  ├── dashboardId
  │   ├── title: string
  │   ├── description: string
  │   ├── company: string             // REQUIRED: "STTH", "STTN", etc.
  │   ├── folderId: string
  │   ├── lookerUrl: string
  │   ├── icon: string
  │   ├── createdBy: uid
  │   ├── createdAt: timestamp
  │   ├── updatedAt: timestamp
  │   └── permissions: {
  │       "company:STTH": ["view"],
  │       "role:moderator": ["view"],
  │       "role:admin": ["view", "edit", "delete"],
  │       "uid:xxx": ["view", "edit"]
  │     }

/invitations
  ├── invitationId
  │   ├── email: string
  │   ├── sentBy: uid
  │   ├── role: string
  │   ├── company: string             // Which company to invite to
  │   ├── status: "pending" | "accepted" | "rejected"
  │   ├── sentAt: timestamp
  │   └── expiresAt: timestamp
```

### Pinia Stores (Company-Scoped)

```
stores/
├── auth.ts                    // Enhanced: Add user.company field
├── companies.ts               // NEW: Manage companies list
├── users.ts                   // CRUD + invitations (company-scoped)
├── dashboards.ts              // CRUD + permissions (company-scoped)
├── folders.ts                 // NEW: Manage folders (company-scoped)
├── permissions.ts             // NEW: Check user permissions
└── ui.ts                      // Modals, notifications
```

### Pages Structure (Company-Scoped)

```
pages/
└── dashboard/
    ├── index.vue              (Dashboard - company-scoped)
    ├── companies/             (NEW - Admin only)
    │   └── index.vue          (View all companies)
    ├── users/
    │   ├── index.vue          (List users in current company)
    │   ├── [id].vue           (Edit user)
    │   └── new.vue            (Invite user to company)
    ├── folders/               (NEW - Admin only)
    │   ├── index.vue          (Manage folders)
    │   ├── [id].vue           (Edit folder)
    │   └── new.vue            (Create folder)
    ├── dashboards/
    │   ├── index.vue          (List dashboards - company-scoped)
    │   ├── [id].vue           (View/embed dashboard)
    │   ├── manage/
    │   │   ├── index.vue      (Manage dashboards - moderator/admin)
    │   │   ├── [id].vue       (Edit dashboard)
    │   │   └── new.vue        (Create dashboard)
    └── settings.vue           (Admin settings - global)
```

---

## 🚀 Next Steps

### Immediate (This Week)
1. ✅ Setup branch protection (develop branch)
2. ✅ Create Dashboard Header component
3. ⏳ **Create Sidebar Navigation component** (feat/sidebar-nav)
4. ⏳ Update dashboard layout
5. ⏳ Setup Firestore collections

### Git Flow Process
For each feature:
```bash
git checkout develop
git pull origin develop
git checkout -b feat/feature-name
# Make changes
git add .
git commit -m "feat(scope): description"
git push -u origin feat/feature-name
# Create PR, get approval, merge
git checkout develop
git pull origin develop
git branch -d feat/feature-name
```

---

## ✅ Success Criteria

- [ ] All 150 users can login with Google OAuth
- [ ] Users Management fully functional (CRUD + invitations)
- [ ] Dashboard Management working (CRUD + permissions)
- [ ] Looker Studio embeds display correctly
- [ ] Role-based access control working properly
- [ ] Performance: Page load < 2 seconds
- [ ] Mobile responsive
- [ ] 95%+ test coverage on critical paths

---

## 📈 Metrics to Track

- **Development Progress:** Sprint completion rate
- **Code Quality:** Linting errors, test coverage
- **Performance:** Bundle size, load times
- **User Feedback:** Bug reports, feature requests

---

## 🤝 Review Schedule

- **Weekly:** Check progress against roadmap
- **Bi-weekly:** Feature review & QA
- **End of phase:** Demo to stakeholders (if available)

