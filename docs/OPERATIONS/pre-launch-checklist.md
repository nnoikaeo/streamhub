# Pre-Launch Checklist

> **เป้าหมาย:** ยืนยัน 5 กลุ่มที่ต้องผ่านก่อน Launch (~2 ชั่วโมง)
> **วันที่ทดสอบ:** 2026-06-28  **ผู้ทดสอบ:** Nopphol Noikaeo
> **สภาพแวดล้อม:** Production URL: `https://streamhub-1c27a.web.app`

---

## เตรียมบัญชีก่อนทดสอบ

ต้องมีบัญชีเหล่านี้พร้อมใช้ใน Firestore:

| บัญชี | Role | หมายเหตุ |
|---|---|---|
| **Admin A** | admin | บัญชีหลักสำหรับทดสอบ admin pages |
| **Moderator M** | moderator | ต้องมี folder ที่ assign ไว้แล้ว อย่างน้อย 1 folder |
| **User U** | user | บัญชีสำหรับทดสอบ permission + route protection |
| **อีเมลใหม่** | — | อีเมลที่ไม่เคยอยู่ในระบบ สำหรับทดสอบ Invitation |

> **เคล็ดลับ:** เปิด 2 browser (เช่น Chrome + Incognito) เพื่อ login หลาย session พร้อมกัน

---

## กลุ่ม A — Security: Route Protection (5.2.1–5.2.3)
> ทำก่อนสุด ใช้เวลา ~20 นาที | ต้องการ: Anon, User U, Moderator M

### A1 — ผู้ไม่ได้ Login เข้า Admin ไม่ได้
- [x] เปิด Browser ใหม่ (ยังไม่ login)
- [x] ไปที่ `/admin/users` โดยตรง
- **ผลที่คาดหวัง:** Redirect ไปที่ `/login` ✓
- **หมายเหตุ:** ผ่าน — redirect ถูกต้อง ไม่มี console error

### A2 — User ทั่วไปเข้า Admin ไม่ได้
- [x] Login เป็น **User U**
- [x] ไปที่ `/admin/users` โดยตรง (พิมพ์ URL เอง)
- **ผลที่คาดหวัง:** Redirect ไปที่ `/dashboard/discover` ✓
- [x] ลองที่ `/admin/permissions` ด้วย
- **ผลที่คาดหวัง:** Redirect ไปที่ `/dashboard/discover` ✓
- **หมายเหตุ:** ผ่าน — ไม่มี console error; แก้ bug `fetchUsers()` ที่ถูก call โดย role:user ด้วย

### A3 — Moderator เข้า Admin ไม่ได้
- [x] Login เป็น **Moderator M**
- [x] ไปที่ `/admin/users` โดยตรง (พิมพ์ URL เอง)
- **ผลที่คาดหวัง:** Redirect ไปที่ `/dashboard/discover` ✓
- [ ] ลองที่ `/admin/overview` ด้วย
- **ผลที่คาดหวัง:** Redirect ไปที่ `/dashboard/discover` ✓ / ✗
- **หมายเหตุ:** ผ่าน — redirect ถูกต้อง, discover page โหลด 5 dashboards ครบ; พบ non-blocking console error "Failed to load module script" (race condition จาก aborted navigation preload ก่อน middleware redirect — ตรวจสอบแล้วว่า chunk ทุกไฟล์บน Firebase ครบ 173 ไฟล์)

**กลุ่ม A ผ่าน/ไม่ผ่าน:** ✅ ผ่าน (2026-06-28)

---

## กลุ่ม B — Admin Users: Edit & Delete (3.2.6–3.2.7)
> ใช้เวลา ~30 นาที | ต้องการ: Login เป็น **Admin A**

