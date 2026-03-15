# User Invitations — Implementation Plan

> **Created:** 2026-03-15
> **Purpose:** Step-by-step prompts สำหรับให้ Sonnet/Haiku ดำเนินการ
> **Strategy:** แต่ละ Step = 1 feature branch → PR → merge to develop
> **Email:** ใช้ Resend (หรือ Firebase) สำหรับส่ง email จริง

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
- server/utils/jsonDatabase.ts (database utility)
- docs/GUIDES/database-schema.md (section 5: Invitations Collection)

เป้าหมาย: สร้าง Invitation type, mock data, และ API endpoints

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

     // Tracking
     invitationCode: string       // Unique code สำหรับ accept
     expiresAt: string            // ISO date — หมดอายุเมื่อไร (default: 14 วัน)
     createdAt: string
     updatedAt: string

     // Acceptance data (filled when accepted)
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
       "invitationCode": "INV-STTH-A1B2C3",
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
       "invitationCode": "INV-STTN-D4E5F6",
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
       "invitationCode": "INV-STTH-G7H8I9",
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
       "invitationCode": "INV-STCS-J0K1L2",
       "expiresAt": "2026-03-01T23:59:59.000Z",
       "createdAt": "2026-02-15T10:00:00.000Z",
       "updatedAt": "2026-03-01T23:59:59.000Z"
     }
   ]
   ```

3. สร้าง API endpoints (ดู server/api/mock/tags/ เป็นแบบ):

   **`server/api/mock/invitations/index.get.ts`** — GET all invitations:
   - Query params: `company` (optional filter), `status` (optional filter)
   - Return: `{ success, data, total }`

   **`server/api/mock/invitations/index.post.ts`** — POST create invitation:
   - Body: CreateInvitationInput
   - Auto-generate: id (`inv_` + timestamp), invitationCode (`INV-{company}-{random6}`)
   - Auto-set: status='pending', expiresAt (default 14 days)
   - Validate: email ไม่ซ้ำกับ invitation ที่ pending อยู่
   - Validate: email ไม่ซ้ำกับ user ที่มีอยู่แล้ว
   - Return: `{ success, data, action: 'created' }`

   **`server/api/mock/invitations/[id].get.ts`** — GET single invitation

   **`server/api/mock/invitations/[id].put.ts`** — PUT update invitation:
   - ใช้สำหรับ update status (cancel, resend)
   - ถ้า resend → reset expiresAt + generate invitationCode ใหม่

   **`server/api/mock/invitations/[id].delete.ts`** — DELETE invitation

   **`server/api/mock/invitations/accept.post.ts`** — POST accept invitation:
   - Body: `{ invitationCode: string, uid: string }`
   - Validate: code ตรง, status='pending', ยังไม่หมดอายุ
   - Update invitation: status='accepted', acceptedAt, acceptedByUid
   - สร้าง user ใหม่ใน users.json (หรือ update ถ้ามีอยู่แล้ว):
     - uid จาก Firebase Auth
     - email, role, company, groups จาก invitation
     - assignedFolders จาก invitation (ถ้าเป็น moderator)
   - Return: `{ success, data: { invitation, user } }`

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

     /** Cancel an invitation */
     const cancelInvitation = async (id: string) => {
       return resource.update(id, { status: 'cancelled' as any })
     }

     /** Resend an invitation (reset expiry) */
     const resendInvitation = async (id: string) => {
       return resource.update(id, {
         status: 'pending' as any,
         expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() as any
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

     return {
       ...resource,
       fetchByCompany,
       fetchByStatus,
       cancelInvitation,
       resendInvitation,
       bulkInvite,
       checkInvitation
     }
   }
   ```

ระวัง:
- invitationCode ต้อง unique — ใช้ format `INV-{COMPANY}-{random 6 chars uppercase}`
- เช็ค email ซ้ำ: ทั้งใน invitations (pending) และ users
- expiresAt ใช้ ISO string format เหมือน createdAt
- ไม่ต้องทำ email sending ใน step นี้ — จะทำใน Step 3
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
   - Success: แสดง invitation code + copy button
   - Error: แสดง error message (email ซ้ำ, etc.)

   **Validation:**
   - Email: required, valid format
   - Company: required
   - Role: required
   - ถ้า email มี pending invitation อยู่แล้ว → แสดง warning

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
- ใช้ PrimeVue components (DataTable, Dialog, InputText, Dropdown, etc.) ที่ project ใช้อยู่
- ดู pattern จากหน้า admin ที่มีอยู่แล้ว (users, companies, tags)
- Invitation code ไม่ต้อง generate ที่ client — server จะ generate ให้
- Copy link/code function: ใช้ navigator.clipboard.writeText()
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

