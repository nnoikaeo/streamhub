# StreamHub — Manual Test Plan

> **Last Updated:** 20 August 2569
> **Total Test Cases:** 211
> **Roles Required:** Admin, Moderator, User (unauthenticated)

### Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Verified by running the real UI (human tester / live browser) |
| 🔍 | **Code-verified only** — logic confirmed in source, NOT yet exercised through the UI. Still needs a human UI pass to become ✅ |
| ❌ | Tested via UI and **failed** — see Known Bugs |
| ☐ | Not yet checked |
| ⊘ N/A | **เคสนี้ไม่มีทางกดจริงได้** — page/feature ถูกถอดหรือมีของใหม่มาแทน (legacy orphan route ที่ไม่มีลิงก์ในไซด์บาร์), หรือ**เงื่อนไขตั้งต้นประกอบขึ้นมาไม่ได้เลยในสถาปัตยกรรมปัจจุบัน** (6.3.2 = ไม่มี REST ของเราที่จะตอบ 500, 3.8.7 = ไม่มี per-user permission override); ไม่นับรวมใน coverage |

> 🔍 เคยเป็นสถานะของทั้งกลุ่มเคสที่ยืนยันด้วยการอ่านโค้ดอย่างเดียว ตอนนี้เหลือตัวเดียวคือ **6.3.1** ซึ่งจงใจไม่กด (เหตุผลอยู่ในแถวนั้น) · ที่เหลือถูกกดจริงหมดแล้ว รวมถึงเคสที่ต้องใช้ข้อมูลซึ่ง UI สร้างเองไม่ได้ — เคสพวกนั้นมี fixture ของตัวเองใน `scripts/` (ดู §9 Testing Environment Setup) ที่เขียนสภาพตั้งต้นลง Firestore แล้วคืนค่าให้ได้ครบ

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

**Components:** Welcome greeting, Recent dashboards, Quick actions
> **Note:** Sidebar folder tree ถูก remove ออกตั้งแต่ Phase 5 redesign — folders เป็น filter บน `/dashboard/discover` แทน

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 2.1.1 | User role — home view | 1. Login as User 2. Go to `/dashboard` | Shows personal section only (no company overview) | High | ✅ |
| 2.1.2 | Moderator role — home view | 1. Login as Moderator 2. Go to `/dashboard` | Shows personal section + company overview cards | High | ✅ |
| 2.1.3 | Admin role — home view | 1. Login as Admin 2. Go to `/dashboard` | Shows personal section + company overview cards | High | ✅ |
| 2.1.4a | Recent dashboards — empty state (first login) | 1. Login (no prior visits) 2. Go to `/dashboard` | "ไม่มีแดชบอร์ดล่าสุด" empty state แสดง | Medium | ✅ |
| 2.1.4b | Recent dashboards — after visit | 1. Open any dashboard 2. Return to `/dashboard` | Dashboard ที่เพิ่งเปิดขึ้นบนสุดใน "แดชบอร์ดล่าสุด" พร้อม "เปิดล่าสุด: เมื่อกี้" | Medium | ✅ |
| 2.1.5 | Click "Dashboards" quick action | 1. Click "Dashboards" card | Navigate to `/dashboard/discover` | Medium | ✅ |
| 2.1.6 | Sidebar folder navigation | N/A — folder tree removed from sidebar (Phase 5 redesign); folders are now filters on `/dashboard/discover` | — | Low | ⊘ N/A |
| 2.1.7 | ปุ่ม "สร้างแดชบอร์ด" ที่การ์ดการดำเนินการด่วน | 1. login admin หรือ moderator 2. `/dashboard` 3. กด ➕ สร้างแดชบอร์ด | admin → `/admin/explorer` · moderator → `/manage/explorer` (เดิมยิงไป `/dashboard/create` ที่ไม่มีอยู่ = หน้า 404 เต็มจอ) | High | ✅ (prod-equivalent 2026-08-20 ทั้งสอง role) |

---

### 2.2 Dashboard Discover (`/dashboard/discover`)

| Middleware: `auth` | Role: All authenticated |
|---|---|

**Query Params:** `?filter=my|shared`, `?folder={id}`, `?tag={id}`, `?company={code}`

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 2.2.1 | Filter by folder | 1. Select folder from dropdown | Only dashboards in that folder display | High | ✅ |
| 2.2.2 | Filter by tag | 1. Select tag from dropdown | Only dashboards with that tag display | High | ✅ |
| 2.2.3 | Multi-filter (folder + tag) | 1. Select folder 2. Select tag | Intersection of both criteria | High | ✅ |
| 2.2.4 | Search by name | 1. Type in search bar | Real-time filter by dashboard name | High | ✅ |
| 2.2.5 | Search + filter combination | 1. Apply tag filter 2. Type search | Search applies within filtered set | Medium | ✅ |
| 2.2.6 | Switch view mode (Grid) | 1. Click Grid view button | Dashboard cards in grid layout | Medium | ✅ |
| 2.2.7 | Switch view mode (Compact) | 1. Click Compact view button | Dashboard cards in compact layout | Medium | ✅ |
| 2.2.8 | Group By Folder | 1. Select "Group By: Folder" | Dashboards grouped by folder with headers | Medium | ✅ |
| 2.2.9 | Expand/Collapse All groups | 1. Group by folder 2. Click "Collapse All" 3. Click "Expand All" | Groups collapse then expand | Low | ✅ |
| 2.2.10 | Admin — archive toggle | 1. Login as Admin 2. Toggle "Show Archived" | Archived dashboards appear/disappear | High | ✅ |
| 2.2.11 | URL query params preserve filters | 1. Apply filters 2. Copy URL 3. Open in new tab | Same filters applied | Medium | ✅ |
| 2.2.12 | Click dashboard card | 1. Click a dashboard card | Navigate to `/dashboard/view/{id}` | High | ✅ |

---

### 2.3 Dashboard View (`/dashboard/view/[id]`)

| Middleware: `auth` | Role: Authorized users (by permission) |
|---|---|

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 2.3.1 | Views own dashboard (by role) | 1. Login as each role 2. Open dashboard | **Admin:** ปุ่ม แสดงข้อมูล + ย่อ + Share + menu (edit/archive) — **Moderator:** ย่อ + Share + menu — **User:** ย่อ + menu เท่านั้น (ไม่มี Share, ไม่มีแสดงข้อมูล) | High | ✅ |
| 2.3.2 | Authorized user views shared dashboard | 1. Login as user with access 2. Open dashboard | Dashboard renders, ปุ่ม ย่อ + menu เท่านั้น, watermark อีเมลทับ iframe | High | ✅ |
| 2.3.3 | Unauthorized user access | 1. Login as user without access 2. Open dashboard URL directly | Error: "เกิดข้อผิดพลาดในการโหลดรายงาน" + "คุณไม่มีสิทธิ์เข้าถึงรายงานนี้" + ปุ่ม "← ย้อนกลับ" | Critical | ✅ |
| 2.3.4 | Admin views any dashboard | 1. Login as Admin 2. Open any dashboard | All actions available | High | ✅ |
| 2.3.5 | Dashboard embed renders | 1. Open dashboard with Looker URL | Iframe/embed loads correctly | High | ✅ |
| 2.3.6 | Fullscreen toggle (native) | 1. เปิด dashboard 2. คลิก "เต็มจอ" 3. คลิก "ย่อ" 4. เข้า fullscreen อีกครั้ง แล้วกด `Esc` | คลิก "เต็มจอ" → เข้า fullscreen ของเบราว์เซอร์จริง (แถบ tab + address bar หายไป) ปุ่มเปลี่ยนเป็น "ย่อ" — ออกได้ทั้ง 2 ทาง: คลิก "ย่อ" หรือกด `Esc` — ทั้งสองทางปุ่มกลับเป็น "เต็มจอ" ถูกต้อง (sync ผ่าน `fullscreenchange`) | Low | ✅ |
| 2.3.7 | Archive dashboard (Admin) | 1. Login as Admin 2. เปิด dashboard ที่ต้องการ archive 3. คลิก `...` menu → เลือก "Archive" 4. ConfirmDialog เปิด → คลิก "เก็บถาวร" | Toast: "เก็บถาวรแดชบอร์ดสำเร็จ" + Redirect ไป `/dashboard/discover` — dashboard หายจาก list (ถ้า Admin เปิด toggle "แสดงที่เก็บถาวร" จะเห็น badge "เก็บถาวร" แทน) | High | ✅ |
| 2.3.8 | Unarchive dashboard (Admin) | 1. Login as Admin 2. เปิด toggle "แสดงที่เก็บถาวร" บน `/dashboard/discover` 3. คลิก dashboard ที่มี badge "เก็บถาวร" 4. คลิก `...` menu → เลือก "Unarchive" | Toast: "ยกเลิกเก็บถาวรแดชบอร์ดสำเร็จ" — อยู่หน้าเดิม, badge "📦 เก็บถาวร" ใน Info sidebar หาย (ไม่มี ConfirmDialog) | High | ✅ |
| 2.3.9 | Edit dashboard metadata | 1. Login as Admin 2. เปิด dashboard 3. คลิก `...` menu → เลือก "Edit" 4. Dialog "แก้ไขข้อมูลแดชบอร์ด" เปิด (ข้อมูลเดิม pre-filled: ชื่อ, รายละเอียด, แท็ก) 5. เปลี่ยนชื่อ / toggle tag 6. คลิก "บันทึก" — **Validation:** ลบชื่อจนว่าง → คลิก "บันทึก" — **Cancel:** เปิด dialog → แก้ข้อมูล → คลิก "ยกเลิก" | **Happy path:** Toast "บันทึกข้อมูลแดชบอร์ดสำเร็จ" + ชื่อใน header อัปเดตทันที, dialog ปิด — **Validation:** error "กรุณาระบุชื่อแดชบอร์ด" ใต้ field ชื่อ — **Cancel:** dialog ปิด ไม่มีการเปลี่ยนแปลง | Medium | ✅ |
| 2.3.10 | Go back button — from Explorer | 1. เปิด `/manage/explorer` หรือ `/admin/explorer` 2. เปิด dashboard จากโฟลเดอร์ 3. คลิกปุ่มลูกศร ← ซ้ายบน | กลับ Explorer โฟลเดอร์เดิม (tree ยัง expand, scroll เดิม) ไม่ใช่ Discover | Low | ✅ |
| 2.3.11 | Go back button — cold entry | 1. เปิด tab ใหม่ (มี history จากเว็บอื่น เช่น google.com) 2. paste URL `/dashboard/view/<id>` ตรงๆ 3. คลิกปุ่มลูกศร ← ซ้ายบน | Redirect ไป `/dashboard/discover` — ต้องไม่ออกไปเว็บนอกแอป | Low | ✅ |
| 2.3.12 | Embed zoom control | 1. เปิด dashboard ที่มี Looker embed 2. คลิก `−` ลงไปจนถึง 60% 3. คลิกที่ตัวเลข `60%` | ปุ่ม `− / % / +` อยู่ในแถบ header (แสดงเฉพาะเมื่อมี embed URL) — คลิก `−` → เนื้อหาเล็กลงและ**เห็นแถวล่างเพิ่มขึ้น** (ที่ 60% เห็นทั้งตารางบนและกราฟล่าง) จัดกึ่งกลาง ขอบขาวเท่ากันสองข้าง — คลิกตัวเลข → กลับเป็น 100% — ช่วง 40–100% ทีละ 10%, สุดช่วงแล้วปุ่ม disabled | Medium | ✅ |
| 2.3.13 | Zoom persists across reload | 1. ตั้ง zoom เป็น 60% 2. refresh หน้า | ยังเป็น 60% (เก็บใน `localStorage` key `streamhub:embed-zoom`) | Low | ✅ |
| 2.3.14 | Browser zoom ไม่ใช่ทางแก้ | 1. เปิด dashboard 2. ใช้ zoom out ของ Chrome (`Cmd -`) | หน้าจอ**ไม่เปลี่ยน** — ไม่ใช่บั๊ก ดู [common-issues.md](../TROUBLESHOOTING/common-issues.md) หัวข้อ "Zoom out ของเบราว์เซอร์ไม่มีผลกับแดชบอร์ด" — ต้องใช้ปุ่ม zoom ในแอปแทน | Low | ✅ |

---

### 2.4 Profile (`/profile`)

| Layout: `default` | Role: ทุก role (auth) |
|---|---|

**Components:** PageLayout, UserMenu (ทางเข้า)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 2.4.1 | เข้าหน้าโปรไฟล์จากเมนู | 1. คลิกชื่อผู้ใช้มุมขวาบน 2. คลิก "โปรไฟล์" | ไปที่ `/profile` — ชื่อ, อีเมล, badge บทบาท ตรงกับบัญชีที่ login | Medium | ✅ (prod-equivalent 2026-08-19, admin) |
| 2.4.2 | ข้อมูลบัญชีถูกต้อง | 1. เปิด `/profile` | บริษัทแสดงเป็น "ชื่อเต็ม (CODE)", สถานะ = ใช้งานอยู่/ถูกระงับ, เข้าร่วมเมื่อ = วันที่จาก `users.createdAt` | Medium | ✅ (admin STTH: "บริษัท สทรีมวอช (ประเทศไทย) จำกัด (STTH)" · 1 มกราคม 2567) |
| 2.4.3 | กลุ่มผู้ใช้ | 1. เปิด `/profile` ด้วยบัญชีที่อยู่ในกลุ่ม | แสดงชิปชื่อกลุ่ม (ไม่ใช่ id); บัญชีที่ไม่มีกลุ่มขึ้น "ยังไม่ได้อยู่กลุ่มใด" | Medium | ✅ (prod 2026-08-19 — moderator INFE เห็นชิป "Sales"; admin STTH เห็นข้อความว่าง) |
| 2.4.4 | การ์ดโฟลเดอร์ที่ดูแล (moderator) | 1. login เป็น moderator 2. เปิด `/profile` | มีการ์ด "โฟลเดอร์ที่ดูแล" แสดงโฟลเดอร์ที่ `assignedModerators` มี uid นี้; admin/user ไม่มีการ์ดนี้ | Medium | ✅ (prod 2026-08-19 — moderator เห็น 📁 Finance, badge "ผู้ดูแลโฟลเดอร์"; หน้า admin ไม่มีการ์ดนี้) |
| 2.4.5 | หน้าอ่านอย่างเดียว | 1. เปิด `/profile` | ไม่มีปุ่มแก้ไข/ฟอร์มใด ๆ + มีข้อความท้ายหน้าว่าแก้ได้โดยผู้ดูแลระบบเท่านั้น | Low | ✅ |

---

## 3. Admin Pages

> **Middleware:** `auth` + `admin` — Non-admin users redirected to `/dashboard/discover`

### 3.1 Admin Overview (`/admin/overview`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.1.1 | Statistics display | 1. Go to `/admin/overview` | User/Dashboard/Folder/Company counts shown | High | ✅ |
| 3.1.2 | Statistics accuracy | 1. Compare stats with actual data | Counts match actual Firestore records | Medium | ✅ |
| 3.1.3 | Quick action — Manage Users | 1. Click "Manage Users" card | Navigate to `/admin/users` | Medium | ✅ |
| 3.1.4 | Quick action — Manage Dashboards | 1. Click "Manage Dashboards" card | Navigate to `/admin/dashboards` | Medium | ✅ |
| 3.1.5 | Non-admin redirect | 1. Login as User 2. Go to `/admin/overview` | Redirect to `/dashboard/discover` | Critical | ✅ |

---

### 3.2 Admin Users (`/admin/users`)

> **Note:** การสร้างผู้ใช้ใหม่ทำผ่าน `/admin/invitations` เท่านั้น เพื่อให้ทุก account มี Firebase Auth UID จริง หน้านี้รองรับเฉพาะ Read / Edit / Delete / Toggle Active

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.2.1 | Search by email or name | 1. Type partial email in search bar → verify matching user shown 2. Clear search 3. Type partial name in search bar → verify matching user shown | Both email and name search return correct results | High | ✅ |
| 3.2.2 | Filter by role | 1. Select "Moderator" from role dropdown | Only moderators shown | High | ✅ |
| 3.2.3 | Filter by company | 1. Select company from dropdown | Only users in that company shown | Medium | ✅ |
| 3.2.4 | Multi-filter (role + company) | 1. Select role 2. Select company | Intersection of filters | Medium | ✅ |
| 3.2.5 | ~~Create new user~~ | ~~N/A~~ | ~~Removed — use /admin/invitations instead~~ | ~~High~~ | ⊘ N/A |
| 3.2.6 | Edit existing user | 1. Click Edit on user 2. Change role 3. Save | User updated, table reflects change | High | ✅ |
| 3.2.6a | Edit user — email is disabled | 1. Click Edit on any user | Email input is disabled (lock hint shown); cannot be changed | High | ✅ |
| 3.2.6b | Edit user — change groups | 1. Click Edit 2. Check/uncheck groups in multi-select 3. Save | User's `groups` array updated, badges in table reflect change | High | ✅ |
| 3.2.6c | Edit moderator — assign folders | 1. Edit moderator user 2. Check folders in picker 3. Save | Selected folders have user UID added to `assignedModerators` | High | ✅ (deep-verified: logged in as the user → moderator explorer showed the assigned Finance folder) |
| 3.2.6d | Edit moderator → change role to user | 1. Edit moderator with folder assignments 2. Change role to user 3. Save | Folder picker hides; all previously assigned folders have UID removed from `assignedModerators` | High | ✅ (deep-verified: after revert, the user no longer saw the Finance folder) |
| 3.2.6e | Edit user — role user → moderator | 1. Edit user (role=user) 2. Change role to moderator 3. Folder picker appears 4. Check folders 5. Save | Folder picker appears on role change; selected folders get UID added | High | ✅ |
| 3.2.7 | Delete user | 1. Click Delete 2. Confirm in dialog | User removed, toast shown | High | ✅ (pre-launch group B4, 2026-06-28 — not re-run on prod to avoid deleting a real account) |
| 3.2.8 | Toggle user active status | 1. Click toggle on user row 2. Confirm in dialog | ConfirmDialog shown → confirm → status updated, toast shown | Medium | ✅ |
| 3.2.9 | ~~Form validation — missing email (create)~~ | ~~N/A~~ | ~~Removed with create flow~~ | ~~Medium~~ | ⊘ N/A |
| 3.2.10 | Cancel edit modal without saving | 1. Click Edit on user 2. Change fields 3. Click Cancel | No changes made, modal closes | Low | ✅ |
| 3.2.11 | ลบผู้ใช้ที่ถูกอ้างอิงอยู่ → ถามก่อน แล้วล้างให้ (BUG-005) | 1. เตรียมผู้ใช้ที่อยู่ในกลุ่มและ/หรือดูแลโฟลเดอร์ 2. กดลบ | dialog บอกว่า "ถูกอ้างอิงอยู่ใน N กลุ่ม และ M โฟลเดอร์ที่ดูแล" → ยืนยัน → uid หายจาก `group.members[]` และ `folders.assignedModerators[]` ทั้งหมด, audit = 0 | Medium | ✅ (**กดจริง 2026-08-20** — บัญชีมาจากคำเชิญเท่านั้น และ 6 บัญชีบน prod ใช้งานอยู่ทั้งหมด จึงสร้างตัวทดสอบด้วย [scripts/qa-cascade-user.mjs](../../scripts/qa-cascade-user.mjs) `seed --apply`: user `uid_qa_cascade` + `groups: ["analytics"]` + `groups/analytics.members` + `folders/folder_1785082588448` (TEST-E) `.assignedModerators` · ลบที่ `/admin/users` → dialog ขึ้นตรงตามคาด "…ถูกอ้างอิงอยู่ใน **1 กลุ่ม และ 1 โฟลเดอร์ที่ดูแล** — ลบแล้วจะถอดออกจากที่เหล่านั้นด้วย ยืนยันหรือไม่?" → ยืนยัน → แถวหาย, `members` และ `assignedModerators` ว่างทั้งคู่, `npm run audit:orphans` = 0 ทั้ง 7 หมวด · คืนสภาพด้วย `restore --apply`) |
| 3.2.12 | ลด role moderator ที่ดูแลโฟลเดอร์ → เตือนก่อน (BUG-027) | 1. `/admin/users` แก้ moderator ที่ดูแลโฟลเดอร์อยู่ 2. เปลี่ยน role เป็น `user` 3. กดบันทึก | dialog "ดูแลอยู่ N โฟลเดอร์ — เปลี่ยนบทบาทแล้วจะถูกถอดออกจากทุกโฟลเดอร์ และเลื่อนกลับเป็น moderator ภายหลังจะไม่ได้คืนอัตโนมัติ" · ยกเลิก = ไม่บันทึกอะไร | Medium | ✅ (prod 2026-08-20 — Nopphol/1 โฟลเดอร์; ยืนยันแล้วถอดจริง คืนค่าให้แล้ว) |

