# User Invitations — Implementation Plan

> **Created:** 2026-03-15
> **Updated:** 2026-03-21
> **Purpose:** Step-by-step prompts สำหรับให้ Sonnet/Haiku ดำเนินการ
> **Strategy:** แต่ละ Step = 1 feature branch → PR → merge to develop
> **Email:** ใช้ Resend สำหรับส่ง email จริง
> **Reference:** ปรับหลักการจาก `dashboard-hub/docs/INVITE_BUTTON_WORKFLOW.md`

---

## Core Principles (adapted from dashboard-hub)

โปรเจกต์เก่า (dashboard-hub) ใช้ **Invitation-based Activation Pattern** ที่พิสูจน์แล้วว่าทำงานได้ดี
หลักการสำคัญที่นำมาปรับใช้:

### Pattern 1: Two-Phase Verification
```
Phase 1: verifyToken → ตรวจสอบว่า token ยัง valid + pending อยู่
Phase 2: finalizeActivation → ยืนยันตัวตน (Google Sign-In) + สร้างบัญชี
```
**เหตุผล:** แยก verify กับ finalize เพื่อ security — ไม่ให้ token ถูกใช้ซ้ำ + ตรวจสอบ identity match

### Pattern 2: Email Matching (Security Critical)
```
invitation.email MUST === googleAuth.email
```
**เหตุผล:** ป้องกันไม่ให้คนที่ได้ลิงก์ แต่ไม่ใช่เจ้าของ email ที่ถูก invite สร้างบัญชีได้

### Pattern 3: Secure Token (UUID v4)
```
token = crypto.randomUUID()  // ไม่ใช่ random 6 chars
```
**เหตุผล:** Token สั้นๆ (6 chars) สามารถ brute force ได้ → ใช้ UUID v4 (128-bit) ที่ปลอดภัย

### Pattern 4: Reactivation vs New Creation
```
checkUserByEmail → FOUND (disabled) → Reactivate existing account
                → NOT_FOUND → Create new account from invitation
```
**เหตุผล:** รองรับ user ที่ถูก deactivate แล้ว admin อยาก invite กลับมา

### Pattern 5: Audit Logging
```
ทุก action สำคัญ → logActivity(action, target, metadata)
```
**เหตุผล:** ต้องมี audit trail สำหรับ: INVITE_USER, CANCEL_INVITATION, ACCEPT_INVITATION, REACTIVATE_USER

### Pattern 6: Server-side Permission Check
```
ทุก API endpoint ที่เป็น admin action → ตรวจสอบ role === 'admin'
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN (Frontend — Nuxt)                      │
│  /admin/invitations                                                 │
│  ┌──────────┐    ┌──────────────────┐    ┌─────────────────────┐   │
│  │ Form     │───▶│ useAdminInvit..  │───▶│ checkUserByEmail    │   │
│  │ (invite) │    │ (composable)     │    │ (API endpoint)      │   │
│  └──────────┘    └──────────────────┘    └─────────┬───────────┘   │
│                                                     │               │
│                          ┌──────────────────────────┤               │
│                          ▼                          ▼               │
│                    status: FOUND             status: NOT_FOUND      │
│                    (ผู้ใช้มีอยู่แล้ว)         (ผู้ใช้ใหม่)          │
│                          │                          │               │
│                          ▼                          ▼               │
│               Confirm reactivate?          createInvitation()      │
│               → reactivateUser()           (POST /api/mock/inv..)  │
└─────────────────────────────────────────────────────────────────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Nuxt Server API)                       │
│                                                                     │
│  POST /api/mock/invitations → สร้าง invitation record              │
│  → sendInvitationEmail() via Resend                                │
│  → logActivity('INVITE_USER')                                      │
└─────────────────────────────────────────────────────────────────────┘
                                                      │
                                               Email with link:
                                    /invite/accept?code={UUID}
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      USER (Frontend — Nuxt)                         │
│  /invite/accept?code=...                                           │
│                                                                     │
│  Phase 1: Verify Token                                             │
│  ┌─────────────────────┐  ┌────────────────────┐                   │
│  │ GET /invitations/   │─▶│ status: pending?   │                   │
│  │   verify?code=XXX   │  │ → Show Google btn  │                   │
│  └─────────────────────┘  └────────┬───────────┘                   │
│                                     │ User clicks                   │
│  Phase 2: Finalize                  ▼                               │
│  ┌─────────────────────┐  ┌────────────────────┐                   │
│  │ Google Sign-In      │─▶│ POST /invitations/ │                   │
│  │ (Firebase Auth)     │  │   accept           │                   │
│  └─────────────────────┘  │ ✓ email matching   │                   │
│                            │ ✓ create user      │                   │
│                            │ ✓ update status    │                   │
│                            └────────┬───────────┘                   │
│                                     ▼                               │
│                            Redirect to /dashboard/discover          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
.data/invitations.json          .data/users.json
┌──────────────────────┐   ┌─────────────────────┐
│ • email              │   │ • uid               │
│ • company            │   │ • email             │
│ • role               │   │ • name              │
│ • status: pending    │──▶│ • role              │
│ • invitationCode     │   │ • company           │
│   (UUID v4)          │   │ • groups            │
│ • invitedBy          │   │ • isActive          │
│ • expiresAt          │   │ • assignedFolders?  │
│ • assignedFolders?   │   └─────────────────────┘
│ • assignedGroups?    │
└──────────────────────┘
         │
         └──▶ Resend API → Email with accept link
```

---

## Dependencies Flow

```
Step 1 (Foundation) → Step 2 (Admin UI) → Step 3 (Email Service) → Step 4 (Acceptance Flow)
```

- Step 1-2 ทำเรียงลำดับ (types → API → UI)
- Step 3 ต้องทำหลัง Step 1 (ต้องมี API ก่อน)
- Step 4 ทำหลังสุด (แก้ auth flow)

---

## Step 1: Invitation Foundation — Types, Mock Data & API

