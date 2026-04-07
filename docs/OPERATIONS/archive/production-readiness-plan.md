# Production Readiness Plan — StreamHub

> **Status: ✅ COMPLETED** — All 7 tasks done, 134/134 tests pass, production verified (2026-04-07)

## Context

Phase 6 implementation เสร็จแล้ว แต่เมื่อ deploy ขึ้น production พบว่าระบบยังคงทำงานเหมือน local ในหลายจุด เช่น auth bypass ผ่าน query param, localhost fallback ใน email, mock API endpoints ที่ยังถูก deploy ขึ้นไปด้วย — ทำให้ต้อง hotfix อยู่เสมอ

แผนนี้มีเป้าหมาย:
1. **Harden** ขอบเขต dev/production ให้ชัดเจน ไม่ leak ข้าม mode
2. **Validate** environment ตั้งแต่ startup — fail fast ถ้า config ผิด
3. **สร้าง Health Check & Testing Tools** เพื่อ verify production readiness ได้ทันที
4. **Clean up** code ที่ไม่ควรอยู่ใน production build

---

## คำแนะนำสถาปัตยกรรม: Local vs Production

> **ระบบควรรองรับทั้ง 2 mode — แต่ต้องมี boundary ที่ชัดเจน**

| หลักการ | รายละเอียด |
|---------|-----------|
| **Dev mode ทำเพื่อ speed** | ใช้ mock data, ไม่ต้อง Firebase credentials, iteration เร็ว |
| **Production mode ทำเพื่อ safety** | ใช้ Firestore จริง, auth จริง, ห้ามมี fallback ใดๆ |
| **Boundary ต้อง build-time** | ใช้ `process.dev` (Nuxt set ตอน build) — production build จะไม่มี dev code |
| **ขึ้น production แล้วกลับ local ได้** | เปลี่ยน env vars กลับเป็น mock mode ได้ — แต่ production deploy ต้อง Firestore เท่านั้น |
| **Fail fast** | ถ้า production ขาด config ที่จำเป็น → error ทันที ไม่ silent fallback |

ปัญหาปัจจุบันไม่ใช่ว่า dual-mode ผิดออกแบบ — แต่ **ขอบเขตรั่ว** (dev fallback หลุดเข้า production path)

---

## ปัญหาที่พบทั้งหมด (จาก Audit)

### 🔴 Critical