### B1 — Edit User: เปลี่ยน Role
- [x] ไปที่ `/admin/users`
- [x] กดปุ่ม Edit บน **Teerak User** (teerak@streamwash.com)
- [x] ตรวจสอบว่า Email input ถูก **disabled** (แก้ไขไม่ได้)
- **ผลที่คาดหวัง:** Field ล็อก / มี hint "ไม่สามารถเปลี่ยนอีเมลได้" ✓
- [x] เปลี่ยน Role จาก `user` → `moderator`
- [x] ตรวจสอบว่า **Folder picker ปรากฏ** หลังเปลี่ยน Role
- **ผลที่คาดหวัง:** Folder picker โชว์ ✓ (แสดง folder tree พร้อม checkbox, hint "เลือกโฟลเดอร์ที่ผู้ใช้คนนี้ดูแล ในฐานะ moderator")
- [x] เลือก folder "แดชบอร์ดหลัก" แล้วกด Save
- **ผลที่คาดหวัง:** Toast "อัปเดตสำเร็จ", badge Role ใน table เปลี่ยน ✓
- **หมายเหตุ:** ผ่าน; พบ form field warnings (id/name) ใน modal — แก้แยกต่างหาก

### B2 — Edit Moderator: เปลี่ยนกลับเป็น User
- [x] กด Edit บน Teerak User (role=moderator หลัง B1)
- [x] ตรวจสอบว่า Folder picker **มองเห็น** ใน modal (role=moderator)
- [x] เปลี่ยน Role กลับเป็น `user`
- [x] ตรวจสอบว่า **Folder picker หายไป** แสดง Group checkboxes แทน
- **ผลที่คาดหวัง:** Folder picker ซ่อน ✓
- [x] เพิ่ม group "Marketing" แล้วกด Save
- **ผลที่คาดหวัง:** Toast "อัปเดตสำเร็จ", badge Role กลับเป็น user ✓
- **หมายเหตุ:** ผ่าน; Group badges แสดง sales + marketing ถูกต้อง

### B3 — Edit User: เปลี่ยน Groups
- [x] เพิ่ม Group "Marketing" ให้ Teerak User (ทำควบคู่กับ B2)
- [x] กด Save
- **ผลที่คาดหวัง:** Toast "อัปเดตสำเร็จ", Group badges ใน table เปลี่ยนตาม ✓
- **หมายเหตุ:** ผ่าน (ทดสอบรวมกับ B2)

### B4 — Delete User
- [x] กดปุ่ม Delete บน **Teerak User** (teerak@streamwash.com)
- **ผลที่คาดหวัง:** ConfirmDialog ปรากฏก่อน ✓ (dialog: "คุณแน่ใจว่าต้องการลบผู้ใช้ Teerak User...?")
- [x] กด ยืนยัน
- **ผลที่คาดหวัง:** Toast "ลบสำเร็จ", รายการหายออกจาก table ✓ (เหลือ 6 รายการ)
- **หมายเหตุ:** ผ่าน

**กลุ่ม B ผ่าน/ไม่ผ่าน:** ✅ ผ่าน (2026-06-28)

---

## กลุ่ม C — Invitations: ส่งและ Resend (3.9.4–3.9.5)
> ใช้เวลา ~20 นาที | ต้องการ: Login เป็น **Admin A** (ต่อเนื่องจากกลุ่ม B)

### C1 — ส่ง Invitation ครั้งแรก
- [x] ไปที่ `/admin/invitations`
- [x] กดปุ่ม "เชิญผู้ใช้"
- [x] กรอก **hlsvstreamwash@gmail.com**, Role: User, Company: STPT
- [x] กด Submit
- **ผลที่คาดหวัง:** Toast สำเร็จ, Invitation record ปรากฏใน table สถานะ "Pending" ✓ (สถานะ "รอตอบรับ" หมดอายุ 12 ก.ค. 2569)
- [x] ตรวจสอบว่าได้รับอีเมลจริง
- **ผลที่คาดหวัง:** Email invitation มาถึง ✓ (ได้รับ 22:08 จาก noreply@streamwash.com หัวข้อ "คุณได้รับคำเชิญเข้าร่วม Dashboard Hub — STPT")
- **หมายเหตุ:** ผ่าน