**Branch:** `feat/invitation-foundation`

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/types/dashboard.ts (ดู User interface เป็นตัวอย่าง)
- app/types/admin.ts (ดู Company, AdminGroup interfaces)
- app/types/tag.ts (ดูโครงสร้าง type file เป็นตัวอย่าง)
- .data/users.json (ดู user data structure)
- .data/companies.json (ดู company codes)
- server/api/mock/tags/ (ดูโครงสร้าง API mock เป็นตัวอย่าง — ทั้ง folder)
- server/utils/jsonDatabase.ts (database utility — มี readJSON, writeJSON, findById, createItem, updateItem)
- docs/GUIDES/database-schema.md (section 5: Invitations Collection)

เป้าหมาย: สร้าง Invitation type, mock data, และ API endpoints
ใช้หลักการ: Two-Phase Verification, Email Matching, Secure Token (UUID v4), Reactivation flow

### สิ่งที่ต้องทำ:

1. สร้าง `app/types/invitation.ts`:
   ```typescript
   export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

   export interface Invitation {
     id: string
     email: string
     role: 'user' | 'moderator' | 'admin'
     company: string              // Company code (STTH, STTN, etc.)
     status: InvitationStatus
     invitedBy: string            // UID ของคนเชิญ
     invitedByName: string        // ชื่อคนเชิญ (for display)
     message?: string             // ข้อความเพิ่มเติม
     assignedFolders?: string[]   // สำหรับ moderator — folder IDs ที่ assign
     assignedGroups?: string[]    // group IDs ที่ assign

     // Tracking — ใช้ UUID v4 แทน short code (Security Pattern 3)
     invitationCode: string       // UUID v4 — crypto.randomUUID()
     expiresAt: string            // ISO date — หมดอายุเมื่อไร (default: 14 วัน)
     createdAt: string
     updatedAt: string

     // Acceptance data (filled when accepted — Phase 2 of Two-Phase Verification)
     acceptedAt?: string
     acceptedByUid?: string       // UID ของ user ที่ accept
   }

   export interface CreateInvitationInput {
     email: string
     role: 'user' | 'moderator' | 'admin'
     company: string
     message?: string
     assignedFolders?: string[]
     assignedGroups?: string[]
     expiresInDays?: number       // default: 14
   }

   export interface BulkInviteInput {
     emails: string[]             // หลาย email พร้อมกัน
     role: 'user' | 'moderator' | 'admin'
     company: string
     message?: string
     assignedFolders?: string[]
     assignedGroups?: string[]
   }

   export interface InvitationStats {
     total: number
     pending: number
     accepted: number
     expired: number
     cancelled: number
   }

   /** ใช้สำหรับ audit log — Pattern 5 */
   export type InvitationAction =
     | 'INVITE_USER'
     | 'CANCEL_INVITATION'
     | 'RESEND_INVITATION'
     | 'ACCEPT_INVITATION'
     | 'REACTIVATE_USER'
     | 'BULK_INVITE'
   ```

2. สร้าง `.data/invitations.json` — mock data 4 invitations:
   ```json
   [
     {
       "id": "inv_001",
       "email": "newuser1@stth.com",
       "role": "user",
       "company": "STTH",
       "status": "pending",
       "invitedBy": "61JSdbE674TqRBHHUu9ezdzFul93",
       "invitedByName": "Admin",
       "message": "Welcome to StreamHub!",
       "assignedFolders": [],
       "assignedGroups": ["sales"],
       "invitationCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
       "expiresAt": "2026-03-29T23:59:59.000Z",
       "createdAt": "2026-03-15T10:00:00.000Z",
       "updatedAt": "2026-03-15T10:00:00.000Z"
     },
     {
       "id": "inv_002",
       "email": "moderator@sttn.com",
       "role": "moderator",
       "company": "STTN",
       "status": "pending",
       "invitedBy": "61JSdbE674TqRBHHUu9ezdzFul93",
       "invitedByName": "Admin",
       "message": "You will manage Operations folders",
       "assignedFolders": ["folder_operations"],
       "assignedGroups": ["operations"],
       "invitationCode": "d4e5f6a7-b8c9-0123-def4-567890abcdef",
       "expiresAt": "2026-03-29T23:59:59.000Z",
       "createdAt": "2026-03-15T10:00:00.000Z",
       "updatedAt": "2026-03-15T10:00:00.000Z"
     },
     {
       "id": "inv_003",
       "email": "accepted@stth.com",
       "role": "user",
       "company": "STTH",
       "status": "accepted",
       "invitedBy": "61JSdbE674TqRBHHUu9ezdzFul93",
       "invitedByName": "Admin",
       "message": "",
       "assignedFolders": [],
       "assignedGroups": ["finance"],
       "invitationCode": "g7h8i9j0-k1l2-3456-mnop-qrstuvwxyz01",
       "expiresAt": "2026-03-25T23:59:59.000Z",
       "createdAt": "2026-03-10T10:00:00.000Z",
       "updatedAt": "2026-03-12T14:30:00.000Z",
       "acceptedAt": "2026-03-12T14:30:00.000Z",
       "acceptedByUid": "user_accepted_001"
     },
     {
       "id": "inv_004",
       "email": "expired@stcs.com",
       "role": "user",
       "company": "STCS",
       "status": "expired",
       "invitedBy": "61JSdbE674TqRBHHUu9ezdzFul93",
       "invitedByName": "Admin",
       "message": "",
       "assignedFolders": [],
       "assignedGroups": [],
       "invitationCode": "j0k1l2m3-n4o5-6789-pqrs-tuvwxyz01234",
       "expiresAt": "2026-03-01T23:59:59.000Z",
       "createdAt": "2026-02-15T10:00:00.000Z",
       "updatedAt": "2026-03-01T23:59:59.000Z"
     }
   ]
   ```

