# Looker Studio API Integration — Implementation Plan

> **Created:** 2026-03-15
> **Completed:** 2026-03-23
> **Purpose:** Step-by-step prompts สำหรับให้ Sonnet/Haiku ดำเนินการ
> **Strategy:** แต่ละ Step = 1 feature branch → PR → merge to develop
> **Approach:** Phase แรกทำ Manual URL → Phase สองเพิ่ม Google API

## ✅ Completion Status

| Step | Branch | PR | Status |
|------|--------|----|--------|
| Step 1: Manual URL Workflow | `feat/looker-manual-url` | #97 | ✅ Merged to main |
| Step 2: Looker Studio API Service | `feat/looker-api-service` | #98 | ✅ Merged to main |
| Step 3: Dashboard Preview Widget | `feat/dashboard-preview-widget` | #99 | ✅ Merged to main |

**Files created:**
- `app/utils/lookerUrl.ts` — URL validation + embed URL conversion
- `app/components/features/LookerUrlInput.vue` — URL input + live preview component
- `app/composables/useLookerApi.ts` — Looker API client (status, reports, sync)
- `server/utils/lookerStudioApi.ts` — Google Sheets/Looker API service
- `server/api/looker/reports.get.ts`, `status.get.ts`, `sync.post.ts`, `reports/[id].get.ts`
- `server/api/thumbnail/[dashboardId].get.ts` — SVG placeholder thumbnail
- `app/components/features/DashboardPreview.vue` — Quick view modal with live iframe

---

---

## Dependencies Flow

```
Step 1 (Manual URL + Validation) → Step 2 (Looker API Service) → Step 3 (Preview Widget)
                                 ↗
                    (ทำได้อิสระหลัง Step 1)
```

- Step 1 ทำก่อน (manual workflow ใช้งานได้เลย)
- Step 2 ทำทีหลัง (ต้อง setup Google Cloud credentials)
- Step 3 ทำได้หลัง Step 1 (ไม่ต้องรอ Step 2)

---

## Step 1: Manual URL Workflow — Dashboard Form + Validation + Preview

**Branch:** `feat/looker-manual-url`

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/types/dashboard.ts (Dashboard interface — โดยเฉพาะ lookerDashboardId, lookerEmbedUrl)
- app/pages/manage/folders/[folderId].vue (manage page ที่มี DashboardForm)
- app/components/manage/DashboardForm.vue (existing form — ถ้ามี)
- app/composables/useModeratorDashboards.ts (dashboard CRUD for moderator)
- app/composables/useJSONMockService.ts (saveDashboard method)
- app/pages/dashboard/view.vue (dashboard view page — iframe embedding)
- .data/dashboards.json (ดู lookerEmbedUrl ที่มีอยู่)

เป้าหมาย: สร้าง/อัปเดต Dashboard form ให้รองรับ Looker Studio URL input + validation + live preview

### สิ่งที่ต้องทำ:

