# Phase 6: Enhancement & Polish — Implementation Plan

> **Created:** 2026-03-25
> **Strategy:** 1 งานย่อย = 1 แชท = 1 feature branch → PR → merge to develop
> **Backend:** Mock JSON API (ยังไม่ใช้ Firestore)
> **Status:** ⏳ In Progress

---

## สถานะงานที่มีอยู่แล้ว (จาก Phase ก่อนหน้า)

| ไฟล์ | สถานะ | หมายเหตุ |
|------|--------|----------|
| `server/utils/companyAccess.ts` | ✅ มีแล้ว | validateCompanyAccess, getInheritingAncestors |giut
| `server/utils/apiResponse.ts` | ✅ มีแล้ว | sendForbidden, sendUnauthorized, sendNotFound, sendBadRequest |
| `app/composables/useCompanyAccess.ts` | ✅ มีแล้ว | canAccessCompany, filterByCompany, getCompanyLabel |
| `server/middleware/auth.ts` | ✅ มีแล้ว | verify Firebase ID Token, DEV fallback to query uid |
| `server/utils/firebaseAdmin.ts` | ✅ มีแล้ว | Firebase Admin SDK init, verifyIdToken |

---

## Dependencies Flow

```
Task 1 (Server Auth Middleware)
  ├──→ Task 2 (ซ่อน Embed URL)
  ├──→ Task 4 (Company API Enforcement)
  │       └──→ Task 5 (Company Client Integration)
  ├──→ Task 6 (Server URL Proxy)
  │       └──→ Task 7 (Audit Logging)
  └──→ Task 3 (CSP Headers) — ไม่ depend กัน ทำเมื่อไหร่ก็ได้

Task 8 (Watermark) — อิสระ ทำเมื่อไหร่ก็ได้
Task 9 (Lazy Loading) — อิสระ
Task 10-12 (Dashboard View UX) — อิสระ
Task 13-15 (Production) — ทำหลังสุด
```

---

## ลำดับการทำงานที่แนะนำ

