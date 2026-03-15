# Company-Based Access Control — Implementation Plan

> **Created:** 2026-03-15
> **Purpose:** Step-by-step prompts สำหรับให้ Sonnet/Haiku ดำเนินการ
> **Strategy:** แต่ละ Step = 1 feature branch → PR → merge to develop
> **Backend:** Mock JSON API (ยังไม่ใช้ Firestore)

---

## Dependencies Flow

```
Step 1 (Server Middleware) → Step 2 (API Enforcement) → Step 3 (Client Guards)
```

- Step 1 ต้องทำก่อน (foundation)
- Step 2 ใช้ middleware จาก Step 1
- Step 3 ทำหลังสุด (client-side enforcement)

---

## Step 1: Server-Side Company Validation Middleware

**Branch:** `feat/company-access-middleware`

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- server/utils/jsonDatabase.ts (database utility)
- server/api/mock/users/index.get.ts (ดูโครงสร้าง API handler)
- server/api/mock/users/[uid].get.ts (ดูวิธี get user by ID)
- server/api/mock/dashboards/index.get.ts (ดู query params ที่ใช้)
- app/types/dashboard.ts (User, Dashboard types — โดยเฉพาะ AccessControl, CompanyAccess)
- app/stores/auth.ts (ดู UserData interface)

เป้าหมาย: สร้าง server utility สำหรับ validate company access บน API layer

### สิ่งที่ต้องทำ:

1. สร้าง `server/utils/companyAccess.ts`:

   ```typescript
   import { H3Event } from 'h3'
   import { readJSON, findById } from './jsonDatabase'

   interface CompanyAccessResult {
     allowed: boolean
     user: any | null
     reason: string
   }

   /**
    * ตรวจสอบว่า user มีสิทธิ์เข้าถึง resource ของ company ที่ร้องขอหรือไม่
    * - Admin: เข้าถึงได้ทุก company
    * - Moderator/User: เข้าถึงได้เฉพาะ company ของตัวเอง
    *
    * @param event - H3Event
    * @param requestedCompany - company code ที่ร้องขอ (optional — ถ้าไม่ส่งมาจะใช้ company ของ user)
    * @returns CompanyAccessResult
    */
   export async function validateCompanyAccess(
     event: H3Event,
     requestedCompany?: string
   ): Promise<CompanyAccessResult> {
     // 1. ดึง uid จาก query params หรือ body
     const query = getQuery(event)
     const uid = query.uid as string

     if (!uid) {
       return { allowed: false, user: null, reason: 'Missing uid parameter' }
     }

     // 2. ค้นหา user จาก users.json
     const user = await findById('users', uid, 'uid')
     if (!user) {
       return { allowed: false, user: null, reason: 'User not found' }
     }

     if (!user.isActive) {
       return { allowed: false, user, reason: 'User is inactive' }
     }

     // 3. Admin bypass — admin เข้าถึงได้ทุก company
     if (user.role === 'admin') {
       return { allowed: true, user, reason: 'Admin access' }
     }

     // 4. ถ้าระบุ requestedCompany ให้เช็คว่าตรงกับ company ของ user
     if (requestedCompany && requestedCompany !== user.company) {
       return {
         allowed: false,
         user,
         reason: `User belongs to ${user.company}, cannot access ${requestedCompany}`
       }
     }

     return { allowed: true, user, reason: 'Company match' }
   }

   /**
    * ตรวจสอบว่า user มีสิทธิ์เข้าถึง dashboard ตาม 3-layer model
    * ใช้กับ API endpoint ที่ดึง dashboard เฉพาะ
    */
   export function checkDashboardAccess(
     dashboard: any,
     user: any
   ): { allowed: boolean; reason: string } {
     // Admin bypass
     if (user.role === 'admin') {
       return { allowed: true, reason: 'Admin access' }
     }

     const access = dashboard.access || { direct: { users: [], roles: [], groups: [] }, company: {} }
     const restrictions = dashboard.restrictions || { revoke: [], expiry: {} }

     // Layer 3: Check restrictions first (deny overrides)
     if (restrictions.revoke?.includes(user.uid)) {
       return { allowed: false, reason: 'Access revoked' }
     }

     const expiryDate = restrictions.expiry?.[user.uid]
     if (expiryDate && new Date(expiryDate) < new Date()) {
       return { allowed: false, reason: 'Access expired' }
     }

     // Layer 1: Direct access (OR condition)
     if (access.direct?.users?.includes(user.uid)) {
       return { allowed: true, reason: 'Direct user access' }
     }
     if (access.direct?.roles?.includes(user.role)) {
       return { allowed: true, reason: 'Direct role access' }
     }
     if (user.groups?.some((g: string) => access.direct?.groups?.includes(g))) {
       return { allowed: true, reason: 'Direct group access' }
     }

     // Layer 2: Company-scoped access (AND condition)
     const companyAccess = access.company?.[user.company]
     if (companyAccess) {
       if (companyAccess.roles?.includes(user.role)) {
         return { allowed: true, reason: 'Company-role access' }
       }
       if (user.groups?.some((g: string) => companyAccess.groups?.includes(g))) {
         return { allowed: true, reason: 'Company-group access' }
       }
     }

     return { allowed: false, reason: 'No matching access rule' }
   }

   /**
    * Filter dashboards ที่ user มีสิทธิ์เข้าถึง
    */
   export function filterAccessibleDashboards(
     dashboards: any[],
     user: any
   ): any[] {
     if (user.role === 'admin') return dashboards
     return dashboards.filter(d => checkDashboardAccess(d, user).allowed)
   }
   ```