3. สร้าง `server/utils/auditLog.ts` — Audit Logging utility (Pattern 5):
   ```typescript
   interface AuditEntry {
     action: string
     performedBy: string      // UID
     performedByEmail: string
     target: string           // email หรือ id ที่ถูก action
     metadata?: Record<string, any>
     timestamp: string        // ISO
   }

   /** Log to .data/audit-log.json (append) */
   export async function logActivity(entry: Omit<AuditEntry, 'timestamp'>): Promise<void>
   ```
   สร้าง `.data/audit-log.json` เป็น `[]` เริ่มต้น

4. สร้าง API endpoints (ดู server/api/mock/tags/ เป็นแบบ):

   **`server/api/mock/invitations/index.get.ts`** — GET all invitations:
   - Query params: `company` (optional filter), `status` (optional filter)
   - Return: `{ success, data, total }`

   **`server/api/mock/invitations/index.post.ts`** — POST create invitation:
   - Body: CreateInvitationInput + `invitedBy` + `invitedByName` (จาก admin session)
   - Auto-generate: id (`inv_` + timestamp), invitationCode → **`crypto.randomUUID()`** (ไม่ใช่ random 6 chars!)
   - Auto-set: status='pending', expiresAt (default 14 days)
   - **Pre-check (Pattern 4 — Reactivation):**
     - ตรวจสอบ users.json ว่า email นี้มี user ที่ `isActive: false` หรือไม่
     - ถ้ามี → return `{ success: false, action: 'user_exists_inactive', existingUser }` ให้ client เลือก reactivate
     - ถ้ามี user ที่ `isActive: true` → return `{ success: false, error: 'User already active' }`
   - Validate: email ไม่ซ้ำกับ invitation ที่ pending อยู่
   - **Audit Log:** logActivity('INVITE_USER', { email, role, company })
   - Return: `{ success, data, action: 'created' }`

   **`server/api/mock/invitations/[id].get.ts`** — GET single invitation

   **`server/api/mock/invitations/[id].put.ts`** — PUT update invitation:
   - ใช้สำหรับ update status (cancel, resend)
   - ถ้า cancel → **Audit Log:** logActivity('CANCEL_INVITATION')
   - ถ้า resend → reset expiresAt + generate invitationCode ใหม่ (UUID v4)
   - ถ้า resend → **Audit Log:** logActivity('RESEND_INVITATION')

   **`server/api/mock/invitations/[id].delete.ts`** — DELETE invitation

   **`server/api/mock/invitations/verify.get.ts`** — GET verify invitation (Phase 1):
   - Query: `code` (UUID invitationCode)
   - ค้นหา invitation by invitationCode
   - ตรวจสอบ: status === 'pending' + ยังไม่หมดอายุ
   - Return invitation info (email, role, company, message) **โดยไม่ expose sensitive data**
   - **ไม่เปลี่ยน status** — แค่ verify ว่ายังใช้ได้
   - กรณีต่างๆ:
     - Valid & pending → `{ success: true, status: 'valid', data: { email, role, company, message, expiresAt } }`
     - Already accepted → `{ success: false, status: 'already_accepted' }`
     - Expired → `{ success: false, status: 'expired' }`
     - Not found → `{ success: false, status: 'not_found' }`

   **`server/api/mock/invitations/accept.post.ts`** — POST accept invitation (Phase 2):
   - Body: `{ invitationCode: string, uid: string, email: string, displayName: string, photoURL?: string }`
   - **Security Check — Email Matching (Pattern 2):**
     - `body.email` MUST === `invitation.email` (ป้องกันคนอื่นใช้ลิงก์)
     - ถ้าไม่ตรง → return `{ success: false, error: 'Email mismatch' }`
   - **Race Condition Prevention:** เช็ค status === 'pending' อีกครั้งก่อน update (ป้องกัน double-accept)
   - **Server-side Expiry Check:** เช็ค `new Date(invitation.expiresAt) > new Date()`
   - Update invitation: status='accepted', acceptedAt, acceptedByUid
   - สร้าง user ใหม่ใน users.json:
     - uid, email, displayName, photoURL จาก body
     - role, company, groups จาก invitation
     - assignedFolders จาก invitation (ถ้าเป็น moderator)
     - isActive: true
   - **Audit Log:** logActivity('ACCEPT_INVITATION', { invitationId, email, role })
   - Return: `{ success, data: { invitation, user } }`

   **`server/api/mock/invitations/check.get.ts`** — GET check invitation by email:
   - Query: `email`
   - ค้นหา invitation ที่ status='pending' + ยังไม่หมดอายุ
   - Return: `{ success, data: invitation | null, found: boolean }`

   **`server/api/mock/invitations/bulk.post.ts`** — POST bulk invite:
   - Body: BulkInviteInput
   - สร้าง invitation สำหรับแต่ละ email (ใช้ crypto.randomUUID() สำหรับแต่ละ code)
   - Pre-check แต่ละ email: pending invitation / active user / inactive user
   - Skip email ที่มี pending invitation อยู่แล้ว หรือเป็น active user
   - **Audit Log:** logActivity('BULK_INVITE', { count, emails })
   - Return: `{ success, data: { created: Invitation[], skipped: { email, reason }[] } }`

   **`server/api/mock/invitations/reactivate.post.ts`** — POST reactivate user (Pattern 4):
   - Body: `{ email: string, role: string, company: string, groups?: string[] }`
   - ค้นหา user ที่ isActive: false + email ตรง
   - Update: isActive=true, role, company, groups
   - **Audit Log:** logActivity('REACTIVATE_USER', { email, uid })
   - Return: `{ success, data: user }`

   **`server/api/mock/invitations/check.get.ts`** — GET check invitation by email:
   - Query: `email`
   - ค้นหา invitation ที่ status='pending' + ยังไม่หมดอายุ
   - Return: `{ success, data: invitation | null, found: boolean }`

   **`server/api/mock/invitations/bulk.post.ts`** — POST bulk invite:
   - Body: BulkInviteInput
   - สร้าง invitation สำหรับแต่ละ email
   - Skip email ที่มี pending invitation อยู่แล้ว หรือเป็น user อยู่แล้ว
   - Return: `{ success, data: { created: Invitation[], skipped: string[] } }`