```
┌─────────────────────────────────────────────────────────────┐
│  🔴 P0 Critical — Security Foundation                      │
│  Task 1 → Task 2 → Task 3                                  │
├─────────────────────────────────────────────────────────────┤
│  🟠 P1 Important — Access Control                          │
│  Task 4 → Task 5 → Task 6                                  │
├─────────────────────────────────────────────────────────────┤
│  🟡 P2 Should Have — Monitoring & UX                       │
│  Task 7 → Task 8 → Task 9                                  │
├─────────────────────────────────────────────────────────────┤
│  🔵 P3 Nice to Have — Dashboard View Features              │
│  Task 10 / Task 11 / Task 12 (ลำดับอิสระ)                  │
├─────────────────────────────────────────────────────────────┤
│  🟣 P4 Long-term — Production                              │
│  Task 13 → Task 14 → Task 15                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Task 1: Server Auth Middleware ✅ Done

**Branch:** `feat/server-auth-middleware`
**Depends on:** ไม่มี (foundation)
**Effort:** 1-2 วัน
**Status:** ✅ Completed

### เป้าหมาย
เพิ่ม Firebase ID Token verification ให้ทุก API endpoint — ปัจจุบัน `/api/mock/*` และ `/api/looker/*` ไม่มี auth เลย

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม)
- docs/OPERATIONS/looker-embed-security-plan.md (แผน security — ดูข้อ 1)
- server/utils/jsonDatabase.ts (database utility ที่ใช้อยู่)
- server/utils/apiResponse.ts (response helpers ที่มีอยู่แล้ว)
- server/api/mock/dashboards/index.get.ts (ตัวอย่าง API handler)
- app/composables/useAuth.ts (auth composable ฝั่ง client)
- app/composables/useJSONMockService.ts (service layer ที่เรียก API)
- app/plugins/firebase.ts (Firebase config)
- nuxt.config.ts

เป้าหมาย: สร้าง server auth middleware ที่ verify Firebase ID Token

### สิ่งที่ต้องทำ:

1. สร้าง `server/utils/firebaseAdmin.ts`:
   - Initialize Firebase Admin SDK ด้วย service account credentials
   - Export `verifyIdToken(token)` function
   - ใช้ environment variable `GOOGLE_APPLICATION_CREDENTIALS` หรือ `FIREBASE_SERVICE_ACCOUNT`

2. สร้าง `server/middleware/auth.ts`:
   - ดึง `Authorization: Bearer <token>` จาก request header
   - Verify token ด้วย Firebase Admin SDK
   - ถ้า verify สำเร็จ → set `event.context.auth = { uid, email, ... }` ให้ handler ใช้ต่อ
   - ถ้า verify ไม่ผ่าน → return 401 Unauthorized
   - Skip auth สำหรับ routes ที่ไม่ต้องการ (เช่น health check, public assets)
   - **DEV MODE:** ถ้า `process.dev === true` → skip verification, ใช้ uid จาก query param แทน (backward compatible กับ mock API)

3. อัปเดต `app/composables/useAuth.ts`:
   - เพิ่ม `getIdToken()` method ที่ return Firebase ID Token
   - Export ให้ service layer ใช้

4. อัปเดต `app/composables/useJSONMockService.ts`:
   - เพิ่ม `Authorization: Bearer <token>` header ในทุก API call
   - ใช้ `useAuth().getIdToken()` เพื่อดึง token
   - Handle 401 response → redirect ไป login

5. Install `firebase-admin` package:
   - `npm install firebase-admin`
   - เพิ่ม env variables ใน `.env.example`

### ระวัง:
- DEV MODE ต้อง backward compatible — ถ้าไม่มี Firebase Admin credentials ให้ fallback เป็น uid จาก query
- Production mode ต้องบังคับ verify token
- ห้าม break existing mock API — ทุกหน้าต้องยังใช้งานได้
- ทดสอบโดย `npm run dev` แล้วเปิด app → login → ทุกหน้ายังทำงานปกติ

### Verification:
- [x] `server/utils/firebaseAdmin.ts` สร้างแล้ว
- [x] `server/middleware/auth.ts` สร้างแล้ว และ apply กับ `/api/mock/*`, `/api/looker/*`
- [x] DEV mode: mock API ยังทำงานได้โดยไม่ต้องมี Firebase Admin credentials
- [x] Client ส่ง Authorization header ในทุก API call
- [x] 401 response → redirect ไป login page
```

---

## Task 2: ซ่อน Embed URL จาก API Response ✅ Done

**Branch:** `feat/hide-embed-url`
**Depends on:** Task 1 (ใช้ auth context)
**Effort:** ครึ่งวัน
**Status:** ✅ Completed

### เป้าหมาย
ไม่คืน `lookerEmbedUrl` ใน API response ของ dashboard listing — สร้าง endpoint เฉพาะที่ต้อง authenticate

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 2)
- docs/OPERATIONS/looker-embed-security-plan.md (แผน security — ดูข้อ 2)
- server/api/mock/dashboards/index.get.ts (GET dashboards listing)
- server/api/mock/dashboards/[id].get.ts (GET single dashboard)
- server/utils/companyAccess.ts (มี checkDashboardAccess อยู่แล้ว)
- server/middleware/auth.ts (จาก Task 1)
- app/pages/dashboard/view/[id].vue (หน้าดู dashboard)
- app/composables/useJSONMockService.ts (service layer)

เป้าหมาย: ซ่อน Looker embed URL จาก API response + สร้าง endpoint แยกสำหรับดึง URL

### สิ่งที่ต้องทำ:

1. แก้ `server/api/mock/dashboards/index.get.ts`:
   - ตัด `lookerEmbedUrl` ออกจาก response ของ listing
   - ใช้ `map()` เพื่อ strip URL ก่อน return

2. แก้ `server/api/mock/dashboards/[id].get.ts`:
   - ตัด `lookerEmbedUrl` ออกจาก response single dashboard

3. สร้าง `server/api/mock/dashboards/[id]/embed-url.get.ts`:
   - ต้อง authenticate (ใช้ auth context จาก middleware)
   - ตรวจสิทธิ์ด้วย `checkDashboardAccess(dashboard, user)`
   - ถ้ามีสิทธิ์ → return `{ embedUrl: dashboard.lookerEmbedUrl }`
   - ถ้าไม่มีสิทธิ์ → return 403

4. อัปเดต client ให้ fetch embed URL แยก:
   - แก้ `app/pages/dashboard/view/[id].vue` — fetch embed URL จาก `/api/mock/dashboards/:id/embed-url`
   - แก้ `app/composables/useJSONMockService.ts` — เพิ่ม `getDashboardEmbedUrl(id)` method

### ระวัง:
- Dashboard listing (discover page) ไม่ต้องมี embed URL — ไม่ break
- Dashboard view page ต้อง fetch embed URL แยก — ต้อง handle loading state
- Admin dashboard CRUD page อาจต้องยังเห็น embed URL → ตรวจสอบด้วย

### Verification:
- [x] GET `/api/mock/dashboards` → response ไม่มี `lookerEmbedUrl`
- [x] GET `/api/mock/dashboards/:id` → response ไม่มี `lookerEmbedUrl`
- [x] GET `/api/mock/dashboards/:id/embed-url` (มี auth) → return `embedUrl`
- [x] GET `/api/mock/dashboards/:id/embed-url` (ไม่มี auth) → 403 Forbidden
- [x] หน้า dashboard view ยังแสดง Looker embed ได้ปกติ
- [x] หน้า discover ยังทำงานปกติ (ไม่ต้องมี URL)
```

---

## Task 3: CSP + Security Headers ✅ Done

**Branch:** `feat/security-headers`
**Depends on:** ไม่มี (ทำเมื่อไหร่ก็ได้)
**Effort:** ครึ่งวัน
**Status:** ✅ Completed

### เป้าหมาย
เพิ่ม HTTP security headers เพื่อป้องกัน clickjacking, referrer leakage, และจำกัด resource origins

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 3)
- docs/OPERATIONS/looker-embed-security-plan.md (แผน security — ดูข้อ 3)
- nuxt.config.ts (Nuxt configuration)
- app/pages/dashboard/view/[id].vue (หน้าที่มี Looker iframe)

เป้าหมาย: เพิ่ม Content Security Policy + security headers

### สิ่งที่ต้องทำ:

1. อัปเดต `nuxt.config.ts`:
   - เพิ่ม security headers ผ่าน `routeRules` หรือ Nitro config:
     - `Content-Security-Policy`: `frame-src https://lookerstudio.google.com https://datastudio.google.com; frame-ancestors 'self'`
     - `X-Frame-Options`: `SAMEORIGIN`
     - `Referrer-Policy`: `strict-origin`
     - `X-Content-Type-Options`: `nosniff`

2. อัปเดต `app/pages/dashboard/view/[id].vue`:
   - เพิ่ม `referrerpolicy="no-referrer"` ใน Looker `<iframe>` tag
   - เพิ่ม `sandbox="allow-scripts allow-same-origin allow-popups"` (ถ้าไม่ break Looker)

### ระวัง:
- CSP ต้องไม่ block resources ที่ app ใช้ (Google Fonts, Firebase, etc.)
- ทดสอบว่า Looker iframe ยังโหลดได้หลังเพิ่ม CSP
- sandbox attribute อาจ break Looker interactivity → ทดสอบก่อน

### Verification:
- [x] Response headers มี CSP ที่กำหนด (ดูใน DevTools → Network → Response Headers)
- [x] Response headers มี X-Frame-Options: SAMEORIGIN
- [x] Response headers มี Referrer-Policy: strict-origin
- [x] Looker iframe ยังโหลดและทำงานได้ปกติ
- [x] App ไม่มี CSP violations ใน Console
```

---

## Task 4: Company Access — API Enforcement ✅ Done

**Branch:** `feat/company-api-enforcement`
**Depends on:** Task 1 (ใช้ auth context)
**Effort:** 1-2 วัน
**Status:** ✅ Completed

### เป้าหมาย
อัปเดต API endpoints ให้ใช้ company access validation จาก `server/utils/companyAccess.ts` ที่มีอยู่แล้ว

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 4)
- docs/OPERATIONS/company-access-control-plan.md (แผน company access — ดู Step 2)
- server/utils/companyAccess.ts (validateCompanyAccess, checkDashboardAccess — มีอยู่แล้ว)
- server/utils/apiResponse.ts (sendForbidden, etc. — มีอยู่แล้ว)
- server/utils/jsonDatabase.ts (readJSON, findById)
- server/middleware/auth.ts (auth middleware จาก Task 1 — event.context.auth)
- server/api/mock/dashboards/index.get.ts (GET dashboards)
- server/api/mock/dashboards/[id].get.ts (GET single dashboard)
- server/api/mock/folders/index.get.ts (GET folders)
- server/api/mock/users/index.get.ts (GET users)
- server/api/mock/users/[uid].get.ts (GET single user)

เป้าหมาย: อัปเดต API endpoints ให้ filter ตาม company access

### สิ่งที่ต้องทำ:

1. อัปเดต `server/api/mock/dashboards/index.get.ts`:
   - ใช้ `event.context.auth` (จาก middleware) เพื่อระบุ user
   - ถ้า user ไม่ใช่ admin → filter dashboards ด้วย `filterAccessibleDashboards()`
   - ถ้ามี `company` query param → validate ว่า user มีสิทธิ์

2. อัปเดต `server/api/mock/dashboards/[id].get.ts`:
   - เพิ่ม `checkDashboardAccess(dashboard, user)` ก่อน return
   - ถ้าไม่มีสิทธิ์ → 403

3. อัปเดต `server/api/mock/folders/index.get.ts`:
   - Admin: เห็นทุก folder
   - Moderator: เห็น folder ที่ถูก assign (assignedModerators มี uid)
   - User: เห็นทุก folder (filter dashboards ข้างใน)

4. อัปเดต `server/api/mock/users/index.get.ts`:
   - Admin: เห็น users ทุก company
   - Moderator/User: เห็นเฉพาะ users ใน company เดียวกัน

5. อัปเดต `server/api/mock/users/[uid].get.ts`:
   - เพิ่ม company validation — non-admin ดูได้เฉพาะ user ใน company เดียวกัน

### ระวัง:
- ต้อง backward compatible — DEV mode ที่ไม่มี auth ต้องยัง fallback ได้
- Admin pages ที่ไม่ส่ง company param ต้อง return all
- ทดสอบโดย run `npm run dev` → login → ทุกหน้ายังทำงานปกติ

### Verification:
- [x] GET dashboards โดย non-admin → เห็นเฉพาะ dashboards ที่มีสิทธิ์
- [x] GET dashboards โดย admin → เห็นทั้งหมด
- [x] GET users โดย non-admin → เห็นเฉพาะ users ใน company เดียวกัน
- [x] GET folders → filter ตาม role ถูกต้อง
- [x] ทุกหน้ายังทำงานปกติ ไม่มี error
```

---

## Task 5: Company Access — Client Integration 🟠 P1

**Branch:** `feat/company-client-integration`
**Depends on:** Task 4 (API enforcement ต้องเสร็จก่อน)
**Effort:** 1 วัน
**Status:** ✅ Completed

### เป้าหมาย
เชื่อม client-side composable (`useCompanyAccess` ที่มีอยู่แล้ว) กับ API layer ที่อัปเดตใหม่

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 5)
- docs/OPERATIONS/company-access-control-plan.md (แผน company access — ดู Step 3)
- app/composables/useCompanyAccess.ts (client guard — มีอยู่แล้ว)
- app/composables/useJSONMockService.ts (service layer)
- app/composables/useDashboardPage.ts (dashboard page logic)
- app/stores/auth.ts (auth store)
- app/stores/permissions.ts (permissions store)
- app/pages/dashboard/discover.vue (discover page)
- app/pages/admin/users/index.vue (admin users page)
- app/middleware/auth.ts (client auth middleware)

เป้าหมาย: เชื่อม useCompanyAccess กับ API calls + handle 403 errors

### สิ่งที่ต้องทำ:

1. อัปเดต `app/composables/useJSONMockService.ts`:
   - ส่ง `company` param ไปใน API calls (getDashboards, getFolders, getUsers)
   - Handle 403 response → return empty result + แสดง toast แจ้งเตือน

2. อัปเดต `app/composables/useDashboardPage.ts`:
   - ตรวจสอบว่า company ถูกส่งไปใน API calls
   - เพิ่ม error state สำหรับ access denied

3. อัปเดต `app/pages/admin/users/index.vue`:
   - Admin เห็น users ทุก company
   - Non-admin เห็นเฉพาะ company ตัวเอง

4. ทดสอบ Access Control:
   - แก้ `.data/users.json` → เปลี่ยน mock user เป็น company อื่น → ตรวจว่า filter ทำงาน
   - ทดสอบ admin → เห็นทุก company
   - ทดสอบ user → เห็นเฉพาะ company ตัวเอง

### ระวัง:
- อย่าเปลี่ยน interface ของ composables ที่มีอยู่
- 403 errors ต้องไม่ทำให้ app crash — handle gracefully
- หน้า discover ต้องยังแสดง dashboards ตามปกติ

### Verification:
- [x] API calls ส่ง company param ไปด้วย
- [x] 403 response → แสดง toast แจ้งเตือน ไม่ crash
- [x] Admin เห็นข้อมูลทุก company
- [x] Non-admin เห็นเฉพาะ company ตัวเอง
- [x] Discover page ยังทำงานปกติ
```

---

## Task 6: Server URL Proxy (Signed Embed URLs) 🟠 P1

**Branch:** `feat/embed-url-proxy`
**Depends on:** Task 1 (auth middleware), Task 2 (embed URL endpoint)
**Effort:** 2-3 วัน

### เป้าหมาย
ไม่ส่ง Looker URL จริงไปที่ client — ใช้ one-time token + redirect แทน

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 6)
- docs/OPERATIONS/looker-embed-security-plan.md (แผน security — ดูข้อ 4)
- server/middleware/auth.ts (auth middleware จาก Task 1)
- server/api/mock/dashboards/[id]/embed-url.get.ts (embed endpoint จาก Task 2)
- server/utils/companyAccess.ts (checkDashboardAccess)
- app/pages/dashboard/view/[id].vue (dashboard view page)

เป้าหมาย: สร้าง one-time token system สำหรับ embed URL

### สิ่งที่ต้องทำ:

1. สร้าง `server/utils/embedTokenStore.ts`:
   - In-memory Map สำหรับเก็บ token → { embedUrl, userId, expiresAt }
   - TTL 30 วินาที
   - Cleanup expired tokens ทุก 60 วินาที
   - `createToken(embedUrl, userId)` → return random token (crypto.randomUUID)
   - `consumeToken(token)` → return embedUrl + ลบ token (one-time use)

2. สร้าง `server/api/embed/request.post.ts`:
   - รับ `{ dashboardId }` + auth context
   - ตรวจสิทธิ์ด้วย checkDashboardAccess
   - สร้าง one-time token → return `{ token, proxyUrl: '/api/embed/{token}' }`

3. สร้าง `server/api/embed/[token].get.ts`:
   - Consume token → ถ้า valid → 302 redirect ไป Looker URL จริง
   - ถ้า invalid/expired → 403

4. อัปเดต `app/pages/dashboard/view/[id].vue`:
   - iframe src ใช้ proxy URL แทน Looker URL ตรง
   - Request token ก่อนแสดง iframe

### ระวัง:
- Token ต้อง cryptographically random (ใช้ crypto.randomUUID)
- TTL ต้องสั้นพอ (30 วินาที) แต่ไม่สั้นเกินจนโหลดไม่ทัน
- In-memory store จะหายเมื่อ server restart — ไม่เป็นปัญหาสำหรับ embed tokens
- ต้องไม่ break DEV mode

### Verification:
- [ ] POST `/api/embed/request` → return token
- [ ] GET `/api/embed/{token}` → 302 redirect ไป Looker URL
- [ ] ใช้ token ซ้ำ → 403 (one-time use)
- [ ] Token หมดอายุ → 403
- [ ] Dashboard view page แสดง iframe ผ่าน proxy ได้ปกติ
- [ ] DevTools → Network tab → ไม่เห็น Looker URL ใน JavaScript/API response
```

---

## Task 7: Audit Logging ✅ Done

**Branch:** `feat/audit-logging`
**Depends on:** Task 1 (auth middleware)
**Effort:** 1-2 วัน
**Status:** ✅ Completed

### เป้าหมาย
บันทึกทุกครั้งที่มีคนดูแดชบอร์ด → ตรวจจับ anomaly → แจ้ง admin

### Volume Analysis (150 คน × 50 แดชบอร์ด)

| Metric | ค่า |
|--------|-----|
| Records/เดือน (raw) | ~17,800 |
| หลัง deduplicate (cooldown 5 นาที) | ~10,700 |
| ขนาดไฟล์ JSON/เดือน | ~2.5 MB |
| ขีดจำกัดก่อนช้า | ~3 เดือน (ต้อง rotate) |

### Logging Strategy

| กลยุทธ์ | รายละเอียด |
|---------|-----------|
| **Cooldown 5 นาที** | user+dashboard เดิมภายใน 5 นาที → skip |
| **Monthly rotation** | `audit-log-2026-03.json`, `audit-log-2026-04.json` |
| **Retention 90 วัน** | ลบไฟล์เก่ากว่า 3 เดือนอัตโนมัติ |
| **Log ทุก data change** | edit, archive, delete → บันทึกเสมอ ไม่มี cooldown |

### Log Levels

| Level | Event | บันทึกเสมอ? |
|-------|-------|-------------|
| **CRITICAL** | Login failed, 403 access denied | ✅ เสมอ |
| **IMPORTANT** | Edit dashboard, archive, create, delete | ✅ เสมอ |
| **NORMAL** | Dashboard view (deduplicated) | ✅ + cooldown 5 นาที |
| **LOW** | Page visit, search query | ❌ ไม่จำเป็น |

### Action Color Coding

| Badge | สี | ความหมาย |
|-------|-----|---------|
| `👁️ view` | เทา/ขาว | ดูแดชบอร์ด (ปกติ) |
| `✏️ edit` | เหลือง | แก้ไขข้อมูล |
| `🗄️ archive` | แดงอ่อน | เก็บถาวร |
| `🚫 denied` | แดง | ถูกปฏิเสธสิทธิ์ (ตรวจจับ anomaly) |
| `➕ create` | เขียว | สร้างใหม่ |
| `🗑️ delete` | แดงเข้ม | ลบ |

### Admin Audit Logs Page — Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  📋 Audit Logs — ประวัติการใช้งานระบบ            [ 📥 Export CSV ] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ วันนี้    │  │ สัปดาห์นี้│  │ เดือนนี้  │  │ Unique   │           │
│  │ 📊 342   │  │ 📊 1,847 │  │ 📊 11,203│  │ 👥 89 คน │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  ┌─── Filters ─────────────────────────────────────────────────┐   │
│  │ 🏷️ ประเภท: ทั้งหมด ▾  │ 👤 ผู้ใช้: ทั้งหมด ▾             │   │
│  │ 🏢 บริษัท: ทั้งหมด ▾  │ 📊 แดชบอร์ด: ทั้งหมด ▾           │   │
│  │ 📅 จากวันที่ ─── ถึงวันที่  │ 🔎 ค้นหา...  │ ↻ Reset │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────┬──────────┬────────────────┬────────────┬────────────┐ │
│  │ เวลา    │ ประเภท   │ ผู้ใช้          │ บริษัท     │ แดชบอร์ด   │ │
│  ├─────────┼──────────┼────────────────┼────────────┼────────────┤ │
│  │ 14:32   │ 👁️ view │ Nopphol N.     │ SV         │ Sales      │ │
│  │ 14:28   │ ✏️ edit  │ Nattha S.      │ SV         │ KPI Monthly│ │
│  │ 14:15   │ 🗄️ arch │ IT Streamwash  │ SW         │ Legacy     │ │
│  │ 13:55   │ 🚫 deny │ Somchai K.     │ SW         │ Finance Q1 │ │
│  │ 13:40   │ 👁️ view │ Janine P.      │ SV         │ Sales      │ │
│  └─────────┴──────────┴────────────────┴────────────┴────────────┘ │
│                                                                     │
│  ← ก่อนหน้า   หน้า 1 / 56   ถัดไป →       แสดง: 25 ▾              │
│                                             (10 / 25 / 50)          │
└─────────────────────────────────────────────────────────────────────┘
```

**Sidebar placement:** เพิ่มเมนู "📋 Audit Logs" ใต้หมวด MONITORING (admin only)

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 7)
- docs/OPERATIONS/looker-embed-security-plan.md (แผน security — ดูข้อ 5)
- server/utils/auditLog.ts (ถ้ามี — ดูว่ามีอะไรอยู่แล้ว)
- server/utils/jsonDatabase.ts (readJSON, writeJSON)
- server/middleware/auth.ts (auth middleware)
- app/pages/dashboard/view/[id].vue (dashboard view page)
- .data/audit-log.json (ถ้ามี)

เป้าหมาย: สร้าง audit logging system สำหรับ dashboard views

### สิ่งที่ต้องทำ:

1. สร้าง/อัปเดต `server/utils/auditLog.ts`:
   - Cooldown 5 นาที: user+dashboard เดิมภายใน 5 นาที → skip (ใช้ in-memory Map)
   - Monthly file rotation: เขียนลง `.data/audit-log-YYYY-MM.json`
   - Log levels: CRITICAL (เสมอ), IMPORTANT (เสมอ), NORMAL (+ cooldown)
   - บันทึก: userId, email, company, dashboardId, dashboardName, action, timestamp, userAgent

2. สร้าง/อัปเดต `server/api/audit/log.post.ts`:
   - รับ `{ dashboardId, action }` + auth context
   - ใช้ auditLog utility เพื่อบันทึก (รวม cooldown logic)
   - Action types: view, edit, archive, create, delete, denied

3. สร้าง `server/api/audit/index.get.ts`:
   - Admin only — return audit logs
   - รองรับ filter: action, userId, company, dashboardId, dateRange
   - Pagination: page, limit (10/25/50), total count
   - Text search: ชื่อผู้ใช้, email, dashboard name

4. อัปเดต `app/pages/dashboard/view/[id].vue`:
   - ส่ง audit event เมื่อ page load (action: 'view')

5. สร้าง `app/pages/admin/audit.vue`:
   - Summary cards: วันนี้, สัปดาห์นี้, เดือนนี้, Unique Users
   - Filters: ประเภท, ผู้ใช้, บริษัท, แดชบอร์ด, ช่วงวันที่, ค้นหาข้อความ
   - ตาราง: เวลา, ประเภท (color-coded badge), ผู้ใช้ (ชื่อ), บริษัท (รหัส), แดชบอร์ด
   - Pagination: 25 items/หน้า default, เปลี่ยนได้ 10/25/50
   - Export CSV button
   - เพิ่ม link ใน sidebar หมวด MONITORING (admin only)

### ระวัง:
- Cooldown ต้องเป็น in-memory Map (จะ reset เมื่อ server restart — ไม่เป็นปัญหา)
- Monthly rotation: อ่าน logs ต้อง merge หลายไฟล์เมื่อ filter ข้ามเดือน
- Export CSV ต้อง filter ตาม criteria ที่เลือก ไม่ใช่ทั้งหมด

### Verification:
- [x] ดูแดชบอร์ด → มี record ใหม่ใน audit-log-YYYY-MM.json
- [x] ดูแดชบอร์ดเดิมภายใน 5 นาที → ไม่มี record ซ้ำ (cooldown)
- [x] edit/archive/delete → บันทึกเสมอ ไม่มี cooldown
- [x] GET `/api/audit` (admin) → return logs พร้อม pagination
- [x] GET `/api/audit` (non-admin) → 403
- [x] Admin audit page แสดง logs + filters + pagination ถูกต้อง
- [x] Export CSV ดาวน์โหลดได้
```

---

## Task 8: Watermark Overlay ✅ Done

**Branch:** `feat/watermark-overlay`
**Depends on:** ไม่มี (ทำเมื่อไหร่ก็ได้)
**Effort:** ครึ่งวัน
**Status:** ✅ Completed

### เป้าหมาย
แสดงอีเมลผู้ใช้แบบ semi-transparent ทับบน Looker iframe

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 8)
- docs/OPERATIONS/looker-embed-security-plan.md (แผน security — ดูข้อ 6)
- app/pages/dashboard/view/[id].vue (dashboard view page — ที่มี iframe)
- app/stores/auth.ts (auth store — ดึง email)

เป้าหมาย: เพิ่ม watermark overlay แสดงอีเมลผู้ใช้ทับบน iframe

### สิ่งที่ต้องทำ:

1. อัปเดต `app/pages/dashboard/view/[id].vue`:
   - เพิ่ม div overlay ทับบน iframe แสดงอีเมลผู้ใช้
   - CSS: `position: absolute`, `pointer-events: none`, `opacity: 0.08-0.12`
   - Font size ใหญ่, หมุน -30 degrees, repeat pattern
   - (Optional) เปลี่ยนตำแหน่ง watermark ทุก 30 วินาที

### ระวัง:
- `pointer-events: none` เพื่อให้ iframe ยังใช้งานได้
- opacity ต้องเห็นได้ใน screenshot แต่ไม่รบกวนการใช้งาน
- ต้องไม่มองเห็นเมื่อดูปกติ (เว้นแต่ screenshot)

### Verification:
- [x] เห็น watermark email ทับบน iframe
- [x] iframe ยังคลิก/scroll ได้ปกติ (pointer-events: none)
- [x] Screenshot เห็น watermark ชัดเจน
- [x] Fullscreen mode ก็มี watermark ด้วย
```

---

## Task 9: Dashboard Lazy Loading ✅ Done

**Branch:** `feat/dashboard-lazy-loading`
**Depends on:** ไม่มี
**Effort:** 1 วัน
**Status:** ✅ Completed

### เป้าหมาย
โหลด dashboard cards ทีละ batch ด้วย Intersection Observer

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 9)
- app/pages/dashboard/discover.vue (discover page)
- app/composables/useDashboardPage.ts (dashboard page composable)
- app/composables/usePaginatedList.ts (มี pagination logic อยู่แล้วหรือเปล่า)
- app/components/dashboard/DashboardGrid.vue
- app/components/dashboard/DashboardList.vue

เป้าหมาย: Lazy loading ด้วย Intersection Observer, 12 items/batch

### สิ่งที่ต้องทำ:

1. สร้าง `app/composables/useLazyLoad.ts`:
   - ใช้ Intersection Observer API
   - โหลดทีละ 12 items เมื่อ scroll ถึง sentinel element
   - Expose: `visibleItems`, `hasMore`, `loadMore()`, `isLoading`

2. อัปเดต `app/pages/dashboard/discover.vue`:
   - ใช้ `useLazyLoad` กับ dashboard list
   - เพิ่ม sentinel div ที่ท้ายรายการ
   - แสดง loading indicator เมื่อกำลังโหลดเพิ่ม

3. อัปเดต components ที่เกี่ยวข้อง:
   - DashboardGrid, DashboardList, TreeDashboardList → รับ items ที่ถูก slice แล้ว

### ระวัง:
- Intersection Observer ต้อง cleanup เมื่อ component unmount
- ต้องทำงานได้ทุก view mode (Grid/Compact/List/Tree)
- Group-by mode อาจต้อง lazy load per group

### Verification:
- [ ] หน้า discover แสดง 12 items แรก → scroll ลง → โหลดเพิ่มอีก 12
- [ ] Loading indicator แสดงขณะโหลด
- [ ] ทำงานได้ทุก view mode
- [ ] Intersection Observer ถูก cleanup เมื่อออกจากหน้า
```

---

## Task 10: แก้ไขข้อมูล Dashboard (Edit Info Dialog) ✅ Done

**Branch:** `feat/dashboard-edit-dialog`
**Depends on:** ไม่มี
**Effort:** 1 วัน
**Status:** ✅ Completed

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 10)
- app/pages/dashboard/view/[id].vue (dashboard view page — ดู handleEditInfo)
- app/components/forms/DashboardForm.vue (dashboard form ที่มีอยู่แล้ว)
- app/types/dashboard.ts (Dashboard type)
- server/api/mock/dashboards/[id].put.ts (PUT endpoint)

เป้าหมาย: สร้าง inline edit dialog สำหรับแก้ไข name/description/tags ของ dashboard บน view page

### สิ่งที่ต้องทำ:

1. สร้าง `app/components/dashboard/DashboardEditDialog.vue`:
   - Modal/dialog สำหรับ edit name, description, tags
   - ใช้ UModal จาก @nuxt/ui
   - Form validation ด้วย Zod
   - Save → PUT `/api/mock/dashboards/:id` → แสดง toast + refresh data

2. อัปเดต `app/pages/dashboard/view/[id].vue`:
   - `handleEditInfo()` → เปิด DashboardEditDialog
   - Pass dashboard data เข้า dialog
   - Handle save success → refresh dashboard info

### Verification:
- [ ] คลิก "แก้ไขข้อมูล" → เปิด dialog
- [ ] แก้ไข name/description/tags → Save → อัปเดตสำเร็จ
- [ ] Form validation ทำงาน (ชื่อห้ามว่าง)
- [ ] Cancel → ปิด dialog, ไม่มีอะไรเปลี่ยน
```

---

## Task 11: เก็บถาวร Dashboard (Archive) 🔵 P3

**Branch:** `feat/dashboard-archive`
**Depends on:** ไม่มี
**Effort:** 1 วัน
**Status:** ✅ Completed

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 11)
- app/pages/dashboard/view/[id].vue (dashboard view page — ดู handleArchive)
- app/types/dashboard.ts (Dashboard type — ต้องเพิ่ม status field)
- server/api/mock/dashboards/[id].put.ts (PUT endpoint)
- app/pages/dashboard/discover.vue (discover page — ต้องเพิ่ม filter)

เป้าหมาย: สร้าง archive/soft-delete dashboard + isArchived filter ใน discover page

### สิ่งที่ต้องทำ:

1. อัปเดต `app/types/dashboard.ts`:
   - เพิ่ม `status?: 'active' | 'archived'` field ใน Dashboard type

2. อัปเดต `app/pages/dashboard/view/[id].vue`:
   - `handleArchive()` → แสดง confirm dialog → PUT status: 'archived' → redirect ไป discover

3. อัปเดต `app/pages/dashboard/discover.vue`:
   - เพิ่ม filter: ซ่อน archived dashboards by default
   - (Optional) เพิ่ม toggle "แสดงที่เก็บถาวร" สำหรับ admin

4. อัปเดต `server/api/mock/dashboards/index.get.ts`:
   - Default: filter out archived dashboards
   - ถ้ามี `includeArchived=true` → return all

### Verification:
- [x] คลิก "เก็บถาวร" → confirm dialog → archive สำเร็จ
- [x] Dashboard ที่ archive → หายจาก discover page
- [x] Admin toggle → เห็น archived dashboards
```

---

## Task 12: ดาวน์โหลด Dashboard (Export) 🔵 P3 ✅ Done

**Branch:** `feat/dashboard-download`
**Depends on:** ไม่มี
**Effort:** 1 วัน
**Status:** ✅ Completed

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 12)
- app/pages/dashboard/view/[id].vue (dashboard view page — ดู handleDownload)

เป้าหมาย: Export dashboard view เป็น PDF

### สิ่งที่ต้องทำ:

1. อัปเดต `app/pages/dashboard/view/[id].vue`:
   - `handleDownload()` → ใช้ `window.print()` สำหรับ print-to-PDF
   - เพิ่ม `@media print` CSS rules:
     - ซ่อน sidebar, header, buttons
     - แสดงเฉพาะ iframe content area
     - Full width

2. (Alternative) ถ้าต้องการ screenshot:
   - ใช้ html2canvas + jspdf library
   - Capture dashboard area → generate PDF → download

### ระวัง:
- Looker iframe อาจไม่ถูก capture ด้วย html2canvas (cross-origin)
- window.print() เป็นวิธีที่ง่ายและเชื่อถือได้ที่สุด

### Verification:
- [x] คลิก "ดาวน์โหลด" → เปิด print dialog / download PDF
- [x] PDF แสดงเฉพาะ dashboard content (ไม่มี sidebar/header)
```

---

## Task 13: Real Firebase Integration 🟣 P4

**Branch:** `feat/firebase-integration`
**Depends on:** Task 1-6 (security ต้องเสร็จก่อน)
**Effort:** 5-10 วัน (แยกเป็นหลาย sub-branches)
**Status:** ✅ Completed

### เป้าหมาย
เปลี่ยนจาก mock JSON API เป็น Firestore จริง

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 13)
- docs/GUIDES/database-schema.md (Firestore collections)
- app/composables/useDashboardService.ts (service abstraction layer)
- app/composables/useJSONMockService.ts (mock implementation)
- app/utils/firebase.ts (Firebase config)

เป้าหมาย: สร้าง Firestore implementation ของ IDashboardService

### สิ่งที่ต้องทำ:

1. สร้าง `app/composables/useFirestoreService.ts`:
   - Implement IDashboardService interface ด้วย Firestore SDK
   - ทดแทน useJSONMockService

2. อัปเดต `app/composables/useDashboardService.ts`:
   - Switch implementation ตาม environment variable
   - `NUXT_PUBLIC_USE_FIRESTORE=true` → useFirestoreService
   - Default: useJSONMockService

3. Migrate mock data → Firestore:
   - สร้าง script `scripts/seed-firestore.ts` สำหรับ import .data/*.json เข้า Firestore

### หมายเหตุ:
- งานนี้ใหญ่มาก อาจต้องแยกเป็นหลาย sessions
- เริ่มจาก collection ที่สำคัญที่สุด: users → dashboards → folders
```

---

## Task 14: Cross-browser Testing + Performance 🟣 P4

**Branch:** `feat/performance`
**Depends on:** Task 13
**Effort:** 2-3 วัน

### เป้าหมาย
ทดสอบ cross-browser + optimize ให้ page load < 2 seconds

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 14)
- nuxt.config.ts

เป้าหมาย: Cross-browser testing + performance optimization

### สิ่งที่ต้องทำ:

1. ทดสอบบน Chrome, Firefox, Safari, Edge
2. Lighthouse audit → แก้ไขปัญหาที่พบ
3. Bundle analysis → optimize chunk sizes
4. Image/asset optimization
5. API response caching strategy
```

---

## Task 15: Deploy to Firebase Hosting 🟣 P4

**Branch:** `feat/firebase-deploy`
**Depends on:** Task 13, Task 14
**Effort:** 1 วัน

### เป้าหมาย
Deploy StreamHub ขึ้น Firebase Hosting

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- docs/OPERATIONS/phase6-implementation-plan.md (แผนงานรวม — ดู Task 15)
- docs/OPERATIONS/deployment.md
- nuxt.config.ts
- package.json

เป้าหมาย: Deploy to Firebase Hosting

### สิ่งที่ต้องทำ:

1. Configure Firebase Hosting (`firebase.json`)
2. Setup Nuxt SSR with Cloud Functions / Cloud Run
3. Environment variables for production
4. CI/CD pipeline (GitHub Actions)
5. Domain setup + SSL
```

---

## สรุป Effort ทั้งหมด

| Task | ชื่องาน | Priority | Effort | Status |
|------|---------|----------|--------|--------|
| 1 | Server Auth Middleware | 🔴 P0 | 1-2 วัน | ✅ Completed |
| 2 | ซ่อน Embed URL | 🔴 P0 | ครึ่งวัน | ✅ Completed |
| 3 | CSP + Security Headers | 🔴 P0 | ครึ่งวัน | ✅ Completed |
| 4 | Company API Enforcement | 🟠 P1 | 1-2 วัน | ✅ Completed |
| 5 | Company Client Integration | 🟠 P1 | 1 วัน | ✅ Completed |
| 6 | Server URL Proxy | 🟠 P1 | 2-3 วัน | ⬜ Not Started |
| 7 | Audit Logging | 🟡 P2 | 1-2 วัน | ✅ Completed |
| 8 | Watermark Overlay | 🟡 P2 | ครึ่งวัน | ✅ Completed |
| 9 | Dashboard Lazy Loading | 🟡 P2 | 1 วัน | ⬜ Not Started |
| 10 | แก้ไขข้อมูล Dashboard | 🔵 P3 | 1 วัน | ⬜ Not Started |
| 11 | เก็บถาวร Dashboard | 🔵 P3 | 1 วัน | ⬜ Not Started |
| 12 | ดาวน์โหลด Dashboard | 🔵 P3 | 1 วัน | ✅ Completed |
| 13 | Real Firebase Integration | 🟣 P4 | 5-10 วัน | ✅ Completed |
| 14 | Cross-browser + Performance | 🟣 P4 | 2-3 วัน | ⬜ Not Started |
| 15 | Deploy Firebase Hosting | 🟣 P4 | 1 วัน | ⬜ Not Started |

**รวม Effort:** ~18-28 วัน (ทุก task)

---

## วิธีใช้แผนนี้

แต่ละ Task = 1 แชท ใช้ prompt ที่กำหนดไว้ในแต่ละ Task

**เริ่มแชทใหม่ แปะ prompt:**
```
ทำงาน Task [N] จากแผน docs/OPERATIONS/phase6-implementation-plan.md
[วาง prompt ที่กำหนดไว้]
```

**เมื่อ Task เสร็จ:**
```
อัปเดต docs/OPERATIONS/phase6-implementation-plan.md
- Mark Task [N] เป็น ✅ Completed
- อัปเดต roadmap.md ถ้าจำเป็น
```