## Step 4: Invitation Acceptance Flow

**Branch:** `feat/invitation-accept-flow`
**ต้องทำหลัง:** Step 1, Step 2

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/types/invitation.ts (Invitation type)
- app/composables/useAuth.ts (auth flow — signInWithGoogle, initAuth)
- app/stores/auth.ts (auth store)
- app/middleware/auth.ts (auth middleware)
- app/pages/login.vue (login page)
- server/api/mock/invitations/accept.post.ts (accept API)
- server/api/mock/invitations/check.get.ts (check API)
- server/api/mock/users/index.post.ts (create user API)

เป้าหมาย: สร้าง invitation acceptance flow ให้ user ที่ถูก invite เข้าระบบได้

### Flow ที่ต้องทำ:

```
User ได้รับ email/link → คลิก Accept → เปิดหน้า /invite/accept?code=XXX
→ Login ด้วย Google (ถ้ายังไม่ login)
→ ระบบเช็ค invitation code → สร้าง user account → redirect ไป /dashboard/discover
```

**กรณี user ที่ login แล้วแต่ไม่อยู่ในระบบ (authError state):**
```
User login ด้วย Google → ระบบหา user profile ไม่เจอ
→ เช็คว่า email นี้มี pending invitation ไหม
→ ถ้ามี → auto-accept invitation → สร้าง user → redirect ไป discover
→ ถ้าไม่มี → แสดง "Contact administrator" error (เหมือนเดิม)
```

### สิ่งที่ต้องทำ:

1. สร้าง `app/pages/invite/accept.vue`:

   **Layout:**
   - ไม่ใช้ sidebar/header layout → ใช้ layout เรียบง่าย (centered card)
   - Logo StreamHub ด้านบน
   - Card แสดงข้อมูล invitation

   **States:**
   - **Loading:** กำลังตรวจสอบ invitation code...
   - **Valid invitation (ยังไม่ login):**
     - แสดงข้อมูล: "You've been invited to join [Company] as [Role]"
     - Message จากผู้เชิญ (ถ้ามี)
     - ปุ่ม "Sign in with Google to accept"
   - **Valid invitation (login แล้ว):**
     - แสดงข้อมูลเหมือนด้านบน
     - ปุ่ม "Accept & Join" → เรียก accept API
     - Processing state: "Setting up your account..."
     - Success: "Welcome! Redirecting..." → redirect to /dashboard/discover
   - **Invalid/Expired:**
     - แสดง error: "This invitation is invalid or has expired"
     - Link กลับไป login page
   - **Already accepted:**
     - แสดง: "This invitation has already been accepted"
     - Link ไป /dashboard/discover

   **Logic:**
   ```typescript
   // 1. อ่าน code จาก query
   const route = useRoute()
   const code = route.query.code as string

   // 2. Verify invitation
   const invitation = ref(null)
   const status = ref<'loading' | 'valid' | 'invalid' | 'accepted' | 'processing' | 'success' | 'error'>('loading')

   onMounted(async () => {
     if (!code) {
       status.value = 'invalid'
       return
     }

     // Fetch invitation by code
     const response = await $fetch('/api/mock/invitations/check', {
       query: { code }
     })

     if (!response.found) {
       status.value = 'invalid'
       return
     }

     invitation.value = response.data

     if (response.data.status === 'accepted') {
       status.value = 'accepted'
     } else if (new Date(response.data.expiresAt) < new Date()) {
       status.value = 'invalid'
     } else {
       status.value = 'valid'
     }
   })

   // 3. Accept invitation
   const acceptInvitation = async () => {
     status.value = 'processing'
     const authStore = useAuthStore()

     const response = await $fetch('/api/mock/invitations/accept', {
       method: 'POST',
       body: {
         invitationCode: code,
         uid: authStore.user?.uid,
         email: authStore.user?.email,
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
     }
   }
   ```