4. สร้าง `app/composables/useAdminInvitations.ts`:
   ```typescript
   import type { Invitation } from '~/types/invitation'
   import { useAdminResource } from './useAdminResource'

   export function useAdminInvitations() {
     const resource = useAdminResource<Invitation>({
       resourceName: 'invitations',
       idKey: 'id',
       displayKey: 'email',
       idPrefix: 'inv_',
       defaults: {
         status: 'pending' as any,
         assignedFolders: [],
         assignedGroups: []
       }
     })

     // Aliases (ตาม pattern ของ useAdminUsers)
     const invitations = resource.items
     const fetchInvitations = resource.fetch

     /** Get invitations filtered by company */
     const fetchByCompany = async (company: string) => {
       const response = await $fetch<any>('/api/mock/invitations', {
         query: { company }
       })
       return response.data || []
     }

     /** Get invitations filtered by status */
     const fetchByStatus = async (status: string) => {
       const response = await $fetch<any>('/api/mock/invitations', {
         query: { status }
       })
       return response.data || []
     }

     /** Cancel an invitation + audit log */
     const cancelInvitation = async (id: string) => {
       return resource.update(id, { status: 'cancelled' as any })
     }

     /** Resend an invitation (reset expiry + new UUID token) */
     const resendInvitation = async (id: string) => {
       return resource.update(id, {
         status: 'pending' as any,
         expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() as any
         // Server จะ generate invitationCode (UUID v4) ใหม่ให้
       })
     }

     /** Bulk invite */
     const bulkInvite = async (input: any) => {
       const response = await $fetch<any>('/api/mock/invitations/bulk', {
         method: 'POST',
         body: input
       })
       return response.data
     }

     /** Check if email has pending invitation */
     const checkInvitation = async (email: string) => {
       const response = await $fetch<any>('/api/mock/invitations/check', {
         query: { email }
       })
       return response
     }

     /** Verify invitation code — Phase 1 of Two-Phase Verification */
     const verifyInvitation = async (code: string) => {
       const response = await $fetch<any>('/api/mock/invitations/verify', {
         query: { code }
       })
       return response
     }

     /** Accept invitation — Phase 2 of Two-Phase Verification */
     const acceptInvitation = async (data: {
       invitationCode: string
       uid: string
       email: string
       displayName: string
       photoURL?: string
     }) => {
       const response = await $fetch<any>('/api/mock/invitations/accept', {
         method: 'POST',
         body: data
       })
       return response
     }

     /** Reactivate disabled user (Pattern 4) */
     const reactivateUser = async (data: {
       email: string
       role: string
       company: string
       groups?: string[]
     }) => {
       const response = await $fetch<any>('/api/mock/invitations/reactivate', {
         method: 'POST',
         body: data
       })
       return response
     }

     return {
       // Aliases
       invitations,
       fetchInvitations,
       // Resource methods
       ...resource,
       // Custom methods
       fetchByCompany,
       fetchByStatus,
       cancelInvitation,
       resendInvitation,
       bulkInvite,
       checkInvitation,
       verifyInvitation,
       acceptInvitation,
       reactivateUser
     }
   }
   ```