1. สร้าง `app/utils/lookerUrl.ts` — URL validation & parsing utility:

   ```typescript
   /**
    * Looker Studio URL patterns:
    * - View URL:  https://lookerstudio.google.com/reporting/{reportId}/page/{pageId}
    * - Embed URL: https://lookerstudio.google.com/embed/reporting/{reportId}/page/{pageId}
    * - Legacy:    https://datastudio.google.com/reporting/{reportId}
    */

   const LOOKER_URL_PATTERNS = [
     // Looker Studio embed URL
     /^https:\/\/lookerstudio\.google\.com\/embed\/reporting\/([a-f0-9-]+)/,
     // Looker Studio view URL
     /^https:\/\/lookerstudio\.google\.com\/reporting\/([a-f0-9-]+)/,
     // Legacy Data Studio embed URL
     /^https:\/\/datastudio\.google\.com\/embed\/reporting\/([a-f0-9-]+)/,
     // Legacy Data Studio view URL
     /^https:\/\/datastudio\.google\.com\/reporting\/([a-f0-9-]+)/,
   ]

   export interface LookerUrlInfo {
     isValid: boolean
     reportId: string | null
     embedUrl: string | null
     originalUrl: string
     error?: string
   }

   /**
    * Parse และ validate Looker Studio URL
    * แปลง view URL → embed URL อัตโนมัติ
    */
   export function parseLookerUrl(url: string): LookerUrlInfo {
     const trimmedUrl = url.trim()

     if (!trimmedUrl) {
       return { isValid: false, reportId: null, embedUrl: null, originalUrl: url, error: 'URL is required' }
     }

     // Try each pattern
     for (const pattern of LOOKER_URL_PATTERNS) {
       const match = trimmedUrl.match(pattern)
       if (match) {
         const reportId = match[1]
         // Always construct embed URL from report ID
         const embedUrl = `https://lookerstudio.google.com/embed/reporting/${reportId}`

         // Preserve page path if present
         const pageMatch = trimmedUrl.match(/\/page\/([a-zA-Z0-9_-]+)/)
         const fullEmbedUrl = pageMatch
           ? `${embedUrl}/page/${pageMatch[1]}`
           : embedUrl

         return {
           isValid: true,
           reportId,
           embedUrl: fullEmbedUrl,
           originalUrl: trimmedUrl
         }
       }
     }

     return {
       isValid: false,
       reportId: null,
       embedUrl: null,
       originalUrl: trimmedUrl,
       error: 'Invalid Looker Studio URL. Please use a URL from lookerstudio.google.com'
     }
   }

   /**
    * Convert view URL → embed URL
    */
   export function toEmbedUrl(url: string): string | null {
     const info = parseLookerUrl(url)
     return info.embedUrl
   }

   /**
    * Extract report ID from URL
    */
   export function extractReportId(url: string): string | null {
     const info = parseLookerUrl(url)
     return info.reportId
   }

   /**
    * Validate URL format only (no network check)
    */
   export function isValidLookerUrl(url: string): boolean {
     return parseLookerUrl(url).isValid
   }
   ```

2. สร้าง `app/components/features/LookerUrlInput.vue`:

   **Component props:**
   ```typescript
   interface Props {
     modelValue: string      // v-model สำหรับ embed URL
     showPreview?: boolean   // แสดง iframe preview (default: true)
     previewHeight?: number  // ความสูง preview (default: 400)
   }
   ```

   **Template structure:**
   ```
   ┌─────────────────────────────────────────────────┐
   │ Looker Studio URL                               │
   │ ┌─────────────────────────────────────────────┐ │
   │ │ https://lookerstudio.google.com/...         │ │
   │ └─────────────────────────────────────────────┘ │
   │ ✅ Valid Looker URL — Report ID: abc-123        │  ← validation message
   │                                                  │
   │ [Preview] [Open in New Tab]                     │  ← action buttons
   │                                                  │
   │ ┌─────────────────────────────────────────────┐ │
   │ │                                             │ │
   │ │          (iframe preview)                   │ │
   │ │                                             │ │
   │ └─────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────┘
   ```

   **Features:**
   - Text input สำหรับ paste Looker Studio URL
   - Real-time validation (ใช้ parseLookerUrl)
   - Auto-convert view URL → embed URL
   - แสดง validation status: valid (green), invalid (red), empty (neutral)
   - แสดง Report ID เมื่อ valid
   - Toggle preview button → แสดง/ซ่อน iframe
   - Open in new tab button
   - Emit `update:modelValue` เป็น embed URL (ไม่ใช่ original URL)

   **Implementation:**
   ```typescript
   const inputUrl = ref(props.modelValue || '')
   const showingPreview = ref(false)

   const urlInfo = computed(() => parseLookerUrl(inputUrl.value))

   // When input changes, emit embed URL
   watch(urlInfo, (info) => {
     if (info.isValid && info.embedUrl) {
       emit('update:modelValue', info.embedUrl)
     }
   })

   // Sync from parent
   watch(() => props.modelValue, (val) => {
     if (val !== urlInfo.value.embedUrl) {
       inputUrl.value = val
     }
   })
   ```

3. อัปเดต `app/components/manage/DashboardForm.vue` (หรือสร้างใหม่ถ้ายังไม่มี):
   - เพิ่ม LookerUrlInput component ในฟอร์ม
   - Field mapping:
     - `lookerEmbedUrl` ← embed URL จาก LookerUrlInput
     - `lookerDashboardId` ← report ID จาก parseLookerUrl
   - Validation: ต้อง valid Looker URL ก่อน save ได้

   ```vue
   <LookerUrlInput
     v-model="form.lookerEmbedUrl"
     :show-preview="true"
     :preview-height="300"
   />
   ```

4. อัปเดต `app/pages/dashboard/view.vue`:
   - ปัจจุบัน: แสดง placeholder สำหรับ iframe
   - เปลี่ยนเป็น: แสดง iframe จริงจาก `dashboard.lookerEmbedUrl`
   - เพิ่ม loading state ขณะ iframe กำลังโหลด
   - เพิ่ม error state ถ้า URL ไม่ valid

   ```vue
   <template>
     <div class="looker-embed-container">
       <!-- Loading overlay -->
       <div v-if="iframeLoading" class="loading-overlay">
         <ProgressSpinner />
         <p>Loading dashboard...</p>
       </div>

       <!-- Actual iframe -->
       <iframe
         v-if="dashboard?.lookerEmbedUrl"
         :src="dashboard.lookerEmbedUrl"
         frameborder="0"
         allowfullscreen
         :style="{ width: '100%', height: '100%', border: 'none' }"
         @load="iframeLoading = false"
         @error="iframeError = true"
       />

       <!-- No URL state -->
       <div v-else class="no-url-placeholder">
         <i class="pi pi-chart-bar" style="font-size: 3rem; color: #ccc;" />
         <p>No Looker Studio URL configured for this dashboard.</p>
       </div>
     </div>
   </template>
   ```

5. อัปเดต `.data/dashboards.json`:
   - ตรวจสอบว่าทุก dashboard มี field `lookerEmbedUrl` (ถ้ายังไม่มีให้เพิ่ม)
   - ถ้ามี URL อยู่แล้ว → ตรวจสอบว่าเป็น embed URL format ที่ถูกต้อง
   - เพิ่ม `lookerDashboardId` field ถ้ายังไม่มี (extract จาก URL)

ระวัง:
- iframe sandbox: Looker Studio ต้องการ `allow-scripts allow-same-origin` — ตรวจสอบ CSP headers
- X-Frame-Options: Looker Studio embed URL ต้องใช้ /embed/ path ถึงจะ embed ได้
- View URL จะถูก block โดย X-Frame-Options → ต้องแปลงเป็น embed URL เสมอ
- Preview อาจไม่ทำงานใน localhost ถ้า Looker Studio ต้องการ domain whitelist
- อย่าเปลี่ยน Dashboard interface — ใช้ field ที่มีอยู่แล้ว (lookerEmbedUrl, lookerDashboardId)
```

