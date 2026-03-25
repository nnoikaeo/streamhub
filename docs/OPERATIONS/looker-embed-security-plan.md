# Looker Embed Security Hardening Plan

**Branch:** TBD  
**Base:** `develop`  
**Created:** 2026-03-25  
**Status:** Planned (ยังไม่เริ่ม)

---

## สรุปปัญหา

เมื่อเปิด DevTools ในหน้าแดชบอร์ดจะเห็น Looker Studio embed URL ได้ทันที:

- **Elements tab** → `<iframe src="https://lookerstudio.google.com/embed/...">`
- **Network tab** → request ไปยัง `lookerstudio.google.com`
- **API response** → `/api/mock/dashboards` ส่ง `lookerEmbedUrl` กลับมาด้วย

เนื่องจากแดชบอร์ดตั้งเป็น **Public** ใน Looker Studio → ใครก็ตามที่ได้ URL ไปสามารถเปิดดูได้โดยตรง **โดยไม่ต้องผ่าน StreamHub**

### ช่องโหว่เพิ่มเติมที่พบจาก Audit

1. **API ไม่มี Authentication** — `/api/mock/dashboards`, `/api/looker/reports` เรียกได้โดยไม่ต้องล็อกอิน
2. **ถ้าไม่ส่ง `uid` parameter** → `dashboards.get.ts` คืนแดชบอร์ดทั้งหมด (URL enumeration)
3. **Permission check เป็น client-side เท่านั้น** — server ไม่ตรวจสิทธิ์ก่อนส่ง URL
4. **`getDashboard(id)`** คืนแดชบอร์ด (พร้อม embed URL) โดยไม่ตรวจสิทธิ์
5. **ไม่มี Content Security Policy (CSP) headers**
6. **ไม่มี server-side Firebase token verification** บน API routes

---

## แนวทาง: Defense-in-Depth (เรียงตามความเร่งด่วน)

### P0 — ต้องทำ (Critical)

---

### 1. Server Auth Middleware (ปิดรูรั่วใหญ่ที่สุด)

**Effort:** 1-2 วัน

**แนวคิด:** เพิ่ม Firebase ID Token verification ให้ทุก API endpoint — ปัจจุบัน `/api/mock/*` และ `/api/looker/*` ไม่มี auth เลย

**สิ่งที่ต้องทำ:**
- สร้าง `server/middleware/auth.ts` — verify Firebase ID token จาก `Authorization: Bearer <token>` header
- Apply กับทุก `/api/mock/*` และ `/api/looker/*` routes
- Client ส่ง `Authorization` header พร้อม Firebase token ทุก API call

**ไฟล์ที่เกี่ยวข้อง:**
- `server/middleware/auth.ts` (สร้างใหม่)
- `server/utils/firebaseAdmin.ts` (สร้างใหม่)
- `app/composables/useAuth.ts` — เพิ่ม token getter
- `app/composables/useDashboardService.ts` — เพิ่ม auth header

| ข้อดี | ข้อเสีย |
|-------|---------|
| ปิดกั้นการเข้าถึง API จากภายนอกทั้งหมด | ต้องใช้ Firebase Admin SDK ฝั่ง server |
| ป้องกันการ enumerate แดชบอร์ดโดยคนนอก | ต้องจัดการ token refresh |
| มาตรฐานอุตสาหกรรม | ไม่แก้ปัญหา URL ใน DevTools สำหรับคนที่ล็อกอินแล้ว |

---

### 2. ซ่อน Embed URL จาก API Response (Quick Win)

**Effort:** ครึ่งวัน

**แนวคิด:** ไม่คืน `lookerEmbedUrl` ใน API response ของรายการแดชบอร์ด แยกเป็น endpoint เฉพาะที่ต้อง authenticate ก่อนถึงจะได้ URL

**สิ่งที่ต้องทำ:**
- แก้ `server/api/mock/dashboards.get.ts` — ตัด `lookerEmbedUrl` ออกจาก response
- สร้าง `server/api/mock/dashboards/[id]/embed-url.get.ts` — ต้อง Firebase token + permission check ถึงจะคืน URL
- แก้ client ให้ fetch embed URL แยกเฉพาะตอนจะดู

**ไฟล์ที่เกี่ยวข้อง:**
- `server/api/mock/dashboards.get.ts`
- `server/api/mock/dashboards/[id]/embed-url.get.ts` (สร้างใหม่)
- `app/pages/dashboard/view/[id].vue`