ระวัง:
- invitationCode ต้อง unique — **ใช้ `crypto.randomUUID()` (UUID v4)** ไม่ใช่ short random code
- เช็ค email ซ้ำ: ทั้งใน invitations (pending) และ users (active + inactive)
- ถ้าเจอ user inactive → return action 'user_exists_inactive' ให้ client เลือก reactivate (Pattern 4)
- expiresAt ใช้ ISO string format เหมือน createdAt
- ทุก write operation → เขียน audit log (Pattern 5)
- ไม่ต้องทำ email sending ใน step นี้ — จะทำใน Step 3
- API ทุกตัวดู pattern จาก server/api/mock/tags/ แล้วใช้ jsonDatabase utility
```

---

## Step 2: Admin Invitation UI

**Branch:** `feat/invitation-admin-ui`
**ต้องทำหลัง:** Step 1

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/types/invitation.ts (จาก Step 1)
- app/composables/useAdminInvitations.ts (จาก Step 1)
- app/composables/useAdminResource.ts (generic CRUD pattern)
- app/pages/admin/users/index.vue (ดูโครงสร้าง admin page เป็นตัวอย่าง)
- app/pages/admin/tags/index.vue (ดูโครงสร้าง admin page อีกตัวอย่าง — ถ้ามี)
- app/components/admin/AdminPanelLayout.vue (layout wrapper)
- app/composables/useRoleNavigation.ts (sidebar menu config)
- .data/companies.json (company list for dropdown)
- .data/groups.json (group list for assignment)
- .data/folders.json (folder list for moderator assignment)

เป้าหมาย: สร้าง Admin invitation management page + invite form
ใช้หลักการ: Reactivation confirmation dialog (Pattern 4), Audit-aware actions

### สิ่งที่ต้องทำ:

1. สร้าง `app/pages/admin/invitations/index.vue`:

   Layout: ใช้ AdminPanelLayout เหมือนหน้า admin อื่นๆ

   **ส่วนบน — Header + Actions:**
   - Title: "User Invitations"
   - ปุ่ม "Invite User" → เปิด invite modal
   - ปุ่ม "Bulk Invite" → เปิด bulk invite modal
   - Company filter dropdown (admin เลือกดู company ไหน)
   - Status filter tabs: All | Pending | Accepted | Expired | Cancelled

   **ส่วนกลาง — Invitation Table:**
   - Columns: Email, Role, Company, Status, Invited By, Sent Date, Expires, Actions
   - Status badge สี: pending=yellow, accepted=green, expired=red, cancelled=gray
   - Actions per row:
     - Pending: "Cancel", "Resend", "Copy Link"
     - Accepted: ไม่มี action
     - Expired: "Resend"
     - Cancelled: "Resend"
   - Sort by: createdAt desc (ล่าสุดก่อน)
   - Empty state: "No invitations yet. Click 'Invite User' to get started."

   **ส่วนล่าง — Stats Bar:**
   - แสดง: Total X | Pending X | Accepted X | Expired X

2. สร้าง `app/components/admin/InviteUserModal.vue`:

   **Form fields:**
   - Email input (required, email validation)
   - Role select: User | Moderator | Admin
   - Company select: dropdown จาก companies list (required)
   - Message textarea (optional, max 500 chars)
   - ถ้า role=moderator:
     - Folder assignment: multi-select จาก folders list
   - Group assignment: multi-select จาก groups list (optional)

   **Actions:**
   - "Send Invitation" → POST /api/mock/invitations
   - "Cancel" → ปิด modal
   - **ถ้า API return action: 'user_exists_inactive' (Pattern 4):**
     - แสดง Confirm dialog: "ผู้ใช้นี้เคยมีอยู่ในระบบแต่ถูก deactivate ต้องการเปิดใช้งานใหม่?"
     - "Reactivate" → POST /api/mock/invitations/reactivate
     - "Cancel" → ปิด
   - Success: แสดง "Invitation sent!" + copy invitation link button
   - Error: แสดง error message (email ซ้ำ, etc.)

   **Validation:**
   - Email: required, valid format
   - Company: required
   - Role: required
   - ถ้า email มี pending invitation อยู่แล้ว → แสดง warning

   **Copy Invitation Link:**
   - Format: `{APP_URL}/invite/accept?code={invitationCode}`
   - ใช้ navigator.clipboard.writeText()
   - แสดง toast "Link copied!"

3. สร้าง `app/components/admin/BulkInviteModal.vue`:

   **Form fields:**
   - Emails textarea: ใส่หลาย email (1 ต่อบรรทัด หรือ comma-separated)
   - Role select: User | Moderator (ไม่ให้ bulk invite admin)
   - Company select: dropdown
   - Message textarea (optional)
   - Group assignment: multi-select (optional)

   **Preview section:**
   - แสดง list ของ emails ที่จะ invite
   - Highlight emails ที่มีปัญหา (format ผิด, ซ้ำ, มี user อยู่แล้ว)

   **Actions:**
   - "Send All" → POST /api/mock/invitations/bulk
   - แสดงผลลัพธ์: X sent, Y skipped (with reasons)

4. อัปเดต `app/composables/useRoleNavigation.ts`:
   - เพิ่ม menu item ใน Admin section:
     ```
     { label: 'Invitations', icon: 'mdi-email-plus-outline', to: '/admin/invitations' }
     ```
   - ใส่ไว้หลัง Users menu item

ระวัง:
- ใช้ @nuxt/ui components (UTable, UModal, UInput, USelect, etc.) ที่ project ใช้อยู่
- ดู pattern จากหน้า admin ที่มีอยู่แล้ว (users, companies, tags) — ใช้ AdminPanelLayout
- Invitation code ไม่ต้อง generate ที่ client — server จะ generate UUID v4 ให้
- Copy link function: ใช้ navigator.clipboard.writeText() + format URL: `/invite/accept?code={invitationCode}`
- Reactivation dialog: ต้องแสดงเมื่อ API return action: 'user_exists_inactive' (Pattern 4)
- responsive: table ต้องแสดงได้ดีบน mobile (ใช้ responsive breakpoints)
```

---

## Step 3: Email Service Integration

**Branch:** `feat/invitation-email`
**ต้องทำหลัง:** Step 1

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/types/invitation.ts (Invitation type)
- server/api/mock/invitations/index.post.ts (create invitation API)
- server/api/mock/invitations/bulk.post.ts (bulk invite API)
- nuxt.config.ts (ดู runtime config)
- .env.example (ดู environment variables)

เป้าหมาย: เพิ่ม email sending เมื่อสร้าง invitation ผ่าน Resend API

### สิ่งที่ต้องทำ:

1. เพิ่ม dependencies:
   ```bash
   npm install resend
   ```

2. เพิ่ม environment variables ใน `.env.example` และ `.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@streamhub.app
   APP_URL=http://localhost:3000
   ```

3. อัปเดต `nuxt.config.ts` — เพิ่ม server-only runtime config:
   ```typescript
   runtimeConfig: {
     // Server-only (ไม่ expose ให้ client)
     resendApiKey: process.env.RESEND_API_KEY || '',
     resendFromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@streamhub.app',
     appUrl: process.env.APP_URL || 'http://localhost:3000',
     // ... existing public config
   }
   ```