2. สร้าง `server/utils/apiResponse.ts` — helper สำหรับ standardize error responses:

   ```typescript
   import { H3Event } from 'h3'

   export function sendForbidden(event: H3Event, message: string) {
     setResponseStatus(event, 403)
     return { success: false, error: 'Forbidden', message }
   }

   export function sendUnauthorized(event: H3Event, message: string) {
     setResponseStatus(event, 401)
     return { success: false, error: 'Unauthorized', message }
   }

   export function sendNotFound(event: H3Event, message: string) {
     setResponseStatus(event, 404)
     return { success: false, error: 'Not Found', message }
   }

   export function sendBadRequest(event: H3Event, message: string) {
     setResponseStatus(event, 400)
     return { success: false, error: 'Bad Request', message }
   }
   ```

ระวัง:
- ห้ามแก้ไข jsonDatabase.ts — แค่ import ใช้งาน
- functions ใน server/utils/ จะถูก auto-import โดย Nitro
- ต้อง import `getQuery`, `setResponseStatus` จาก 'h3'
```

---

## Step 2: Enforce Company Filtering on API Endpoints

**Branch:** `feat/company-api-enforcement`
**ต้องทำหลัง:** Step 1

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- server/utils/companyAccess.ts (จาก Step 1)
- server/utils/apiResponse.ts (จาก Step 1)
- server/utils/jsonDatabase.ts (database utility)
- server/api/mock/dashboards/index.get.ts (GET dashboards)
- server/api/mock/dashboards/[id].get.ts (GET single dashboard)
- server/api/mock/folders/index.get.ts (GET folders)
- server/api/mock/users/index.get.ts (GET users)
- server/api/mock/users/[uid].get.ts (GET single user)

เป้าหมาย: อัปเดต API endpoints ให้ใช้ company access validation

### สิ่งที่ต้องทำ:

1. อัปเดต `server/api/mock/dashboards/index.get.ts`:
   - เพิ่ม company validation ด้วย validateCompanyAccess()
   - ถ้า user ไม่ใช่ admin → filter dashboards ด้วย filterAccessibleDashboards()
   - ถ้า query มี `company` param → validate ว่า user มีสิทธิ์เข้าถึง company นั้น
   - Admin: ส่ง dashboards ทั้งหมด (หรือ filter ตาม company param ถ้ามี)

   ตัวอย่างโครงสร้าง:
   ```typescript
   export default defineEventHandler(async (event) => {
     const query = getQuery(event)
     const uid = query.uid as string
     const companyFilter = query.company as string

     // Validate company access
     if (uid) {
       const accessResult = await validateCompanyAccess(event, companyFilter)
       if (!accessResult.allowed) {
         return sendForbidden(event, accessResult.reason)
       }

       // Read all dashboards
       const dashboards = await readJSON('dashboards')

       // Filter by company access
       const accessible = filterAccessibleDashboards(dashboards, accessResult.user)

       // Additional filters (folderId, etc.)
       let filtered = accessible
       if (query.folderId) {
         filtered = filtered.filter(d => d.folderId === query.folderId)
       }

       return { success: true, data: filtered, total: filtered.length }
     }

     // Fallback: return all (for admin pages without uid)
     const dashboards = await readJSON('dashboards')
     return { success: true, data: dashboards, total: dashboards.length }
   })
   ```

2. อัปเดต `server/api/mock/dashboards/[id].get.ts`:
   - ถ้ามี uid → validate company access + checkDashboardAccess()
   - ถ้าไม่มี uid → return dashboard ตามปกติ (backward compatible)

3. อัปเดต `server/api/mock/folders/index.get.ts`:
   - ถ้ามี uid → ดึง user → filter folders ที่ user มีสิทธิ์:
     - Admin: เห็นทุก folder
     - Moderator: เห็น folder ที่ตัวเองถูก assign (assignedModerators มี uid)
     - User: เห็นทุก folder (แต่จะ filter dashboards ข้างในตาม access)

4. อัปเดต `server/api/mock/users/index.get.ts`:
   - ถ้ามี query param `company` → filter users ตาม company
   - ถ้ามี query param `uid` (requester) → validate ว่า requester มีสิทธิ์ดู users ของ company นั้น
   - Admin: เห็น users ทุก company
   - Moderator/User: เห็นเฉพาะ users ใน company เดียวกัน

5. อัปเดต `server/api/mock/users/[uid].get.ts`:
   - เพิ่ม optional company validation:
     - ถ้ามี requester uid → check ว่า requester มีสิทธิ์ดู user นี้
     - Admin: ดูได้ทุกคน
     - อื่นๆ: ดูได้เฉพาะ user ใน company เดียวกัน

ระวัง:
- ต้อง backward compatible — endpoint ที่ไม่ส่ง uid ต้องยังทำงานได้ปกติ
- อย่า break endpoint ที่ admin pages ใช้อยู่ (admin ไม่ส่ง uid บาง endpoint)
- Admin pages อาจเรียก GET /api/mock/users โดยไม่ส่ง company → ต้อง return all
- ทดสอบโดย run `npm run dev` แล้วเปิด app → login → ดูว่ายังใช้งานได้ปกติ
```