---

## Step 2: Looker Studio API Service

**Branch:** `feat/looker-api-service`
**ต้องทำหลัง:** Step 1 (แต่ไม่จำเป็นต้องทำ — Manual URL ใช้งานได้แล้ว)

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/types/dashboard.ts (Dashboard interface)
- app/utils/lookerUrl.ts (URL parser จาก Step 1)
- server/utils/jsonDatabase.ts (database utility)
- nuxt.config.ts (runtime config)
- .env.example (environment variables)

เป้าหมาย: สร้าง Looker Studio API integration สำหรับดึง report list + metadata

### Background:
Google Looker Studio API ใช้สำหรับ:
- List reports ที่ user มีสิทธิ์เข้าถึง
- Get report metadata (title, owner, last modified)
- ไม่สามารถ embed หรือ get thumbnail ผ่าน API ได้โดยตรง

API Endpoint: https://lookerstudio.googleapis.com/v1/assets:search
Authentication: OAuth 2.0 (Service Account หรือ User Credentials)
Docs: https://developers.google.com/looker-studio/api/reference/rest

### สิ่งที่ต้องทำ:

1. เพิ่ม dependencies:
   ```bash
   npm install googleapis
   ```

2. เพิ่ม environment variables ใน `.env.example` และ `.env`:
   ```
   # Looker Studio API (Optional — ถ้าไม่ตั้ง จะใช้ Manual URL mode)
   GOOGLE_SERVICE_ACCOUNT_EMAIL=streamhub@project.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   # หรือใช้ path to JSON key file:
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   ```

3. อัปเดต `nuxt.config.ts`:
   ```typescript
   runtimeConfig: {
     googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
     googleServiceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
     // ... existing config
   }
   ```