4. สร้าง `server/utils/emailService.ts`:
   ```typescript
   import { Resend } from 'resend'

   let resendClient: Resend | null = null

   function getResendClient(): Resend | null {
     if (resendClient) return resendClient

     const config = useRuntimeConfig()
     if (!config.resendApiKey) {
       console.warn('⚠️ RESEND_API_KEY not configured — emails will be skipped')
       return null
     }

     resendClient = new Resend(config.resendApiKey)
     return resendClient
   }

   interface SendInvitationEmailInput {
     to: string
     inviterName: string
     role: string
     company: string
     invitationCode: string
     message?: string
     expiresAt: string
   }

   export async function sendInvitationEmail(input: SendInvitationEmailInput): Promise<boolean> {
     const client = getResendClient()
     const config = useRuntimeConfig()

     if (!client) {
       console.log('📧 [Email] Skipped (no API key):', input.to)
       return false
     }

     const acceptUrl = `${config.appUrl}/invite/accept?code=${input.invitationCode}`
     const expiryDate = new Date(input.expiresAt).toLocaleDateString('th-TH', {
       year: 'numeric', month: 'long', day: 'numeric'
     })

     try {
       await client.emails.send({
         from: config.resendFromEmail,
         to: input.to,
         subject: `You're invited to StreamHub — ${input.company}`,
         html: generateInvitationHtml({
           ...input,
           acceptUrl,
           expiryDate
         })
       })

       console.log('✅ [Email] Sent invitation to:', input.to)
       return true
     } catch (error) {
       console.error('❌ [Email] Failed to send:', error)
       return false
     }
   }

   function generateInvitationHtml(data: {
     to: string
     inviterName: string
     role: string
     company: string
     message?: string
     acceptUrl: string
     expiryDate: string
     invitationCode: string
   }): string {
     return `
     <!DOCTYPE html>
     <html>
     <head>
       <meta charset="utf-8">
       <style>
         body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
         .header { background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
         .header h1 { margin: 0; font-size: 24px; }
         .content { background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; }
         .info { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; }
         .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
         .info-label { font-weight: 600; color: #666; }
         .btn { display: inline-block; background: #3B82F6; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0; }
         .code { background: #e8f4fd; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 18px; text-align: center; letter-spacing: 2px; margin: 12px 0; }
         .footer { padding: 16px; text-align: center; color: #999; font-size: 12px; }
         .message { background: #fff3cd; padding: 12px; border-radius: 4px; margin: 12px 0; font-style: italic; }
       </style>
     </head>
     <body>
       <div class="header">
         <h1>StreamHub</h1>
         <p style="margin: 4px 0 0; opacity: 0.8;">Dashboard Management System</p>
       </div>
       <div class="content">
         <h2>You've been invited!</h2>
         <p><strong>${data.inviterName}</strong> has invited you to join StreamHub.</p>

         ${data.message ? `<div class="message">"${data.message}"</div>` : ''}

         <div class="info">
           <div class="info-row"><span class="info-label">Role</span><span>${data.role}</span></div>
           <div class="info-row"><span class="info-label">Company</span><span>${data.company}</span></div>
           <div class="info-row"><span class="info-label">Expires</span><span>${data.expiryDate}</span></div>
         </div>

         <div style="text-align: center;">
           <a href="${data.acceptUrl}" class="btn">Accept Invitation</a>
         </div>

         <p style="text-align: center; color: #666; font-size: 14px;">Or use this invitation code:</p>
         <div class="code">${data.invitationCode}</div>
       </div>
       <div class="footer">
         <p>This invitation expires on ${data.expiryDate}.</p>
         <p>If you didn't expect this invitation, you can safely ignore it.</p>
       </div>
     </body>
     </html>
     `
   }
   ```

5. อัปเดต `server/api/mock/invitations/index.post.ts`:
   - หลังจากสร้าง invitation สำเร็จ → เรียก sendInvitationEmail()
   - ถ้า email ส่งไม่ได้ → ยังคงสร้าง invitation สำเร็จ (email เป็น best-effort)
   - เพิ่ม field `emailSent: boolean` ใน response

6. อัปเดต `server/api/mock/invitations/bulk.post.ts`:
   - ส่ง email สำหรับแต่ละ invitation ที่สร้างสำเร็จ
   - Return: `{ created: [], skipped: [], emailsSent: number, emailsFailed: number }`

ระวัง:
- RESEND_API_KEY ต้องอยู่ใน runtimeConfig (ไม่ใช่ public) — ห้าม expose ให้ client
- ถ้าไม่มี API key → skip email silently (log warning แต่ไม่ error)
- Email HTML ต้อง inline CSS (email clients ไม่ support external CSS)
- Rate limiting: Resend free tier = 100 emails/day → ระวัง bulk invite ขนาดใหญ่
- ทดสอบ: ตั้ง RESEND_API_KEY ใน .env แล้ว invite email จริง
```

---

## Step 4: Invitation Acceptance Flow (Two-Phase Verification)

**Branch:** `feat/invitation-accept-flow`
**ต้องทำหลัง:** Step 1, Step 2

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/types/invitation.ts (Invitation type)
- app/composables/useAdminInvitations.ts (verifyInvitation, acceptInvitation methods)
- app/composables/useAuth.ts (auth flow — signInWithGoogle, initAuth)
- app/stores/auth.ts (auth store)
- app/middleware/auth.ts (auth middleware)
- app/pages/login.vue (login page)
- server/api/mock/invitations/verify.get.ts (Phase 1 — verify API)
- server/api/mock/invitations/accept.post.ts (Phase 2 — accept API)
- server/api/mock/invitations/check.get.ts (check by email)
- server/api/mock/users/index.post.ts (create user API)

เป้าหมาย: สร้าง invitation acceptance flow ให้ user ที่ถูก invite เข้าระบบได้
ใช้หลักการ: Two-Phase Verification, Email Matching (Security Critical), Auto-detect invitation

### Flow ที่ต้องทำ:

**Flow A — ผ่าน Invitation Link (Two-Phase):**
```
User ได้รับ email → คลิก Accept → /invite/accept?code={UUID}
→ Phase 1: verifyToken (GET /verify?code=XXX)
→ แสดงข้อมูล invitation → ปุ่ม Sign in with Google
→ Google Sign-In
→ Phase 2: finalizeActivation (POST /accept)
   ✓ Email matching: googleAuth.email === invitation.email
   ✓ Create user account
   ✓ Update invitation status → 'accepted'
   ✓ Audit log
→ Redirect ไป /dashboard/discover
```

**Flow B — Auto-detect (Login ปกติ แต่มี pending invitation):**
```
User login ด้วย Google → ระบบหา user profile ไม่เจอ
→ เช็คว่า email นี้มี pending invitation ไหม (GET /check?email=XXX)
→ ถ้ามี → auto-accept invitation (POST /accept)
   ✓ Email matching: ตรงอยู่แล้ว (login email = invitation email)
   ✓ Create user + redirect
→ ถ้าไม่มี → แสดง "Contact administrator" error (เหมือนเดิม)
```

### สิ่งที่ต้องทำ:

