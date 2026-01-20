# 🗺️ StreamHub Development Roadmap

**Project:** Dashboard Management System for Streamwash  
**Timeline:** 2 months  
**Team:** Solo Development  
**Strategy:** Features → QA → Deploy (iterative)

---

## 📊 Project Overview

### Organization Structure
- **Departments:** HR, Sales, Account, Finance, Engineer, Audit, Purchase
- **Users:** 150 employees
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
**Goal:** Setup foundational features

- [x] Google Authentication
- [x] Dashboard Header Component
- [ ] **Sidebar Navigation** (feat/sidebar-nav)
- [ ] Dashboard Layout wrapper
- [ ] Base styling & theme setup
- [ ] Firestore collections structure

**Estimated Time:** 5-7 days

---

### Phase 2: Users Management (Week 2-4)
**Goal:** Full CRUD for users + invitations

- [ ] **Users List Page** (feat/users-list)
  - Table with filtering/search
  - User data display
  - Action buttons (edit, delete, view)

- [ ] **Add/Edit User Modal** (feat/user-form)
  - Form validation
  - Role/Department assignment
  - Image upload (profile)

- [ ] **User Invitations** (feat/user-invitations)
  - Bulk invite functionality
  - Email invitation system
  - Invitation tracking

- [ ] **Role Management UI** (feat/roles)
  - Display user permissions
  - Change role interface

**Estimated Time:** 10-12 days

---

### Phase 3: Dashboard Management (Week 4-6)
**Goal:** Create, edit, manage dashboards + permissions

- [ ] **Dashboards List Page** (feat/dashboards-list)
  - Display available dashboards
  - Filter by department
  - Search functionality

- [ ] **Dashboard Creation Form** (feat/create-dashboard)
  - Looker Studio URL input
  - Title, description, icon
  - Department assignment

- [ ] **Dashboard Edit Page** (feat/edit-dashboard)
  - Update dashboard info
  - Manage access permissions
  - Preview embed

- [ ] **Access Control Settings** (feat/dashboard-permissions)
  - Role-based access matrix
  - Department-level permissions
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
/users
  ├── uid
  │   ├── email: string
  │   ├── displayName: string
  │   ├── photoURL: string
  │   ├── role: "user" | "moderator" | "admin"
  │   ├── department: string
  │   ├── createdAt: timestamp
  │   ├── isActive: boolean
  │   └── invitedAt: timestamp

/dashboards
  ├── dashboardId
  │   ├── title: string
  │   ├── description: string
  │   ├── lookerUrl: string
  │   ├── icon: string
  │   ├── department: string
  │   ├── createdBy: uid
  │   ├── createdAt: timestamp
  │   └── permissions: {
  │       "department:HR": ["view", "edit"],
  │       "role:admin": ["view", "edit", "delete"],
  │       "uid:xxx": ["view"]
  │     }

/departments
  ├── departmentId
  │   ├── name: string
  │   ├── description: string
  │   └── createdAt: timestamp

/invitations
  ├── invitationId
  │   ├── email: string
  │   ├── sentBy: uid
  │   ├── role: string
  │   ├── department: string
  │   ├── status: "pending" | "accepted" | "rejected"
  │   ├── sentAt: timestamp
  │   └── expiresAt: timestamp
```

### Pinia Stores

```
stores/
├── auth.ts (existing)
├── users.ts (CRUD + invitations)
├── dashboards.ts (CRUD + permissions)
├── departments.ts (list)
└── ui.ts (modals, notifications)
```

### Pages Structure

```
pages/
└── dashboard/
    ├── index.vue (main dashboard)
    ├── users/
    │   ├── index.vue (list)
    │   ├── [id].vue (edit)
    │   └── new.vue (create)
    ├── dashboards/
    │   ├── index.vue (list)
    │   ├── [id].vue (view/embed)
    │   ├── manage/
    │   │   ├── index.vue (manage list)
    │   │   ├── [id].vue (edit)
    │   │   └── new.vue (create)
    └── settings.vue (admin settings)
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