2. อัปเดต `server/api/mock/invitations/check.get.ts`:
   - เพิ่ม query param `code` (invitation code) นอกจาก `email`
   - ค้นหาได้ทั้ง by email และ by code

3. อัปเดต `app/composables/useAuth.ts` — signInWithGoogle:
   - ปัจจุบัน: ถ้า user ไม่เจอใน system → set authError
   - เพิ่ม: ก่อน set authError → เช็คว่า email มี pending invitation ไหม
   - ถ้ามี → auto-accept invitation → สร้าง user → continue login flow

   ```typescript
   // ใน signInWithGoogle, หลัง mockUser not found:
   if (!mockUser) {
     // Check for pending invitation
     try {
       const invResponse = await fetch(`/api/mock/invitations/check?email=${encodeURIComponent(userCredential.user.email)}`)
       const invData = await invResponse.json()

       if (invData.found && invData.data.status === 'pending') {
         // Auto-accept invitation
         const acceptResponse = await fetch('/api/mock/invitations/accept', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             invitationCode: invData.data.invitationCode,
             uid: userCredential.user.uid,
             email: userCredential.user.email,
             displayName: userCredential.user.displayName,
             photoURL: userCredential.user.photoURL
           })
         })
         const acceptData = await acceptResponse.json()

         if (acceptData.success) {
           const newUser = acceptData.data.user
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
       console.log('No pending invitation found')
     }

     // Original error handling (user not found, no invitation)
     throw new Error(`User with UID "${userCredential.user.uid}" not found in system. Please contact administrator to create an account.`)
   }
   ```

4. อัปเดต `server/api/mock/invitations/accept.post.ts`:
   - รับ body: `{ invitationCode, uid, email, displayName, photoURL }`
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
     (อัปเดต folders ที่ถูก assign ให้เพิ่ม uid ใน assignedModerators)

5. เพิ่ม route rule ใน `nuxt.config.ts`:
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
- ถ้า user login ผ่าน Google แต่ไม่มีใน system → ต้องเช็ค invitation ก่อน error
- Race condition: invitation อาจถูก accept ซ้ำ → server ต้อง check status ก่อน accept
- Security: invitation code ต้อง unique + ไม่ guessable (ใช้ random chars ยาวพอ)
- หลัง accept แล้ว refresh page → user ต้องยังอยู่ในระบบ (ข้อมูลถูก persist ใน users.json)
```

---

## Verification Checklist

หลัง implement ครบทุก step ให้ทดสอบ:

1. **Admin สร้าง Invitation**
   - [ ] สร้าง single invitation ได้ — เลือก email, role, company, groups
   - [ ] สร้าง bulk invitation ได้ — หลาย emails พร้อมกัน
   - [ ] Email ซ้ำ (pending) → แสดง warning
   - [ ] Email ที่เป็น user อยู่แล้ว → skip
   - [ ] Invitation table แสดงข้อมูลถูกต้อง + filter ได้

2. **Email Sending**
   - [ ] ได้รับ email จริงเมื่อถูก invite (ต้องตั้ง RESEND_API_KEY)
   - [ ] Email มี Accept link + invitation code
   - [ ] ถ้าไม่มี API key → invitation สร้างได้ แต่ไม่ส่ง email

3. **Accept Flow — ผ่าน Link**
   - [ ] คลิก Accept link → เปิดหน้า /invite/accept
   - [ ] ถ้ายังไม่ login → แสดงปุ่ม Sign in with Google
   - [ ] Login แล้ว → กด Accept → สร้าง user → redirect ไป discover
   - [ ] Invitation status เปลี่ยนเป็น 'accepted'

4. **Accept Flow — Auto-detect**
   - [ ] User ที่ถูก invite login ด้วย Google
   - [ ] ระบบเช็คเจอ pending invitation → auto-accept
   - [ ] User ได้ role + company + groups จาก invitation
   - [ ] Moderator ได้ assignedFolders จาก invitation

5. **Edge Cases**
   - [ ] Expired invitation → แสดง error
   - [ ] Already accepted → แสดง "already accepted"
   - [ ] Invalid code → แสดง error
   - [ ] Cancel invitation → ไม่สามารถ accept ได้