1. สร้าง `app/pages/invite/accept.vue`:

   **Layout:**
   - ไม่ใช้ sidebar/header layout → ใช้ layout เรียบง่าย (centered card)
   - Logo StreamHub ด้านบน
   - Card แสดงข้อมูล invitation

   **States (6 states):**
   - **loading:** กำลังตรวจสอบ invitation code... (Phase 1)
   - **valid (ยังไม่ login):**
     - แสดงข้อมูล: "You've been invited to join [Company] as [Role]"
     - Message จากผู้เชิญ (ถ้ามี)
     - ปุ่ม "Sign in with Google to accept"
   - **valid (login แล้ว, email ตรง):**
     - แสดงข้อมูลเหมือนด้านบน
     - ปุ่ม "Accept & Join" → เรียก accept API (Phase 2)
   - **valid (login แล้ว, email ไม่ตรง):** ← Security Check!
     - แสดง warning: "You're signed in as [current email] but this invitation is for [invitation email]"
     - ปุ่ม "Sign out & use correct account" → sign out → revert to "valid (ยังไม่ login)"
   - **processing:** "Setting up your account..." (Phase 2 กำลังทำงาน)
   - **success:** "Welcome! Redirecting..." → redirect to /dashboard/discover (2 seconds)
   - **invalid/expired:** แสดง error + link กลับ login
   - **already_accepted:** แสดง "Already accepted" + link ไป /dashboard/discover

   **Logic (Two-Phase):**
   ```typescript
   // 1. อ่าน code จาก query
   const route = useRoute()
   const code = route.query.code as string

   // 2. Phase 1: Verify invitation (read-only, ไม่เปลี่ยน status)
   const invitation = ref(null)
   const status = ref<'loading' | 'valid' | 'invalid' | 'already_accepted' | 'email_mismatch' | 'processing' | 'success' | 'error'>('loading')

   onMounted(async () => {
     if (!code) {
       status.value = 'invalid'
       return
     }

     // GET /api/mock/invitations/verify?code=XXX
     const response = await $fetch('/api/mock/invitations/verify', {
       query: { code }
     })

     if (response.status === 'valid') {
       invitation.value = response.data
       // เช็ค auth state ปัจจุบัน
       const authStore = useAuthStore()
       if (authStore.isAuthenticated) {
         // Email Matching Check (Pattern 2)
         if (authStore.user?.email === response.data.email) {
           status.value = 'valid'
         } else {
           status.value = 'email_mismatch'
         }
       } else {
         status.value = 'valid'
       }
     } else if (response.status === 'already_accepted') {
       status.value = 'already_accepted'
     } else {
       status.value = 'invalid'
     }
   })

   // 3. Phase 2: Finalize — Accept invitation
   const acceptInvitation = async () => {
     status.value = 'processing'
     const authStore = useAuthStore()

     // POST /api/mock/invitations/accept
     // Server จะ verify email matching อีกครั้ง (defense in depth)
     const response = await $fetch('/api/mock/invitations/accept', {
       method: 'POST',
       body: {
         invitationCode: code,
         uid: authStore.user?.uid,
         email: authStore.user?.email,        // ← ต้องตรงกับ invitation.email
         displayName: authStore.user?.displayName,
         photoURL: authStore.user?.photoURL
       }
     })

     if (response.success) {
       // Update auth store with new user data
       authStore.setUser({
         ...authStore.user,
         role: invitation.value.role,
         company: invitation.value.company
       })
       status.value = 'success'
       setTimeout(() => navigateTo('/dashboard/discover'), 2000)
     } else if (response.error === 'Email mismatch') {
       // Server rejected — email ไม่ตรง
       status.value = 'email_mismatch'
     }
   }

   // 4. Handle Google Sign-In on this page
   const signInAndAccept = async () => {
     const { signInWithGoogle } = useAuth()
     const result = await signInWithGoogle()
     if (result.success) {
       // หลัง sign in → เช็ค email matching แล้ว accept
       const authStore = useAuthStore()
       if (authStore.user?.email === invitation.value.email) {
         await acceptInvitation()
       } else {
         status.value = 'email_mismatch'
       }
     }
   }
   ```

2. อัปเดต `app/composables/useAuth.ts` — signInWithGoogle:
   - ปัจจุบัน: ถ้า user ไม่เจอใน system → set authError
   - **เพิ่ม: Auto-detect invitation (Flow B)**
   - ก่อน set authError → เช็คว่า email มี pending invitation ไหม

   ```typescript
   // ใน signInWithGoogle, หลัง mockUser not found:
   if (!mockUser) {
     // Auto-detect: Check for pending invitation (Flow B)
     try {
       const invResponse = await $fetch('/api/mock/invitations/check', {
         query: { email: userCredential.user.email }
       })

       if (invResponse.found && invResponse.data.status === 'pending') {
         // Auto-accept invitation (Phase 2)
         // Email matching: ตรงอยู่แล้วเพราะ search by email
         const acceptResponse = await $fetch('/api/mock/invitations/accept', {
           method: 'POST',
           body: {
             invitationCode: invResponse.data.invitationCode,
             uid: userCredential.user.uid,
             email: userCredential.user.email,
             displayName: userCredential.user.displayName,
             photoURL: userCredential.user.photoURL
           }
         })

         if (acceptResponse.success) {
           const newUser = acceptResponse.data.user
           const userData: UserData = {
             uid: userCredential.user.uid,
             email: userCredential.user.email,
             displayName: userCredential.user.displayName,
             photoURL: userCredential.user.photoURL,
             role: newUser.role,
             company: newUser.company
           }
           authStore.setUser(userData)
           authStore.setAuthError(null)
           permissionsStore.initializePermissions(userData)
           return { success: true }
         }
       }
     } catch (invError) {
       console.log('No pending invitation found for:', userCredential.user.email)
     }

     // Original error handling (user not found, no invitation)
     throw new Error(`User with UID "${userCredential.user.uid}" not found...`)
   }
   ```