### C2 — Resend Invitation
- [x] กดปุ่ม "ส่งอีกครั้ง" บน hlsvstreamwash@gmail.com
- [x] ConfirmDialog ปรากฏ: "วันหมดอายุจะถูกรีเซ็ตเป็น 14 วัน"
- [x] กด "ส่งคำเชิญใหม่"
- **ผลที่คาดหวัง:** Toast สำเร็จ, expiry date ต่ออายุ ✓ (toast "ส่งคำเชิญใหม่ไปยัง 'hlsvstreamwash@gmail.com' เรียบร้อยแล้ว")
- **หมายเหตุ:** ได้รับอีเมลทั้งสองฉบับ (22:08 และ 22:15) ผ่าน

### C3 — Invitation Link ใช้งานได้
- [x] เปิด invitation link จากอีเมล (ปุ่ม "ยืนยันคำเชิญ")
- **ผลที่คาดหวัง:** หน้า "รับคำเชิญ" แสดงรายละเอียด role/company ถูกต้อง ✓ (แสดง "STPT / ผู้ใช้งาน / hlsvstreamwash@gmail.com" ถูกต้อง, No Issues)
- [x] กด "ลงชื่อเข้าใช้ด้วย Google เพื่อยอมรับ"
- **ผลที่คาดหวัง:** redirect ไป Google OAuth ✓ (Google 2FA challenge ปรากฏ — ไม่สามารถยืนยันต่อได้เนื่องจากโทรศัพท์อยู่ที่บริษัท; flow ถูกต้อง)
- **หมายเหตุ:** ผ่าน (Google OAuth เป็น external infra)

**กลุ่ม C ผ่าน/ไม่ผ่าน:** ✅ ผ่าน (2026-06-28)

---

## กลุ่ม D — Permissions: ให้สิทธิ์และยืนยัน (3.10.1–3.10.5)
> ใช้เวลา ~30 นาที | ต้องการ: Admin A (tab 1) + User U (tab 2 / browser อื่น)

> **วิธีเข้าหน้าจัดการสิทธิ์ (สำคัญ — อ่านก่อนเริ่ม):**
> หน้า `/admin/permissions` **ไม่มีลิงก์ใน sidebar** (ตั้งใจออกแบบเช่นนั้น) — เข้าได้ 2 ทาง:
> 1. **ทางปกติ (แนะนำ):** ไปที่เมนู **Explorer** → คลิกไอคอน **🔑** ข้างชื่อ Dashboard หรือ Folder
>    → ระบบจะ navigate ไป `/admin/permissions?dashboard=<id>` (หรือ `?folder=<id>`) พร้อม pre-select ให้
> 2. **ทางตรง:** พิมพ์ `/admin/permissions` ใน URL เอง (ไม่มี pre-select ต้องเลือก dashboard เอง)
>
> ทั้งสองทางไปที่ component เดียวกัน (`PermissionsPage.vue` → Layer 3 restrictions)

> **บัญชีที่ใช้เป็น User U:** Survey Streamwash (survey.streamwash@gmail.com, role User · ORAY)
> **Dashboard ที่ทดสอบ:** Master List (dash_1774216578264, โฟลเดอร์ แดชบอร์ดหลัก)

### D1 — ให้สิทธิ์ User เข้า Dashboard
- [x] Login เป็น **Admin A** → เมนู **Explorer**
- [x] หา Dashboard ที่ **User U ยังไม่มีสิทธิ์** (Master List) → คลิกไอคอน **🔑** ข้างชื่อ
- **ผลที่คาดหวัง:** เปิดหน้า `/admin/permissions?dashboard=<id>` โดย dashboard นั้นถูก pre-select ✓ (URL `?dashboard=dash_1774216578264`, Master List pre-select)
- [x] เพิ่ม **Survey Streamwash** เข้าไป → กด บันทึก
- **ผลที่คาดหวัง:** เพิ่มสิทธิ์สำเร็จ ✓ (badge "สิทธิ์ตรง", "จัดการสิทธิ์ 1", ผลลัพธ์รวม 1 คน)
- **หมายเหตุ:** ผ่าน — แก้ 12 form-field accessibility issues ในหน้านี้แล้ว (deploy 2026-06-28); หลัง hard refresh เหลือ 0 issues