4. สร้าง `server/utils/lookerStudioApi.ts`:

   ```typescript
   import { google } from 'googleapis'

   let authClient: any = null

   /**
    * สร้าง Google Auth client สำหรับ Looker Studio API
    */
   async function getAuthClient() {
     if (authClient) return authClient

     const config = useRuntimeConfig()

     if (!config.googleServiceAccountKey && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       console.warn('⚠️ Google credentials not configured — Looker API disabled')
       return null
     }

     try {
       if (config.googleServiceAccountKey) {
         // Use inline key from env
         const key = JSON.parse(config.googleServiceAccountKey)
         authClient = new google.auth.GoogleAuth({
           credentials: key,
           scopes: ['https://www.googleapis.com/auth/datastudio.readonly']
         })
       } else {
         // Use GOOGLE_APPLICATION_CREDENTIALS file
         authClient = new google.auth.GoogleAuth({
           scopes: ['https://www.googleapis.com/auth/datastudio.readonly']
         })
       }

       return authClient
     } catch (error) {
       console.error('❌ [LookerAPI] Auth setup failed:', error)
       return null
     }
   }

   export interface LookerReport {
     id: string             // Report ID
     title: string          // Report title
     owner: string          // Owner email
     lastModified: string   // Last modified date
     createTime: string     // Creation date
     embedUrl: string       // Generated embed URL
   }

   /**
    * Search Looker Studio reports
    * ดึง reports ทั้งหมดที่ service account มีสิทธิ์เข้าถึง
    */
   export async function searchLookerReports(
     query?: string
   ): Promise<LookerReport[]> {
     const auth = await getAuthClient()
     if (!auth) return []

     try {
       const client = await auth.getClient()
       const accessToken = await client.getAccessToken()

       // Looker Studio API endpoint
       const url = 'https://lookerstudio.googleapis.com/v1/assets:search'
       const params: any = {
         assetTypes: 'REPORT',
       }
       if (query) {
         params.title = query
       }

       const response = await $fetch(url, {
         headers: {
           Authorization: `Bearer ${accessToken.token}`,
         },
         query: params,
       })

       const assets = (response as any).assets || []

       return assets.map((asset: any) => ({
         id: asset.name?.split('/').pop() || '',
         title: asset.title || 'Untitled',
         owner: asset.owner || '',
         lastModified: asset.updateTime || '',
         createTime: asset.createTime || '',
         embedUrl: `https://lookerstudio.google.com/embed/reporting/${asset.name?.split('/').pop() || ''}`,
       }))
     } catch (error) {
       console.error('❌ [LookerAPI] Search failed:', error)
       return []
     }
   }

   /**
    * Get single report metadata
    */
   export async function getLookerReport(reportId: string): Promise<LookerReport | null> {
     const auth = await getAuthClient()
     if (!auth) return null

     try {
       const client = await auth.getClient()
       const accessToken = await client.getAccessToken()

       const url = `https://lookerstudio.googleapis.com/v1/assets/${reportId}`

       const response = await $fetch(url, {
         headers: {
           Authorization: `Bearer ${accessToken.token}`,
         },
       })

       const asset = response as any
       return {
         id: reportId,
         title: asset.title || 'Untitled',
         owner: asset.owner || '',
         lastModified: asset.updateTime || '',
         createTime: asset.createTime || '',
         embedUrl: `https://lookerstudio.google.com/embed/reporting/${reportId}`,
       }
     } catch (error) {
       console.error('❌ [LookerAPI] Get report failed:', error)
       return null
     }
   }

   /**
    * Check if Looker API is configured
    */
   export function isLookerApiEnabled(): boolean {
     const config = useRuntimeConfig()
     return !!(config.googleServiceAccountKey || process.env.GOOGLE_APPLICATION_CREDENTIALS)
   }
   ```

5. สร้าง API endpoints:

   **`server/api/looker/reports.get.ts`** — Search/list reports:
   ```typescript
   export default defineEventHandler(async (event) => {
     if (!isLookerApiEnabled()) {
       return { success: false, enabled: false, message: 'Looker API not configured' }
     }

     const query = getQuery(event)
     const searchQuery = query.q as string | undefined

     const reports = await searchLookerReports(searchQuery)

     return {
       success: true,
       enabled: true,
       data: reports,
       total: reports.length
     }
   })
   ```

   **`server/api/looker/reports/[id].get.ts`** — Get report metadata:
   ```typescript
   export default defineEventHandler(async (event) => {
     if (!isLookerApiEnabled()) {
       return { success: false, enabled: false, message: 'Looker API not configured' }
     }

     const reportId = getRouterParam(event, 'id')
     if (!reportId) {
       return sendBadRequest(event, 'Report ID required')
     }

     const report = await getLookerReport(reportId)
     if (!report) {
       return sendNotFound(event, 'Report not found')
     }

     return { success: true, data: report }
   })
   ```

   **`server/api/looker/status.get.ts`** — Check API status:
   ```typescript
   export default defineEventHandler(async () => {
     return {
       enabled: isLookerApiEnabled(),
       message: isLookerApiEnabled()
         ? 'Looker Studio API is configured and ready'
         : 'Looker Studio API is not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY in .env'
     }
   })
   ```

   **`server/api/looker/sync.post.ts`** — Sync reports → dashboards:
   ```typescript
   export default defineEventHandler(async (event) => {
     if (!isLookerApiEnabled()) {
       return { success: false, message: 'Looker API not configured' }
     }

     // Fetch all reports from Looker
     const reports = await searchLookerReports()

     // Read existing dashboards
     const dashboards = await readJSON('dashboards')

     // Find dashboards that have lookerDashboardId matching a report
     let synced = 0
     for (const dashboard of dashboards) {
       if (!dashboard.lookerDashboardId) continue

       const report = reports.find(r => r.id === dashboard.lookerDashboardId)
       if (report) {
         // Update metadata from Looker
         dashboard.lookerEmbedUrl = report.embedUrl
         // Optionally update name if different
         // dashboard.name = report.title
         dashboard.updatedAt = new Date().toISOString()
         synced++
       }
     }

     if (synced > 0) {
       await writeJSON('dashboards', dashboards)
     }

     return {
       success: true,
       totalReports: reports.length,
       syncedDashboards: synced
     }
   })
   ```

6. สร้าง `app/composables/useLookerApi.ts`:
   ```typescript
   import type { LookerReport } from '~/server/utils/lookerStudioApi'

   export function useLookerApi() {
     const enabled = ref(false)
     const reports = ref<LookerReport[]>([])
     const loading = ref(false)

     /** Check if Looker API is available */
     const checkStatus = async () => {
       const response = await $fetch<any>('/api/looker/status')
       enabled.value = response.enabled
       return response.enabled
     }

     /** Search reports */
     const searchReports = async (query?: string) => {
       loading.value = true
       try {
         const response = await $fetch<any>('/api/looker/reports', {
           query: query ? { q: query } : undefined
         })
         reports.value = response.data || []
         return reports.value
       } finally {
         loading.value = false
       }
     }

     /** Get single report */
     const getReport = async (reportId: string) => {
       const response = await $fetch<any>(`/api/looker/reports/${reportId}`)
       return response.data
     }

     /** Sync reports with dashboards */
     const syncReports = async () => {
       loading.value = true
       try {
         const response = await $fetch<any>('/api/looker/sync', { method: 'POST' })
         return response
       } finally {
         loading.value = false
       }
     }

     return {
       enabled: readonly(enabled),
       reports: readonly(reports),
       loading: readonly(loading),
       checkStatus,
       searchReports,
       getReport,
       syncReports
     }
   }
   ```

7. อัปเดต `app/components/features/LookerUrlInput.vue` (จาก Step 1):
   - เพิ่ม "Browse Reports" button (แสดงเฉพาะเมื่อ Looker API enabled)
   - กดแล้วเปิด dialog แสดง list ของ reports จาก API
   - เลือก report → auto-fill URL + report ID

   ```vue
   <!-- เพิ่มใน template -->
   <Button
     v-if="lookerApiEnabled"
     label="Browse Reports"
     icon="pi pi-search"
     severity="secondary"
     size="small"
     @click="showReportBrowser = true"
   />

   <!-- Report Browser Dialog -->
   <Dialog v-model:visible="showReportBrowser" header="Select Looker Report" :style="{ width: '700px' }">
     <InputText v-model="reportSearch" placeholder="Search reports..." class="w-full mb-3" />
     <DataTable :value="filteredReports" :loading="loadingReports" selectionMode="single" @row-select="selectReport">
       <Column field="title" header="Title" />
       <Column field="owner" header="Owner" />
       <Column field="lastModified" header="Last Modified" />
     </DataTable>
   </Dialog>
   ```

ระวัง:
- Google Service Account ต้องมีสิทธิ์ Looker Studio Viewer ถึงจะดึง reports ได้
- Reports ที่ share กับ service account เท่านั้นจะแสดงผล
- API quota: Looker Studio API มี rate limit → ควร cache ผลลัพธ์
- googleapis package ค่อนข้างใหญ่ → import เฉพาะ module ที่ใช้
- ถ้า credentials ไม่ถูกต้อง → API จะ return error → handle gracefully
- Looker Studio API อาจเปลี่ยน endpoint ได้ → ตรวจสอบ docs ล่าสุด
```