3. อัปเดต `server/api/mock/invitations/accept.post.ts` — เพิ่ม security checks:
   - รับ body: `{ invitationCode, uid, email, displayName, photoURL }`
   - **Security Check 1 — Email Matching (Pattern 2):**
     ```typescript
     if (body.email.toLowerCase() !== invitation.email.toLowerCase()) {
       return { success: false, error: 'Email mismatch',
         message: 'The email you signed in with does not match the invitation email' }
     }
     ```
   - **Security Check 2 — Race Condition Prevention:**
     ```typescript
     if (invitation.status !== 'pending') {
       return { success: false, error: 'Already processed',
         message: 'This invitation has already been ' + invitation.status }
     }
     ```
   - **Security Check 3 — Server-side Expiry:**
     ```typescript
     if (new Date(invitation.expiresAt) < new Date()) {
       // Update status to expired
       await updateItem('invitations.json', invitation.id, { status: 'expired' })
       return { success: false, error: 'Expired' }
     }
     ```
   - สร้าง user ใน users.json:
     ```typescript
     const newUser = {
       uid: body.uid,
       email: body.email,
       name: body.displayName || body.email.split('@')[0],
       role: invitation.role,
       company: invitation.company,
       groups: invitation.assignedGroups || [],
       isActive: true,
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString()
     }
     ```
   - ถ้า role=moderator → set assignedFolders จาก invitation
   - **Audit Log:** logActivity('ACCEPT_INVITATION')
   - Update invitation: status='accepted', acceptedAt, acceptedByUid

4. เพิ่ม route rule ใน `nuxt.config.ts`:
   ```typescript
   routeRules: {
     '/admin/**': { ssr: false },
     '/manage/**': { ssr: false },
     '/invite/**': { ssr: false }  // เพิ่มบรรทัดนี้
   }
   ```

6. อัปเดต `app/middleware/auth.ts`:
   - เพิ่ม exception สำหรับ `/invite/accept` — ไม่ redirect ไป login ถ้ากำลังอยู่หน้า accept
   - หรือให้ redirect ไป login แต่เก็บ redirect URL ไว้ (redirect back หลัง login)

ระวัง:
- Auth middleware ต้องไม่ block หน้า /invite/accept (user อาจยังไม่ login)
- **Email Matching (Pattern 2):** ทั้ง client-side และ server-side ต้องเช็ค email ตรงกัน (defense in depth)
- **Two-Phase Verification:** Phase 1 (verify) = read-only ไม่เปลี่ยน state, Phase 2 (accept) = write + create user
- **Race Condition:** Server ต้อง re-check status === 'pending' ก่อน accept (ป้องกัน double-accept)
- **Server-side Expiry:** Server ต้องเช็ค expiresAt ด้วย (ไม่ trust client expiry check เพียงอย่างเดียว)
- Security: invitation code เป็น UUID v4 (128-bit, ไม่สามารถ brute force ได้)
- หลัง accept แล้ว refresh page → user ต้องยังอยู่ในระบบ (ข้อมูลถูก persist ใน users.json)
- Auto-detect (Flow B): ใช้ $fetch แทน fetch ใน Nuxt composable
```

---

## Verification Checklist

หลัง implement ครบทุก step ให้ทดสอบ:

1. **Admin สร้าง Invitation**
   - [ ] สร้าง single invitation ได้ — เลือก email, role, company, groups
   - [ ] สร้าง bulk invitation ได้ — หลาย emails พร้อมกัน
   - [ ] Email ซ้ำ (pending) → แสดง warning
   - [ ] Email ที่เป็น active user → แสดง error
   - [ ] Email ที่เป็น inactive user → **แสดง reactivation dialog** (Pattern 4)
   - [ ] Invitation table แสดงข้อมูลถูกต้อง + filter ได้
   - [ ] Invitation code เป็น UUID v4 (ไม่ใช่ short code)
   - [ ] Copy link button ทำงาน (format: /invite/accept?code={UUID})

2. **Email Sending**
   - [ ] ได้รับ email จริงเมื่อถูก invite (ต้องตั้ง RESEND_API_KEY)
   - [ ] Email มี Accept link + invitation code
   - [ ] ถ้าไม่มี API key → invitation สร้างได้ แต่ไม่ส่ง email

3. **Accept Flow A — ผ่าน Link (Two-Phase Verification)**
   - [ ] คลิก Accept link → Phase 1: verify token (read-only)
   - [ ] แสดงข้อมูล invitation (email, role, company, message)
   - [ ] ยังไม่ login → แสดงปุ่ม Sign in with Google
   - [ ] Login ด้วย email ที่ตรงกับ invitation → Phase 2: accept สำเร็จ
   - [ ] **Login ด้วย email ที่ไม่ตรง → แสดง email mismatch warning** (Pattern 2)
   - [ ] สร้าง user สำเร็จ → redirect ไป discover
   - [ ] Invitation status เปลี่ยนเป็น 'accepted'

4. **Accept Flow B — Auto-detect**
   - [ ] User ที่ถูก invite login ด้วย Google ที่หน้า login ปกติ
   - [ ] ระบบเช็คเจอ pending invitation → auto-accept
   - [ ] User ได้ role + company + groups จาก invitation
   - [ ] Moderator ได้ assignedFolders จาก invitation

5. **Security & Edge Cases**
   - [ ] Expired invitation → แสดง error
   - [ ] Already accepted invitation → แสดง "already accepted"
   - [ ] Invalid/unknown code → แสดง error
   - [ ] Cancel invitation → ไม่สามารถ accept ได้
   - [ ] **Double-accept race condition → server rejects second attempt** (Pattern 2)
   - [ ] **Email mismatch → server rejects with 'Email mismatch'** (Pattern 2)
   - [ ] **Server-side expiry check** (ไม่ trust client-side check เพียงอย่างเดียว)
   - [ ] Invitation code เป็น UUID v4 — ไม่สามารถ brute force ได้

6. **Audit Logging (Pattern 5)**
   - [ ] INVITE_USER — logged เมื่อ admin สร้าง invitation
   - [ ] CANCEL_INVITATION — logged เมื่อ admin cancel
   - [ ] RESEND_INVITATION — logged เมื่อ admin resend
   - [ ] ACCEPT_INVITATION — logged เมื่อ user accept
   - [ ] REACTIVATE_USER — logged เมื่อ admin reactivate
   - [ ] BULK_INVITE — logged เมื่อ admin bulk invite
   - [ ] Audit log entries มี: action, performedBy, target, metadata, timestamp