| # | ปัญหา | ไฟล์ | ผลกระทบ |
|---|--------|------|---------|
| C1 | ~~Auth middleware มี `process.dev` bypass 3 จุด~~ ✅ Fixed (PR #202) | `server/middleware/auth.ts` | ~~Security breach~~ |
| C2 | ~~`getAppUrl()` fallback เป็น `http://localhost:3000`~~ ✅ Fixed (Task 2, PR #203) | `server/utils/emailService.ts:27` | ~~Email invitation link ชี้ localhost~~ |
| C3 | ~~`nuxt.config.ts` มี `appUrl` default เป็น localhost~~ ✅ Fixed (Task 2, PR #203) | `nuxt.config.ts:160` | ~~Server-side URL ผิด~~ |
| C4 | ~~`.env` ที่ commit มี `APP_URL=http://localhost:3000`~~ ✅ Fixed (Task 7) | `.env:16,21` | ~~Build time อาจใช้ค่า localhost~~ |

### 🟠 High

| # | ปัญหา | ไฟล์ | ผลกระทบ |
|---|--------|------|---------|
| H1 | ~~Audit log fallback จาก Firestore → JSON file~~ ✅ Fixed (Task 3, PR #205) | `server/utils/auditLog.ts` | ~~Audit log หาย~~ |
| H2 | ~~Mock API 43 endpoints ถูก deploy ไป production~~ ✅ Fixed (Task 7, `blockMockApi.ts`) | `server/api/mock/` | ~~Return empty/error~~ |
| H3 | ~~ไม่มี startup validation~~ ✅ Fixed (Task 2, `validateEnv.ts`) | ทั้งระบบ | ~~Silent failures~~ |
| H4 | ~~`useFirestore` flag check ไม่สม่ำเสมอ~~ ✅ Fixed (Task 6, `useServiceMode.ts`) | หลายไฟล์ | ~~อาจ evaluate ต่างกัน~~ |

### 🟡 Medium

| # | ปัญหา | ไฟล์ | ผลกระทบ |
|---|--------|------|---------|
| M1 | ~~Auth middleware มี console.log 15+ บรรทัด~~ ✅ Fixed (PR #202) | `server/middleware/auth.ts` | ~~Sensitive data ใน Cloud Function logs~~ |
| M2 | ~~ไม่มี health check endpoint~~ ✅ Fixed (Task 4, PR #207) | `server/api/health.get.ts` | ~~ไม่สามารถ monitor ได้~~ |
| M3 | ~~`.env` committed กับ real API keys~~ ✅ Fixed (Task 7) | `.env` | ~~Security risk~~ |

---

## แผนงาน: แบ่งเป็น 7 Tasks (1 Task = 1 Chat)

### Task 1: Harden Auth Middleware — ลบ Dev Bypass ออกจาก Production Path ✅ Done
**Priority:** 🔴 Critical | **Effort:** เล็ก | **Dependencies:** ไม่มี
**Branch:** `fix/harden-auth-middleware` | **PR:** #202 | **Merged:** 2026-04-06

**สิ่งที่ทำ:**
- รวม 3 จุด `process.dev` bypass → early return block เดียว
- Production path: strict 401, ไม่มี query param fallback
- เปลี่ยน 15+ `console.log` → `console.debug` (stripped in production)
- `firebaseAdmin.ts`: init logs → `console.debug`

**ผลการ Verify:** 74/74 tests pass, build output มี 0 `process.dev` references, 4 auth rejection paths confirmed

---

### Task 2: Fix Localhost Fallbacks & Environment Validation ✅ Done
**Priority:** 🔴 Critical | **Effort:** เล็ก | **Dependencies:** ไม่มี
**Branch:** `fix/localhost-fallbacks-env-validation` | **PR:** #203 | **Merged:** 2026-04-06

**สิ่งที่ทำ:**
- `emailService.ts`: `getAppUrl()` throw ใน production ถ้าไม่มี APP_URL (dev ยังใช้ localhost fallback ได้)
- `nuxt.config.ts:160`: เปลี่ยน `|| 'http://localhost:3000'` → `|| ''`
- `.env`: เพิ่ม comment ชี้แจงว่า APP_URL/NUXT_APP_URL เป็น dev-only default
- สร้าง `server/utils/validateEnv.ts`: log error ถ้า NUXT_APP_URL หรือ NUXT_PUBLIC_USE_FIRESTORE หาย หรือชี้ localhost
- สร้าง `server/plugins/validateEnv.ts`: เรียก validation ผ่าน Nitro `request` hook (deferred — ไม่รันตอน Firebase CLI analysis)

**หมายเหตุการแก้ไข (hotfix):** ต้องแก้เพิ่มหลัง CI fail — Firebase CLI รัน Nitro plugin ตอน deploy-analysis phase ซึ่ง env vars ยังไม่ถูก inject → เปลี่ยนจาก plugin init → `request` hook และเปลี่ยน `throw` → `console.error` (fail-fast ยังอยู่ที่ `getAppUrl()` เมื่อ send email จริง)

**ผลการ Verify:** 74/74 tests pass, CI deploy pass, PR #204 (develop→main) สร้างแล้ว

---

### Task 3: Fix Audit Log & Firestore Fallback ✅ Done
**Priority:** 🟠 High | **Effort:** เล็ก | **Dependencies:** ไม่มี
**Branch:** `fix/audit-log-firestore-fallback` | **PR:** #205 → #206 | **Merged:** 2026-04-06

**เป้าหมาย:** Audit log ต้องไม่หายใน production

**สิ่งที่ทำ:**
- `logAuditEvent`: เพิ่ม Firestore write path — เดิมใช้แค่ JSON เสมอ ไม่เคย check `USE_FIRESTORE`
- `logActivity`: ลบ silent fallback — เดิม Firestore fail → fall through ไป JSON; ตอนนี้ retry 1 ครั้ง → throw
- JSON path ยังใช้ได้เมื่อ `NUXT_PUBLIC_USE_FIRESTORE !== 'true'` (dev/mock mode)
- `id` generate ก่อน retry closure → idempotent (Firestore `set` ด้วย id เดิม ไม่ duplicate)

**ผลการ Verify:** 74/74 tests pass, PR #205 (develop) → PR #206 (main) merged 2026-04-06

---

### Task 4: สร้าง Health Check API + Environment Status Page ✅ Done
**Priority:** 🟠 High | **Effort:** กลาง | **Dependencies:** Task 2
**Branch:** merged | **PR:** #207 → #208 | **Merged:** 2026-04-06

**เป้าหมาย:** สร้างเครื่องมือตรวจสอบว่า production ทำงานถูกต้อง

**ไฟล์ที่สร้าง/แก้:**
- สร้าง `server/api/health.get.ts` — Health check endpoint
- สร้าง `app/pages/admin/health.vue` — Admin-only health dashboard page

**สิ่งที่ต้องทำ:**
1. สร้าง `/api/health` endpoint (protected, admin only):
   ```typescript
   {
     status: 'ok',
     environment: {
       mode: process.dev ? 'development' : 'production',
       useFirestore: true/false,
       useJsonMock: true/false,
       firebaseAdminAvailable: true/false,
       appUrl: 'https://...' // mask ถ้า localhost
       resendConfigured: true/false,
       nodeEnv: process.env.NODE_ENV,
     },
     checks: {
       firestoreConnection: 'ok'/'error',
       firebaseAuth: 'ok'/'error',
       emailService: 'ok'/'error',
     },
     warnings: ['APP_URL is localhost', ...],
     timestamp: '...',
     version: '...'
   }
   ```
2. สร้าง Admin health page ที่แสดง status แบบ visual:
   - ✅ / ❌ สำหรับแต่ละ check
   - Warning ถ้ามี config ที่ผิดปกติ
   - แสดง environment mode ปัจจุบัน

**Verification:**
- เปิด `/admin/health` ใน production → ต้องเห็น status ทุก check เป็น ✅
- ถ้ามี config ผิด → แสดง ❌ พร้อม description

---

### Task 5: Production Readiness Test Suite ✅ Done
**Priority:** 🟠 High | **Effort:** กลาง | **Dependencies:** Task 1, 2
**Branch:** `fix/production-readiness-tests` | **PR:** #209 → #210 | **Merged:** 2026-04-06

**เป้าหมาย:** สร้าง automated tests ที่ verify production configuration

**ไฟล์ที่สร้าง:**
- `tests/config/productionReadiness.test.ts` — 11 static config assertions (readFileSync + regex, no mocks)

**สิ่งที่ทำ:**
1. **firebase.json — environment variables** (4 tests):
   - `NUXT_PUBLIC_USE_FIRESTORE` = `"true"`
   - `NUXT_PUBLIC_USE_JSON_MOCK` = `"false"`
   - `NUXT_APP_URL` set และไม่มี localhost
   - `NUXT_APP_URL` ขึ้นต้นด้วย `https://`
2. **server/middleware/auth.ts — production path security** (4 tests):
   - uid fallback (devMode: true) มีอยู่สำหรับ dev
   - uid fallback อยู่ภายใน `if (process.dev)` เท่านั้น
   - Production path ใช้ `sendUnauthorized`
   - ไม่มี `console.log` (มีแค่ `console.debug`)
3. **.github/workflows/deploy.yml — build environment** (2 tests):
   - `NUXT_PUBLIC_USE_FIRESTORE: 'true'` ตอน build
   - `NUXT_PUBLIC_USE_JSON_MOCK: 'false'` ตอน build
4. **.env — dev-only documentation** (1 test, `describe.skipIf` on CI):
   - Comment ชี้แจงว่า APP_URL / NUXT_APP_URL เป็น dev-only default

**หมายเหตุการแก้ไข (hotfix):** `.env` ไม่ถูก commit (อยู่ใน .gitignore) → CI fail เพราะ `readFileSync` on missing file → แก้เป็น `describe.skipIf(!hasEnvFile)` เพื่อ skip บน CI

**ผลการ Verify:** 117/117 tests pass, introduce localhost bug → 2 tests fail correctly

---

### Task 6: Standardize useFirestore Flag & Clean Up Config Pattern ✅ Done
**Priority:** 🟡 Medium | **Effort:** เล็ก | **Dependencies:** ไม่มี
**Branch:** `refactor/standardize-service-mode` | **PR:** #211 (develop) → #212 (main) | **Merged:** 2026-04-06

**เป้าหมาย:** ทำให้ทุก file ใช้ pattern เดียวกันในการ check Firestore mode

**สิ่งที่ทำ:**
- สร้าง `app/composables/useServiceMode.ts` — single source of truth สำหรับ `isFirestore`, `isMock`, `apiBase()`
- แก้ 7 ไฟล์ที่มี inline check ซ้ำ ให้ใช้ `useServiceMode()` แทน:
  - `useAuth.ts`, `useAdminResource.ts`, `useAdminInvitations.ts`
  - `useDashboardService.ts`, `accept.vue`, `InviteUserModal.vue`, `BulkInviteModal.vue`
- ไฟล์ที่ใช้ `useRuntimeConfig()` แค่สำหรับ useFirestore → ลบ `useRuntimeConfig()` ทิ้ง
- ไฟล์ที่ใช้ `useRuntimeConfig()` สำหรับอย่างอื่นด้วย (เช่น `useAuth.ts` — Firebase config) → เก็บไว้ ลบแค่ flag line
- สร้าง `tests/composables/useServiceMode.test.ts` — 7 test cases

**ผลการ Verify:** 124/124 tests pass, `grep -r 'config.public.useFirestore' app/` → only in `useServiceMode.ts`

---

### Task 7: Disable Mock API in Production & Clean Up .env ✅ Done
**Priority:** 🟡 Medium | **Effort:** เล็ก | **Dependencies:** Task 6
**Branch:** `develop` | **Commit:** `53059df` | **Pushed:** 2026-04-06

**เป้าหมาย:** Mock API endpoints ไม่ทำงานใน production build

**สิ่งที่ทำ:**
- สร้าง `server/middleware/blockMockApi.ts` — return 404 สำหรับ `/api/mock/*` ใน production
  - ใช้ `import.meta.dev` แทน `process.dev` → build-time dead code elimination (Nitro best practice)
- Clean up `.env` — ลบ real Resend API key (`re_Fsyuy...`) → ใส่ placeholder `re_test_xxxxxxxxxxxx`
  - เพิ่ม header documentation ชี้ไป `.env.local`
  - Real key อยู่ใน `.env.local` อยู่แล้ว (git-ignored)
- อัปเดต `.env.example` — เพิ่ม mock data config section, ปรับ documentation
- `.gitignore` — ตรวจสอบแล้ว: `.env.*` pattern ครอบคลุม `.env.local` อยู่แล้ว
- สร้าง `tests/server/blockMockApi.test.ts` — 5 static assertions
- เพิ่ม production readiness tests 3 ข้อ:
  - `.env` ไม่มี real API keys
  - `blockMockApi.ts` exists และ block correctly

**ผลการ Verify:** 132/132 tests pass (เพิ่มจาก 124 → 132, +8 tests ใหม่)

---

## ลำดับการทำงาน

```
Week 1:
  Task 1 (Auth Harden)     ✅ Done — PR #202 merged 2026-04-06
  Task 2 (Localhost Fix)    ✅ Done — PR #203 merged 2026-04-06
  Task 3 (Audit Log Fix)    ✅ Done — PR #205

Week 2:
  Task 4 (Health Check)    ✅ Done
  Task 5 (Test Suite)      ✅ Done — PR #209 → #210 merged 2026-04-06
  Task 6 (Standardize)     ✅ Done — PR #211 → #212 merged 2026-04-06

Week 3:
  Task 7 (Mock Cleanup)    ✅ Done — commit 53059df pushed 2026-04-06
```

---

## วิธี Verify ทั้งระบบ (End-to-End)

หลังทำครบ 7 Tasks:

1. **Build & Deploy**:
   - `npm run build` → ไม่มี warning
   - Deploy ไป Firebase

2. **Health Check**:
   - เปิด `/admin/health` → ทุก check ✅

3. **Auth Test**:
   - เปิด protected page โดยไม่ login → redirect ไป login
   - เรียก `/api/audit` ไม่มี token → 401
   - เรียก `/api/mock/users` → 404

4. **Feature Test** (ทุกหน้า):
   - Login → เห็น dashboard
   - เปิด dashboard view → embed ทำงาน
   - Admin pages → CRUD ทำงานกับ Firestore
   - Invite user → email มี link production URL
   - Audit log → entries ปรากฏใน Firestore

5. **Automated Tests**:
   - `npm test` → production-readiness tests ผ่าน

---

## Post-Completion Hotfixes

หลังปิด 7 Tasks แล้ว พบปัญหาเพิ่มเติมจากการ deploy จริง:

### Hotfix 1: Preview Workflow Cleanup (PR #216)
- **ปัญหา:** `preview.yml` cleanup job ขาด `actions/checkout` → Firebase CLI หา `firebase.json` ไม่เจอ
- **แก้ไข:** เพิ่ม `actions/checkout@v5` + `prepare-firebase-deploy.mjs` step

### Hotfix 2: Cloud Functions .env File (PR #217)
- **ปัญหา:** Firebase CLI ไม่อ่าน `environmentVariables` จาก `functions.yaml` → `NUXT_APP_URL` และ `NUXT_PUBLIC_USE_FIRESTORE` หายจาก Cloud Run runtime → 500 error บน invitation resend
- **แก้ไข:** เปลี่ยน `prepare-firebase-deploy.mjs` จากเขียน env vars ใน `functions.yaml` → สร้าง `.env` file ใน `.output/server/`
- **ยืนยัน:** Deploy log แสดง `Loaded environment variables from .env.` + Resend dashboard ยืนยัน email ส่งสำเร็จ

### บทเรียน
- Firebase CLI อ่าน `secretEnvironmentVariables` จาก `functions.yaml` ✅
- Firebase CLI **ไม่**อ่าน `environmentVariables` จาก `functions.yaml` ❌ → ต้องใช้ `.env` file

---

## สรุปผลลัพธ์

| Metric | Before | After |
|--------|--------|-------|
| Tests | 74 | 134 |
| Production issues | 11 (C:4, H:4, M:3) | 0 |
| Health check | ไม่มี | `/admin/health` + `/api/health` |
| Mock API in prod | เปิดอยู่ 43 endpoints | Blocked (404) |
| Auth bypass | 3 จุด | 0 |
| Env validation | ไม่มี | `validateEnv.ts` + `productionReadiness.test.ts` |
| Email delivery | ❌ 500 error | ✅ Delivered (Resend confirmed) |