---

## Step 3: Client-Side Company Guards

**Branch:** `feat/company-client-guards`
**ต้องทำหลัง:** Step 2

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/stores/auth.ts (auth store — UserData interface)
- app/stores/permissions.ts (permission checking)
- app/composables/useAuth.ts (auth composable)
- app/composables/useDashboardPage.ts (dashboard page logic)
- app/composables/useJSONMockService.ts (service layer)
- app/middleware/auth.ts (auth middleware)
- app/middleware/admin.ts (admin middleware)
- app/pages/dashboard/discover.vue (discover page)
- app/pages/admin/users/index.vue (admin users page)

เป้าหมาย: เพิ่ม client-side company guards เพื่อให้ UI สอดคล้องกับ server-side enforcement

### สิ่งที่ต้องทำ:

1. สร้าง `app/composables/useCompanyAccess.ts`:
   ```typescript
   /**
    * Company Access Composable
    * ใช้สำหรับเช็คสิทธิ์ company-level บน client-side
    */
   export function useCompanyAccess() {
     const authStore = useAuthStore()
     const permissionsStore = usePermissionsStore()

     /** User's home company */
     const userCompany = computed(() => authStore.user?.company || '')

     /** Is admin (can access all companies) */
     const isAdmin = computed(() => permissionsStore.isAdmin)

     /**
      * เช็คว่า user มีสิทธิ์เข้าถึง company ที่ระบุ
      */
     const canAccessCompany = (companyCode: string): boolean => {
       if (isAdmin.value) return true
       return userCompany.value === companyCode
     }

     /**
      * Filter items ตาม company ของ user
      * Admin: ไม่ filter (เห็นทุก company)
      * Others: filter เฉพาะ items ที่มี company ตรงกัน
      */
     const filterByCompany = <T extends { company?: string }>(items: T[]): T[] => {
       if (isAdmin.value) return items
       return items.filter(item => !item.company || item.company === userCompany.value)
     }

     /**
      * Get company label สำหรับ display
      */
     const getCompanyLabel = (code: string): string => {
       // จะถูกเพิ่ม company name lookup ทีหลัง
       return code
     }

     return {
       userCompany,
       isAdmin,
       canAccessCompany,
       filterByCompany,
       getCompanyLabel
     }
   }
   ```