| ข้อดี | ข้อเสีย |
|-------|---------|
| ง่ายมาก ทำเร็ว | URL ยังอยู่ใน iframe src เมื่อดูแดชบอร์ด |
| ป้องกันการ enumerate URL ทั้งหมดในครั้งเดียว | ป้องกันได้เฉพาะ listing ไม่ใช่ viewing |
| รวมกับวิธีอื่นได้ดี | |

---

### P1 — ควรทำ (Important)

---

### 3. Content Security Policy + Security Headers

**Effort:** ครึ่งวัน

**แนวคิด:** เพิ่ม HTTP security headers เพื่อป้องกัน clickjacking, referrer leakage, และจำกัด resource origins

**สิ่งที่ต้องทำ:**
- เพิ่ม CSP header: `frame-src https://lookerstudio.google.com https://datastudio.google.com`
- เพิ่ม `frame-ancestors 'self'` — ป้องกัน StreamHub ถูก embed ในเว็บอื่น
- เพิ่ม `Referrer-Policy: strict-origin`
- เพิ่ม `X-Frame-Options: SAMEORIGIN`
- เพิ่ม `referrerpolicy="no-referrer"` ใน Looker iframe

**ไฟล์ที่เกี่ยวข้อง:**
- `nuxt.config.ts` — เพิ่ม security headers
- `app/pages/dashboard/view/[id].vue` — เพิ่ม referrerpolicy ใน iframe

| ข้อดี | ข้อเสีย |
|-------|---------|
| ง่ายมาก (config เท่านั้น) | ไม่ป้องกันการดู URL ใน DevTools |
| ป้องกัน clickjacking | เป็น defense-in-depth ไม่ใช่ primary protection |
| ลด referrer leakage | |
| ไม่มี performance impact | |

---

### 4. Server-Side URL Proxy (Impact สูงสุด)

**Effort:** 2-3 วัน

**แนวคิด:** ไม่ส่ง Looker URL จริงไปที่ client เลย สร้าง one-time token (TTL 30 วินาที) → iframe โหลดจาก `/api/embed/{token}` → server ตรวจสิทธิ์แล้ว 302 redirect ไป Looker

**สิ่งที่ต้องทำ:**
- สร้าง `server/api/embed/request.post.ts` — รับ dashboardId + Firebase token → ตรวจสิทธิ์ → สร้าง one-time token
- สร้าง `server/api/embed/[token].get.ts` — ตรวจ token validity → 302 redirect ไป Looker URL จริง
- สร้าง `server/utils/embedTokenStore.ts` — in-memory token store พร้อม TTL cleanup
- แก้ `app/pages/dashboard/view/[id].vue` — iframe src ใช้ proxy URL แทน Looker URL ตรง

**ไฟล์ที่เกี่ยวข้อง:**
- `server/api/embed/request.post.ts` (สร้างใหม่)
- `server/api/embed/[token].get.ts` (สร้างใหม่)
- `server/utils/embedTokenStore.ts` (สร้างใหม่)
- `server/utils/firebaseAdmin.ts` (สร้างใหม่ หรือแชร์กับข้อ 1)
- `app/pages/dashboard/view/[id].vue`
- `app/composables/useDashboardService.ts`

| ข้อดี | ข้อเสีย |
|-------|---------|
| URL ไม่ปรากฏใน DOM หรือ JavaScript | iframe redirect ยังเห็น URL ปลายทางใน Network tab ได้ |
| Server บังคับตรวจสิทธิ์ทุกครั้ง | เพิ่ม complexity ของ server (token storage, TTL) |
| Token หมดอายุเร็ว ใช้ซ้ำไม่ได้ | เพิ่ม latency ~100-200ms |
| ใช้กับ Looker Studio Free ได้ | ต้องมี cleanup mechanism สำหรับ expired tokens |

---

### P2 — น่าทำ (Nice to Have)

---

### 5. Audit Logging (ตรวจจับ + ยับยั้ง)

**Effort:** 1-2 วัน

**แนวคิด:** บันทึกทุกครั้งที่มีคนดูแดชบอร์ด (userId, dashboardId, timestamp, IP, userAgent) → ตรวจพบ anomaly → แจ้ง admin

**สิ่งที่ต้องทำ:**
- สร้าง `server/api/audit/log.post.ts` — บันทึก dashboard view events
- เพิ่ม Firestore collection `audit_logs`
- แก้ client ให้ส่ง audit event เมื่อโหลดแดชบอร์ด
- (Optional) สร้างหน้า admin สำหรับดู access logs

**ไฟล์ที่เกี่ยวข้อง:**
- `server/api/audit/log.post.ts` (สร้างใหม่)
- `app/pages/dashboard/view/[id].vue` — ส่ง audit event on load
- `app/pages/admin/audit.vue` (สร้างใหม่, optional)