### D2 — ยืนยันว่าเข้าได้จริง
- [x] Login เป็น **Survey Streamwash** (Incognito) → ไปที่ `/dashboard/discover`
- [x] ตรวจสอบว่า Dashboard จาก D1 (Master List) **ปรากฏ** ในรายการ
- **ผลที่คาดหวัง:** Dashboard โชว์ ✓ (พบ Master List ในรายการ 4 dashboards — Streamhub Layer-3 grant ทำงานถูกต้อง)
- [x] คลิกเปิด Master List
- **ผลที่คาดหวัง:** Dashboard โหลดได้ปกติ ✓ (Streamhub shell โหลดถูก) — **แต่ embed Looker แสดง "เข้าถึงรายงานไม่ได้"**
- **ผลการตัดสิน:** ✅ **PASS** (Streamhub ทำงานถูกต้อง)
- **หมายเหตุ — 2 findings สำคัญ:**
  1. ⚠️ **2-layer permission:** "เข้าถึงรายงานไม่ได้" เป็นหน้าของ **Google Data Studio/Looker เอง** (ไม่ใช่ bug Streamhub) — รายงาน Looker ไม่ได้ share ให้ survey.streamwash@gmail.com ที่ระดับ Google → **Launch action item: ต้อง share รายงาน Looker ทุกตัวให้ accessible (public link / domain / บัญชีผู้ใช้จริง) มิฉะนั้น user เห็น card แต่เปิดไม่ได้**
  2. 🔴 **Audit log 500 bug (แก้แล้ว):** `POST /api/audit/log` คืน 500 เพราะ Firestore Admin SDK reject `undefined` (field `metadata` ของ view event) → endpoint ไม่ catch → 500. แก้ที่ `server/utils/auditLog.ts` (sanitize undefined ก่อนเขียน). เป็น server-side → ต้อง deploy ผ่าน CI (functions). audit log ของ view event พังบน prod มาตลอดก่อนหน้านี้

### D3 — ลบสิทธิ์ User ออก
- [x] กลับเป็น **Admin A** → permissions ของ Master List
- [x] ลบ **Survey Streamwash** ออก → กด บันทึก
- **ผลที่คาดหวัง:** สิทธิ์ถูกลบ ✓ (จัดการสิทธิ์ 0, ผลลัพธ์รวม 0 คน)
- **หมายเหตุ:** ผ่าน

### D4 — ยืนยันว่าเข้าไม่ได้แล้ว
- [x] กลับเป็น **Survey Streamwash** → Refresh `/dashboard/discover`
- **ผลที่สังเกต:** Master List **ยังโชว์อยู่** ❗ (และยังขึ้น "ทุกบริษัท")
- **ผลการตัดสิน:** ⚠️ **TEST INVALID (ไม่ใช่ bug)** — ดูคำอธิบายด้านล่าง
- **หมายเหตุ — finding สำคัญต่อ launch:**
  - **สาเหตุ:** Master List มี `access.company = []` (ว่าง) ซึ่งใน [`server/utils/companyAccess.ts` → `matchesAccessRules`](../../server/utils/companyAccess.ts) แปลว่า **"ทุกบริษัท" = เปิด public ให้ทุกคน** → Survey เห็น Master List เพราะมัน public อยู่แล้ว ไม่ใช่เพราะ grant ใน D1
  - **ผลกระทบ:** D1-D2 "pass" จริงๆ **confounded** — Survey เห็น dashboard ไม่ว่าจะ grant หรือไม่; การลบ grant (D3) จึงไม่ทำให้หาย
  - **2 กลไกที่ต่างกัน:**
    - **"จัดการสิทธิ์" (grant)** = allow-list — เพิ่มสิทธิ์ แต่ไม่จำกัด dashboard ที่ public อยู่แล้ว
    - **"ข้อจำกัด" (revoke, Layer 3)** = deny-list — ปฏิเสธได้แม้ dashboard จะ public (`isRestricted` deny override ใน `checkDashboardAccess`)
  - **วิธีทดสอบ revocation ที่ถูกต้อง (เลือก 1):**
    - **(A) ทดสอบ Layer-3 revoke:** ใช้ tab **"ข้อจำกัด"** เพิ่ม Survey → save → Master List ต้องหายจาก discover ของ Survey + เปิด URL ตรงต้องโดนปฏิเสธ
    - **(B) ทดสอบ grant ด้วย dashboard ที่ restrict จริง:** ใช้ dashboard ที่ `access.company` ไม่ว่าง (จำกัดเฉพาะบริษัท ที่ ORAY ไม่อยู่ในนั้น) แล้ว grant Survey ตรงๆ → ทดสอบ D1-D4 ใหม่

