# StreamHub — Manual Test Plan

> **Last Updated:** 7 April 2569
> **Total Test Cases:** 144
> **Roles Required:** Admin, Moderator, User (unauthenticated)

---

## สารบัญ

1. [Authentication & Onboarding](#1-authentication--onboarding)
2. [Dashboard Pages](#2-dashboard-pages)
3. [Admin Pages](#3-admin-pages)
4. [Moderator Pages](#4-moderator-pages)
5. [Cross-Cutting Concerns](#5-cross-cutting-concerns)
6. [Error Scenarios & Edge Cases](#6-error-scenarios--edge-cases)
7. [Cross-Browser & Responsive](#7-cross-browser--responsive)
8. [Test Case Summary](#8-test-case-summary)
9. [Testing Environment Setup](#9-testing-environment-setup)
10. [Regression Checklist](#10-regression-checklist)

---

## 1. Authentication & Onboarding

### 1.1 Login Page (`/login`)

| Layout: `auth` | Role: Unauthenticated |
|---|---|

**Components:** Logo, Google Sign-In button, ErrorDialog

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 1.1.1 | Valid Google sign-in (existing user) | 1. Go to `/login` 2. Click "Sign in with Google" 3. Complete Google OAuth | Redirect to `/dashboard` | Critical | ✅ |
| 1.1.2 | Sign-in with pending invitation | 1. Create invitation for email X 2. Sign in with email X | Auto-accept invitation, redirect to `/dashboard` | Critical | ✅ |
| 1.1.3 | Sign-in with non-existent user | 1. Sign in with unregistered Google account | Error: "ไม่พบบัญชีในระบบ" + "ขอสิทธิ์การเข้าถึง" button | Critical | ✅ |
| 1.1.4 | Sign-in with inactive account | 1. Deactivate user in admin 2. Sign in with that account | Error: "บัญชีถูกระงับ" | High | ✅ |
| 1.1.5 | Sign-out and re-sign-in | 1. Sign out 2. Sign in again | Session resets, redirect to `/dashboard` | High | ✅ |
| 1.1.6 | Already authenticated → `/login` | 1. While logged in, navigate to `/login` | Redirect away from login (to `/dashboard`) | Medium | ✅ |

---

### 1.2 Invite Accept Page (`/invite/accept?code={code}`)

| Layout: Custom | Role: Public (no auth required) |
|---|---|

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 1.2.1 | Valid code, not logged in | 1. Open invite link 2. Verify details shown | Show invitation details + Accept button | Critical | ✅ |
| 1.2.2 | Valid code, matching email logged in | 1. Log in with invited email 2. Open invite link | Auto-accept, redirect to `/dashboard/discover` | Critical | ✅ |
| 1.2.3 | Valid code, mismatched email | 1. Log in with different email 2. Open invite link | Warning: "อีเมลไม่ตรงกัน" แสดงอีเมลที่ login และอีเมลที่ได้รับเชิญ + ปุ่ม "ออกจากระบบและใช้บัญชีที่ถูกต้อง" | High | ✅ |
| 1.2.4 | Invalid invitation code | 1. Open link with invalid code 2. Open link with empty code | Error: "คำเชิญไม่ถูกต้อง" — code ผิดแสดง "ไม่พบคำเชิญหรือคำเชิญไม่ถูกต้อง", code ว่างแสดง "ไม่พบรหัสคำเชิญ" + ลิงก์ "กลับไปหน้าเข้าสู่ระบบ" | High | ✅ |
| 1.2.5 | Expired invitation code | 1. Open link with expired code | Error: "คำเชิญหมดอายุแล้ว" + "คำเชิญนี้หมดอายุแล้ว กรุณาติดต่อผู้ดูแลระบบเพื่อขอคำเชิญใหม่" + ลิงก์ "กลับไปหน้าเข้าสู่ระบบ" | High | ✅ |
| 1.2.6 | Already accepted invitation | 1. Accept invitation 2. Open same link again | Info: "คำเชิญนี้ถูกใช้งานไปแล้ว" + "คำเชิญนี้ได้รับการยืนยันเรียบร้อยแล้ว" + ลิงก์ "ไปที่หน้าหลัก" | Medium | ✅ |

---

## 2. Dashboard Pages

### 2.1 Dashboard Home (`/dashboard`)

| Middleware: `auth` | Role: All authenticated |
|---|---|

**Components:** Welcome greeting, Recent dashboards, Quick actions, Sidebar folder tree

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 2.1.1 | User role — home view | 1. Login as User 2. Go to `/dashboard` | Shows personal section only (no company overview) | High | ☐ |
| 2.1.2 | Moderator role — home view | 1. Login as Moderator 2. Go to `/dashboard` | Shows personal section + company overview cards | High | ☐ |
| 2.1.3 | Admin role — home view | 1. Login as Admin 2. Go to `/dashboard` | Shows personal section + company overview cards | High | ☐ |
| 2.1.4a | Recent dashboards — empty state (first login) | 1. Login (no prior visits) 2. Go to `/dashboard` | "ไม่มีแดชบอร์ดล่าสุด" empty state แสดง | Medium | ✅ |
| 2.1.4b | Recent dashboards — after visit | 1. Open any dashboard 2. Return to `/dashboard` | Dashboard ที่เพิ่งเปิดขึ้นบนสุดใน "แดชบอร์ดล่าสุด" พร้อม "เปิดล่าสุด: เมื่อกี้" | Medium | ✅ |
| 2.1.5 | Click "Dashboards" quick action | 1. Click "Dashboards" card | Navigate to `/dashboard/discover` | Medium | ☐ |
| 2.1.6 | Sidebar folder navigation | 1. Click folder in sidebar tree | Filters content by selected folder | Medium | ☐ |

---

### 2.2 Dashboard Discover (`/dashboard/discover`)

| Middleware: `auth` | Role: All authenticated |
|---|---|

**Query Params:** `?filter=my|shared`, `?folder={id}`, `?tag={id}`, `?company={code}`

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 2.2.1 | Filter by folder | 1. Select folder from dropdown | Only dashboards in that folder display | High | ☐ |
| 2.2.2 | Filter by tag | 1. Select tag from dropdown | Only dashboards with that tag display | High | ☐ |
| 2.2.3 | Multi-filter (folder + tag) | 1. Select folder 2. Select tag | Intersection of both criteria | High | ☐ |
| 2.2.4 | Search by name | 1. Type in search bar | Real-time filter by dashboard name | High | ☐ |
| 2.2.5 | Search + filter combination | 1. Apply tag filter 2. Type search | Search applies within filtered set | Medium | ☐ |
| 2.2.6 | Switch view mode (Grid) | 1. Click Grid view button | Dashboard cards in grid layout | Medium | ☐ |
| 2.2.7 | Switch view mode (Compact) | 1. Click Compact view button | Dashboard cards in compact layout | Medium | ☐ |
| 2.2.8 | Group By Folder | 1. Select "Group By: Folder" | Dashboards grouped by folder with headers | Medium | ☐ |
| 2.2.9 | Expand/Collapse All groups | 1. Group by folder 2. Click "Collapse All" 3. Click "Expand All" | Groups collapse then expand | Low | ☐ |
| 2.2.10 | Admin — archive toggle | 1. Login as Admin 2. Toggle "Show Archived" | Archived dashboards appear/disappear | High | ☐ |
| 2.2.11 | URL query params preserve filters | 1. Apply filters 2. Copy URL 3. Open in new tab | Same filters applied | Medium | ☐ |
| 2.2.12 | Click dashboard card | 1. Click a dashboard card | Navigate to `/dashboard/view/{id}` | High | ☐ |

---

### 2.3 Dashboard View (`/dashboard/view/[id]`)

| Middleware: `auth` | Role: Authorized users (by permission) |
|---|---|

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 2.3.1 | Owner views own dashboard | 1. Login as owner 2. Open dashboard | All actions available (edit, share, archive) | High | ☐ |
| 2.3.2 | Authorized user views shared dashboard | 1. Login as user with access 2. Open dashboard | Dashboard renders, limited actions | High | ☐ |
| 2.3.3 | Unauthorized user access | 1. Login as user without access 2. Open dashboard URL | "Access Denied" error + "Go Back" button | Critical | ☐ |
| 2.3.4 | Admin views any dashboard | 1. Login as Admin 2. Open any dashboard | All actions available | High | ☐ |
| 2.3.5 | Dashboard embed renders | 1. Open dashboard with Looker URL | Iframe/embed loads correctly | High | ☐ |
| 2.3.6 | Fullscreen toggle | 1. Click fullscreen button 2. Click again to exit | Dashboard expands/shrinks | Low | ☐ |
| 2.3.7 | Archive dashboard (Admin) | 1. Login as Admin 2. Click Archive | Dashboard marked as archived, badge shown | High | ☐ |
| 2.3.8 | Unarchive dashboard (Admin) | 1. View archived dashboard 2. Click Unarchive | Dashboard restored to active | High | ☐ |
| 2.3.9 | Edit dashboard metadata | 1. Click Edit 2. Change name 3. Save | Name updated in header | Medium | ☐ |
| 2.3.10 | Go back button | 1. Click back button | Navigate to `/dashboard/discover` | Low | ☐ |

---

## 3. Admin Pages

> **Middleware:** `auth` + `admin` — Non-admin users redirected to `/dashboard/discover`

### 3.1 Admin Overview (`/admin/overview`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.1.1 | Statistics display | 1. Go to `/admin/overview` | User/Dashboard/Folder/Company counts shown | High | ☐ |
| 3.1.2 | Statistics accuracy | 1. Compare stats with actual data | Counts match actual Firestore records | Medium | ☐ |
| 3.1.3 | Quick action — Manage Users | 1. Click "Manage Users" card | Navigate to `/admin/users` | Medium | ☐ |
| 3.1.4 | Quick action — Manage Dashboards | 1. Click "Manage Dashboards" card | Navigate to `/admin/dashboards` | Medium | ☐ |
| 3.1.5 | Non-admin redirect | 1. Login as User 2. Go to `/admin/overview` | Redirect to `/dashboard/discover` | Critical | ☐ |

---

### 3.2 Admin Users (`/admin/users`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.2.1 | Search by email | 1. Type email in search bar | Matching users shown | High | ☐ |
| 3.2.2 | Filter by role | 1. Select "Moderator" from role dropdown | Only moderators shown | High | ☐ |
| 3.2.3 | Filter by company | 1. Select company from dropdown | Only users in that company shown | Medium | ☐ |
| 3.2.4 | Multi-filter (role + company) | 1. Select role 2. Select company | Intersection of filters | Medium | ☐ |
| 3.2.5 | Create new user | 1. Click "เพิ่มผู้ใช้" 2. Fill form 3. Submit | User added to table, toast shown | High | ☐ |
| 3.2.6 | Edit existing user | 1. Click Edit on user 2. Change role 3. Save | User updated, table reflects change | High | ☐ |
| 3.2.7 | Delete user | 1. Click Delete 2. Confirm in dialog | User removed, toast shown | High | ☐ |
| 3.2.8 | Toggle user active status | 1. Click toggle switch on user row | Status updates inline via API | Medium | ☐ |
| 3.2.9 | Form validation — missing email | 1. Open create form 2. Leave email empty 3. Submit | Validation error shown | Medium | ☐ |
| 3.2.10 | Cancel modal without saving | 1. Open create form 2. Fill partially 3. Click Cancel | No changes made, modal closes | Low | ☐ |

---

### 3.3 Admin Folders (`/admin/folders`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.3.1 | Create root folder | 1. Click "เพิ่มโฟลเดอร์" 2. No parent selected 3. Submit | Root folder created | High | ☐ |
| 3.3.2 | Create child folder | 1. Click "เพิ่มโฟลเดอร์" 2. Select parent 3. Submit | Subfolder created under parent | High | ☐ |
| 3.3.3 | Edit folder name | 1. Click Edit 2. Change name 3. Save | Name updated in table | Medium | ☐ |
| 3.3.4 | Delete empty folder | 1. Click Delete on folder with no children/dashboards 2. Confirm | Folder removed | High | ☐ |
| 3.3.5 | Delete folder with children | 1. Click Delete on folder with subfolders | Error: "ไม่สามารถลบโฟลเดอร์ที่มีโฟลเดอร์ย่อย" | High | ☐ |
| 3.3.6 | Search by name | 1. Type name in search bar | Matching folders shown | Medium | ☐ |
| 3.3.7 | Toggle folder active status | 1. Click toggle switch | Status updates inline | Medium | ☐ |
| 3.3.8 | Folder hierarchy display | 1. View table | Parent folder shown in column | Low | ☐ |

---

### 3.4 Admin Dashboards (`/admin/dashboards`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.4.1 | Search by name | 1. Type dashboard name in search | Matching dashboards shown | High | ☐ |
| 3.4.2 | Filter by archive status | 1. Toggle archive filter | Archived/active dashboards filtered | High | ☐ |
| 3.4.3 | Create dashboard | 1. Click "เพิ่มแดชบอร์ด" 2. Fill name, folder, owner 3. Submit | Dashboard created, toast shown | High | ☐ |
| 3.4.4 | Edit dashboard | 1. Click Edit 2. Change fields 3. Save | Dashboard updated in table | High | ☐ |
| 3.4.5 | Delete dashboard | 1. Click Delete 2. Confirm | Dashboard removed | High | ☐ |
| 3.4.6 | Toggle archive status | 1. Click archive toggle on row | Dashboard archived/unarchived | High | ☐ |
| 3.4.7 | Form validation | 1. Submit form with missing required fields | Validation errors shown | Medium | ☐ |
| 3.4.8 | Dashboard with Looker URL | 1. Create dashboard with Looker URL 2. View it | Dashboard renders embed | Medium | ☐ |

---

### 3.5 Admin Companies (`/admin/companies`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.5.1 | Search by name/code | 1. Type in search bar | Matching companies shown | Medium | ☐ |
| 3.5.2 | Filter by region | 1. Select region from dropdown | Companies in that region shown | Medium | ☐ |
| 3.5.3 | Create company | 1. Click "เพิ่มบริษัท" 2. Fill code, name 3. Submit | Company created | High | ☐ |
| 3.5.4 | Unique code validation | 1. Create company with existing code | Error: "รหัสบริษัทซ้ำ" | High | ☐ |
| 3.5.5 | Edit company | 1. Click Edit 2. Change fields 3. Save | Company updated | Medium | ☐ |
| 3.5.6 | Delete company | 1. Click Delete 2. Confirm | Company removed | Medium | ☐ |
| 3.5.7 | Move Up/Down reorder | 1. Click Move Up on company | sortOrder swaps with adjacent | Medium | ☐ |
| 3.5.8 | Toggle active status | 1. Click toggle switch | Status updates | Low | ☐ |

---

### 3.6 Admin Regions (`/admin/regions`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.6.1 | CRUD — Create region | 1. Click "เพิ่มภูมิภาค" 2. Fill code, name 3. Submit | Region created | Medium | ☐ |
| 3.6.2 | CRUD — Edit region | 1. Click Edit 2. Change name 3. Save | Region updated | Medium | ☐ |
| 3.6.3 | CRUD — Delete region | 1. Click Delete (no companies reference it) 2. Confirm | Region removed | Medium | ☐ |
| 3.6.4 | Move Up/Down reorder | 1. Click Move Up/Down | sortOrder swaps | Low | ☐ |
| 3.6.5 | Unique code validation | 1. Create with existing code | Validation error shown | Medium | ☐ |

---

### 3.7 Admin Groups (`/admin/groups`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.7.1 | Create group with members | 1. Click "เพิ่มกลุ่ม" 2. Fill name 3. Select members 4. Submit | Group created with members | High | ☐ |
| 3.7.2 | Edit group members | 1. Click Edit 2. Add/remove members 3. Save | Members updated | High | ☐ |
| 3.7.3 | View group details | 1. Click View on group | Modal shows group info + member list | Medium | ☐ |
| 3.7.4 | Delete group | 1. Click Delete 2. Confirm | Group removed | Medium | ☐ |
| 3.7.5 | Toggle group active status | 1. Click toggle switch | Status updates | Low | ☐ |
| 3.7.6 | Search by name | 1. Type in search bar | Matching groups shown | Low | ☐ |

---

### 3.8 Admin Tags (`/admin/tags`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.8.1 | Create tag | 1. Click "เพิ่มแท็ก" 2. Fill name, slug 3. Submit | Tag created | Medium | ☐ |
| 3.8.2 | Slug format validation | 1. Enter slug with spaces/uppercase | Error or auto-converts to lowercase-underscore | Medium | ☐ |
| 3.8.3 | Edit tag | 1. Click Edit 2. Change name 3. Save | Tag updated | Medium | ☐ |
| 3.8.4 | Delete tag | 1. Click Delete 2. Confirm | Tag removed | Medium | ☐ |
| 3.8.5 | Move Up/Down reorder | 1. Click Move Up/Down | sortOrder swaps | Low | ☐ |
| 3.8.6 | Unique slug validation | 1. Create with existing slug | Validation error shown | Medium | ☐ |
| 3.8.7 | Permission check (canManageTags) | 1. Login as admin without tag permission | Redirected or features hidden | Low | ☐ |

---

### 3.9 Admin Invitations (`/admin/invitations`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.9.1 | View all invitations | 1. Go to `/admin/invitations` | Table loads with pagination | High | ☐ |
| 3.9.2 | Filter by status tab | 1. Click "Pending" / "Accepted" / "Expired" tab | Shows only selected status | High | ☐ |
| 3.9.3 | Search by email | 1. Type email in search bar | Matching invitations shown | Medium | ☐ |
| 3.9.4 | Send single invitation | 1. Click "เชิญผู้ใช้" 2. Fill email, role, company 3. Submit | Email sent, record created in table | Critical | ☐ |
| 3.9.5 | Resend pending invitation | 1. Click "ส่งอีกครั้ง" on pending invitation 2. Confirm | New email sent, expiry extended | Critical | ☐ |
| 3.9.6 | Cancel pending invitation | 1. Click "ยกเลิก" on pending invitation 2. Confirm | Status changes to "cancelled" | High | ☐ |
| 3.9.7 | Delete invitation record | 1. Click Delete 2. Confirm | Record removed from table | Medium | ☐ |
| 3.9.8 | Bulk invite via CSV | 1. Click "เชิญหลายคน" 2. Upload CSV 3. Preview 4. Submit | Multiple emails sent, records created | High | ☐ |
| 3.9.9 | Expired invitation auto-detect | 1. View invitation past expiry date | Status shows "expired" (client-side) | Medium | ☐ |
| 3.9.10 | Resend already accepted | 1. Try resend on accepted invitation | Resend button hidden or disabled | Medium | ☐ |

---

### 3.10 Admin Permissions (`/admin/permissions`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.10.1 | Add user to dashboard | 1. Select dashboard 2. Add user 3. Save | User gains access | High | ☐ |
| 3.10.2 | Remove user from dashboard | 1. Select dashboard 2. Remove user 3. Save | User loses access | High | ☐ |
| 3.10.3 | Add group to dashboard | 1. Select dashboard 2. Add group 3. Save | All group members gain access | High | ☐ |
| 3.10.4 | Set role restriction (Layer 3) | 1. Select dashboard 2. Set restriction 3. Save | Access overridden by restriction | Medium | ☐ |
| 3.10.5 | Verify permission applies | 1. Grant user access to dashboard 2. Login as that user 3. View dashboard | Dashboard accessible | High | ☐ |

---

### 3.11 Admin Health (`/admin/health`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.11.1 | Health page loads | 1. Go to `/admin/health` | Status indicators displayed | Medium | ☐ |
| 3.11.2 | All services OK | 1. Verify green indicators | Firestore, Auth, Email all green | Medium | ☐ |
| 3.11.3 | Environment info | 1. Check mode display | Shows "production" and correct App URL | Low | ☐ |

---

### 3.12 Admin Audit Logs (`/admin/audit`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.12.1 | View audit logs | 1. Go to `/admin/audit` | Table shows activity records | Medium | ☐ |
| 3.12.2 | Filter by action type | 1. Select "create" from action dropdown | Only create actions shown | Medium | ☐ |
| 3.12.3 | Filter by company | 1. Select company from dropdown | Company-specific actions shown | Medium | ☐ |
| 3.12.4 | Filter by date range | 1. Set from/to dates | Actions within range shown | Medium | ☐ |
| 3.12.5 | Search by user | 1. Type user email in search | User's actions shown | Medium | ☐ |
| 3.12.6 | Multi-filter combination | 1. Apply action + company + date filters | Intersection of all criteria | Low | ☐ |
| 3.12.7 | Export to CSV | 1. Click Export button | CSV file downloaded | Medium | ☐ |
| 3.12.8 | Pagination works | 1. Navigate between pages | Correct page data loads | Low | ☐ |

---

### 3.13 Admin Explorer (`/admin/explorer`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.13.1 | Navigate folder hierarchy | 1. Click folders in tree | Breadcrumb updates, content changes | High | ☐ |
| 3.13.2 | Create subfolder | 1. Click "สร้างโฟลเดอร์" 2. Fill form 3. Submit | Subfolder appears in tree and list | High | ☐ |
| 3.13.3 | Create dashboard in folder | 1. Navigate to folder 2. Click "สร้างแดชบอร์ด" 3. Submit | Dashboard appears in current folder | High | ☐ |
| 3.13.4 | Assign moderators to folder | 1. Click folder settings 2. Select moderators 3. Save | Moderators assigned | High | ☐ |
| 3.13.5 | Delete empty folder | 1. Click Delete on empty folder 2. Confirm | Folder removed from tree | Medium | ☐ |
| 3.13.6 | Delete folder with content | 1. Click Delete on folder with dashboards | Error message shown | Medium | ☐ |
| 3.13.7 | Breadcrumb navigation | 1. Navigate deep 2. Click breadcrumb segment | Jumps to that folder level | Low | ☐ |

---

## 4. Moderator Pages

### 4.1 Moderator Explorer (`/manage/explorer`)

| Middleware: `auth` | Role: Moderator |
|---|---|

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 4.1.1 | View assigned folders | 1. Login as Moderator 2. Go to `/manage/explorer` | Assigned folders shown, others disabled | High | ☐ |
| 4.1.2 | Create dashboard in assigned folder | 1. Navigate to assigned folder 2. Create dashboard | Dashboard created successfully | High | ☐ |
| 4.1.3 | Create dashboard in unassigned folder | 1. Try to create in unassigned folder | Error: "ไม่มีสิทธิ์" or button hidden | High | ☐ |
| 4.1.4 | Delete dashboard in assigned folder | 1. Delete own dashboard in assigned folder | Success | Medium | ☐ |
| 4.1.5 | Cannot reassign moderators | 1. Open folder settings | Moderator assignment hidden/disabled | Medium | ☐ |
| 4.1.6 | View unassigned folders (read-only) | 1. Click unassigned folder in tree | Shows content but no create/edit actions | Medium | ☐ |

---

### 4.2 Moderator Permissions (`/manage/permissions`)

| Middleware: `auth` | Role: Moderator |
|---|---|

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 4.2.1 | View manageable dashboards | 1. Go to `/manage/permissions` | Only dashboards in assigned folders shown | High | ☐ |
| 4.2.2 | Add user to dashboard | 1. Select dashboard 2. Add user 3. Save | User gains access | High | ☐ |
| 4.2.3 | Remove user from dashboard | 1. Select dashboard 2. Remove user 3. Save | User loses access | High | ☐ |
| 4.2.4 | Layer 3 restrictions hidden | 1. Check permission editor | Layer 3 (restrictions) not visible | Medium | ☐ |
| 4.2.5 | Cannot view unassigned dashboards | 1. Check list of dashboards | Unassigned dashboards not in list | Medium | ☐ |

---

## 5. Cross-Cutting Concerns

### 5.1 CRUD Pattern (ทุกหน้า Admin)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 5.1.1 | Create → Toast success | 1. Create any resource | Toast: "สร้างสำเร็จ" | High | ☐ |
| 5.1.2 | Update → Toast success | 1. Edit any resource | Toast: "อัปเดตสำเร็จ" | High | ☐ |
| 5.1.3 | Delete → Confirm dialog | 1. Click Delete on any resource | ConfirmDialog opens before delete | High | ☐ |
| 5.1.4 | Form validation — Zod errors | 1. Submit form with invalid data | Field-level error messages shown | High | ☐ |
| 5.1.5 | Modal close without saving | 1. Open modal 2. Fill data 3. Click Cancel | No changes persisted | Medium | ☐ |
| 5.1.6 | Loading state during API call | 1. Submit form (slow network) | Spinner shown, button disabled | Medium | ☐ |

### 5.2 Navigation & Middleware

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 5.2.1 | Unauthenticated → `/admin/*` | 1. Open admin URL without login | Redirect to `/login` | Critical | ☐ |
| 5.2.2 | User role → `/admin/*` | 1. Login as User 2. Go to `/admin/users` | Redirect to `/dashboard/discover` | Critical | ☐ |
| 5.2.3 | Moderator → `/admin/*` | 1. Login as Moderator 2. Go to `/admin/users` | Redirect to `/dashboard/discover` | Critical | ☐ |
| 5.2.4 | Sidebar reflects role | 1. Login as each role | Sidebar shows role-appropriate menu items | High | ☐ |
| 5.2.5 | Sidebar visibility on mobile | 1. Open on mobile viewport | Sidebar in drawer, toggle button visible | Medium | ☐ |

---

## 6. Error Scenarios & Edge Cases

### 6.1 Authentication Errors

| # | Scenario | Expected Behavior | Status |
|---|----------|-------------------|--------|
| 6.1.1 | Token expired during action | Redirect to `/login`, preserve returnTo URL | ☐ |
| 6.1.2 | User account deactivated mid-session | Error on next page load, force logout | ☐ |
| 6.1.3 | Permission revoked mid-session | Middleware redirects from protected routes | ☐ |

### 6.2 Data Errors

| # | Scenario | Expected Behavior | Status |
|---|----------|-------------------|--------|
| 6.2.1 | Folder deleted while dashboard still references it | Graceful display (show orphan or error) | ☐ |
| 6.2.2 | User deleted while showing in admin table | Show UID or "User not found" | ☐ |
| 6.2.3 | Folder has children — delete attempt | Error: "ไม่สามารถลบโฟลเดอร์ที่มีข้อมูล" | ☐ |

### 6.3 Network Errors

| # | Scenario | Expected Behavior | Status |
|---|----------|-------------------|--------|
| 6.3.1 | Slow API response | Loading spinner shown | ☐ |
| 6.3.2 | API 500 error | Error toast: "เกิดข้อผิดพลาด กรุณาลองใหม่" | ☐ |
| 6.3.3 | API 404 (resource not found) | Error: "ไม่พบข้อมูล" | ☐ |

---

## 7. Cross-Browser & Responsive

### 7.1 Browsers

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest 2 | ☐ |
| Firefox | Latest 2 | ☐ |
| Safari | Latest 2 | ☐ |
| Edge | Latest | ☐ |

### 7.2 Responsive Breakpoints

| Breakpoint | Width | Key Checks | Status |
|------------|-------|------------|--------|
| Mobile | 320–640px | Sidebar in drawer, modals full-width, tables scroll horizontal | ☐ |
| Tablet | 641–1024px | Sidebar narrow, responsive grid | ☐ |
| Desktop | 1025px+ | Full layout, sidebar visible | ☐ |

---

## 8. Test Case Summary

| Page | # Tests | Priority | Status |
|------|---------|----------|--------|
| Login | 6 | Critical | ☐ |
| Invite Accept | 6 | Critical | ☐ |
| Dashboard Home | 6 | High | ☐ |
| Dashboard Discover | 12 | High | ☐ |
| Dashboard View | 10 | High | ☐ |
| Admin Overview | 5 | High | ☐ |
| Admin Users | 10 | High | ☐ |
| Admin Folders | 8 | High | ☐ |
| Admin Dashboards | 8 | High | ☐ |
| Admin Companies | 8 | Medium | ☐ |
| Admin Regions | 5 | Medium | ☐ |
| Admin Groups | 6 | Medium | ☐ |
| Admin Tags | 7 | Medium | ☐ |
| Admin Invitations | 10 | Critical | ☐ |
| Admin Permissions | 5 | High | ☐ |
| Admin Health | 3 | Low | ☐ |
| Admin Audit Logs | 8 | Medium | ☐ |
| Admin Explorer | 7 | High | ☐ |
| Moderator Explorer | 6 | High | ☐ |
| Moderator Permissions | 5 | High | ☐ |
| Cross-Cutting (CRUD) | 6 | High | ☐ |
| Navigation & Middleware | 5 | Critical | ☐ |
| Error Scenarios | 9 | Medium | ☐ |
| **TOTAL** | **161** | — | — |

---

## 9. Testing Environment Setup

### Prerequisite Data

- [ ] Admin account (Google sign-in)
- [ ] Moderator account (Google sign-in)
- [ ] User account (Google sign-in)
- [ ] 3+ companies (e.g., STTH, INFE, TEST)
- [ ] 3+ regions
- [ ] 5+ folders (nested hierarchy, 2+ levels)
- [ ] 20+ dashboards across folders
- [ ] 5+ groups with members
- [ ] 10+ tags
- [ ] 3+ pending invitations (for resend/cancel/accept tests)

### Test Accounts

| Email | Role | Company | Notes |
|-------|------|---------|-------|
| it.streamwash@gmail.com | Admin | STTH | Primary test admin |
| (moderator email) | Moderator | STTH | Assigned to specific folders |
| (user email) | User | STTH | Basic dashboard viewer |
| (new test email) | — | — | For invitation accept testing |

---

## 10. Regression Checklist

> ทำเครื่องหมาย ✅ เมื่อทดสอบผ่านในแต่ละ release

- [ ] CRUD ทุกหน้า (create, read, update, delete)
- [ ] Permissions enforce ถูกต้องตาม role
- [ ] Navigation ระหว่างหน้าทำงาน
- [ ] Search และ Filters ทำงานทุกหน้า admin
- [ ] Forms validate input ถูกต้อง
- [ ] Modals open/close ถูกต้อง
- [ ] Toasts แสดง success/error messages
- [ ] API calls ใช้ endpoint ถูกต้อง
- [ ] Auth middleware redirect ผู้ใช้ที่ไม่ได้ login
- [ ] Admin middleware enforce admin role
- [ ] Error dialogs แสดงถูกต้อง
- [ ] Sidebar navigation แสดงตาม role ผู้ใช้
- [ ] Dashboard view embed/display ถูกต้อง
- [ ] Archive/Unarchive ทำงาน
- [ ] Pagination โหลดข้อมูลถูกต้อง
- [ ] Export (CSV) ทำงาน
- [ ] Email invitation ส่งสำเร็จ (Resend dashboard)
- [ ] Mobile responsive layout ใช้งานได้