| ข้อดี | ข้อเสีย |
|-------|---------|
| ยับยั้งการใช้งานผิด (คนรู้ว่ามี log) | เป็น reactive ไม่ใช่ preventive |
| ใช้สืบสวนได้เมื่อเกิดเหตุ | ต้องมีคนมอนิเตอร์ |
| ไม่เพิ่มความยุ่งยากให้ผู้ใช้ | เพิ่ม storage/processing cost |
| มีประโยชน์ด้าน compliance | |

---

### 6. Watermark Overlay (ยับยั้งการ Screenshot)

**Effort:** ครึ่งวัน

**แนวคิด:** แสดงอีเมลผู้ใช้แบบ semi-transparent ทับบน iframe (pointer-events: none) → ถ้ามี screenshot ไปแชร์ สามารถติดตามต้นทางได้

**สิ่งที่ต้องทำ:**
- เพิ่ม CSS overlay div ทับบน iframe แสดงอีเมลผู้ใช้
- ใช้ `pointer-events: none` เพื่อให้ iframe ยังใช้งานได้
- (Optional) เปลี่ยนตำแหน่ง watermark เป็นระยะ เพื่อป้องกันการ crop

**ไฟล์ที่เกี่ยวข้อง:**
- `app/pages/dashboard/view/[id].vue` — เพิ่ม watermark overlay div

| ข้อดี | ข้อเสีย |
|-------|---------|
| ยับยั้งทางจิตวิทยาได้ดี | ลบได้ผ่าน DevTools (CSS overlay) |
| ติดตามได้ถ้ามีการ screenshot | ไม่ป้องกันการแชร์ URL |
| ไม่ต้องแก้ backend | อาจกระทบ UX เล็กน้อย |
| ทำง่ายมาก | |

---

## สรุป Effort ทั้งหมด

| # | วิธี | Priority | Effort | Impact |
|---|------|----------|--------|--------|
| 1 | Server Auth Middleware | P0 | 1-2 วัน | สูง — ปิด API จากภายนอก |
| 2 | ซ่อน URL จาก API | P0 | ครึ่งวัน | กลาง — ป้องกัน enumeration |
| 3 | CSP + Security Headers | P1 | ครึ่งวัน | ต่ำ-กลาง — defense-in-depth |
| 4 | Server URL Proxy | P1 | 2-3 วัน | สูง — ซ่อน URL จาก DOM |
| 5 | Audit Logging | P2 | 1-2 วัน | กลาง — detection + deterrence |
| 6 | Watermark Overlay | P2 | ครึ่งวัน | ต่ำ — screenshot deterrence |

**รวม Effort ทั้งหมด:** ~5.5-8.5 วัน (ถ้าทำทุกข้อ)

---

## ข้อจำกัดที่ต้องยอมรับ

> **Looker Studio Free + Public dashboards → ไม่มีวิธีใดป้องกันได้ 100%**

Browser ต้องโหลด iframe จาก `lookerstudio.google.com` อยู่ดี — ผู้ใช้ที่มีความรู้ทาง technical สามารถเห็น URL ใน Network tab ได้เสมอ

วิธีที่จะล็อกได้สมบูรณ์:
- **Looker Studio Pro** — มี embedded SSO ที่ Google ตรวจสอบตัวตนก่อนแสดงผล
- **ตั้งแดชบอร์ดเป็น Private** — แต่ต้องจัดการสิทธิ์ซ้ำซ้อนทั้ง Looker Studio และ StreamHub
- **ใช้ Looker ตัวเต็ม** — มี signed embed URL พร้อม user-level auth

**เป้าหมาย:** ทำให้ยากพอที่คนทั่วไปเข้าไม่ได้ + ตรวจจับได้ถ้ามีการเข้าถึงผิดปกติ

---

## Verification Checklist

- [ ] **API auth:** เรียก `/api/mock/dashboards` โดยไม่มี token → ต้องได้ 401
- [ ] **URL stripping:** ตรวจ response ของ `/api/mock/dashboards` → ต้องไม่มี `lookerEmbedUrl`
- [ ] **CSP headers:** ตรวจ response headers ใน DevTools → ต้องมี CSP ที่กำหนด
- [ ] **Proxy:** ดูแดชบอร์ด → iframe src ต้องขึ้นต้นด้วย `/api/embed/` ไม่ใช่ `lookerstudio.google.com`
- [ ] **Audit:** ดูแดชบอร์ด → ต้องมี record ใหม่ใน `audit_logs`
- [ ] **Watermark:** ดูแดชบอร์ด → ต้องเห็น overlay แสดงอีเมลผู้ใช้