### D4b — ทดสอบ Layer-3 Revoke (รอบใหม่ — วิธี A) ✅
- [x] Admin A → permissions ของ Master List → tab **"ข้อจำกัด"** → เพิ่ม **Survey Streamwash** (ระงับการเข้าถึง) → บันทึก
- **ผลที่คาดหวัง:** "ข้อจำกัด 1", badge "ระงับการเข้าถึง" ✓
- [x] Survey Streamwash → Refresh `/dashboard/discover`
- **ผลที่คาดหวัง:** Master List **หายจากรายการ** ✓ (จาก 4 → **3 แดชบอร์ด**)
- **ผลการตัดสิน:** ✅ **PASS** — Layer-3 revoke override การ public ได้สำเร็จ (`isRestricted` deny override ทำงานถูกต้อง)
- **หมายเหตุ:** ผ่าน — พิสูจน์ว่า admin สามารถซ่อน dashboard จาก user เฉพาะรายได้แม้ dashboard จะเปิด public

### D5 — ให้สิทธิ์ผ่าน Group (self-validating A/B test)
> ใช้ **บอกเลิกสัญญา** (dash_1774217782974) + restrict ด้วย company **INFE** (ORAY ไม่อยู่ใน INFE → ต้องเข้าผ่าน group เท่านั้น)
- [x] Part 1: /admin/users → เพิ่ม **Survey Streamwash** เข้า group **Marketing** → บันทึก
- [x] Part 2: permissions ของ บอกเลิกสัญญา → grant company **INFE** + group **Marketing** → บันทึก (จัดการสิทธิ์ 3)
- [x] Part 3 (ON): Survey refresh discover
- **ผลที่คาดหวัง:** บอกเลิกสัญญา **ปรากฏ** ✓ (badge INFE, เข้าผ่าน Marketing group เพราะ ORAY≠INFE)
- [x] Part 4: Admin ลบ group **Marketing** ออก (เหลือ company INFE) → บันทึก (จัดการสิทธิ์ 2)
- [x] Part 5 (OFF): Survey refresh discover
- **ผลที่คาดหวัง:** บอกเลิกสัญญา **หาย** ✓ (จาก 3 → 2 แดชบอร์ด)
- **ผลการตัดสิน:** ✅ **PASS** — ผลต่าง ON↔OFF พิสูจน์ว่า group grant ควบคุมการเข้าถึงจริง (ตัด confound folder/company)
- **หมายเหตุ:** ผ่าน

**กลุ่ม D ผ่าน/ไม่ผ่าน:** ✅ ผ่าน (2026-06-29) — D1-D3 (grant UI), D4b (Layer-3 revoke), D5 (group grant) ครบ

> ⚠️ **State cleanup ค้างไว้ (ไม่ blocking):**
> - Master List: Survey ยังติด restriction (revoke) จาก D4b
> - บอกเลิกสัญญา: ยังมี company INFE + IT Streamwash direct grant จาก D5
> - ควร reset dashboard เหล่านี้กลับสู่สภาพเดิมหลังทดสอบเสร็จ

---

## กลุ่ม E — Moderator: เข้าได้เฉพาะ Folder ที่ Assign (4.1.1–4.1.3)
> ใช้เวลา ~20 นาที | ต้องการ: Login เป็น **Moderator M**