---

### 3.3 Admin Folders (`/admin/folders`)

> **⚠️ Superseded by Explorer (`/admin/explorer`).** This DataTable page is a legacy
> orphan route with **no sidebar link** — folder management now happens in the Explorer
> tree (folders + dashboards in one place). The page remains reachable by direct URL, so
> it is kept functional and its delete path was hardened to match Explorer's content guard
> (see BUG-008 / TC 3.3.5). Verified 8/8 on 2026-07-26 before deprecation; no further
> routine testing required unless the route is revived. Candidate for removal.

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.3.1 | Create root folder | 1. Click "เพิ่มโฟลเดอร์" 2. No parent selected 3. Submit | Root folder created | High | ✅ |
| 3.3.2 | Create child folder | 1. Click "เพิ่มโฟลเดอร์" 2. Select parent 3. Submit | Subfolder created under parent | High | ✅ |
| 3.3.3 | Edit folder name | 1. Click Edit 2. Change name 3. Save | Name updated in table | Medium | ✅ |
| 3.3.4 | Delete empty folder | 1. Click Delete on folder with no children/dashboards 2. Confirm | Folder removed | High | ✅ |
| 3.3.5 | Delete folder with content | 1. Click Delete on folder with subfolders/dashboards 2. Confirm | Error toast: "ไม่สามารถลบโฟลเดอร์ที่มีเนื้อหาได้ กรุณาลบแดชบอร์ดและโฟลเดอร์ย่อยทั้งหมดก่อน" + folder NOT deleted | High | ✅ (was silent-delete orphan bug — fixed via `canDelete` guard, parity with BUG-008/explorer) |
| 3.3.6 | Search by name | 1. Type name in search bar | Matching folders shown | Medium | ✅ |
| 3.3.7 | Toggle folder active status | 1. Click toggle switch | Status updates inline | Medium | ✅ |
| 3.3.8 | Folder hierarchy display | 1. View table | Parent folder shown in column | Low | ✅ |

---

### 3.4 Admin Dashboards (`/admin/dashboards`)

> **⊘ NOT TESTED — Superseded by Explorer (`/admin/explorer`).** Like §3.3, this DataTable
> page is a **legacy orphan route with no sidebar link** ([useRoleNavigation.ts](../../app/composables/useRoleNavigation.ts)
> admin menu does not include it — only reachable by typing the URL directly). Dashboard
> management now lives in the Explorer tree. Testing is **intentionally skipped**: the route
> is not part of any user-facing flow and is a candidate for removal. All cases marked ⊘ N/A.
> (Note: dashboards are leaf nodes with no children, so there is no delete-orphan risk of the
> BUG-008/BUG-009 kind here.) Decision 2026-07-26.
>
> **Revisited 2026-08-15 — the skip cost us a real defect (BUG-013).** Typing
> `FormModal`'s `save` payload surfaced that this page wired the modal's save button
> straight to `handleSave`, so create/update received the modal's raw `FormData`
> scrape instead of the form's values — and `FormField` names its inputs
> `field-${Math.random()}`, so the write carried random keys, never `name`/`folderId`/
> `lookerEmbedUrl`, and skipped validation entirely. Reproduced live on prod (doc
> `dash_1786790982303` held only defaults), fixed in PR #365, and 3.4.3 / 3.4.4 / 3.4.7
> are now verified. An orphan route still writes to the same collection everyone reads:
> "not in the menu" is not the same as "cannot corrupt data".

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.4.1 | Search by name | 1. Type dashboard name in search | Matching dashboards shown | High | ⊘ N/A (orphan) |
| 3.4.2 | Filter by archive status | 1. Toggle archive filter | Archived/active dashboards filtered | High | ⊘ N/A (orphan) |
| 3.4.3 | Create dashboard | 1. Click "เพิ่มแดชบอร์ด" 2. Fill name, folder, owner 3. Submit | Dashboard created, toast shown | High | ✅ (2026-08-15, BUG-013) |
| 3.4.4 | Edit dashboard | 1. Click Edit 2. Change fields 3. Save | Dashboard updated in table | High | ✅ (2026-08-15) |
| 3.4.5 | Delete dashboard | 1. Click Delete 2. Confirm | Dashboard removed | High | ⊘ N/A (orphan) |
| 3.4.6 | Toggle archive status | 1. Click archive toggle on row | Dashboard archived/unarchived | High | ⊘ N/A (orphan) |
| 3.4.7 | Form validation | 1. Submit form with missing required fields | Validation errors shown | Medium | ✅ (2026-08-15, BUG-013) |
| 3.4.8 | Dashboard with Looker URL | 1. Create dashboard with Looker URL 2. View it | Dashboard renders embed | Medium | ⊘ N/A (orphan) |

---

### 3.5 Admin Companies (`/admin/companies`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.5.1 | Search by name/code | 1. Type in search bar | Matching companies shown | Medium | ✅ |
| 3.5.2 | Filter by region | 1. Select region from dropdown | Companies in that region shown | Medium | ✅ |
| 3.5.3 | Create company | 1. Click "เพิ่มบริษัท" 2. Fill code, name 3. Submit | Company created | High | ✅ (was BUG-011 — blank region sent `undefined` → setDoc rejected; fixed) |
| 3.5.4 | Unique code validation | 1. Create company with existing code | Error: "รหัสบริษัทซ้ำ" | High | ✅ (was BUG-010 — duplicate code silently overwrote existing company; fixed via `uniqueFields` guard) |
| 3.5.5 | Edit company | 1. Click Edit 2. Change fields 3. Save | Company updated | Medium | ✅ |
| 3.5.6 | Delete company | 1. Click Delete on a company with no members 2. Confirm | Company removed | Medium | ✅ |
| 3.5.9 | Delete company that still has members | 1. Click Delete on a company with users 2. Confirm | Blocked with error toast "ไม่สามารถลบบริษัทที่ยังมีผู้ใช้อยู่ (N คน)…"; company survives, no user is left with a dead `company` ref | High | ✅ (prod 2026-08-05 — OAYT with 1 member: toast shown, row survives, dialog closed) |
| 3.5.7 | Move Up/Down reorder | 1. Click Move Up on company | sortOrder swaps with adjacent | Medium | ✅ (swaps within same region only; a lone/ungrouped company is a no-op) |
| 3.5.8 | Toggle active status | 1. Click toggle switch | Status updates | Low | ✅ |

---

### 3.6 Admin Regions (`/admin/regions`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.6.1 | CRUD — Create region | 1. Click "เพิ่มภูมิภาค" 2. Fill code, name 3. Submit | Region created | Medium | ✅ |
| 3.6.2 | CRUD — Edit region | 1. Click Edit 2. Change name 3. Save | Region updated | Medium | ✅ |
| 3.6.3 | CRUD — Delete region | 1. Click Delete (no companies reference it) 2. Confirm | Region removed | Medium | ✅ (delete leaves a gap in sortOrder — cosmetic, harmless; not re-compacted) |
| 3.6.4 | Move Up/Down reorder | 1. Click Move Up/Down | sortOrder swaps | Low | ✅ |
| 3.6.5 | Unique code validation | 1. Create with existing code | Validation error shown | Medium | ✅ (covered by BUG-010 fix — toast "รหัสกลุ่มธุรกิจ/เขตพื้นที่ซ้ำ", no overwrite) |