2. อัปเดต `app/composables/useJSONMockService.ts`:
   - ตรวจสอบว่า getDashboards() ส่ง `company` param ไปใน API call
   - ตรวจสอบว่า getFolders() ส่ง `company` param ไปใน API call
   - จัดการ 403 error response จาก server (แสดง error message ที่เหมาะสม)

   เพิ่ม error handling:
   ```typescript
   // ใน getDashboards, getFolders, etc.
   } catch (error: any) {
     if (error?.statusCode === 403) {
       console.error('🚫 [JSONMockService] Access denied:', error.data?.message)
       // ไม่ throw — return empty result แทน
       return { dashboards: [], total: 0, hasMore: false }
     }
     // ... existing error handling
   }
   ```

3. อัปเดต `app/pages/admin/users/index.vue` (ถ้ามี):
   - Admin เห็น users ทุก company
   - ถ้ามี company filter dropdown → ใช้ filter ได้
   - ข้อมูลแสดง company column ใน table

4. อัปเดต `app/composables/useDashboardPage.ts`:
   - ตรวจสอบว่า company ถูกส่งไปใน API calls ทุกที่
   - เพิ่ม error state สำหรับ access denied

ระวัง:
- อย่าเปลี่ยน interface ของ composables ที่มีอยู่ — แค่เพิ่ม validation
- 403 errors จาก API ต้องไม่ทำให้ app crash — ควร handle gracefully
- ทดสอบด้วย user ที่ต่าง company กัน (แก้ .data/users.json เพิ่ม user company อื่น)
- Admin ต้องยังเห็นข้อมูลทุก company ได้
- หน้า discover ต้องยังแสดง dashboards ตามปกติสำหรับ user ที่ login
```

---

## Verification Checklist

หลัง implement ครบทุก step ให้ทดสอบ:

1. **User (role: user, company: STTH)**
   - [ ] เห็นเฉพาะ dashboards ที่มีสิทธิ์ใน STTH
   - [ ] ไม่เห็น dashboards ของ company อื่น
   - [ ] API return 403 ถ้าพยายามเข้าถึง company อื่น

2. **Moderator (role: moderator, company: STTH)**
   - [ ] เห็นเฉพาะ dashboards/folders ที่ถูก assign ใน STTH
   - [ ] จัดการ folder ที่ถูก assign ได้
   - [ ] ไม่เข้าถึง company อื่นได้

3. **Admin (role: admin)**
   - [ ] เห็น dashboards/folders/users ทุก company
   - [ ] Filter by company ได้ใน admin panel
   - [ ] CRUD ข้าม company ได้

4. **Backward Compatibility**
   - [ ] หน้าที่มีอยู่ทั้งหมดยังทำงานปกติ
   - [ ] API endpoints ที่ไม่ส่ง uid ยังทำงานได้
   - [ ] Login flow ไม่เปลี่ยน