---

## Step 3: Dashboard Preview Widget

**Branch:** `feat/dashboard-preview-widget`
**ต้องทำหลัง:** Step 1

### Prompt

```
อ่านไฟล์ต่อไปนี้ก่อน:
- app/types/dashboard.ts (Dashboard interface)
- app/utils/lookerUrl.ts (URL parser จาก Step 1)
- app/components/features/LookerUrlInput.vue (URL input จาก Step 1)
- app/pages/dashboard/discover.vue (discover page — DashboardCard)
- app/components/dashboard/DashboardCard.vue (dashboard card component — ถ้ามี)

เป้าหมาย: สร้าง Dashboard preview/thumbnail สำหรับแสดงใน card view

### สิ่งที่ต้องทำ:

1. สร้าง `app/components/features/DashboardPreview.vue`:

   **Component props:**
   ```typescript
   interface Props {
     embedUrl?: string          // Looker embed URL
     thumbnailUrl?: string      // Pre-generated thumbnail URL (ถ้ามี)
     title?: string             // Dashboard title (for alt text)
     mode?: 'thumbnail' | 'modal' | 'inline'  // display mode
     width?: string | number    // width (default: '100%')
     height?: string | number   // height (default: 200 for thumbnail, 600 for modal)
   }
   ```

   **3 display modes:**

   **thumbnail mode (default):** สำหรับ DashboardCard
   ```
   ┌────────────────────────┐
   │  ┌──────────────────┐  │
   │  │   📊             │  │  ← placeholder/thumbnail image
   │  │   Dashboard      │  │
   │  │   Preview        │  │
   │  └──────────────────┘  │
   │  [🔍 Quick View]       │  ← hover: แสดง quick view button
   └────────────────────────┘
   ```
   - แสดง thumbnail image หรือ gradient placeholder
   - Hover: แสดง overlay + "Quick View" button
   - Click "Quick View" → เปิด modal mode

   **modal mode:** Quick view dialog
   ```
   ┌─────────────── Quick View ─────────────────┐
   │ Dashboard Title                    [✕]     │
   │ ┌─────────────────────────────────────────┐│
   │ │                                         ││
   │ │         (iframe — live preview)         ││
   │ │                                         ││
   │ └─────────────────────────────────────────┘│
   │                        [Open Full View →]  │
   └────────────────────────────────────────────┘
   ```
   - Dialog/overlay ขนาดใหญ่
   - แสดง iframe ของ Looker dashboard จริง
   - ปุ่ม "Open Full View" → navigate ไป /dashboard/view?id=xxx

   **inline mode:** สำหรับ embed ในหน้า
   - แสดง iframe โดยตรง (ไม่มี modal)
   - ใช้ใน dashboard view page

   **Implementation:**
   ```typescript
   const showModal = ref(false)
   const iframeLoaded = ref(false)

   // Generate placeholder gradient based on title
   const placeholderGradient = computed(() => {
     if (!props.title) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
     // Simple hash to generate consistent colors
     let hash = 0
     for (let i = 0; i < props.title.length; i++) {
       hash = props.title.charCodeAt(i) + ((hash << 5) - hash)
     }
     const hue = Math.abs(hash % 360)
     return `linear-gradient(135deg, hsl(${hue}, 70%, 60%) 0%, hsl(${(hue + 60) % 360}, 70%, 40%) 100%)`
   })
   ```

2. อัปเดต `app/components/dashboard/DashboardCard.vue` (หรือ DashboardGrid ที่ใช้อยู่):
   - เพิ่ม DashboardPreview ใน card
   - แสดง thumbnail/placeholder ส่วนบนของ card
   - Hover → แสดง Quick View overlay

   ```vue
   <template>
     <div class="dashboard-card">
       <!-- Preview section -->
       <DashboardPreview
         :embed-url="dashboard.lookerEmbedUrl"
         :title="dashboard.name"
         mode="thumbnail"
         height="160"
       />

       <!-- Card content (existing) -->
       <div class="card-content">
         <h3>{{ dashboard.name }}</h3>
         <!-- ... existing content ... -->
       </div>
     </div>
   </template>
   ```

3. สร้าง server-side thumbnail generation (optional — สำหรับ performance):

   สร้าง `server/api/thumbnail/[dashboardId].get.ts`:
   - ใช้ placeholder SVG แทน actual screenshot (ไม่ต้อง puppeteer)
   - Generate SVG placeholder ตาม dashboard title + colors
   - Cache SVG ไว้ใน memory

   ```typescript
   export default defineEventHandler(async (event) => {
     const dashboardId = getRouterParam(event, 'dashboardId')

     // Find dashboard
     const dashboard = await findById('dashboards', dashboardId!)
     if (!dashboard) {
       return sendNotFound(event, 'Dashboard not found')
     }

     // Generate SVG placeholder
     const hue = hashString(dashboard.name) % 360
     const svg = `
       <svg width="400" height="225" xmlns="http://www.w3.org/2000/svg">
         <defs>
           <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" style="stop-color:hsl(${hue},70%,60%)" />
             <stop offset="100%" style="stop-color:hsl(${(hue+60)%360},70%,40%)" />
           </linearGradient>
         </defs>
         <rect width="400" height="225" fill="url(#bg)" rx="8"/>
         <text x="200" y="100" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif" opacity="0.9">
           ${escapeXml(dashboard.name)}
         </text>
         <text x="200" y="130" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif" opacity="0.6">
           Looker Studio Dashboard
         </text>
       </svg>
     `

     setResponseHeader(event, 'Content-Type', 'image/svg+xml')
     setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
     return svg
   })

   function hashString(str: string): number {
     let hash = 0
     for (let i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash)
     }
     return Math.abs(hash)
   }

   function escapeXml(str: string): string {
     return str.replace(/[<>&'"]/g, c => ({
       '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
     }[c] || c))
   }
   ```

4. เพิ่ม CSS transitions สำหรับ card hover effect:
   ```css
   .dashboard-card {
     transition: transform 0.2s, box-shadow 0.2s;
   }
   .dashboard-card:hover {
     transform: translateY(-2px);
     box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
   }
   .preview-overlay {
     opacity: 0;
     transition: opacity 0.2s;
   }
   .dashboard-card:hover .preview-overlay {
     opacity: 1;
   }
   ```

ระวัง:
- iframe preview ใน thumbnail mode จะหนักมาก (load ทุก card) → ใช้ placeholder + lazy load
- Quick View modal: load iframe เฉพาะตอนเปิด modal เท่านั้น
- SVG placeholder ใช้ text จาก dashboard name → ต้อง escape HTML entities
- Mobile: Quick View ควรเป็น full-screen modal
- Performance: ถ้ามี dashboards เยอะ (50+) → ใช้ Intersection Observer load preview เมื่อเห็น
- อย่าเปลี่ยน DashboardCard layout เดิมมากเกินไป — แค่เพิ่ม preview section ด้านบน
```

---

## Verification Checklist

หลัง implement ครบทุก step ให้ทดสอบ:

### Step 1 — Manual URL ✅
1. **URL Input**
   - [x] Paste Looker view URL → auto-convert เป็น embed URL
   - [x] Paste embed URL → ใช้ได้เลย
   - [x] Paste URL ผิด format → แสดง error
   - [x] แสดง Report ID เมื่อ valid

2. **Preview**
   - [x] กด Preview → แสดง iframe ของ Looker dashboard
   - [x] Dashboard view page แสดง iframe จริง (ไม่ใช่ placeholder)

### Step 2 — Looker API ✅
3. **API Integration**
   - [x] `/api/looker/status` → แสดง enabled/disabled
   - [x] `/api/looker/reports` → list reports จาก Looker
   - [x] Browse Reports dialog → เลือก report → auto-fill URL
   - [x] Sync → อัปเดต dashboard metadata จาก Looker

### Step 3 — Preview Widget ✅
4. **Thumbnails**
   - [x] Dashboard cards แสดง gradient placeholder
   - [x] Hover → แสดง Quick View overlay
   - [x] Click Quick View → เปิด modal กับ live iframe
   - [x] Modal มีปุ่ม "Open Full View" → navigate ไปหน้า view