> **Note:** No delete-guard on regions — deleting a region still referenced by a company orphans `company.region` (cosmetic: the company's region column falls back to the raw code). Lower severity than the folder case (not data loss); not currently a test case. Consider a `canDelete` guard if this becomes an issue.

---

### 3.7 Admin Groups (`/admin/groups`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.7.1 | Create group with members | 1. Click "เพิ่มกลุ่ม" 2. Fill name 3. Select members 4. Submit | Group created with members | High | ✅ |
| 3.7.2 | Edit group members | 1. Click Edit 2. Add/remove members 3. Save | Members updated + user.groups[] synced (BUG-005) | High | ✅ (verified sync-through: adding members wrote both users in Firestore) |
| 3.7.3 | View group details | 1. Click View on group | Modal shows group info + member list | Medium | ✅ |
| 3.7.4 | Delete group | 1. Click Delete 2. Confirm | Group removed | Medium | ✅ (see note — orphan user.groups[] on delete) |
| 3.7.5 | Toggle group active status | 1. Click toggle switch | Status updates | Low | ✅ |
| 3.7.6 | Search by name | 1. Type in search bar | Matching groups shown | Low | ✅ |
| 3.7.7 | Unique id validation | 1. Create group with existing id | Error toast "รหัสกลุ่มซ้ำ" + no overwrite | High | ✅ (BUG-012 — was silent-overwrite, fixed via uniqueFields; added this case) |
| 3.7.8 | ลบกลุ่มที่มีสมาชิก → ถามก่อน แล้วล้างให้ (BUG-005) | 1. `/admin/groups` สร้างกลุ่มทดสอบ ใส่สมาชิก 1 คน 2. `/admin/users` ยืนยันว่า badge กลุ่มขึ้นกับคนนั้น 3. กลับไปลบกลุ่ม | dialog บอก "มีสมาชิก N คน — ลบแล้วจะถอดกลุ่มนี้ออกจากทุกคนด้วย" → ยืนยัน → badge หายจากตารางผู้ใช้ และ `npm run audit:orphans` = 0 | Medium | ✅ (prod 2026-08-20 — dialog "กลุ่ม 'zz-qa-grp2' มีสมาชิก 1 คน — ลบแล้วจะถอดกลุ่มนี้ออกจากทุกคนด้วย" · ยืนยันแล้ว badge หายจากแถว Janine เอง · audit = 0) |

> **Note:** Deleting a group does **not** clear the deleted group id from its members' `user.groups[]` (delete uses the raw `deleteGroup`, not a sync wrapper) — those users keep an orphan group ref. This is the delete-direction gap of BUG-005 (create/edit sync IS handled via `createGroupWithSync`/`updateGroupWithSync`). Low severity (access control tolerates a group id that no longer exists); consider a `deleteGroupWithSync` if it matters.

---

### 3.8 Admin Tags (`/admin/tags`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.8.1 | Create tag | 1. Click "เพิ่มแท็ก" 2. Fill name, slug 3. Submit | Tag created | Medium | ✅ |
| 3.8.2 | Slug format validation | 1. Enter name with spaces/uppercase/symbols | Slug auto-generates as lowercase-**dash** (e.g. "QA Test TAG!!" → "qa-test-tag") | Medium | ✅ (auto-gen from name only — see note) |
| 3.8.3 | Edit tag | 1. Click Edit 2. Change name 3. Save | Tag updated (slug locked in edit mode) | Medium | ✅ |
| 3.8.4 | Delete tag | 1. Click Delete 2. Confirm | Tag removed | Medium | ✅ |
| 3.8.5 | Move Up/Down reorder | 1. Click Move Up/Down | sortOrder swaps | Low | ✅ |
| 3.8.6 | Unique slug validation | 1. Create with existing slug | Error toast "slug นี้ถูกใช้แล้ว" + no overwrite | Medium | ✅ (BUG-010 fix — tags→slug uniqueFields) |
| 3.8.7 | Permission check (canManageTags) | 1. Login as admin without tag permission | Redirected to /admin/overview | Low | ⊘ N/A (**สถานะ "admin ที่ถูกถอดสิทธิ์แท็ก" สร้างไม่ได้ในสถาปัตยกรรมนี้** — `canManageTags` มาจากเมทริกซ์ role ล้วน ๆ ที่ [permissions.ts:44](../../app/stores/permissions.ts#L44) (`admin: true` ตายตัว) ผ่าน `initializePermissions` ที่คัดลอกค่าจาก `ROLE_PERMISSIONS[role]` ตรง ๆ [permissions.ts:155](../../app/stores/permissions.ts#L155) · ไม่มีที่เก็บ per-user override ทั้งใน Firestore และในสโตร์ ⇒ ไม่มีทางประกอบเงื่อนไขของเคสนี้ขึ้นมาได้ · role อื่นก็มาไม่ถึง guard เพราะ `admin` middleware เด้งด้วย `canAccessAdmin` ไปก่อนที่ [admin.ts:39](../../app/middleware/admin.ts#L39) ⇒ guard ที่ [tags/index.vue:36](../../app/pages/admin/tags/index.vue#L36) เป็น defense-in-depth ที่ไม่มีเส้นทางเข้าถึงตามการออกแบบปัจจุบัน · **จะกดจริงได้ต่อเมื่อทำ per-user permission override** (ที่เก็บ + UI + rules) ซึ่งควรทำเมื่อมีคนขอจริงเท่านั้น — ถ้าทำเมื่อไร ให้เปิดเคสนี้กลับเป็น ☐) |
| 3.8.8 | Tag color visible in list | 1. Open `/admin/tags` | `แท็ก` column shows each tag as a colored `TagBadge` (size md) — not plain text — so colors can be compared across rows without opening the edit modal | Low | ✅ (verified on prod 2026-08-04) |
| 3.8.9 | Switched-off tag reads as off | 1. Toggle a tag's สถานะ off | Its badge dims (opacity 0.55) with a dashed outline and a "ปิดใช้งาน" tooltip, immediately, without a reload | Low | ✅ (prod 2026-08-05 — ภาคเหนือ toggled off) |
| 3.8.10 | ลำดับ numbering has no gaps | 1. Delete a tag from the middle 2. Look at the ลำดับ column | Numbers stay contiguous (1..N) because the column shows list position, not the stored `sortOrder`; ⬆️/⬇️ still reorder | Low | ✅ (prod 2026-08-05 — 7 tags numbered 1–7) |

> **Both cosmetic gaps found during 3.8.8 are now closed:** `TagBadge` dims switched-off tags (PR #341, TC 3.8.9) and the `ลำดับ` column numbers by position instead of raw `sortOrder` (PR #342, TC 3.8.10).

> **Note (3.8.2):** The slug auto-generates from the **name** field (lowercase, spaces→`-`, strips non `[a-z0-9-]`) — spec said "underscore" but impl uses **dash**. The slug field itself has **no format validation**: typing directly into it (spaces/uppercase) is not sanitized, so a manually-entered malformed slug would persist. Low impact (users normally leave it auto). Slug is locked (read-only) in edit mode.

---

### 3.9 Admin Invitations (`/admin/invitations`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.9.1 | View all invitations | 1. Go to `/admin/invitations` | Table loads with pagination | High | ✅ |
| 3.9.2 | Filter by status tab | 1. Click "Pending" / "Accepted" / "Expired" tab | Shows only selected status | High | ✅ |
| 3.9.3 | Search by email | 1. Type email in search bar | Matching invitations shown | Medium | ✅ |
| 3.9.4 | Send single invitation | 1. Click "เชิญผู้ใช้" 2. Fill email, role, company 3. Submit | Email sent, record created in table | Critical | ✅ |
| 3.9.5 | Resend pending invitation | 1. Click "ส่งอีกครั้ง" on pending invitation 2. Confirm | New email sent, expiry extended | Critical | ✅ |
| 3.9.6 | Cancel pending invitation | 1. Click "ยกเลิก" on pending invitation 2. Confirm | Status changes to "cancelled" | High | ✅ |
| 3.9.7 | ~~Delete invitation record~~ | ~~N/A~~ | ~~Removed — design is cancel-only (no hard delete)~~ | ~~Medium~~ | ⊘ N/A |
| 3.9.8 | Bulk invite (multi-add) | 1. Click "เชิญหลายคน" 2. Add rows with mixed role/company/group 3. Submit | Multiple emails sent, records created **with per-row role/company/group** | High | ✅ |
| 3.9.9 | Expired invitation auto-detect | 1. View invitation past expiry date | Status shows "expired" (client-side) | Medium | ✅ |
| 3.9.10 | Resend already accepted | 1. Try resend on accepted invitation | Resend button hidden or disabled | Medium | ✅ |

---

### 3.10 Admin Permissions (`/admin/permissions`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.10.1 | Add user to dashboard | 1. Select **restricted** dashboard 2. Add user 3. Save | User gains access | High | ✅ |
| 3.10.2 | Remove user from dashboard | 1. Select **restricted** dashboard 2. Remove user 3. Save | User loses access | High | ✅ |
| 3.10.3 | Add group to dashboard | 1. Select **restricted** dashboard 2. Add group 3. Save | All group members gain access | High | ✅ |
| 3.10.4 | Set role restriction (Layer 3) | 1. Select dashboard 2. Set restriction 3. Save | Access overridden by restriction | Medium | ✅ |
| 3.10.5 | Verify permission applies | 1. Grant user access to **restricted** dashboard 2. Login as that user 3. View dashboard | Dashboard accessible | High | ✅ |
| 3.10.6 | Expiry ที่ผ่านมาแล้วบล็อกการเปิดแดชบอร์ด | 1. ให้ direct grant กับ user 2. ตั้ง `restrictions.expiry.<uid>` เป็น **Timestamp ของเมื่อวาน** (console) 3. login เป็น user นั้น เปิด `/dashboard/view/<id>` | "คุณไม่มีสิทธิ์เข้าถึงรายงานนี้" — grant ยังอยู่ แต่ expiry ชนะ | High | ✅ |
| 3.10.7 | Expiry ที่ผ่านมาแล้วซ่อนแดชบอร์ดจาก Discover | ต่อจาก 3.10.6 → เปิด `/dashboard/discover` | แดชบอร์ดไม่อยู่ในลิสต์ | High | ✅ |
| 3.10.8 | Expiry ที่ผ่านมาแล้วตัด user ออกจาก "ผู้มีสิทธิ์เข้าถึง" | ต่อจาก 3.10.6 → กลับเป็น admin เปิด `/admin/permissions?dashboard=<id>` | ผลลัพธ์รวม = **0 คน** ทั้งที่ "สิทธิ์ที่ให้แล้ว" ยังแสดง user นั้น; แท็บข้อจำกัดแสดงวันหมดอายุ | High | ✅ |
| 3.10.9 | ฝั่ง server ปฏิเสธด้วย (Cloud Function) | ต่อจาก 3.10.6 → `POST /api/embed/request` ด้วย ID token ของ user นั้น | **403** `Access revoked or expired` | High | ✅ |
| 3.10.10 | Expiry ในอนาคตยังเข้าได้ (control) | แก้ Timestamp เป็น **พรุ่งนี้** → ยิง `/api/embed/request` ซ้ำ + รีเฟรชหน้าสิทธิ์ | เปลี่ยนเป็น **404** `No embed URL configured` (= ผ่านด่านสิทธิ์แล้ว) และหน้าสิทธิ์กลับเป็น 1 คน | High | ✅ |
| 3.10.11 | ตั้งวันหมดอายุผ่าน UI ได้ค่าถูกต้อง (BUG-018) | 1. เปิดหน้าจัดการสิทธิ์ของแดชบอร์ดทดสอบ 2. แท็บ "ข้อจำกัด" → หมดอายุ → เลือกผู้ใช้ + วันพรุ่งนี้ 3. บันทึก 4. `node scripts/inspect-expiry.mjs <id>` | `shape: object<Timestamp>` และ `resolves` = **23:59:59.999 ตามเวลาผู้ตั้ง** ของวันที่เลือก (ไม่ใช่เที่ยงคืน UTC) | Medium | ✅ |
| 3.10.12 | วันหมดอายุของโฟลเดอร์เขียน shape เดียวกัน | ทำแบบ 3.10.11 แต่ที่โฟลเดอร์ (`?folder=<id>`) | `folders/<id>.restrictions.expiry` เป็น `Timestamp` เช่นกัน | Low | ✅ |
| 3.10.13 | ลบสิทธิ์ที่มีข้อจำกัดผูกอยู่ → ถามก่อน (BUG-020) | 1. ให้สิทธิ์ user + ตั้งวันหมดอายุ 2. ไม่มีสิทธิ์ทางอื่น (ไม่ public, ไม่ให้บริษัท/กลุ่ม) 3. กด ✕ ลบสิทธิ์ผู้ใช้ | ขึ้น dialog "ลบสิทธิ์ของ &lt;ชื่อ&gt;" — ยืนยัน = หายทั้งคู่, ยกเลิก = ไม่เปลี่ยนอะไร | Medium | ✅ |
| 3.10.14 | ข้อจำกัดที่ยังมีผลต้องไม่ถูกลบ | 1. ให้สิทธิ์ผ่าน **บริษัท** ของ user + ให้ direct grant + ตั้งวันหมดอายุให้ user คนนั้น 2. ลบ **direct grant** | **ไม่ขึ้น dialog** และข้อจำกัดยังอยู่ (ยังกัดผ่านสิทธิ์บริษัท) | Medium | ✅ |
| 3.10.15 | ลบสิทธิ์บริษัท/กลุ่มที่เป็นทางเข้าสุดท้าย → ถามเหมือนกัน | 1. ให้สิทธิ์เฉพาะ **บริษัท** ของ user + ตั้งวันหมดอายุ 2. ลบสิทธิ์บริษัทนั้น | ขึ้น dialog "ลบสิทธิ์บริษัท OAYT" → ยืนยัน = ข้อจำกัดหายด้วย (เดิมดักเฉพาะตอนลบ direct user) | Medium | ✅ |
| 3.10.16 | ป้าย "เข้าถึงได้ / หมดอายุแล้ว" ในคอลัมน์รายชื่อ | 1. ให้สิทธิ์บริษัท/กลุ่ม หรืออยู่ใต้โฟลเดอร์ที่ให้สิทธิ์ 2. ดูคอลัมน์ผู้ใช้ | ป้ายเขียวบอกต้นทางแบบสั้น: `โฟลเดอร์ Finance` / `กลุ่ม Finance` / `บริษัท OAYT` / `ทุกบริษัท` / `สาธารณะ` (+`· +n` ถ้าได้หลายทาง) — คำว่า "โฟลเดอร์"/"กลุ่ม" ต้องแยกกันได้แม้ชื่อซ้ำ; คนที่มีสิทธิ์แต่หมดอายุ/ถูกระงับขึ้นป้ายเหลือง; แถบ "ผลลัพธ์รวม" ยังแสดงลูกโซ่เต็ม (`📁 Finance · บริษัท STTH`) | Medium | ✅ |
| 3.10.17 | บันทึกสิทธิ์แล้วต้องมีข้อความยืนยัน (BUG-021) | 1. เปิด `/admin/permissions?dashboard=<id>` หรือกด 🔑 จาก Explorer 2. แก้สิทธิ์ 3. บันทึก | toast เขียว "บันทึกสิทธิ์สำหรับ …" ขึ้นให้เห็น แม้หน้าจะเด้งกลับ Explorer; ถ้าบันทึกล้มเหลวต้องขึ้น toast แดง | Medium | ✅ |
| 3.10.18 | บันทึกสิทธิ์ธรรมดา (ไม่มีวันหมดอายุ) ไม่ทำฟิลด์หาย | 1. เพิ่มสิทธิ์กลุ่ม 2. บันทึก 3. `inspect-expiry.mjs <id>` | `access.direct.groups` มีกลุ่มที่เพิ่ม และ `restrictions` ยังมีครบทั้ง `revoke` และ `expiry` (payload ที่ประกอบใหม่ตอนเขียนต้องไม่กลืนคีย์) | High | ✅ |
| 3.10.19 | สวิตช์สาธารณะ + ป้าย + แถบผลลัพธ์รวม | 1. เปิดสวิตช์สาธารณะ 2. บันทึก 3. เปิดหน้าใหม่ | `access.public: true` และสิทธิ์เดิมไม่หาย; ทุกคนขึ้นป้าย `เข้าถึงได้ · สาธารณะ`; แถบล่างนับผู้ใช้ที่ไม่ใช่ admin ครบ | High | ✅ |
| 3.10.20 | ระงับ (revoke) ผ่านตัวคำนวณเดียวกับ expiry | 1. ระงับผู้ใช้ที่มีสิทธิ์ 2. บันทึก | ป้ายเหลือง `มีสิทธิ์ แต่ถูกระงับ`; แถบผลลัพธ์รวมลดลง 1; `restrictions.revoke` มี uid นั้น | High | ✅ |
| 3.10.21 | บันทึกสิทธิ์โฟลเดอร์ส่งครบทุกฟิลด์ | 1. ติ๊กสิทธิ์สืบทอด + เพิ่มบริษัท 2. บันทึก | `inheritPermissions: true` **และ** `access.company` อยู่ด้วยกัน พร้อม `permissionMeta` (provenance) | High | ✅ |
| 3.10.22 | ปิดสาธารณะทั้งที่มีข้อจำกัดค้าง → ถามตอนบันทึก (BUG-022) | 1. เปิดสาธารณะ + ระงับผู้ใช้ 1 คน → บันทึก 2. ปิดสาธารณะ 3. กดบันทึก | ขึ้น dialog "ลบข้อจำกัดที่ไม่มีสิทธิ์รองรับ" ระบุชื่อคนนั้น → **ลบและบันทึก** = `restrictions` ว่างพร้อมกับสิทธิ์; **ยกเลิก** = ไม่บันทึกอะไรเลย | Medium | ✅ |
| 3.10.23 | ข้อจำกัดที่ยังมีสิทธิ์รองรับต้องไม่ถูกถาม | 1. ให้สิทธิ์บริษัทของผู้ใช้ + ระงับผู้ใช้คนนั้น 2. ลบ direct grant (ถ้ามี) 3. บันทึก | **ไม่ขึ้น dialog** และ `restrictions.revoke` ยังอยู่ (ยังกัดผ่านสิทธิ์บริษัท) | Medium | ✅ |

> 🧪 **TC 3.10.6–3.10.10 — ทดสอบ end-to-end บน Firestore prod จริง 2026-08-16** (ยืนยัน fix PR #364)
> ทำบนแดชบอร์ด `EXPIRY-TEST` ที่สร้างขึ้นเฉพาะการทดสอบแล้วลบทิ้ง (โฟลเดอร์ "แดชบอร์ดหลัก" ซึ่งไม่ให้สิทธิ์สืบทอดกับใคร) กับ user `survey.streamwash@gmail.com` (role `user`, company OAYT — ไม่มีสิทธิ์ทางอื่นเลย ตัวแปรเดียวที่เหลือคือ expiry)
> ค่าที่ทดสอบเป็น **Firestore `Timestamp` ของจริง** ไม่ใช่ ISO string — ยืนยันร่างด้วย `firebase-admin` แบบ read-only ก่อนทุกครั้ง (`shape: object<Timestamp> +toDate()`, และ `new Date(value)` แบบเดิมยังคงได้ `Invalid Date` = ถ้าเป็นโค้ดก่อน #364 จะปล่อยผ่านทั้ง 4 จุด)
> ครอบจุดอ่าน expiry ครบทั้ง 4 จุด: `useFirestoreService.checkAccess`, `resolveEffectiveUsers`/Discover, `PermissionsPage.effectiveAccess`, `server/utils/companyAccess.isRestricted`
> ℹ️ ตอนทดสอบครั้งนั้นตั้ง expiry ผ่าน UI ไม่ได้ ต้องแก้ที่ Firebase console (BUG-017) — ตอนนี้ตั้งได้ที่หน้าจัดการสิทธิ์ แท็บ "ข้อจำกัด" → หมดอายุ แต่ค่าที่เขียนยังเป็น ISO string เที่ยงคืน UTC ดู BUG-018

> ⚠️ **หมายเหตุการทดสอบ 3.10.x (อัปเดตหลัง DESIGN-001 fix — Looker model):** ตอนนี้ default = **private**. dashboard ที่ไม่มี grant + ไม่เปิด public = ไม่มีใครเห็น (นอกจาก admin). ทดสอบ add/remove user บน dashboard ใดก็ได้ที่ **ไม่เปิด public** — เพิ่ม user → เห็น, ลบ → หายจริง. ปุ่ม 🌐 สาธารณะ = เปิดให้ทุกคนในระบบเห็น

---

### 3.11 Admin Health (`/admin/health`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.11.1 | Health page loads | 1. Go to `/admin/health` | Status indicators displayed | Medium | ✅ |
| 3.11.2 | All services OK | 1. Verify green indicators | Firestore, Auth, Email all green | Medium | ✅ (all green after PR #309; Email❌ earlier was health-check env-name bug, not a real outage — RESEND_API_KEY secret is bound, emails send) |
| 3.11.3 | Environment info | 1. Check mode display | Shows "production" and correct App URL | Low | ✅ (Mode=production, App URL correct, Data Source=Firestore; Version="unknown" — minor) |

---

### 3.12 Admin Audit Logs (`/admin/audit`)

> ✅ **BUG-007 fix DEPLOYED (2026-07-26, CI run 30196196979).** Was: audit **read** path (`queryAuditLogs`/`getAuditSummary`) + admin gate were JSON-only while writes go to Firestore `audit-log` → prod page showed empty table + zero cards despite 20 docs (PR #300 commit mislabeled it BUG-006, which was already the discover-label fix #296). Fix live via CI (`--only hosting,functions`). Follow-up fixes: actor name for legacy rows (PR #304) + company column via dual-mode user lookup + legacy metadata.company (PR #305). Note: view logs written before PR #305 keep empty company; BULK_INVITE has no company in source data. **§3.12 = 8/8 ✅ (all UI-verified).**

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.12.1 | View audit logs | 1. Go to `/admin/audit` | Table shows activity records | Medium | ✅ (20 records shown, matches Firestore) |
| 3.12.2 | Filter by action type | 1. Select "create" from action dropdown | Only create actions shown | Medium | ✅ (filter view → 6 rows, matches Firestore view count) |
| 3.12.3 | Filter by company | 1. Select company from dropdown | Company-specific actions shown | Medium | ✅ (ORAY → 2 rows, matches export) |
| 3.12.4 | Filter by date range | 1. Set from/to dates | Actions within range shown | Medium | ✅ (12/04–12/04 → 5 rows, all 2026-04-12) |
| 3.12.5 | Search by user | 1. Type user email in search | User's actions shown | Medium | ✅ (search "survey" → 4 rows across name/email/dashboard) |
| 3.12.6 | Multi-filter combination | 1. Apply action + company + date filters | Intersection of all criteria | Low | ✅ (view + ORAY → 0, AND logic confirmed) |
| 3.12.7 | Export to CSV | 1. Click Export button | CSV file downloaded | Medium | ✅ (20 rows, 8 cols, UTF-8 BOM; verify Thai in Excel) |
| 3.12.8 | Pagination works | 1. Navigate between pages | Correct page data loads | Low | ✅ (2 pages, page 2 = rows 11–20) |

---

### 3.13 Admin Explorer (`/admin/explorer`)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 3.13.1 | Navigate folder hierarchy | 1. Click folders in tree | Breadcrumb updates, content changes | High | ✅ (Root›Finance›Budget›2026, content swaps) |
| 3.13.2 | Create subfolder | 1. Click "สร้างโฟลเดอร์" 2. Fill form 3. Submit | Subfolder appears in tree and list | High | ✅ (TEST-A under Payroll) |
| 3.13.3 | Create dashboard in folder | 1. Navigate to folder 2. Click "สร้างแดชบอร์ด" 3. Submit | Dashboard appears in current folder | High | ✅ (Test Dashboard in TEST-A) |
| 3.13.4 | Assign moderators to folder | 1. Click folder settings 2. Select moderators 3. Save | Moderators assigned | High | ✅ (assigned Finance→Nopphol; moderator explorer confirms access) |
| 3.13.5 | Delete empty folder | 1. Click Delete on empty folder 2. Confirm | Folder removed from tree | Medium | ✅ (empty TEST-A removed, no error) |
| 3.13.6 | Delete folder with content | 1. Click Delete on folder with dashboards | Error message shown | Medium | 🐛 BUG-008 — folder deleted silently, dashboard orphaned (fixed: content guard added) |
| 3.13.7 | Breadcrumb navigation | 1. Navigate deep 2. Click breadcrumb segment | Jumps to that folder level | Low | ✅ |
| 3.13.8 | Assign tags to a dashboard | 1. Click Edit on a dashboard 2. Click "+ Add tag" 3. Tick a tag 4. Click "บันทึก" | Dropdown stays open, tag becomes a removable badge, modal closes only on Save | Medium | 🐛 BUG-013 — first click saved and closed the modal (fixed; re-verified on prod 2026-08-04) |
| 3.13.9 | Tags shown in the list | 1. Open a folder holding tagged and untagged dashboards | Tagged rows show TagBadge chips on a second line under the name; untagged rows and folder rows are unchanged; columns do not shift | Low | ✅ (prod 2026-08-04 — 5 dashboards × 2 tags each, งบทดลอง/ภาคตะวันออกเฉียงเหนือ) |

---

## 4. Moderator Pages

### 4.1 Moderator Explorer (`/manage/explorer`)

| Middleware: `auth` | Role: Moderator |
|---|---|

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 4.1.1 | View assigned folders | 1. Login as Moderator 2. Go to `/manage/explorer` | Assigned folders shown, others disabled | High | ✅ |
| 4.1.2 | Create dashboard in assigned folder | 1. Navigate to assigned folder 2. Create dashboard | Dashboard created successfully | High | ✅ |
| 4.1.3 | Create dashboard in unassigned folder | 1. Try to create in unassigned folder | Error: "ไม่มีสิทธิ์" or button hidden | High | ✅ |
| 4.1.4 | Delete dashboard in assigned folder | 1. Delete own dashboard in assigned folder | Success | Medium | ✅ |
| 4.1.5 | Cannot reassign moderators | 1. Open folder settings | Moderator assignment hidden/disabled | Medium | ✅ |
| 4.1.6 | View unassigned folders (read-only) | 1. Click unassigned folder in tree | Shows content but no create/edit actions | Medium | ✅ |

---

### 4.2 Moderator Permissions (`/manage/permissions`)

| Middleware: `auth` | Role: Moderator |
|---|---|

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 4.2.1 | View manageable dashboards | 1. Go to `/manage/permissions` | Only dashboards in assigned folders shown | High | ✅ |
| 4.2.2 | Add user to dashboard | 1. Select dashboard 2. Add user 3. Save | User gains access | High | ✅ |
| 4.2.3 | Remove user from dashboard | 1. Select dashboard 2. Remove user 3. Save | User loses access | High | ✅ |
| 4.2.4 | Layer 3 restrictions hidden | 1. Check permission editor | Layer 3 (restrictions) not visible | Medium | ✅ |
| 4.2.5 | Cannot view unassigned dashboards | 1. Check list of dashboards | Unassigned dashboards not in list | Medium | ✅ |

---

## 5. Cross-Cutting Concerns

> **⏸️ ~~§5 / §6 / §7 deferred~~ — ปิดครบแล้ว (อัปเดต 2026-08-23).** §5 และ §6
> กดจบไปแล้วทั้งหมด (เหลือ 6.3.1 ที่จงใจข้าม) · §7 ผ่าน Chrome + Safari ครบ 6/6 ช่อง,
> breakpoint ครบทุกช่วง (320 / 768 / 769 / 1024), Firefox ตัดออกจากขอบเขต 2026-08-23 —
> route protection (§5.2.1–3) ผ่านตั้งแต่ pre-launch group A. ย่อหน้า
> ข้างล่างนี้เป็นบันทึกของตอนเข้า user trial เก็บไว้เป็นประวัติ. Revisit
> opportunistically after trial feedback. Decision 2026-07-28.

### 5.1 CRUD Pattern (ทุกหน้า Admin)

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 5.1.1 | Create → Toast success | 1. Create any resource | Toast: "เพิ่ม&lt;ทรัพยากร&gt;เรียบร้อยแล้ว" (เช่น "เพิ่มแท็กเรียบร้อยแล้ว") | High | ✅ (prod 2026-08-19 — `/admin/tags` สร้าง `ZZ-TEST-511` ได้ toast เขียว "เพิ่มแท็กเรียบร้อยแล้ว" ตรงคำ) |
| 5.1.2 | Update → Toast success | 1. Edit any resource | Toast: "แก้ไข&lt;ทรัพยากร&gt;เรียบร้อยแล้ว" | High | ✅ (UI: pre-launch B1–B3, 2026-06-28 — แก้ role/group ที่ `/admin/users` ขึ้น toast ทุกครั้ง) |
| 5.1.3 | Delete → Confirm dialog | 1. Click Delete on any resource | ConfirmDialog เปิดก่อนเสมอ → ยืนยัน = Toast "ลบ &lt;ชื่อรายการ&gt; เรียบร้อยแล้ว" | High | ✅ (UI: pre-launch B4 2026-06-28 + TC 3.3.5 / 3.5.9 ที่เห็น dialog แล้วโดน guard บล็อก) |
| 5.1.4 | Form validation — errors on submit | 1. Submit form with invalid data | Field-level error messages shown | High | ✅ |
| 5.1.5 | Modal close without saving | 1. Open modal 2. Fill data 3. Click Cancel | No changes persisted | Medium | ✅ (prod 2026-08-19 — กรอก `ZZ-CANCEL-TEST` แล้วกดยกเลิก, รีเฟรชแล้วยัง "แสดง 1–7 จาก 7 รายการ" เท่าเดิม) |
| 5.1.6 | Loading state during API call | 1. DevTools → Network → Slow 3G 2. `/admin/tags` เพิ่มแท็ก 3. กดบันทึก | ปุ่มเปลี่ยนเป็น "⟳ กำลังบันทึก..." และถูก disable กดซ้ำไม่ได้ | Medium | ✅ (2026-08-19 — throttle 3G, ปุ่มจางกดไม่ได้ตลอดช่วงรอ) |
| 5.1.7 | Error clears when the field is fixed | 1. `/admin/dashboards` → เพิ่มแดชบอร์ดใหม่ 2. กด บันทึก ทั้งที่ว่าง 3. เลือกโฟลเดอร์ | แดงใต้โฟลเดอร์หายทันที ไม่ต้องกด บันทึก ซ้ำ | High | ✅ |
| 5.1.8 | Fixing one field keeps the others' errors | ต่อจาก 5.1.7 ก่อนกรอกชื่อ | แดงใต้ ชื่อแดชบอร์ด ยังอยู่ | High | ✅ |
| 5.1.9 | Message follows the failing rule | 1. `/admin/companies` → เพิ่มบริษัท 2. กด บันทึก ทั้งที่ว่าง 3. พิมพ์ `A` 4. พิมพ์ต่อเป็น `AB` | `is required` → `must be at least 2 characters` → แดงหาย | Medium | ✅ |
| 5.1.10 | No error before submit or blur | 1. เปิดฟอร์มเปล่า 2. พิมพ์ `A` ค้าง cursor ไว้ในช่อง | ไม่มีแดงขึ้น จนกว่าจะ blur หรือกด บันทึก | Medium | ✅ |
| 5.1.11 | Edit mode opens clean | 1. `/admin/companies` → กดแก้ไขบริษัทที่มีอยู่ | ฟอร์มเปิดมาไม่มีข้อความแดง | Medium | ✅ |

### 5.2 Navigation & Middleware

| # | Test Case | Steps | Expected Result | Priority | Status |
|---|-----------|-------|-----------------|----------|--------|
| 5.2.1 | Unauthenticated → `/admin/*` | 1. Open admin URL without login | Redirect to `/login` | Critical | ✅ (UI: pre-launch group A1, 2026-06-28) |
| 5.2.2 | User role → `/admin/*` | 1. Login as User 2. Go to `/admin/users` | Redirect to `/dashboard/discover` | Critical | ✅ (UI: pre-launch group A2, 2026-06-28) |
| 5.2.3 | Moderator → `/admin/*` | 1. Login as Moderator 2. Go to `/admin/users` | Redirect to `/dashboard/discover` | Critical | ✅ (UI: pre-launch group A3, 2026-06-28) |
| 5.2.4 | Sidebar reflects role | 1. Login as each role | user = แดชบอร์ด (หน้าแรก + แดชบอร์ดทั้งหมด) เท่านั้น · moderator = + accordion "จัดการ" · admin = + accordion "ผู้ดูแลระบบ" (ภาพรวม/ผู้ใช้/คำเชิญ/Explorer/บริษัท/เขตพื้นที่/กลุ่มผู้ใช้/แท็ก/Audit Logs/System Health) | High | ✅ (2026-08-19 — เห็นครบ 3 role: `survey` user, `n.noikaeo` moderator, `it.streamwash` admin) |
| 5.2.5 | Sidebar visibility on mobile | 1. เปิดที่ 375px (iPhone SE) 2. กด ☰ 3. กดฉากมืด 4. กดเมนูใน drawer | ปุ่ม ☰ อยู่ซ้ายสุดของ header · กดแล้ว drawer เลื่อนเข้า + ฉากมืด · กดฉากมืดปิด · กดเมนูแล้วไปหน้านั้นและ drawer ปิดเอง · เมนูผู้ใช้ (avatar) ยังกดได้ ไม่ตกขอบ | High | ✅ (2026-08-19 ครบ 4 ทาง — ☰ เปิด · แตะพื้นเทาปิด · กดลิงก์ปิด (รวมลิงก์ของหน้าที่อยู่แล้ว) · กดหัว accordion กางเมนูโดยไม่ปิด · จอ >768px ไม่มี ☰) |

---

## 6. Error Scenarios & Edge Cases

### 6.1 Authentication Errors

| # | Scenario | Expected Behavior | Status |
|---|----------|-------------------|--------|
| 6.1.1 | Token expired during action | Redirect ไป `/login?returnTo=<หน้าเดิม>` แล้ว login สำเร็จต้องพากลับหน้าเดิม (พร้อม query เช่น `?dashboard=`) | ✅ (2026-08-19 — เข้า `/admin/permissions?dashboard=dash_1785082599181` ทั้งที่ไม่ได้ login แล้ว login เป็น admin กลับมาหน้าเดิมพร้อม query ครบ · `?returnTo=https://example.com` ไป `/dashboard` ไม่ออกนอกเว็บ) |
| 6.1.2 | User account deactivated mid-session | รีเฟรชแล้วต้องถูก sign out ทันที เข้าหน้าไหนไม่ได้อีก | ✅ (2026-08-19 — user `survey` เปิดค้างที่ `/dashboard` · admin ปิดสวิตช์ · กด F5 เด้งออก `/login?returnTo=/dashboard` ทันที) |
| 6.1.4 | หน้า login บอกเหตุผลที่ถูกเตะออก | ต่อจาก 6.1.2 — หน้า `/login` ต้องมีแถบแดง "บัญชีของคุณถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ" เหนือปุ่ม Google (ไม่ใช่หน้า login เปล่า) | ✅ (2026-08-19 — เห็นแถบแดงหลังกด F5 ที่ `/login?returnTo=/dashboard`) |
| 6.1.3 | Permission revoked mid-session | หลัง**รีเฟรช** `initAuth` อ่าน role ใหม่ → เด้งออกจากหน้าที่ไม่มีสิทธิ์ · ระหว่าง SPA ที่ยังไม่รีเฟรช store ยังเป็นค่าเดิมตามการออกแบบ | ✅ (2026-08-19 — moderator ค้างที่ `/manage/explorer`, admin เปลี่ยนเป็น role `user`, กด F5 → เด้ง `/dashboard/discover` sidebar เหลือแค่ แดชบอร์ด · ตัวกันอยู่ในหน้า [manage/explorer:140](../../app/pages/manage/explorer/[[folderId]].vue#L140) ไม่ใช่ middleware — `/manage/*` มีแค่ `auth`) |

### 6.2 Data Errors

| # | Scenario | Expected Behavior | Status |
|---|----------|-------------------|--------|
| 6.2.1 | Folder deleted while dashboard still references it | ปัจจุบัน chip โฟลเดอร์แสดง**ว่างเปล่า** ([DashboardListItem.vue:76](../../app/components/features/DashboardListItem.vue#L76) `?? ''`) ไม่ error ไม่บอกว่ากำพร้า — สร้างสภาพนี้ผ่าน UI ไม่ได้แล้ว (guard BUG-008/009) ต้องแก้ Firestore ตรง ๆ; ตรวจด้วย `npm run audit:orphans` · ตั้ง/คืนสภาพด้วย `node scripts/qa-broken-refs.mjs break --apply` / `restore --apply` | ✅ (2026-08-19 — ตั้ง `folderId` เป็น id ที่ไม่มีจริง: แถวยังอยู่ในลิสต์ ช่องโฟลเดอร์ว่างเปล่า ไม่ error ไม่หาย · คืนค่าแล้ว audit = 0) |
| 6.2.2 | User deleted while showing in admin table | หน้าจัดการสิทธิ์ fallback เป็น uid ดิบ ([PermissionsPage.vue:513](../../app/components/features/PermissionsPage.vue#L513)) และ PermissionEditor แสดง "Unknown" ([PermissionEditor.vue:520](../../app/components/features/PermissionEditor.vue#L520)) — ไม่ crash · ตั้ง/คืนสภาพด้วย `node scripts/qa-broken-refs.mjs break --apply` / `restore --apply` | ✅ (2026-08-19 — ใส่ uid ที่ไม่มีจริงใน `access.direct.users`: แท็บขึ้น "จัดการสิทธิ์ 1" แถวแสดง "Unknown" + badge สิทธิ์ตรง + ปุ่ม ✕ ลบได้ · "ผลลัพธ์รวม: 0 คน" ถูกต้องเพราะ uid ผีไม่ใช่ผู้ใช้จริง · คืนค่าแล้ว) |
| 6.2.3 | Folder has children — delete attempt | Error toast "ไม่สามารถลบโฟลเดอร์ที่มีเนื้อหาได้ กรุณาลบแดชบอร์ดและโฟลเดอร์ย่อยทั้งหมดก่อน" + โฟลเดอร์ไม่ถูกลบ | ✅ (ครอบด้วย TC 3.3.5 `/admin/folders` และ TC 3.13.6 Explorer ที่กดจริงแล้วทั้งคู่ — BUG-008/009) |

### 6.3 Network Errors

| # | Scenario | Expected Behavior | Status |
|---|----------|-------------------|--------|
| 6.3.1 | Slow API response | Spinner + "กำลังโหลด..." กลางตารางระหว่างรอ | 🔍 (**จงใจไม่กด** — [DataTable.vue:208](../../app/components/admin/DataTable.vue#L208) `v-if="loading"` แสดง spinner แทนตาราง และ `useAdminResource.fetch` set `loading=true` ก่อน await ทุกครั้ง · ทดสอบจริงแล้วเห็นยาก เพราะคอลเลกชันจริงมี 7 แถวบน WebChannel ที่เปิดค้าง ⇒ round trip สั้นกว่าที่ตาจับได้ แม้ throttle 3G · ถ้ากลไกพัง อาการที่ผู้ใช้เห็นคือ "ตารางว่าง" ไม่ใช่ "ไม่มี spinner") |
| 6.3.2 | API 500 error | — | ⊘ N/A (**เคสนี้เกิดไม่ได้ในสถาปัตยกรรมนี้** — หน้า admin เขียน Firestore ตรงผ่าน SDK ไม่ได้ยิง REST ของเราที่จะตอบ 500 · `setDoc` resolve เมื่อ server รับเท่านั้น และ SDK ไม่มี timeout: **ทดสอบจริง 2026-08-19** ตัดเน็ต (DevTools Offline) แล้วกดบันทึก → ปุ่มค้าง "กำลังบันทึก..." เกิน 30 วิ เงียบ ไม่มี error; ต่อเน็ตกลับ → SDK ส่งคิวที่ค้าง เขียนสำเร็จ toast เขียว modal ปิด · เส้น catch ที่ [useAdminCrudPage.ts:123](../../app/composables/useAdminCrudPage.ts#L123) ยังทำงานกับ error ที่ server ตอบจริง เช่น permission-denied หรือ `ValidationError` (เห็น toast แดงมาแล้วใน TC 3.7.7/3.8.6) · ช่องว่าง UX ที่พบระหว่างทางบันทึกเป็น BUG-026) |
| 6.3.3 | API 404 (resource not found) | หน้า `/dashboard/view/<id ที่ไม่มี>` ขึ้นกล่องแดง "เกิดข้อผิดพลาดในการโหลดรายงาน" + รายละเอียด `Dashboard not found` (อังกฤษ) + ปุ่ม "← ย้อนกลับ" | ✅ (2026-08-19 — `/dashboard/view/dash_xxxx` ด้วยบัญชี user) |

---

## 7. Cross-Browser & Responsive

> แถวใน §7 **ไม่นับรวมใน 211 เคส** ของ §8 — เป็นเมทริกซ์สภาพแวดล้อม ไม่ใช่เคสทดสอบฟังก์ชัน

### 7.1 Browsers

เบราว์เซอร์แยกกันที่ **engine** ไม่ใช่ที่ยี่ห้อ Chrome กับ Edge ใช้ Blink ตัวเดียวกัน กดทั้งคู่จึงได้ข้อมูลชุดเดียว

| Browser | Engine | Status | หมายเหตุ |
|---------|--------|--------|---------|
| Chrome | Blink | ✅ | เบราว์เซอร์ที่ใช้ทดสอบทุกเคสในแผนนี้ |
| Edge | Blink | ⊘ N/A | Blink เดียวกับ Chrome เวอร์ชันไล่ตามกันติด ๆ — ครอบคลุมโดยแถวบน ไม่ใช่ "ยังไม่ได้ทดสอบ" |
| Safari | WebKit | ✅ (**6/6 บน macOS 2026-08-20 · ยืนยันซ้ำบน iPhone จริง 2026-08-21**) | ผ่านครบทุกช่อง · เจอ BUG-029 (ความสูง `<select>`) แก้แล้วในรอบเดียวกัน · **ทดสอบบน `https://streamhub-1c27a.web.app` เท่านั้น ไม่ใช่ localhost** (ดู authDomain caveat ใน [authentication.md](../GUIDES/authentication.md)) · เป็น engine ของ iPhone/iPad ทุกเครื่อง จึงได้ทดสอบมือถือจริงไปในตัว |
| Firefox | Gecko | ⊘ ตัดออกจากขอบเขต (2026-08-23) | **เจ้าของโปรเจกต์ตัดออก ไม่ใช่ "ยังไม่ได้ทดสอบ"** — ต่างจาก Edge ตรงที่ Edge ครอบคลุมโดย Blink แต่ Gecko ไม่มีอะไรครอบคลุม จึงเป็นช่องว่างที่ **รับไว้โดยรู้ตัว** ไม่ใช่ช่องว่างที่ปิดแล้ว · ฐานที่ใช้ตัดสิน: ไล่โค้ดแล้วไม่ใช้ `:has()` / container query / `dvh` เลย, `backdrop-filter` มีที่เดียวและเป็นการตกแต่ง ([DashboardGrid.vue:135](../../app/components/features/DashboardGrid.vue#L135)), scrollbar เขียนทั้ง `scrollbar-width` และ `::-webkit-scrollbar` ⇒ ความเสี่ยงต่ำ · **เปิดกลับเมื่อไร:** มีผู้ใช้จริงรายงานปัญหาบน Firefox หรือมีโค้ดใหม่แตะ `signInWithPopup` / CSP `frame-src` / ฟีเจอร์ CSS ที่ Gecko ต่างจาก Blink — ช่อง `7.1.a–7.1.f` ยังอยู่ในตารางล่าง กดต่อได้ทันที |

**สิ่งที่ต้องกดในเบราว์เซอร์ที่ยังไม่ผ่าน** (ไม่ต้องไล่ทั้ง 211 เคส — กดเฉพาะที่ engine ต่างกันแล้วพัง):

> **ไม่มีเบราว์เซอร์ค้างแล้ว ณ 2026-08-23** — Chrome ✅, Safari ✅ 6/6, Edge ⊘ N/A (Blink), Firefox ⊘ ตัดออกจากขอบเขต · ตารางนี้เก็บไว้เป็นสคริปต์พร้อมกดถ้า Firefox ถูกเปิดกลับ หรือมี engine ใหม่เข้ามา

| # | กดอะไร | ผลที่ต้องได้ | ผล |
|---|--------|-------------|-----|
| 7.1.a | login ด้วย Google | หน้าต่าง popup เปิด เลือกบัญชีแล้วปิดเอง กลับมาที่แอปแบบล็อกอินแล้ว — **จุดเสี่ยงหลักของ §7 ทั้งหมด** `signInWithPopup` เป็นที่ที่ popup blocker กับ storage partitioning ต่างกันมากที่สุดระหว่าง engine | ✅ Safari — popup เปิด เลือกบัญชี แล้วปิดเอง กลับมาที่ `/` แบบล็อกอินแล้ว ไม่ติด popup blocker ไม่ติด ITP (ยืนยันข้อสันนิษฐานว่า authDomain same-origin บน prod ทำให้ผ่าน) |
| 7.1.b | ปิดหน้าต่าง Google ทิ้งกลางคัน | กลับมาหน้า login เงียบ ๆ ไม่มีข้อความแดง (`auth/popup-closed-by-user` ถูกกลืน) | ✅ Safari — ระหว่างรอปุ่มขึ้น "กำลังลงชื่อเข้า..." แบบ disabled พอปิดหน้าต่าง Google ทิ้ง **ปุ่มกลับมากดได้ตามปกติ** ไม่มีกล่องแดง · ตัวชี้ขาดคือปุ่ม ไม่ใช่ข้อความ: ถ้า `finally` ที่ [login.vue:41](../../app/pages/login.vue#L41) ไม่ทำงาน ปุ่มจะค้าง disabled ถาวร เข้าระบบต่อไม่ได้จนกว่าจะรีเฟรช |
| 7.1.c | เปิดแดชบอร์ดที่ฝัง Looker | iframe แสดงผล ไม่โดน CSP `frame-src` บล็อก | ✅ Safari — `Master List` (`dash_1774216578264`) เรนเดอร์เต็มทั้งกราฟ ตาราง และ Looker control ไม่โดน CSP `frame-src` บล็อก แถบซูมในแอปก็ทำงาน · **รอบแรกเปิด `dash_1784197770551` (Budget 2026) ซึ่งเป็น 1 ใน 7/41 ตัวที่ไม่มี `lookerEmbedUrl` เลย** จึงขึ้น placeholder และไม่ได้ทดสอบ iframe — เลือกแดชบอร์ดให้ถูกก่อนกดเคสนี้ |
| 7.1.d | หน้า admin ที่มีตาราง เช่น `/admin/users` | ตารางเรนเดอร์ครบ เลื่อนแนวนอนได้ถ้าจอแคบ ไม่ล้นทับ layout | ✅ Safari — ตารางเรนเดอร์ครบ ข้อมูลตรงกับ Chrome · พบ `<select>` ตัวกรองเตี้ยกว่า Chrome = **BUG-029** แก้แล้ว |
| 7.1.e | เปิด modal สักตัว (แก้ไขผู้ใช้) | modal เปิด/ปิด ปุ่มกดได้ scrollbar ในตัว modal ใช้งานได้ | ✅ Safari — เปิด "แก้ไขผู้ใช้" (🖊️ ไม่ใช่ 🗑️) โดยย่อหน้าต่างให้เตี้ยจนฟอร์มล้น: เนื้อหาถูกตัดหลังช่อง "ชื่อจริง" แต่ **ปุ่มยกเลิก/บันทึกยังติดขอบล่าง modal ครบ** = `.modal-body` ถูกบีบตาม `max-height: 90vh` จริง · ไม่เห็น scrollbar ไม่ใช่สัญญาณ — macOS ซ่อน overlay scrollbar จนกว่าจะเลื่อน · **ต้องเปิด modal ที่ผ่าน [Modal.vue](../../app/components/ui/Modal.vue) เท่านั้น**: `ConfirmDialog` เป็นคนละคอมโพเนนต์ เขียน `position: fixed` เอง ไม่มี `.modal-body` จึงไม่ทดสอบอะไร |
| 7.1.f | logout | กลับหน้า login ไม่ค้าง | ✅ Safari — กลับหน้า `/login` ไม่ค้าง |

> **โหมดเต็มจอบน iPhone — ยืนยันด้วยเครื่องจริง 2026-08-21** · iPhone Safari ไม่มี Fullscreen API สำหรับ element ใด ๆ (มีเฉพาะ `<video>`) ⇒ `supportsNativeFullscreen()` คืน `false` และโค้ดข้ามส่วน native ไปเงียบ ๆ **ไม่มี toast** ซึ่งเป็นพฤติกรรมที่ตั้งใจ — ถ้าเห็น toast "ซ่อนแถบเบราว์เซอร์ไม่ได้…" แปลว่าเครื่องนั้น**มี** API แต่ปฏิเสธ คนละกรณีกัน
>
> ที่เห็นบนเครื่องจริง: แถบหัวแอปหาย รายงานกินที่แทน ปุ่มออกลอยมุมขวาบนใช้ได้ทั้งแนวตั้งและแนวนอน · **แถบของ Safari เองยังอยู่เสมอ** (แนวตั้าง = แถบล่าง, แนวนอน = URL bar + แถบแท็บ) แตะไม่ได้จากฝั่งเว็บ ⇒ พื้นที่ที่ได้คืนบน iPhone คือความสูงของแถบหัวแอปอย่างเดียว ไม่ใช่ทั้งจอ
>
> **iPad ยืนยันด้วยเครื่องจริงแล้ว (iPad 9, 2026-08-23)** — ได้**ทั้งสองอย่าง**ตามที่คาดไว้: แถบหัวแอปหาย *และ* แถบของ Safari หายหมด (URL bar + แถบแท็บ + แถบสถานะ) เหลือแต่รายงานเต็มจอ กับปุ่มออกของเราที่มุมขวาบนและปุ่มออกของ iPadOS ที่มุมซ้ายบน · **ไม่มี toast** ⇒ `supportsNativeFullscreen()` คืน `true` และ `requestFullscreen()` สำเร็จ ไม่ได้เข้าทาง `catch` · นี่คือความต่างระหว่าง iPad กับ iPhone ที่เดาไว้ตอนแรกและตอนนี้วัดได้แล้ว: iPhone มี Fullscreen API เฉพาะ `<video>` จึงได้แค่ครึ่งเดียว (แถบหัวแอปหาย แถบ Safari อยู่) · ยืนยันครบ 4 สภาพ: แนวตั้ง/แนวนอน × ปกติ/เต็มจอ

> **สิ่งที่ 7.1.e ตรวจจริง ๆ** — [Modal.vue:286](../../app/components/ui/Modal.vue#L286) เขียน `.modal-body { flex: 1; overflow-y: auto }` อยู่ใน container ที่เป็น `flex-direction: column; max-height: 90vh; overflow: hidden` แต่ **ไม่ได้ตั้ง `min-height: 0`** · flex item มีค่าเริ่มต้น `min-height: auto` = ห้ามหดต่ำกว่าความสูงเนื้อหา ถ้าเอนจินบังคับกฎนี้เข้ม `overflow-y` จะไม่ทำงาน เนื้อหาดันกล่องจนสูงเกิน แล้วโดน `overflow: hidden` ตัดส่วนล่างทิ้ง ⇒ **อาการคือปุ่มบันทึกหายไป ไม่ใช่ scrollbar หาย** · ทดสอบแล้วไม่เกิดทั้ง Blink และ WebKit แต่ถ้าวันหนึ่ง modal เพี้ยนบนเบราว์เซอร์ใหม่ ให้มาดูบรรทัดนี้ก่อน

### 7.2 Responsive Breakpoints

CSS media query ล้วน ๆ — ทดสอบใน DevTools ของ Chrome ได้ ไม่ต้องเปลี่ยนเบราว์เซอร์

| Breakpoint | Width | Key Checks | Status |
|------------|-------|------------|--------|
| Mobile (drawer) | 375px | ปุ่ม ☰ + drawer + overlay + ย่อโลโก้ + ซ่อนชื่อผู้ใช้ · **และแถบหัวของหน้าแดชบอร์ด** | ✅ (ยืนยัน 2026-08-21) · `AppLayout` ผ่านตั้งแต่ BUG-025 แต่รอบนั้น**ไม่ได้ตรวจหน้าแดชบอร์ดซึ่งมีแถบหัวของตัวเอง** — ตรวจแล้วพังจริง (BUG-030 ปุ่มซูมถูกตัด) แก้และกดยืนยันแล้ว · บทเรียน: "375px ผ่าน" ของ layout หนึ่งไม่ได้แปลว่าทุกหน้าผ่าน หน้าไหนมีแถบเครื่องมือของตัวเองต้องดูแยก |
| Mobile (ขอบล่าง) | 320px | เหมือน 375 แต่แคบสุด — หัวข้อ/ปุ่มในแถบบนต้องไม่ทับกัน, `width: 70vw` ของ drawer = 224px ยังอ่านเมนูออก | ✅ Chrome DevTools (2026-08-23) — แถบบน (☰ / โลโก้ / avatar) ไม่ทับกัน · drawer 224px อ่านเมนูออกครบ "กลุ่มธุรกิจ/เขตพื้นที่" พอดีบรรทัดเดียว (กว้างกว่า sidebar 192px ของ 7.2.a) · `/admin/users` ตัวกรองเรียงเป็นคอลัมน์เดียว ตารางเลื่อนในกรอบตัวเอง · **แถบซูมหน้าแดชบอร์ดครบทั้ง `−` `80%` `+` ไม่ถูกตัด** (`dash_1774216578264`) = fix BUG-030 ยืนที่ 320px ไม่ใช่แค่ 375 |
| Tablet | 641–1024px | sidebar ย่อเหลือ `12rem` แต่ยังอยู่ในflow ([AppLayout.vue:236](../../app/components/layouts/AppLayout.vue#L236)) — **ไม่มีปุ่ม ☰ ในช่วงนี้ และถูกต้องแล้ว** เพราะ sidebar ไม่ได้ถูกซ่อน · ที่ต้องดูคือผลข้างเคียง ดูตารางล่าง | ✅ (2026-08-23) — ปิดครบด้วย 7.2.a–7.2.d ที่ 1024 / 769 / 768 (769 บีบกว่า 800 ที่แผนเขียนไว้ จึงกินความครอบคลุมของ 800 ไปด้วย) |
| Desktop | 1025px+ | layout เต็ม sidebar กว้างปกติ | ✅ |

**ช่วง 769–1024px — สิ่งที่ต้องดูจริง ๆ**

drawer ตัดที่ `max-width: 768px` ส่วนการย่อ sidebar ตัดที่ `max-width: 1024px` ⇒ ช่วงคาบเกี่ยวนี้ sidebar กว้าง 192px และเห็นตลอด เหลือเนื้อที่เนื้อหา ~832px ที่ 1024

| # | ดูอะไร | ผลที่ต้องได้ | ผล |
|---|--------|-------------|-----|
| 7.2.a | เมนูไทยยาวใน sidebar ("กลุ่มธุรกิจ/เขตพื้นที่") | ไม่ล้น 192px ไม่ถูกตัดจนอ่านไม่รู้เรื่อง | ✅ Chrome DevTools 1024px (2026-08-23) — ข้อความ **ตัดขึ้น 2 บรรทัด** ("กลุ่มธุรกิจ/เขต" / "พื้นที่") ซึ่ง**ไม่ใช่การล้น**: ทุกตัวอักษรอยู่ในกรอบ 192px ไม่มี `…` ไม่มีตัวไหนหาย ไม่มีอะไรทะลุออกนอกแถบ อ่านครบ · แถวสูงขึ้นหนึ่งบรรทัดเท่านั้น ไม่ดันรายการอื่นเพี้ยน · เทียบได้: ที่ 320px drawer กว้าง 224px ข้อความเดียวกันพอดีบรรทัดเดียว ⇒ 192px คือจุดที่แคบพอให้ wrap ไม่ใช่จุดที่พัง |
| 7.2.b | `/admin/users` (ตาราง 7 คอลัมน์) ที่ 1024 และ 800 | ตารางเลื่อนแนวนอนในกรอบตัวเอง ไม่ดันทั้งหน้าให้เลื่อนแนวนอน | ✅ Chrome DevTools 1024 + 769px (2026-08-23) — ที่ 1024 คอลัมน์ครบไม่ต้องเลื่อน · ที่ 769 (บีบกว่า 800 ที่แผนขอ เพราะ sidebar กิน 192px เหลือเนื้อที่ 577px) ตารางถูกตัดที่คอลัมน์ "กลุ่ม" แล้ว **เลื่อนในกรอบตัวเองไปถึง `สถานะ` และ `จัดการ` ได้จริง กดยืนยันแล้ว** หน้าเว็บทั้งหน้าไม่เลื่อนตาม · กลไกคือ `overflow-x-auto` ที่ [DataTable.vue:214](../../app/components/admin/DataTable.vue#L214) |
| 7.2.c | ที่ 769px พอดี (ขอบล่างของช่วง) | sidebar ยังอยู่ ไม่มี ☰ ไม่มี overlay ค้าง ([AppLayout.vue:271](../../app/components/layouts/AppLayout.vue#L271) ซ่อน overlay ตั้งแต่ 769 ขึ้นไป) | ✅ Chrome DevTools 769px (2026-08-23) — sidebar 192px ยังอยู่ในflow, ไม่มีปุ่ม ☰, ไม่มี overlay ค้างทับเนื้อหา |
| 7.2.d | ที่ 768px (ต่ำลงมา 1px) | สลับเป็น drawer ทันที ปุ่ม ☰ โผล่ ไม่มีสภาพครึ่ง ๆ กลาง ๆ | ✅ Chrome DevTools 768px (2026-08-23) — ลง 1px จาก 769 แล้ว sidebar หายทั้งแถบ ☰ โผล่มุมซ้ายทันที ไม่มีสภาพครึ่ง ๆ · **ผลข้างเคียงที่ควรรู้:** 768 เห็นคอลัมน์ครบ 6 แต่ 769 เห็น 4 เพราะ 769 ยังเสีย 192px ให้ sidebar (เหลือ 577px) ส่วน 768 ได้เต็ม 768px ⇒ จอแคบลงกลับเห็นข้อมูลมากขึ้น เป็นผลของ breakpoint ไม่ใช่ของเสีย แต่แปลว่า **769–950px คือช่วงที่อึดอัดที่สุดของหน้า admin** |

**สองอย่างที่เห็นระหว่างกด §7.2 — ไม่ใช่บั๊ก แต่จดไว้กันค้นซ้ำ**

1. **ปุ่ม 🖊️ กับ 🗑️ ในคอลัมน์ "จัดการ" แยกคนละบรรทัดเมื่อจอแคบ** — ตั้งใจ ไม่ใช่ layout พัง: กล่องปุ่มเป็น `flex ... flex-wrap` ที่ [DataTable.vue:354](../../app/components/admin/DataTable.vue#L354) ส่วน `<td>` ตั้ง `width: 120px` ไว้เป็น *คำแนะนำ* ไม่ใช่ `min-width` ⇒ พอตารางถูกบีบ คอลัมน์แคบกว่า 2 ปุ่ม (36px + gap + 36px) มันจึง **wrap ลงบรรทัดใหม่แทนที่จะถูกตัดหาย** ปุ่มทั้งสองยังเห็นและกดได้ครบ แลกกับแถวสูงขึ้น · ถ้าจะให้อยู่บรรทัดเดียวเสมอต้องเปลี่ยนเป็น `min-width` บน `<td>` หรือถอด `flex-wrap` — แต่ทางนั้นแลกด้วยการตัดปุ่มหายเมื่อที่ไม่พอ ซึ่งแย่กว่า

2. **console ของหน้าแดชบอร์ดมีข้อความจาก Looker เอง ไม่ใช่ของเรา** — `requestStorageAccess: Refused to execute request. The document is sandboxed...` มาจาก `recaptcha__th.js` และคำเตือน Google Maps `loading=async` มาจาก `js?key=...visualization` ทั้งคู่รันอยู่**ข้างใน** iframe ของ Looker · `sandbox` ที่เราตั้งไว้ที่ [\[id\].vue:252](../../app/pages/dashboard/view/[id].vue#L252) ไม่มี `allow-storage-access-by-user-activation` จึงเห็นข้อความนี้ · รายงานเรนเดอร์ครบและซูมได้ตามปกติ ⇒ ยังไม่ต้องแตะ · **ถ้าวันหนึ่งมี Looker control ตัวไหนทำงานไม่ครบ ให้มาดูบรรทัดนี้ก่อน** แล้วค่อยชั่งว่าจะเพิ่ม keyword เข้า `sandbox` ไหม

เคสไหนพัง จดเป็น BUG-032 ขึ้นไปในตาราง §8 ก่อน แล้วค่อยตัดสินใจว่าจะแก้รอบไหน (029 = ความสูง `<select>` บน WebKit, 030 = ปุ่มซูมถูกตัดที่ 375px, 031 = embed token 403)

---

## 8. Known Bugs

| # | Bug | พบใน TC | Priority | Status |
|---|-----|---------|----------|--------|
| BUG-001 | Dashboard ใน sub-folder ไม่แสดงใน "Group By: Folder" และไม่มีชื่อ folder ในคอลัมน์ Folder | TC 2.2.8 | High | 🔧 Fixed |
| BUG-002 | Admin toggle "แสดงที่เก็บถาวร" ไม่แสดง archived dashboard | TC 2.2.10 | High | 🔧 Fixed |
| BUG-003 | Tag filter ไม่ถูก sync เข้า URL query params — copy URL แล้วเปิด tab ใหม่ filter หาย | TC 2.2.11 | Medium | 🔧 Fixed |
| ENV-001 | หน้าขาวพร้อม MIME type error "Expected JavaScript-or-Wasm but got text/html" หลัง deploy ใหม่ | TC 2.3.1 | Low | ℹ️ Not a Bug |
| BUG-004 | Bulk invite ไม่ใช้ role/company/group รายแถว — ทุกคนได้ค่าของแถวแรก | TC 3.9.8 | High | 🔧 Fixed |
| DESIGN-001 | `access.company = []` = public ทุกคน — override direct user/group grant; 7/11 dashboards prod เป็น public (2 ตัวมี group grant ที่ถูก override) | TC 3.10.2 | High | 🔧 Fixed (Looker visibility model) |
| BUG-006 | Discover company column แสดง "ทุกบริษัท" เมื่อ access.company ว่าง — label เก่าจากยุคก่อน DESIGN-001 (empty ≠ public แล้ว) ทำให้เข้าใจผิดว่า dashboard เปิดทุกคน | TC 4.2 | Medium | 🔧 Fixed |
| BUG-005 | `group.members[]` (แก้ที่ /admin/groups) ไม่ sync กับ `user.groups[]` (แก้ที่ /admin/users) — 2 แหล่งข้อมูลไม่ตรงกัน + **ทิศลบไม่ล้าง ref**: ลบกลุ่มแล้ว id ยังค้างใน `user.groups[]` (ตารางผู้ใช้ยังโชว์ badge ของกลุ่มที่ไม่มีแล้ว — ยืนยันด้วยการกดจริง 2026-08-19) และลบผู้ใช้แล้ว uid ยังค้างใน `group.members[]` + `folders.assignedModerators[]` | TC 3.10.3 / 3.7.8 / 3.2.11 | Medium | 🔧 Fixed (ทิศ create/edit: PR #279/#280 · **ทิศลบ: ถาม ConfirmDialog พร้อมจำนวนที่กระทบ แล้ว cascade ล้างให้** — `planGroupDeleteCascade` / `planUserDeleteCascade` ใน [cascadeDelete.ts](../../app/utils/cascadeDelete.ts) + 12 เทสต์; `audit:orphans` เพิ่มหมวด `assignedModerators` ที่เดิมไม่มีใครตรวจ — รันครั้งแรกเจอ **5 โฟลเดอร์บน prod** ที่ยังถือ uid ของบัญชีที่ถูกลบไปนานแล้ว ล้างด้วย `scripts/clean-orphan-refs.mjs` เมื่อ 2026-08-20 audit = 0 ครบ 7 หมวด) |
| BUG-008 | Admin Explorer ลบโฟลเดอร์ที่มีเนื้อหาได้เงียบ ๆ ไม่มี error/warning — dashboard/subfolder ข้างในกลายเป็น orphan (`folderId`/`parentId` ชี้ไปยัง folder ที่ถูกลบ) | TC 3.13.6 | Medium | 🔧 Fixed |
| BUG-009 | `/admin/folders` (DataTable, ต่างหน้ากับ BUG-008 ที่เป็น Explorer) ลบโฟลเดอร์ที่มี subfolder/dashboard ได้เงียบ ๆ — orphan แบบเดียวกัน; guard ของ Explorer ไม่ครอบหน้านี้ (คนละ composable: `useAdminCrudPage`) | TC 3.3.5 | High | 🔧 Fixed (เพิ่ม `canDelete` guard ใน `useAdminCrudPage` + wire หน้า folders) |
| BUG-010 | สร้าง company/region ด้วย `code` ซ้ำ = **เขียนทับ record เดิมเงียบ ๆ (data loss)** — `useAdminResource.create` ใช้ `setDoc(docId=code)` ไม่เช็ค existence; tags `slug` ก็ไม่ถูกบังคับ unique | TC 3.5.4 / 3.6.5 / 3.8.6 | High | 🔧 Fixed (เพิ่ม `uniqueFields` + `assertUnique` บน create+update; companies/regions→`code`, tags→`slug`) |
| BUG-011 | สร้าง company โดยไม่เลือก region → CompanyForm ส่ง `region: undefined` → Firestore `setDoc` reject ("Unsupported field value: undefined") = สร้างไม่ได้เลย | TC 3.5.3 | High | 🔧 Fixed (CompanyForm ส่ง region เป็น `''` เมื่อว่าง, omit regionRole) |
| BUG-012 | Groups ใช้ `id` ที่ผู้ใช้พิมพ์เป็น doc id แต่ **ตกหล่นจาก fix BUG-010** — สร้าง group ด้วย id ซ้ำ = ทับ group เดิมเงียบ ๆ (data-loss แบบเดียวกัน) | TC 3.7.7 | High | 🔧 Fixed (wire `useAdminGroups` uniqueFields `id`→"รหัสกลุ่มซ้ำ"; PR #321) |
| BUG-013 | กด "+ Add tag" ใน modal แก้ไขแดชบอร์ด = **เซฟและปิด modal ทันที** ติดแท็กไม่ได้เลย — ปุ่มใน `TagSelector`/`TagBadge` ไม่ได้ใส่ `type` ปุ่มที่ไม่มี type คือ `type="submit"` และมันอยู่ใน `<form>` ของ `FormModal` คลิกจึง submit → `emit('save')` → parent เซฟ+ปิด (ปุ่ม `✕` ลบแท็กก็พังแบบเดียวกัน — `@click.stop` หยุดแค่ propagation ไม่ได้หยุด submit) | TC 3.13.8 | High | 🔧 Fixed (`type="button"` 3 ปุ่ม; PR #336) |
| BUG-014 | Quick Share จาก Discover ส่ง `userIds: [undefined]` — `QuickShareDialog` อ่าน `user.id` ทั้งไฟล์ แต่ type `User` มีแค่ `uid`; ปุ่มลบผู้ใช้ที่เลือกก็ไม่เคยตรงกับแถวไหน (filter ด้วย `undefined`) | TC 2.2 (share flow) | High | ⊘ ปิดด้วยการลบ — แก้เป็น `uid` แล้ว (PR #353) แต่ไม่เคย retest ด้วยมือได้เพราะ dialog เปิดไม่ได้ ตอนนี้ Quick Share ถูกลบทั้งชุด โค้ดที่มีบั๊กไม่เหลือแล้ว |
| BUG-016 | ข้อความ error ค้างหลังแก้ค่าให้ถูกแล้ว ทุกฟอร์ม admin — `useForm` ล้าง error ไว้ใน `setFieldValue` แต่ทุกฟอร์มผูก `v-model="formData.x"` ซึ่งเขียน reactive object ตรงๆ ทางนั้นจึงไม่เคยถูกเรียก (CompanyForm เป็นไฟล์เดียวในรีโปที่เรียก และเรียกกับ field ที่ไม่มี validator) | TC 5.1.7 | Medium | 🔧 Fixed (`watch(formData)` + re-validate ใน `useForm`; PR #367; UI-verified 2026-08-15 TC 5.1.7–5.1.10) |
| BUG-017 | ปุ่ม "แชร์" ใน `QuickShareDialog` (Discover) **ไม่เขียนอะไรเลย** — `handleShare` ใน `useDashboardPage` เป็น stub ไม่เคยเรียก `quickShareDashboard` แต่ dialog ปิดตัวเองหลัง emit ผู้ใช้จึงเห็นเหมือนสำเร็จ | TC 2.2 (share flow) | High | ⊘ ปิดด้วยการลบ — ต่อสายให้ทำงานแล้ว (PR #376) จากนั้นพบว่า **dialog ไม่มีทางเปิดในทุก UI** จึงตัดสินใจลบ Quick Share ทั้งชุด ดูรายละเอียดใต้ตาราง |
| BUG-018 | หน้า `/admin/permissions` (+ `/manage/permissions`) เขียน `restrictions.expiry` เป็น **ISO string ที่เที่ยงคืน UTC** = 07:00 น. ตามเวลาไทย ⇒ ตั้ง "หมดอายุ 18 ส.ค." สิทธิ์ตัดเช้าวันที่ 18 เร็วไป 17 ชม.; และ shape ต่างจากที่ Quick Share เขียน (`Timestamp`) ทั้งที่เป็นฟิลด์เดียวกัน | TC 3.10.11–3.10.12 | Medium | 🔧 Fixed — **ยืนยันบน prod 2026-08-19**: `dash_1787110946066` ได้ `object<Timestamp>` + `resolves 2026-08-20T16:59:59.999Z` (= 23:59:59.999 น. ไทย) ✅ และฝั่งโฟลเดอร์ `folder_1785082588448` ได้ `Timestamp` เดียวกัน ✅ |
| BUG-020 | ลบสิทธิ์ผู้ใช้ออกจากแดชบอร์ด แต่ข้อจำกัด (หมดอายุ/ระงับ) ของคนนั้นยังค้างอยู่ — หน้าจอแสดง `จัดการสิทธิ์ 0` คู่กับ `ข้อจำกัด 1` โดยไม่บอกว่ามีผลหรือไม่ และถ้าให้สิทธิ์คนเดิมใหม่ภายหลัง วันหมดอายุเก่าจะกลับมามีผลเงียบ ๆ | TC 3.10.13 | Medium | 🔧 Fixed (ถาม ConfirmDialog ตอนลบสิทธิ์ที่มีข้อจำกัดผูกอยู่ **เฉพาะเมื่อ direct grant เป็นทางเข้าเดียว** ยืนยันแล้วลบทั้งคู่) — **ยืนยันบน prod 2026-08-19** TC 3.10.13/3.10.14/3.10.15 ผ่านครบ ✅ · ต่อมาย้าย guard ไปตรวจตอนกดบันทึกแทนการดักรายปุ่ม ดู BUG-022 |
| BUG-021 | บันทึกสิทธิ์สำเร็จแล้ว **ไม่มีข้อความยืนยันเลย** — `cameFromExplorer` เป็น true ทุกครั้งที่ URL มี `?dashboard=`/`?folder=` (คือทางเข้าปกติทั้งหมด) จึง `goBackToExplorer()` แล้ว `return` ก่อนถึงบรรทัดที่ตั้ง `successMessage` ⇒ แถบ `alert-success` เป็นโค้ดที่ไม่มีทางแสดง ผู้ใช้ไม่รู้ว่าบันทึกติดหรือไม่ | TC 3.10.17 | Medium | 🔧 Fixed (`showToast` ก่อน navigate — toast เป็น `useState` singleton จึงข้าม route ได้; ทางที่ล้มเหลวก็ toast ด้วย) — **ยืนยันบน prod 2026-08-19** ✅ |
| BUG-022 | สวิตช์ **เข้าถึงสาธารณะ** ไม่ได้เดินผ่านการตรวจของ BUG-020 — มันเขียน `access.public` ตรง ๆ ที่ [PermissionsPage.vue:103](../../app/components/features/PermissionsPage.vue#L103) ไม่ใช่ `requestRemoval` ใน PermissionEditor ⇒ ปิดสาธารณะทั้งที่มีคนถูกระงับ/หมดอายุ = ทิ้งข้อจำกัดกำพร้าเงียบ ๆ (พบตอน regression pass 2026-08-19: ปิดสาธารณะ + ลบกลุ่ม แล้ว `revoke` ของ Janine ค้าง) | TC 3.10.22–3.10.23 | Medium | 🔧 Fixed (ย้ายการตรวจไปที่ตอน **กดบันทึก** ด้วย `strandedRestrictions`; ถอด guard รายปุ่มใน `PermissionEditor` ออก) — **ยืนยันบน prod 2026-08-19** ครบ 4 เส้นทาง: ถาม / ยกเลิกไม่เขียน / ยืนยันเขียนทั้งคู่ / ข้อจำกัดที่ยังมีผลไม่ถูกแตะ ✅ |
| BUG-019 | ปุ่ม Share ในหน้า `/dashboard/view/[id]` เด้งไป `/admin/permissions` แบบ hardcode ทั้งที่หน้านั้น middleware `['auth','admin']` ⇒ **moderator กดแล้วโดนเด้ง** ใช้ไม่ได้ | TC 2.3.1 | Medium | ⊘ ปิดด้วยการลบ — ปุ่ม Share ในหน้านี้ถูกเอาออกพร้อม Quick Share (2026-08-18) เหลือทางเดียวคือ Explorer ปุ่ม 🔑 ซึ่งเลือก path ตาม role ถูกอยู่แล้ว |
| BUG-027 | ลด role moderator → user **ล้างโฟลเดอร์ที่ดูแลทิ้งทั้งหมดโดยไม่เตือน** และเลื่อนกลับเป็น moderator ไม่คืนให้ (ไม่มีที่เก็บประวัติ) — พบตอนทดสอบ TC 6.1.3: `folder_finance` เสีย `assignedModerators` ของบัญชีทดสอบไปถาวร ต้องผูกคืนเอง · การล้างเป็นพฤติกรรมตั้งใจ ([folderAssignment.ts:62](../../app/utils/folderAssignment.ts#L62)) แต่ฟอร์มไม่บอกว่ากำลังจะทิ้งอะไร | TC 6.1.3 | Medium | 🔧 Fixed (ConfirmDialog ตอนกดบันทึกเมื่อ role เปลี่ยนจาก moderator และคนนั้นดูแลโฟลเดอร์อยู่ — บอกจำนวนและว่าเลื่อนกลับไม่ได้คืนอัตโนมัติ) — **ยืนยันด้วยการกดจริง 2026-08-20** ✅ |
| BUG-028 | หน้า `/profile` ซ่อนการ์ด "โฟลเดอร์ที่ดูแล" ทั้งที่ badge ขึ้น "ผู้ดูแลโฟลเดอร์" — หน้าเดียวอ่าน role จาก 2 แหล่ง: badge จากเอกสาร Firestore (สด) ส่วนการ์ดจาก auth store (อัปเดตเฉพาะตอน auth init) ⇒ หลัง admin เปลี่ยน role กลางคัน สองส่วนขัดกันจนกว่าจะรีเฟรช | TC 6.1.3 | Low | 🔧 Fixed (อ่าน role จากเอกสารเป็นหลัก fallback ไป store ระหว่างรอโหลด; ย้ายการตัดสินใจ fetch โฟลเดอร์ไปหลังเอกสารมาถึง) |
| BUG-026 | กดบันทึกตอนเน็ตหลุด = **เงียบไม่มีที่สิ้นสุด** — ปุ่มค้าง "กำลังบันทึก..." ไม่มีข้อความ ไม่มี timeout ไม่มีทางยกเลิก ผู้ใช้แยกไม่ออกระหว่าง "ช้า" กับ "เน็ตหลุด" (งานไม่หาย SDK ส่งให้เองเมื่อกลับมาออนไลน์ แต่ไม่มีอะไรบอก) | TC 6.3.2 | Low | 🔧 Fixed (แบนเนอร์ออฟไลน์ใน `AppLayout` จาก [useOnlineStatus.ts](../../app/composables/useOnlineStatus.ts) — บอกว่าการบันทึกจะค้างและข้อมูลไม่หาย · ไม่ใส่ timeout เพราะจะไปตัดงานที่ระบบส่งสำเร็จภายหลัง) — **ยืนยันด้วยการกดจริง 2026-08-20** ✅ |
| BUG-029 | `<select>` ที่ใช้คลาส `.theme-form-select` เตี้ยกว่าที่ออกแบบไว้บน Safari/WebKit — คลาสนี้ตั้ง `padding: 0.5rem 1rem` แต่ไม่เคลียร์ `appearance` ⇒ ยังเป็น native control ที่ **WebKit ไม่สนใจ padding แนวตั้ง** (Blink ใส่ให้) ตัวกรองจึงไม่เท่าช่องค้นหาและปุ่มในแถวเดียวกัน · กระทบ select 13 ตัวใน 11 ไฟล์ · `.form-select` ของ [FormField.vue](../../app/components/forms/FormField.vue) **มีการแก้แบบนี้อยู่แล้ว** — `.theme-form-select` คือเส้นที่ตกหล่นไป | TC 7.1.d | Low | 🔧 Fixed (เคลียร์ `appearance` + วาดลูกศรเอง ใน [theme.css](../../assets/css/theme.css) โดย**ใช้ค่าเดียวกับ `.form-select` ทุกตัว** เพราะ filter bar กับ modal เห็นพร้อมกันได้ ลูกศรคนละทรงจะโป๊ะ — แก้ทีหลังต้องแก้คู่กัน) |
| BUG-030 | **ปุ่มซูม `+` ของหน้าแดชบอร์ดถูกตัดหายที่จอ ≤~400px กดไม่ได้เลย** — `.header-right` ([[id].vue:787](../../app/pages/dashboard/view/[id].vue#L787)) เป็น flex ที่ไม่มี `flex-wrap` ของ 4 ชิ้นรวม ~395px แต่ที่ 375px มีให้ 343px ⇒ ป้ายข้อความตกบรรทัด และ `.zoom-control` ที่ตั้ง `overflow: hidden` กลืนปุ่ม `+` ทิ้ง ไม่ถูกวาดและกดไม่โดน · หนักกว่าที่เห็นเพราะซูมนี้มีอยู่เนื่องจาก zoom ของเบราว์เซอร์ใช้กับ Looker ไม่ได้ (รายงานรีสเกลตามความกว้าง iframe เอง — PR #351) ⇒ บนมือถือขยายดูแดชบอร์ดไม่ได้เลยสักทาง · media query เดิมของไฟล์มีแค่ `max-width: 768px` ซึ่งจับ `.view-header` ไม่ได้จับ `.header-right` | TC 7.2 (375px) | Medium | 🔧 Fixed (≤640px ซ่อนป้ายข้อความเหลือไอคอน คืนที่ ~150px ทุกปุ่มอยู่แถวเดียว header ไม่กินความสูงเพิ่ม · เติม `aria-label` ให้ปุ่มสลับข้อมูลกับเต็มจอ เพราะเดิมมีแค่ `title` ⇒ ซ่อนข้อความแล้วจะเสียชื่อที่ screen reader อ่าน ส่วนปุ่มซูมมี `aria-label` อยู่แล้ว) — **ยืนยันด้วยการกดจริงที่ 375px 2026-08-21** ✅ ปุ่ม `+` กลับมาเห็นและกดได้ ทุกตัวอยู่แถวเดียว |
| BUG-031 | **เปิดแดชบอร์ดแล้วได้ `403 Invalid or expired token` เป็นครั้งคราว ทุกเครื่อง ไม่มีรูปแบบ** — token ของ embed เก็บใน `const store = new Map()` ที่อยู่ใน memory ของ instance ([embedTokenStore.ts](../../server/utils/embedTokenStore.ts)) แต่ functions เป็น `gcfv2` ไม่ตั้ง `minInstances` ⇒ autoscale หลาย instance และลงศูนย์ได้ · flow เป็น **2 request แยกกัน**: `POST /api/embed/request` สร้าง token ไว้ที่ instance A แล้ว iframe ยิง `GET /api/embed/{token}` ซึ่งอาจไปโดน instance B ที่ Map ว่าง ⇒ 403 · ซ้ำด้วยอีก 2 ชั้น: `consumeToken` **ลบทิ้งทันทีที่อ่าน** (รีเฟรช/retry/เบราว์เซอร์ยิงซ้ำ = ครั้งที่สอง 403) และ TTL แค่ **30 วินาที** (ค้างหน้าไว้แล้วค่อยโหลด = หมดอายุ) · **พบบน iPad 2026-08-21 แต่ไม่ใช่บั๊กเฉพาะอุปกรณ์** เครื่องอื่นผ่านเพราะโชคของจังหวะ instance | เปิดแดชบอร์ดที่มี Looker | High | 🔧 Fixed (`embedTokenStore.ts` ถูกลบ แทนด้วย [embedToken.ts](../../server/utils/embedToken.ts) — payload `{embedUrl, uid, exp}` ปิดผนึกด้วย **AES-256-GCM** จาก `EMBED_TOKEN_SECRET` ⇒ ไม่มี state ให้หายไปกับ instance, redeem ซ้ำได้, TTL เป็นข้อมูลใน token ไม่ใช่ตัวจับเวลาลบ · ยืด TTL 30 วินาที → **5 นาที** · เลือก encrypt ไม่ใช่ HMAC เพราะ payload แบบเซ็นอย่างเดียวอ่านออกด้วย base64 ⇒ Looker URL ตัวจริงจะหลุดถึง client ซึ่งเป็นสิ่งที่ proxy นี้ตั้งใจกันไว้แต่แรก) — ทดสอบบน dev server: mint 1 ครั้ง redeem 3 ครั้งได้ 302 ทุกครั้ง, token ที่ถูกแก้ 1 ไบต์และ token มั่ว = 403, ถอด base64 แล้วไม่พบ URL · ตามด้วยการผูก token เข้ากับเบราว์เซอร์ด้วย cookie `__session` (ปิดผนึกด้วยกุญแจเดียวกัน) — token ที่ถูกขโมยไปเปิดในเบราว์เซอร์คนอื่นได้ 403 ยืนยันด้วย cookie jar สองใบของ admin กับ user จริง · deploy รอบแรกบน prod ตอบ 500 `Embed tokens are not configured` เพราะ Nitro รับ env override เฉพาะที่ขึ้นต้น `NUXT_` แต่ Secret Manager ฉีดชื่อดิบ ⇒ เพิ่ม `resolveEmbedSecret` อ่าน `process.env` เป็น fallback |
| BUG-032 | **แดชบอร์ด Looker ไม่แสดงบน Safari ที่เปิด "ป้องกันการติดตามข้ามไซต์" (ค่าปริยาย)** — iframe ไปถึง Looker ได้ แต่ Looker เรนเดอร์หน้า "เข้าถึงรายงานไม่ได้ · เว็บไซต์นี้ใช้คุกกี้จาก Google" ของตัวเองข้างในกรอบ ⇒ **ไม่ใช่ 403 ของเรา ไม่ใช่ embed token** · Looker ใช้คุกกี้ Google ยืนยันว่าผู้ดูมีสิทธิ์ แต่ในกรอบมันเป็นคุกกี้บุคคลที่สาม ซึ่ง Safari ตัดทิ้ง · **หน้าที่พังเป็น cross-origin ⇒ ฝั่งเราไม่มี event ไม่มี error ให้จับ ตรวจด้วย feature detection ก็ไม่ได้** จึงเงียบสนิทสำหรับผู้ใช้ | เปิดแดชบอร์ดที่มี Looker บน Safari/iPadOS ที่ไม่เคยผ่อนคุกกี้ให้ Google | Medium | 🔧 Fixed (บางส่วน — เป็นข้อจำกัดของเบราว์เซอร์ ไม่ใช่ของโค้ด) · **พิสูจน์สาเหตุบน iPad 9 (2026-08-23):** ล็อกอิน `lookerstudio.google.com` แบบ first-party แล้ว **ยังไม่ขึ้น** ⇒ ตัดข้อสันนิษฐาน "ขาด first-party interaction" ทิ้ง · ปิด "ป้องกันการติดตามข้ามไซต์" แล้ว **ขึ้นทันที** ⇒ ตัวบล็อกคือ 3rd-party cookie ล้วน ๆ · **สิ่งที่แก้:** (A) เติม `allow-storage-access-by-user-activation` เข้า `sandbox` ของทุก iframe ที่ฝัง Looker — เดิมเราปิดประตู Storage Access API ไว้เอง (เห็นได้จาก console `requestStorageAccess: Refused to execute request. The document is sandboxed...`) เป็น**เงื่อนไขจำเป็น** ให้ Safari ขึ้นกล่องขออนุญาตคุกกี้ได้ แต่ Looker ต้องเรียก API เองด้วยจึงจะพอ · (B) แถบคำแนะนำในหน้าแดชบอร์ด แสดงเฉพาะเบราว์เซอร์ WebKit ([browser.ts](../../app/utils/browser.ts)) ปิดแล้วจำถาวร — เพราะตรวจความล้มเหลวไม่ได้ จึงต้องบอกล่วงหน้า · **(C) พิสูจน์แล้วว่าแก้ต้นเหตุได้จริง (iPad 9, 2026-08-23):** รายงานที่แชร์ฝั่ง Looker แบบ "ใครมีลิงก์ก็ดูได้" เปิดบน iPad ขึ้นครบทั้งโหมดปกติและเต็มจอ **โดยที่ "ป้องกันการติดตามข้ามไซต์" เปิดอยู่** — ไม่ต้องใช้คุกกี้บุคคลที่สามเลย · **ระวังการอ่านผลผิด:** รอบแรกทดสอบตอนสวิตช์ยัง*ปิด*อยู่ ซึ่งไม่พิสูจน์อะไร ต้องเปิดสวิตช์ก่อนเสมอจึงจะเป็นการทดสอบ C จริง · **ราคาที่ต้องจ่าย:** ใครถือลิงก์ Looker ก็เปิดได้ ไม่ผ่านสิทธิ์ในแอปเรา — ตัว URL ยังถูกปิดผนึกอยู่ใน embed token ไม่หลุดถึง client แต่ถ้าหลุดทางอื่นก็เปิดได้จริง ⇒ **เลือกใช้เป็นรายรายงาน ตามความอ่อนไหวของข้อมูล ไม่ใช่เปิดหมดทุกตัว** · **ต้องเปิด 2 สวิตช์ที่ Looker ไม่ใช่ตัวเดียว:** แชร์แบบลิงก์ **และ** File > Embed report > Enable embedding — รายงานที่แชร์ลิงก์แต่ไม่เปิด embedding ได้หน้าขาวทุกเบราว์เซอร์ รวม Chrome บนแมคที่ไม่บล็อกคุกกี้อะไรเลย (เจอจริงตอนทดสอบ ทำให้เกือบสรุปผิดว่า C ใช้ไม่ได้) |
| BUG-025 | **บนมือถือใช้งานไม่ได้เลย** — ที่จอ ≤768px [AppLayout.vue](../../app/components/layouts/AppLayout.vue) ดัน sidebar ออกนอกจอ (`left: -100%`) แล้วรอคลาส `.sidebar-open` ที่**ไม่มีที่ไหนใส่** และไม่มีปุ่มเปิดในทั้งแอป ⇒ ไปหน้าอื่นไม่ได้; ซ้ำโลโก้สูง 5rem ดัน `UserMenu` ตกขอบขวา ⇒ กดออกจากระบบ/โปรไฟล์ก็ไม่ได้ เหลือแค่หน้าที่เปิดค้างอยู่ | TC 5.2.5 | High | 🔧 Fixed (ปุ่ม ☰ + state `isSidebarOpen` + overlay กดปิด + ปิดเองเมื่อเปลี่ยน route; ย่อโลโก้/ซ่อนชื่อผู้ใช้บนจอเล็ก; ปลด `.menu-toggle` ออกจากกฎ global ที่ทาทุก `button` เป็นน้ำเงิน) — **ยืนยันด้วยการกดจริง 2026-08-19** ✅ · รอบแรกปิด drawer ด้วย `watch(route.fullPath)` อย่างเดียว ซึ่งค้างเมื่อกดลิงก์ของหน้าที่เปิดอยู่แล้ว (ปลายทางเดิม = ไม่มี navigation) จึงย้ายไปปิดตอนแตะ `<a>` |
| BUG-023 | **ปิดบัญชีผู้ใช้กลางคัน แล้วเขายังใช้งานต่อได้** — `isActive === false` ถูกเช็คเฉพาะใน `signInWithGoogle` ส่วน `initAuth` (ที่รันทุกครั้งที่รีเฟรช) เช็คแค่ว่า "พบ user ไหม" และ `firestore.rules` ก็ไม่ดู `isActive` ⇒ คนที่ถูกปิดบัญชียังเปิดหน้า อ่านรายการแดชบอร์ด/โครงสร้างโฟลเดอร์ได้จนกว่าจะ sign out เอง (ตัวเนื้อหาแดชบอร์ดถูกกันไว้ที่ server แล้ว — `embed/request.post.ts` เช็ค `isActive`) | TC 6.1.2 | High | 🔧 Fixed (เช็ค `isActive` ใน `initAuth` → `signOut()`) — **ยืนยันด้วยการกดจริง 2026-08-19** ✅ · การเตะออกเกิดก่อนกิ่ง `authError` ของ middleware ผู้ใช้จึงเห็นหน้า login เปล่า ตามมาด้วยแถบเหตุผลบนหน้า login (TC 6.1.4) |
| BUG-024 | หมด session กลางทางแล้วกลับเข้ามาไม่ถึงที่เดิม — middleware `navigateTo('/login')` ไม่แนบปลายทาง ⇒ login ใหม่ไปโผล่ `/dashboard` เสมอ คนที่กำลังแก้สิทธิ์ที่ `/admin/permissions?dashboard=<id>` ต้องเดินกลับเอง | TC 6.1.1 | Medium | 🔧 Fixed (`?returnTo=` + `safeReturnTo` sanitiser กัน open redirect; 13 เทสต์) — **ยืนยันด้วยการกดจริง 2026-08-19** ✅ ทั้งเส้นปกติและเส้น open redirect |
| BUG-015 | `PermissionsPage` บันทึก `setByName` เป็นค่าว่างเสมอ — เขียน `user.value?.name` ซึ่งไม่มีใน auth user (มี `displayName`) → provenance ไม่มีชื่อผู้ตั้งสิทธิ์ | TC 3.10 | Medium | 🔧 Fixed (ใช้ `displayName`; PR #353) |

**BUG-001 รายละเอียด:**
- **อาการ:** เมื่อใช้ Group By Folder จะแสดงเฉพาะ dashboard ที่อยู่ใน root folder เท่านั้น dashboard ที่อยู่ใน sub-folder จะหายไปจาก grouped view และคอลัมน์ folder ใน list view จะว่างเปล่า
- **Root Cause:** `buildFolderTree()` ใน `useFirestoreService.ts` คืนค่าเฉพาะ root folders (sub-folders ถูก nest ไว้ใน `.children`) แต่ `groupedByFolder` และ `folderNameMap` ใน `discover.vue` iterate แค่ level บนสุด ทำให้ sub-folder ID ไม่ถูก map
- **ไฟล์ที่เกี่ยวข้อง:** `app/pages/dashboard/discover.vue` (computed `groupedByFolder`, `folderNameMap`)

**BUG-002 รายละเอียด:**
- **อาการ:** Admin เปิด toggle "แสดงที่เก็บถาวร" แล้ว archived dashboard ไม่ปรากฏ
- **Root Cause:** `loadDashboards()` ใน `useDashboardPage.ts` ไม่ได้ส่ง `includeArchived: true` ไปให้ service ทำให้ archived dashboards ไม่ถูก load เข้า `dashboards.value` ตั้งแต่แรก toggle บน UI จึงไม่มีผล
- **ไฟล์ที่เกี่ยวข้อง:** `app/composables/useDashboardPage.ts` (function `loadDashboards`)

**BUG-003 รายละเอียด:**
- **อาการ:** เลือก tag filter แล้ว URL bar ไม่เปลี่ยน — copy URL ไปเปิด new tab ได้หน้าว่างไม่มี filter
- **Root Cause:** `handleTagFilterUpdate()` อัปเดตเฉพาะ `tagStore` แต่ไม่ push query param ลง URL ตรงข้ามกับ folder ที่ใช้ `router.push` เสมอ และไม่มี restore tag จาก URL ตอน `onMounted`
- **ไฟล์ที่เกี่ยวข้อง:** `app/pages/dashboard/discover.vue` (function `handleTagFilterUpdate`, `onMounted`)

**ENV-001 รายละเอียด:**
- **อาการ:** หน้าขาวพร้อม console error: `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"`
- **Root Cause:** Browser cache สาเหตุ — tab ที่เปิดค้างไว้ก่อน deploy ใหม่ถือ `index.html` เก่าที่อ้างอิง JS chunk hash เก่า (เช่น `IhJDMPiJ.js`) ซึ่ง Firebase Hosting ลบออกหลัง deploy Firebase SPA rewrite จึงตอบด้วย `index.html` แทน JS จริง ทำให้ browser ปฏิเสธ
- **วิธีแก้:** กด **Cmd+Shift+R** (Hard Refresh) หรือ clear cache — error หายทันที ไม่ใช่ app bug

**BUG-004 รายละเอียด:**
- **อาการ:** เชิญหลายคนใส่ role/company/group ต่างกันรายแถว แต่ทุกคนได้ role/company/group ของแถวแรก (เช่น แถว 2 ตั้ง Moderator + Management → ถูกส่งเป็น User + ไม่มีกลุ่ม)
- **Root Cause:** `server/api/invitations/bulk.post.ts` destructure แค่ flat `{ emails, role, company, assignedGroups }` แล้ว loop `for (const email of emails)` ใช้ค่าเดียวกับทุก email — **เมิน array `items[]`** ที่ client ([BulkInviteModal.vue](../../app/components/admin/BulkInviteModal.vue)) ส่งมาพร้อม role/company/group รายแถว
- **ไฟล์ที่เกี่ยวข้อง:** `server/api/invitations/bulk.post.ts` (+ `server/api/mock/invitations/bulk.post.ts` น่าจะมีปัญหาเดียวกัน)
- **แนวทางแก้:** ถ้ามี `body.items` ให้ loop ตาม items ใช้ role/company/message/assignedGroups รายแถว; fallback ไป flat arrays เพื่อ backward compat
- **🔧 Fixed (2026-07-19):** เพิ่ม `normalizeBulkItems` util + regression tests (PR #279); follow-up ปิด group leak (แถวไม่มี group ดึงของแถวก่อนหน้า) โดยแยก items[] mode (ไม่ inherit flat) vs emails[] mode (PR #280) — ยืนยันบน prod Firestore: purchase=user/STTH/[], mnc=moderator/STSB/[finance]

**DESIGN-001 รายละเอียด:**
- **อาการ:** ลบ direct user ออกจาก dashboard แล้ว user ยังเห็น dashboard อยู่ (พบตอนทดสอบ 3.10.2 บน Finance Summary)
- **Root cause:** `access.company = []` (ว่าง) ถูกตีความว่า "ทุกบริษัทเข้าถึงได้" — มี comment + logic ตรงกัน 3 ที่: [useFirestoreService.ts:720](../../app/composables/useFirestoreService.ts#L720), [useMockData.ts:165](../../app/composables/useMockData.ts#L165), [server/utils/companyAccess.ts:104](../../server/utils/companyAccess.ts#L104). เมื่อ company ว่าง `checkAccess` คืน true ให้ทุกคน — direct user/group grant ถูก override
- **Blast radius (prod, 2026-07-19):** 7/11 dashboards มี company=[] = public; 2 ตัว (`dash_hr_employee_data`, `dash_project_q1_analytics`) ตั้ง group grant ไว้แต่ถูก override เป็น public
- **ไม่ใช่ code bug — เป็น design decision ที่เป็น footgun.** ต้องตัดสินใจ: (A) คงไว้ (empty=public by design) แต่เพิ่ม UI cue ว่า dashboard นี้ public / (B) เปลี่ยน semantics — ถ้ามี direct.users หรือ direct.groups แล้ว company=[] ควรหมายถึง "เฉพาะ grant" ไม่ใช่ "ทุกคน" (ต้องแก้ทั้ง 3 ที่ + rule + regression)
- **ผลต่อการทดสอบ:** 3.10.1/2/3/5 ต้องทดสอบบน dashboard ที่ restricted (company ระบุ) เท่านั้น
- **🔧 Fixed (2026-07-19) — เลือก Looker-style visibility model (PR #283 A+B → PR #284 default-private):**
  - เพิ่ม `access.public` flag (default false = private); ลบ empty-company-means-all ทิ้ง
  - Logic ใหม่ (3 จุดตรงกัน): `restrictions → deny; public → allow; direct/group/company match → allow; else DENY`
  - **default = private** (ไม่มี grant + ไม่ public = เฉพาะ admin + folder inheritance)
  - UI: toggle 🌐 สาธารณะ (admin+moderator) + banner สาธารณะ/ส่วนตัว(มีสิทธิ์)/ส่วนตัว(ยังไม่มีใคร)
  - ไม่มี migration — dashboard ที่เคย public (ไม่มี grant) กลายเป็น private อัตโนมัติ (ตัดสินใจ: เข้มทันที)
  - regression tests: `tests/server/companyAccess.test.ts`
  - **หมายเหตุ:** บรรทัด useFirestoreService.ts:720 / useMockData.ts:165 / companyAccess.ts:104 ข้างบนเป็นเลขก่อนแก้ — logic ปัจจุบันเปลี่ยนแล้ว

**BUG-005 รายละเอียด:**
- **อาการ:** เปิด modal "รายละเอียดกลุ่ม" ของ operations แสดง "สมาชิกในกลุ่ม 2 คน" แต่ list แสดงแค่ Janine 1 คน + ข้อความ "มีสมาชิก 1 คนที่ไม่พบข้อมูลในระบบ"
- **Root cause (2 ชั้น):**
  1. **Stale ref:** `group.members = ["user_janine_user", "user_sombat_user"]` — `user_sombat_user` ถูกลบออกจาก `users` collection ไปแล้ว (ลบ user ไม่ล้าง reference ใน `group.members`)
  2. **Sync ขาด:** Survey Streamwash มี `user.groups` รวม `"operations"` (แก้ที่ `/admin/users` → UserForm) **แต่ไม่ปรากฏใน `operations.members[]`** เลย — [GroupForm.vue](../../app/components/admin/forms/GroupForm.vue) กับ [UserForm.vue](../../app/components/admin/forms/UserForm.vue) แก้คนละ field (`group.members[]` vs `user.groups[]`) โดยไม่ sync กัน
- **ผลกระทบ:** หน้า `/admin/groups` (ดูสมาชิก) **แสดงผิด/เข้าใจผิดได้** — admin เห็น roster ไม่ตรงความจริง
- **ไม่กระทบ access control:** dashboard access ผ่านกลุ่ม (`checkAccess`/`checkDashboardAccess`) เทียบกับ **`user.groups`** ไม่ใช่ `group.members` — สิทธิ์จริงทำงานถูกแม้ display ผิด (verified: Survey ได้ access ผ่าน group แม้ไม่โผล่ใน modal)
- **ต้องตัดสินใจ:** (A) ใช้ `group.members` เป็น source of truth เดียว — GroupForm sync เขียนกลับ `user.groups` ของสมาชิกทุกคนตอน save + access-check เปลี่ยนไปอ่าน `group.members` แทน / (B) ใช้ `user.groups` เป็น source of truth — GroupForm member picker ให้แก้ `user.groups` ของ user ที่เลือกแทนที่จะเขียน `group.members` ของตัวเอง + ลบ field `members` ทิ้งหรือทำเป็น computed/denormalized cache / (C) เก็บ 2 field ไว้แต่เพิ่ม Cloud Function trigger sync สองทาง
- **แนะนำเบื้องต้น:** (B) ง่ายสุด — `user.groups` เป็นตัวที่ access-control ใช้จริงอยู่แล้ว ให้เป็น source of truth เดียวไปเลย ไม่ต้องมี sync logic
- **cleanup แยก:** ลบ orphan UID (`user_sombat_user`) ออกจาก `operations.members[]`

**BUG-008 รายละเอียด:**
- **อาการ:** ที่ `/admin/explorer` กดถังขยะลบโฟลเดอร์ที่ยังมี dashboard/subfolder ข้างใน → modal ยืนยันแบบ generic ("คุณแน่ใจว่าต้องการลบ 'TEST-B'") ไม่มี warning ว่ามีเนื้อหา แล้วลบสำเร็จเงียบ ๆ ไม่มี error (spec TC 3.13.6 คาดหวัง "Error message shown")
- **Root cause:** [admin/explorer/[[folderId]].vue](../../app/pages/admin/explorer/[[folderId]].vue) ไม่ส่ง `canDeleteFolder` guard เข้า `useExplorer` — [useExplorer.ts](../../app/composables/useExplorer.ts) จะบล็อกก็ต่อเมื่อมี callback นี้ (บรรทัด ~197) admin path เลยเรียก `deleteFolder` ลบ doc ตรง ๆ ไม่เช็คว่าว่างหรือ cascade
- **ผลกระทบ:** dashboard/subfolder ที่ค้างข้างในกลายเป็น orphan — `folderId`/`parentId` ชี้ไป folder ที่ถูกลบไปแล้ว (data integrity)
- **Fix:** เพิ่ม `canDeleteFolder` ใน admin explorer เช็ค subfolder + dashboard ก่อน ถ้าไม่ว่าง return error string บล็อกการลบ — เลือก option 1 (block) ให้ตรง spec แทน cascade เปลี่ยน native `alert()` ใน `useExplorer` เป็น `ConfirmDialog` แบบ OK-only (เพิ่ม prop `hideCancel`)
- **manage explorer ด้วย:** `/manage/explorer` (moderator) มี orphan-risk เดียวกัน — `canDeleteFolder` เดิมเช็คแค่สิทธิ์ เพิ่ม content check (subfolder + dashboard ว่าง) ต่อจากเช็คสิทธิ์แล้วในรอบนี้

**BUG-018 รายละเอียด:**
- **อาการ:** ตั้งวันหมดอายุที่หน้าจัดการสิทธิ์ (แท็บ "ข้อจำกัด" → หมดอายุ) เลือก 18/8/2569 กดบันทึก → ค่าที่เขียนจริงคือ `"2026-08-18T00:00:00.000Z"` = **07:00 น. วันที่ 18 ตามเวลาไทย** สิทธิ์ตัดกลางเช้าแทนที่จะเป็นสิ้นวัน
- **Root cause 2 จุด:**
  1. [PermissionEditor.vue:780](../../app/components/features/PermissionEditor.vue#L780) `localRestrictions.value.expiry[uid] = new Date(popupExpiryDate.value)` — `new Date('2026-08-18')` คือเที่ยงคืน **UTC** (บั๊กชั้น 3 ตัวเดียวกับ BUG-017 คนละไฟล์)
  2. [PermissionEditor.vue:501](../../app/components/features/PermissionEditor.vue#L501) `JSON.parse(JSON.stringify(obj))` แปลง `Date` เป็น ISO string ก่อน emit ออกไป แล้ว [saveDashboardPermissions](../../app/composables/useFirestoreService.ts#L370) เขียนลง Firestore ตรง ๆ ⇒ ได้ `shape: string` ไม่ใช่ `Timestamp` (Quick Share เขียนเป็น `Timestamp` — ฟิลด์เดียวกันแต่คนละ shape)
- **ผลกระทบ:** ฝั่งอ่านไม่พังเพราะ `toDate`/`isExpired` รับทั้ง string และ Timestamp (PR #364) แต่เวลาที่ตัดสิทธิ์เร็วไป 17 ชั่วโมง
- **Fix (2026-08-18):**
  1. [PermissionEditor.confirmExpiry](../../app/components/features/PermissionEditor.vue#L780) ใช้ `endOfDayLocal` — วันที่เลือกกลายเป็นวันสุดท้ายที่เข้าถึงได้ (23:59:59.999 ตามเวลาผู้ตั้ง)
  2. [toExpiryTimestamps](../../app/utils/expiryWrite.ts) แปลงทุกค่าเป็น `Timestamp` ตอนเขียน ไม่ว่าหน้าจะถืออะไรอยู่ (Date / ISO string จาก JSON clone / `{seconds}`) ต่อทั้ง `saveDashboardPermissions` และ `saveFolderPermissions` — ค่าที่อ่านไม่ออกถูก **ตัดทิ้งพร้อม warning** ไม่เขียนลงไป เพราะค่าที่อ่านไม่ออกจะถูกฝั่งอ่านตีความว่า "ยังไม่หมดอายุ" = ให้สิทธิ์ตลอดไป
  3. `formatDate` ในตัวแก้ไขอ่านผ่าน `toDate` แทน `new Date()` — เดิมจะโชว์ `Invalid Date` ถ้าค่าเป็น Timestamp
- **ยืนยันบน prod ก่อนแก้:** `node scripts/inspect-expiry.mjs dash_1786983449961` ระหว่างทดสอบ BUG-017 ได้ `"2026-08-18T00:00:00.000Z"` (string, เที่ยงคืน UTC) — ค่าทดสอบถูกลบแล้ว

**BUG-019 รายละเอียด:**
- **อาการ:** moderator เปิดแดชบอร์ดแล้วกดปุ่ม Share ในหน้า view → เด้งไป `/admin/permissions` ซึ่ง middleware เป็น `['auth','admin']` เข้าไม่ได้
- **Root cause:** [view/[id].vue:541](../../app/pages/dashboard/view/[id].vue#L541) hardcode `/admin/permissions` ทั้งที่ปุ่มโชว์ให้ทั้ง admin และ moderator ([:57](../../app/pages/dashboard/view/[id].vue#L57))
- **แนวทางแก้ (ยังไม่ทำ):** เลือก path ตาม role แบบเดียวกับ [ExplorerPage.vue:101](../../app/components/features/ExplorerPage.vue#L101) (`routePrefix.replace('/explorer','/permissions')` → `/manage/permissions` สำหรับ moderator)

**BUG-020 รายละเอียด:**
- **อาการ:** ลบ `Survey Streamwash` ออกจากสิทธิ์ของแดชบอร์ด กดบันทึก → `access.direct.users` ว่างแล้ว แต่ `restrictions.expiry.<uid>` ยังอยู่ หน้าจอขึ้น `จัดการสิทธิ์ 0` / `ข้อจำกัด 1`
- **ทำไมไม่ลบอัตโนมัติทั้งหมด:** `restrictions` เป็น **Layer 3** ทำงานทับทุกเส้นทางที่ได้สิทธิ์ ([useFirestoreService.ts:688](../../app/composables/useFirestoreService.ts#L688) เช็ค restrictions ก่อน access; [:509-513](../../app/composables/useFirestoreService.ts#L509) ตัด uid หลังรวมคนจาก group + company) ⇒ ถ้าลบข้อจำกัดทิ้งทุกครั้งที่ลบ direct grant คนที่เข้าถึงผ่าน**บริษัท/กลุ่ม/โฟลเดอร์ที่สืบทอด** จะได้สิทธิ์ที่ถูกจำกัดเวลาไว้คืนแบบเงียบ ๆ = คืนสิทธิ์โดยไม่มีใครสั่ง
- **Fix (รอบแรก):** ถามด้วย `ConfirmDialog` ตอนลบสิทธิ์ที่ทำให้คนถือข้อจำกัดไม่เหลือทางเข้า ตัดสินด้วย `restrictedWithoutAccess` ใน `app/utils/accessScope.ts` — **ต่อมาถูกแทนที่ด้วยการตรวจตอนกดบันทึก ดู BUG-022** (ไฟล์นั้นถูกลบแล้ว)
- **ครอบทุกชนิดของสิทธิ์:** ลบผู้ใช้ / กลุ่ม / บริษัท และ "ล้างทั้งหมด" ผ่านทางเดียวกันหมด — รอบแรก (PR #380) ดักเฉพาะตอนลบ direct user ทำให้ลบสิทธิ์บริษัทที่เป็นทางเข้าสุดท้ายแล้วยังทิ้ง orphan (พบตอนทดสอบ TC 3.10.14 วันที่ 2026-08-19)
- **ยังมีผลอยู่ถ้าเข้าทางอื่นได้:** กรณีนั้นไม่ถาม และไม่ลบข้อจำกัด เพราะมันยังกัดอยู่จริง
- **จังหวะเขียนฐานข้อมูล:** dialog กับปุ่ม ✕ แก้แค่ state ในหน้า การเขียนเกิดตอนกด **บันทึก** เท่านั้น ([savePermissions](../../app/components/features/PermissionsPage.vue#L653)) กด "ยกเลิก"/"รีเซ็ต" ก่อนบันทึก = ไม่มีอะไรลง Firestore

**BUG-021 / BUG-022 รายละเอียด:**
- **BUG-021 อาการ:** กดบันทึกที่หน้าจัดการสิทธิ์แล้วไม่มีข้อความยืนยันใด ๆ — `cameFromExplorer` เป็น true ทุกครั้งที่ URL มี `?dashboard=`/`?folder=` (ทางเข้าปกติทั้งหมด ทั้งปุ่ม 🔑 และลิงก์ที่ส่งต่อกัน) จึง `goBackToExplorer()` แล้ว `return` ก่อนถึงบรรทัดที่ตั้ง `successMessage` ⇒ แถบ `alert-success` ในเทมเพลตไม่มีทางแสดงเลย
- **BUG-021 fix:** ทั้ง 2 พาธ (dashboard/folder) `showToast` ก่อนแล้วค่อย navigate — toast เป็น `useState` singleton จึงข้าม route ได้ และทางที่ล้มเหลว toast แดงด้วย เดิมตั้งแค่ `errorMessage` ซึ่งอยู่บนสุดของหน้าที่แอดมินเลื่อนผ่านไปแล้ว (PR #387)
- **BUG-022 อาการ:** สวิตช์ **เข้าถึงสาธารณะ** เขียน `access.public` ตรง ๆ ที่หน้าเพจ ไม่ได้ผ่าน `requestRemoval` ของ `PermissionEditor` ⇒ ปิดสาธารณะทั้งที่มีคนถือข้อจำกัดอยู่ = ทิ้ง orphan เงียบ ๆ เหมือนก่อนแก้ BUG-020
- **BUG-022 fix:** ย้ายการตรวจไปที่จังหวะ **กดบันทึก** — [strandedRestrictions](../../app/utils/effectiveAccess.ts) เทียบรายชื่อที่ถือข้อจำกัดกับผู้ที่สิทธิ์ชุดปัจจุบันเอื้อมถึง (จากการคำนวณตัวเดียวกับป้ายและแถบผลลัพธ์รวม) ถ้ามีคนตกค้างจึงถามครั้งเดียว ยืนยัน = ลบข้อจำกัดนั้นแล้วบันทึก, ยกเลิก = ไม่บันทึกอะไรเลย
- **ถอด guard รายปุ่มออก:** `requestRemoval` กับ `app/utils/accessScope.ts` ถูกลบ — ดักรายปุ่มไม่มีทางครบ (สวิตช์สาธารณะกับสวิตช์สืบทอดอยู่คนละคอมโพเนนต์กับตัวแก้ไขสิทธิ์) และการถาม 2 ที่ในโฟลว์เดียวทำให้คนกดผ่านโดยไม่อ่าน

**BUG-017 รายละเอียด (ปิดด้วยการลบ Quick Share — 2026-08-18):**
- **อาการที่รายงาน:** กด 🔗 ที่การ์ดใน Discover → กด Share → dialog ปิดเหมือนสำเร็จ ไม่มี toast และไม่มีอะไรถูกเขียนลง Firestore
- **Root cause เดิม (3 ชั้น):** `handleShare` เป็น stub ไม่เคยเรียก `quickShareDashboard`; `availableUsers` ประกาศแล้วไม่เคยถูก assign; `expiryDate` เป็น string แต่ service รับ `Date`
- **PR #376** ต่อสายครบทั้ง 3 ชั้น (service call + toast ทุกผลลัพธ์ + `endOfDayLocal`) พร้อมเทสต์ 8 เคส
- **แล้วพบว่าเปิด dialog ไม่ได้เลย:** `DashboardCard` emit แค่ `view` และ `git log -S "emit(\'share\')"` บนไฟล์นั้นไม่มีประวัติ ⇒ ปุ่ม 🔗 บนการ์ดไม่เคยมีจริง ส่วนหน้า view ถอด Quick Share ไปเป็น navigate ตั้งแต่ `a52674c` ⇒ อาการที่รายงานเกิดขึ้นจริงไม่ได้ในโค้ดเวอร์ชันนี้
- **การตัดสินใจ:** ลบ Quick Share ทั้งชุด ให้เหลือทางเดียวคือหน้าจัดการสิทธิ์ (เข้าจาก Explorer ปุ่ม 🔑 ซึ่งเลือก path ตาม role ถูกอยู่แล้ว) — ตัดสินใจจากหน้าตัวอย่างเทียบสองทาง
- **สิ่งที่ถูกลบ:** `QuickShareDialog.vue`, `app/utils/quickShare.ts` + เทสต์, `handleShare`/`handleShareDashboard`/`shareDialogOpen`/`availableUsers` ใน `useDashboardPage`, สาย `@share-dashboard` ที่ตายแล้วใน Grid/List/Grouped, `quickShareDashboard` ทั้ง interface + Firestore + JSON mock + wrapper 2 ตัว, ปุ่ม 🔗 stub ที่หน้าแรก (`alert('coming soon')`) และปุ่ม Share ในหน้า view (ปิด BUG-019 ไปด้วย)
- **สิ่งที่เก็บไว้:** `endOfDayLocal` ใน [shared/utils/dates.ts](../../shared/utils/dates.ts) พร้อมเทสต์ — ตอนนั้นยังไม่มีคนเรียก และถูกใช้จริงตอนแก้ BUG-018 ในวันถัดมา; flag `canShareDashboard` ใน permissions store ยังอยู่ในเมทริกซ์ role แต่ไม่มี UI ไหนอ่านแล้ว

**สร้างโฟลเดอร์ที่ sidebar (ปิดด้วยการลบ — 2026-08-19):**
- **สภาพเดิม:** ปุ่ม `+` ใน `FolderSidebar` ผูกกับ stub 2 ตัว — `alert('Create folder functionality coming soon!')` ที่ `/dashboard` และ `console.log` เงียบ ๆ ที่ `/dashboard/discover`
- **ตรวจแล้วพบว่าไม่มีทางกดถึง:** `PageLayout` ส่ง `:allow-create` ต่อให้ `UnifiedSidebar` ซึ่ง render แค่ `AdminAccordion` 3 อัน ไม่เคย render `FolderSidebar`; ตัว `FolderSidebar` ถูกใช้โดย `FolderAccordion` ที่ไม่มีหน้าไหนเรียก ⇒ prop ตกพื้นกลางทาง แบบเดียวกับ dialog ของ BUG-017
- **การตัดสินใจ:** ลบทั้งสาย ไม่ต่อให้ทำงาน — Explorer (`/admin/explorer`, `/manage/explorer`) สร้างโฟลเดอร์ได้จริงอยู่แล้ว และเป็นทางเดียวที่ผู้ใช้ใช้อยู่
- **สิ่งที่ถูกลบ:** ปุ่ม `+` + prop `allowCreate` + event `create-folder` ตลอดสาย `FolderSidebar` → `FolderAccordion` → `UnifiedSidebar` → `PageLayout`, handler `handleCreateFolder` 4 ที่ (2 หน้า + composable + PageLayout), computed `canCreateFolder` ใน `useDashboardPage` และ `/dashboard`, และ `:allow-create="false"` ที่ 13 หน้า
- **สิ่งที่เก็บไว้:** flag `canCreateFolder` ในเมทริกซ์ role ของ permissions store — ไม่มีโค้ดอ่านแล้ว แต่ยังเป็นสเปกที่ [docs/GUIDES/roles-and-permissions.md](../GUIDES/roles-and-permissions.md) อ้างถึง (Explorer ใช้ `canCreateInCurrentFolder` ของตัวเอง ไม่ได้อ่าน flag นี้)

**เมนูโปรไฟล์ / การตั้งค่า ใน UserMenu (2026-08-19):**
- **สภาพเดิม:** ทั้งสองเมนูแสดงกับทุก role กดแล้ว `console.log` เฉย ๆ เพราะไม่มี route `/profile` และ `/settings`
- **โปรไฟล์ → ทำจริง:** เพิ่มหน้า `/profile` แบบอ่านอย่างเดียว (ตัวตน, บทบาท, บริษัท, สถานะ, วันเข้าร่วม, กลุ่ม, โฟลเดอร์ที่ดูแลสำหรับ moderator) อ่านจาก `users/{uid}` ของตัวเอง + lookup ชื่อบริษัท/กลุ่ม ทั้งหมดอยู่ในสิทธิ์ที่ [firestore.rules](../../firestore.rules) ให้อยู่แล้ว ไม่ต้องแก้ rules — ดู TC 2.4.x
- **การตั้งค่า → ลบทิ้ง:** ยังไม่มีค่าอะไรให้ผู้ใช้ตั้งเลย (ธีม/ภาษา/การแจ้งเตือน ไม่มีในระบบ) เมนูที่กดแล้วเงียบจึงถูกเอาออกจนกว่าจะมีของจริง

---

## 9. Test Case Summary

| Page | # Tests | Priority | Status |
|------|---------|----------|--------|
| Login | 6 | Critical | ✅ |
| Invite Accept | 6 | Critical | ✅ |
| Dashboard Home | 8 | High | ✅ |
| Dashboard Discover | 12 | High | ✅ |
| Dashboard View | 14 | High | ✅ |
| Profile | 5 | Medium | ✅ (5/5 — ยืนยันบน prod ทั้ง admin และ moderator 2026-08-19) |
| Admin Overview | 5 | High | ✅ |
| Admin Users | 17 | High | ✅ (17/17 — 3.2.11 cascade delete ยืนยันบน prod 2026-08-20 ด้วย fixture `scripts/qa-cascade-user.mjs`) |
| Admin Folders | 8 | High | ✅ (8/8 — BUG-009 fixed; page superseded by Explorer) |
| Admin Dashboards | 8 | High | ⊘ N/A (5/8 orphan route, superseded by Explorer; 3.4.3/3.4.4/3.4.7 ยังผ่าน UI ตอนไล่ BUG-013 2026-08-15) |
| Admin Companies | 9 | Medium | ✅ (9/9 — BUG-010 unique-code + BUG-011 blank-region fixed) |
| Admin Regions | 5 | Medium | ✅ (5/5 — unique-code via BUG-010 fix) |
| Admin Groups | 8 | Medium | ✅ (8/8 — 3.7.8 cascade delete ยืนยันบน prod) |
| Admin Tags | 10 | Medium | ✅ (9 ✅ / 1 ⊘ 3.8.7 — "admin ที่ถูกถอดสิทธิ์แท็ก" ไม่มีทางเกิด เพราะ `canManageTags` ผูกกับ role ตรง ๆ ไม่มี per-user override) |
| Admin Invitations | 10 | Critical | ✅ (9 ✅ / 1 N/A) |
| Admin Permissions | 23 | High | ✅ (23/23 — 3.10.11–3.10.23 verified on prod 2026-08-19) |
| Admin Health | 3 | Low | ✅ (3/3) |
| Admin Audit Logs | 8 | Medium | ✅ (8/8 — BUG-007 fixed) |
| Admin Explorer | 9 | High | ✅ (7/9 ✅ / 2 🐛 BUG-008 + BUG-013 fixed และ re-verified) |
| Moderator Explorer | 6 | High | ✅ (6/6) |
| Moderator Permissions | 5 | High | ✅ (5/5) |
| Cross-Cutting (CRUD) | 11 | High | ✅ (11/11 — 5.1.6 ยืนยันด้วย throttle 3G 2026-08-19) |
| Navigation & Middleware | 5 | Critical | ✅ (5/5 — 5.2.5 ปิดครบทุกทาง 2026-08-19) |
| Error Scenarios | 10 | Medium | ✅ (8 ✅ / 1 🔍 จงใจข้าม 6.3.1 / 1 ⊘ 6.3.2 เกิดไม่ได้) |
| **TOTAL** | **211** | — | 197 ✅ / 1 🔍 / 0 ☐ / 11 ⊘ N/A / 2 🐛 fixed+verified |

> ตัวเลขนี้นับจากช่องสถานะ (คอลัมน์สุดท้าย) ของแถวเคสทั้ง 211 แถว — แถวเลขที่มีตัวอักษรต่อท้าย (`2.1.4a`, `3.2.6a`) นับด้วย · ทุกเคส N/A ใช้สัญลักษณ์ `⊘ N/A` เหมือนกันหมดแล้ว (เดิมมี 4 แถวเขียน `N/A` เปล่า ๆ ทำให้นับตกไป) ⇒ นับซ้ำได้ด้วย regex `^\| [0-9]+\.[0-9]+\.[0-9]+[a-z]? ` แล้วดูสัญลักษณ์ในช่องท้าย · §7 ตั้งใจใช้เลขคนละทรง (`7.1.a` — ตัวอักษร**แทน**ตัวเลขตัวที่สาม ไม่ใช่ต่อท้ายแบบ `2.1.4a`) regex นี้จึงไม่จับ และเมทริกซ์สภาพแวดล้อมไม่ปนเข้ามาในยอด 211

---

## 9. Testing Environment Setup

### Fixture scripts — สภาพตั้งต้นที่ UI สร้างเองไม่ได้

บางเคสต้องการข้อมูลที่แอปปฏิเสธจะสร้าง (guard กันไว้) หรือไม่มีทางสร้าง (บัญชีเกิดจากคำเชิญเท่านั้น) สคริปต์พวกนี้เขียนสภาพนั้นลง Firestore ตรง ๆ พร้อมจำค่าเดิมไว้คืน — **dry run ถ้าไม่ใส่ `--apply`** และต้องรัน `restore --apply` ให้จบก่อนปิด session ทุกครั้ง

| เคส | คำสั่ง | สร้างสภาพอะไร |
|---|---|---|
| TC 3.2.11 | `node scripts/qa-cascade-user.mjs seed\|restore [--apply]` | user `uid_qa_cascade` ที่ถูกอ้างอิงจาก **ทั้งสองฝั่ง** ของ cascade — `groups/analytics.members[]` + TEST-E `.assignedModerators[]` — เพื่อให้มีบัญชีที่ลบทิ้งได้ (6 บัญชีจริงบน prod ใช้งานอยู่หมด) |
| TC 6.2.1 / 6.2.2 | `node scripts/qa-broken-refs.mjs break\|restore [--apply]` | dangling `folderId` + grant ที่ชี้ไป uid ที่ไม่มีจริง บนแดชบอร์ด QA (guard BUG-008/009 กันไม่ให้ UI สร้างสภาพนี้) |

ปิดท้ายด้วย `npm run audit:orphans` ทุกครั้ง ต้องได้ 0 ทั้ง 7 หมวด

---

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
| n.noikaeo@gmail.com | Moderator | STTH | Primary test moderator |
| nattha@streamwash.com | Moderator | STTH | Secondary moderator |
| teerak@streamwash.com | User | STTH | Primary test user |
| survey.streamwash@gmail.com | User | STTH | Secondary test user |

### Local vs Production — where results match (and where they don't)

Local dev (`npm run dev`) runs with `NUXT_PUBLIC_USE_FIRESTORE=true` against the
**same production Firestore project** (`streamhub-1c27a`) — **no emulator, no separate
DB**. So local and prod **share the same data**, and testing CRUD locally writes to the
real production database. (Always clean up test records.)

| Feature type | prod == local? | Why |
|--------------|----------------|-----|
| Client-side Firestore CRUD (§3.3–3.8 admin, §2 dashboards, §4 moderator) | ✅ Same | Same deployed code + same Firestore data; reads/writes go straight from the browser through security rules |
| Cloud Functions / Nitro server routes (§3.9 invitations/email, §3.11 health, §3.12 audit read) | ⚠️ Can differ | Local runs the Nitro dev server; prod runs **separately-deployed Cloud Functions**. These can diverge — **BUG-007** was exactly this (audit read worked on local/mock but returned empty on prod). **Verify these on prod, not only local.** |
| Auth / OAuth | mostly same | Same Firebase Auth project; prod uses the deployed `authDomain` (see authentication guide's authDomain caveat) |

**Takeaways:**
- §3.3–3.8 results verified locally **are** representative of prod (same code + same DB; the fixes are all deployed to `main`/prod).
- Server-function-backed sections must still be exercised against the live prod URL.
- Local is **not** an isolated sandbox — it mutates prod data. A true sandbox would need the Firestore emulator or a second Firebase project (not currently configured).

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
- [ ] ลบผู้ใช้/กลุ่มแล้ว ref ฝั่งตรงข้ามถูกล้าง (`scripts/qa-cascade-user.mjs` + `npm run audit:orphans` = 0)