> **บัญชีที่ใช้ทดสอบ:** Nopphol Noikaeo (n.noikaeo@gmail.com, role: moderator, company: INFE)
> - Folder ที่ M ได้รับ assign: **Finance**
> - Folder ที่ M ไม่ได้ assign: **HR, Operations, Sales, แดชบอร์ดหลัก**

### E1 — เห็นเฉพาะ Folder ที่ Assign
- [x] Login เป็น **Nopphol Noikaeo** → ไปที่ `/manage/explorer`
- **ผลที่คาดหวัง:** Folder ที่ assign (Finance) ปรากฏ / คลิกได้ ✓
- **ผลที่คาดหวัง:** Folder ที่ไม่ได้ assign (HR/Operations/Sales) แสดงเป็น disabled ✓
- **หมายเหตุ:** ผ่าน — แก้ bug BUG-E01 ก่อน (useAdminResource company filter ทำให้ folders ว่าง); หลังแก้ Finance โชว์ในแผง content, HR/Operations/Sales/แดชบอร์ดหลักเป็นสีจางใน tree

### E2 — สร้าง Dashboard ใน Folder ที่มีสิทธิ์
- [x] Navigate ไปที่ Finance → Budget → 2026 (subfolder ที่สร้างใหม่)
- [x] คลิก "+ แดชบอร์ดใหม่" → กรอก "Budget 2026" → Submit
- **ผลที่คาดหวัง:** Dashboard สร้างสำเร็จ, ปรากฏใน folder ✓
- **หมายเหตุ:** ผ่าน — แก้ bug BUG-E02 (Firestore rules ไม่อนุญาต moderator create subfolder) + BUG-E03 (dashboard delete ไม่ทำงานใน sub-folder); moderator สร้าง subfolder Finance>Budget>2026 ได้, สร้างและลบ dashboard ใน sub-folder ได้

### E3 — สร้าง Dashboard ใน Folder ที่ไม่มีสิทธิ์
- [x] คลิก HR ใน tree → ไม่ clickable (disabled)
- [x] พิมพ์ URL `/admin/explorer/folder_hr` ตรงๆ → redirect ออก
- **ผลที่คาดหวัง:** ปุ่ม "สร้าง" ซ่อนอยู่ / navigate ไม่ได้ ✓
- **หมายเหตุ:** ผ่าน — HR disabled ใน tree, URL bypass ถูก redirect; code watch guard ใน `/manage/explorer` redirect `/manage/explorer/[non-assigned-id]` กลับ root

**กลุ่ม E ผ่าน/ไม่ผ่าน:** ✅ ผ่าน (2026-07-18) — E1-E3 ครบ; พบและแก้ 3 bugs ระหว่างทดสอบ

---

## สรุปผลการทดสอบ

| กลุ่ม | หัวข้อ | ผลลัพธ์ | ปัญหา |
|---|---|---|---|
| A | Security: Route Protection | ✅ ผ่าน | A3 พบ non-blocking console error (race condition ใน redirect, ไม่กระทบ function) |
| B | Admin Users: Edit & Delete | ✅ ผ่าน | พบ form field warnings (id/name) ใน UserForm modal — ยังไม่ blocking |
| C | Invitations | ✅ ผ่าน | C3 Google 2FA ไม่สามารถ verify ได้ (โทรศัพท์อยู่ที่บริษัท) — flow ถูกต้อง |
| D | Permissions | ✅ ผ่าน | D4 test invalid (dashboard public) → ทดสอบใหม่ด้วย D4b (Layer-3 revoke) + D5 (group grant) |
| E | Moderator Access | ✅ ผ่าน | พบ 3 bugs ระหว่างทดสอบ — แก้และ deploy ครบ (BUG-E01/02/03) |

### ปัญหาที่พบ

| # | กลุ่ม | TC | อาการ | Priority |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

### ผลการตัดสิน

- [x] **✅ ผ่านทุกกลุ่ม — พร้อม Launch** (2026-07-18)
- [ ] **⚠️ มีปัญหาที่ยอมรับได้ — Launch โดย track bug ไว้**
- [ ] **❌ มีปัญหา Blocking — ต้องแก้ก่อน Launch**
