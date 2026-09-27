# Google Sheets ใน StreamHub — พฤติกรรมที่วัดได้จริง

เอกสารนี้คือ**ความจริงปัจจุบัน**ของการฝัง Google Sheets: ฝังแบบไหน ทำอะไรได้บนเบราว์เซอร์ไหน ต้องตั้งค่าอะไรไว้และห้ามถอด และบทเรียนจากการทดสอบ · ทุกข้อในนี้วัดจริงแล้ว ข้อที่ยังไม่ได้วัดอยู่ใน [§ ยังไม่รู้](#ยังไม่รู้)

- นโยบายว่าชีตแบบไหนเอาเข้าได้ (แชร์ลิงก์ ข้อมูลอ่อนไหว): [looker-sharing-policy.md § Google Sheets](../OPERATIONS/looker-sharing-policy.md)
- กฎสั้นที่ต้องรู้ก่อนแก้โค้ด: [CLAUDE.md § Google Sheets Embeds](../../CLAUDE.md#google-sheets-embeds)
- ที่มาและตัวเลขดิบทั้งหมด (ปิดงานแล้ว เก็บไว้เป็นประวัติ):
  - [google-sheets-spike-plan.md](../OPERATIONS/archive/google-sheets-spike-plan.md) — เทียบ 3 ทางเลือก (iframe / proxy ผ่าน service account / ซิงก์สิทธิ์ Drive) · ทำไมเลือก iframe · 2026-08-30 ถึง 09-06
  - [google-sheets-embed-plan.md](../OPERATIONS/archive/google-sheets-embed-plan.md) — แผนสร้าง P1–P5 (#472–#475)
  - [google-sheets-menubar-spike.md](../OPERATIONS/archive/google-sheets-menubar-spike.md) — เมนูบาร์ M0–M9 และผลหลัง deploy P1–P6 (#476–#478)

## โหมดฝัง

URL ที่ฝังถูกเก็บ**ทั้งเส้น**ใน `sheetEmbedUrl` — โหมดไม่ได้ถูกใช้ตอนแสดงผล ⇒ เปลี่ยนโหมดคือเปลี่ยน URL ที่เก็บ ([sheetUrl.ts](../../shared/utils/sheetUrl.ts))

| โหมด | URL ที่ฝัง | ได้อะไร |
|---|---|---|
| **`full`** (ค่าเริ่มต้นตั้งแต่ 2026-09-26) | `/d/{id}/edit` | UI เต็มของ Google: เมนูบาร์ ทูลบาร์ แถบสูตร แท็บ |
| `interactive` | `/d/{id}/edit?rm=minimal&widget=true&headers=false` | ตาราง + หัวคอลัมน์ + ตัวกรอง + แท็บ ไม่มีเมนู/ทูลบาร์/แถบสูตร |
| `view` | `/d/{id}/preview` | ตารางแบน คลิกไม่ได้ |
| URL ที่ publish | `/d/e/2PACX-…/pubhtml?widget=true&headers=false` | ไม่ขึ้นกับโหมด · **ข้อมูลสาธารณะเต็มรูป** อ่านด้วยเครื่องได้ (`pub?output=csv`) |

`rm` ไม่มีเอกสารรับรองจาก Google — ทุกค่าเสี่ยงเท่ากัน รวมถึง `rm=minimal`

## อะไรทำได้ที่ไหน

วัดบน prod 2026-09-27 หลัง #477 · "แก้ไขได้" = ตามสิทธิ์ของบัญชีบนชีตนั้น ไม่ใช่ทุกคน

| | โหมด `full` | โหมด `interactive` |
|---|---|---|
| **Chrome เดสก์ท็อป** | เมนูครบ แก้ไขได้ | เลือกเซลล์/แก้ไขได้ ไม่มีเมนู |
| **Safari เดสก์ท็อป** | เมนูครบ แก้ไขได้ — กรอบล็อกอินเองผ่าน passive sign-in (URL ได้ `pli=1`) | เหมือน Chrome |
| **iPhone** (ทุกเบราว์เซอร์) | **อ่านอย่างเดียว** — Google ส่งหน้าเวอร์ชันมือถือ: ตารางล้วน แท็บเป็นลิงก์ ไม่มีเมนู · ไม่ขึ้นกับโหมดหรือสิทธิ์ | เหมือนกัน |
| iPad / Android | ยังไม่ได้วัด | ยังไม่ได้วัด |

สิทธิ์บนชีตยังเป็นของ Google ล้วน:

- บัญชีที่เป็น**ผู้ดู** → ป้าย "ดูอย่างเดียว" · เมนู แทรก / รูปแบบ / ส่วนขยาย เทา · ใช้ได้แค่ ดู / ข้อมูล > ตัวกรอง
- **แท็บที่ถูกป้องกัน** (ไอคอนแม่กุญแจ) แก้ไม่ได้แม้บัญชีจะแก้แท็บอื่นได้ — ดูเหมือนบั๊กเบราว์เซอร์ แต่ไม่ใช่ (เคส "ทดลอง" 2026-09-27: แก้ไม่ได้เหมือนกันทั้ง Chrome และ Safari)

### ในกรอบ Google ปิดอะไรไว้เอง แม้เป็นเจ้าของ

ไฟล์ > เปิด / นำเข้า / **ทำสำเนา** / **แชร์** / อีเมล / ย้ายไปที่ถังขยะ · แทรก > รูปภาพ · ส่วนขยาย > ส่วนเสริม · **ไม่มี Apps Script** · เครื่องมือ เหลือ 4 รายการ

### ในกรอบเราปิดอะไรไว้ (ด้วย `sandbox`)

| คำสั่ง | ผล | เพราะ |
|---|---|---|
| ไฟล์ > ดาวน์โหลด | **ไม่มีไฟล์ออก ไม่มี error** | ไม่มี `allow-downloads` |
| ไฟล์ > พิมพ์ | หน้าตั้งค่าการพิมพ์ขึ้น กด "ถัดไป" แล้วหายไปเฉย ๆ | ไม่มี `allow-modals` |

ตั้งใจ — กันได้แค่ทางแอป · **export URL ตรง (`export?format=csv|xlsx|pdf`) ยังเปิดให้คนที่ไม่ล็อกอินเสมอ** ถ้าชีตแชร์ลิงก์ (spike S1.10)

## ค่าที่ต้องมี และห้ามถอด

| ค่า | อยู่ที่ | ถ้าถอด |
|---|---|---|
| `https://docs.google.com` ใน `frame-src` | [securityHeaders.ts](../../server/middleware/securityHeaders.ts) **และ** [firebase.json](../../firebase.json) | กรอบว่างทุกเบราว์เซอร์ |
| **`https://accounts.google.com` ใน `frame-src`** | สองที่เดียวกัน | **ชีตทุกตัวบน Safari/iPhone เป็นกรอบว่าง** มีแค่ error ใน console — Google พากรอบผ่าน `accounts.google.com/ServiceLogin?passive=…` ก่อนเปิดชีต และ CSP ตรวจทุกช่วงของ redirect · เป็นแบบนี้บน prod ตั้งแต่ #472 จนถึง #477 (BUG-036) · หน้าล็อกอินของ Google ส่ง `X-Frame-Options: DENY` อยู่แล้ว ⇒ อนุญาตโดเมนนี้ไม่ทำให้ฟอร์มล็อกอินมาอยู่ในกรอบ |
| กรอบของ sheet **ไม่มี** `allow-top-navigation-by-user-activation` | `embedSandbox` ใน [[id].vue](../../app/pages/dashboard/view/[id].vue) | ปุ่ม "เข้าสู่ระบบ" ของ Google ในกรอบจะพา**ทั้งแท็บ**ออกจาก StreamHub ไปชีตตรง — ไม่มีลายน้ำ URL จริงอยู่ที่แถบที่อยู่ · ตอนนี้เปิดแท็บใหม่แทน (ผ่าน `allow-popups`) · Looker ยังมี flag นี้ |
| `allow-popups` | sandbox ทุกกรอบ | ลิงก์ในเซลล์และเมนูความช่วยเหลือเปิดไม่ได้ |

## แถบเตือน

| แถบ | ขึ้นเมื่อ | ข้อความ |
|---|---|---|
| Looker | ทุกแดชบอร์ด Looker บน WebKit (`isSafariLike`) | Safari บล็อกคุกกี้ที่ Looker ใช้ยืนยันสิทธิ์ (BUG-032) |
| Sheet | ทุกแดชบอร์ดชีต **บนมือถือ** (`isPhone`) ทุกโหมด | บนมือถือ Google แสดงชีตแบบอ่านอย่างเดียว — แก้ไขได้บนคอมพิวเตอร์ |

ทั้งสองอยู่ใน [browser.ts](../../app/utils/browser.ts) · ปิดแล้วจำถาวรใน `localStorage` แยก key กัน · `isPhone` ไม่นับ iPad เพราะ iPadOS ขอหน้าเดสก์ท็อปเป็นค่าเริ่มต้น

## อ่าน console ให้ถูก

ตัวที่**สำคัญ**:

| ข้อความ | แปลว่า |
|---|---|
| `Refused to load https://accounts.google.com/ServiceLogin?…passive=… because it does not appear in the frame-src directive` | `accounts.google.com` หายจาก CSP — กรอบว่าง |
| `Refused to load https://docs.google.com/…` (frame-src) | `docs.google.com` หายจาก CSP |
| หน้า "อนุญาตให้ Google ชีต เข้าถึงคุกกี้ที่จำเป็น" ในกรอบ | ชีตยังไม่แชร์ลิงก์ — ดู [common-issues.md](../TROUBLESHOOTING/common-issues.md) |

ตัวที่**เป็นเสียงรบกวน** ไม่ต้องแก้:

| ข้อความ | ที่มา |
|---|---|
| `Refused to load …drivesharing/clientmodel` / `…contacts.google.com/widget/hovercard` / `…accounts.google.com/RotateCookiesPage` — `frame-ancestors` | CSP ของ Google เอง อนุญาตแค่ใต้ `docs.google.com` · กล่องแชร์และการ์ดรายชื่อใช้ไม่ได้ในกรอบ · หมุนคุกกี้ไม่ได้ ⇒ เปิดค้างนานมากอาจต้องโหลดหน้าใหม่ |
| `[blocked] … requested insecure content from filesystem:…/fonts/….woff` | Google ลองโหลดฟอนต์จาก cache ตัวเอง แล้วโหลดจากเน็ตแทน |
| `calcworker_j2cl_core.sourcemap` 404 | sourcemap ของ Google |
| `Fetch API cannot load https://firestore.googleapis.com/…/channel … due to access control checks` | Safari ตัด long-poll ของ Firestore ตอนออกจากหน้า/รีเฟรช · ต่อใหม่เอง · ไม่เกี่ยวกับชีต |

## วิธีทดสอบ — บทเรียน

1. **ทดสอบ Safari ของงานฝังบน prod เสมอ** — localhost ไม่เจอ passive sign-in ทั้งที่ CSP เหมือนกัน ⇒ spike บน localhost สรุปว่า "Safari อ่านอย่างเดียว" (ผิด) และไม่เห็นกรอบว่าง (มีจริงบน prod) · ทำไม localhost ต่าง ยังไม่รู้
2. **preview URL ของ PR ล็อกอินไม่ได้** — CSP ใน firebase.json อาศัย `'self'` ครอบ authDomain (`streamhub-1c27a.web.app`) ซึ่งบน `…--prNNN-….web.app` ไม่ใช่โดเมนเดียวกัน ⇒ preview ใช้ได้แค่หน้าที่ไม่ต้องล็อกอิน · ตรวจ header ของ preview ได้ด้วย `curl -sI`
3. **แยกเบราว์เซอร์กับสิทธิ์ก่อนสรุป** — แก้ไม่ได้บน Safari? ลองบัญชีเดียวกันบน Chrome ก่อน ถ้าแก้ไม่ได้เหมือนกันคือสิทธิ์บนชีต (P3)
4. **อ่านมุมขวาบนของกรอบ** — วงกลมชื่อบัญชี = กรอบรู้จักผู้ใช้ · ปุ่ม "เข้าสู่ระบบ" = นิรนาม · สัตว์การ์ตูน = ผู้ชมนิรนามคนอื่นที่เปิดอยู่ · กรอบสีของเซลล์ = เคอร์เซอร์ของคนอื่น ไม่ใช่ของเรา
5. **ลายน้ำอีเมลเป็นของ StreamHub** วางทับกรอบ ไม่ได้แปลว่า Google รู้จักผู้ใช้
6. curl จำลอง Safari ไม่ได้ — Google ตอบ 200 ให้ curl เสมอ แม้ Safari จะถูกพาไป `ServiceLogin`

## เครื่องมือ

| | ทำอะไร |
|---|---|
| [spike-sheets-iframe.html](../../scripts/spike-sheets-iframe.html) | หน้าทดสอบ**นอก**แอป ไม่มี CSP ไม่มี sandbox ของเรา — วัดพฤติกรรมของ Google ล้วน · เทียบกับในแอปเพื่อหาว่าตัวการอยู่ฝั่งไหน |
| `node scripts/migrate-sheet-full-mode.mjs [--apply]` | ย้ายแดชบอร์ด `interactive` เป็น `full` · รันแล้ว 2026-09-27 (3 ตัว) · รันซ้ำไม่มีผล |
| `POST /api/sheet/check-sharing` | ตรวจว่าชีตแชร์ลิงก์ไหม (200/401) · ฟอร์มเรียกเอง |
| ชีตทดสอบ `SPIKE-E-link` | `17tVllF92cAhn9ymGo9xIWqW84-vs4gtkaYie4CLb12g` · แชร์ลิงก์ผู้ดู · เจ้าของ `n.noikaeo@gmail.com` · เคยถูกทิ้งลงถังขยะครั้งหนึ่ง — เช็กก่อนใช้ |

## ยังไม่รู้

งานที่วางแผนไว้สำหรับข้อเหล่านี้อยู่ใน [roadmap.md § Phase 11](../OPERATIONS/roadmap.md#phase-11-sheets-follow-ups--planned)

- **iPad / Android** — คาดว่า iPad ได้หน้าเดสก์ท็อป (แก้ได้) และ Android ได้หน้ามือถือ (อ่านอย่างเดียว) ยังไม่ได้วัด · มี iPad ให้วัด · **ไม่มีเครื่อง Android**
- **M6** — ถ้าเจ้าของปิด "ผู้ดูดาวน์โหลด พิมพ์ คัดลอกได้" export URL ยังตอบ 200 ไหม · รอมติประชุม · จะสำคัญก็ต่อเมื่อคิดเปิด `allow-downloads`
- **ทำไม localhost ไม่ถูกพาไป passive sign-in**
- `rm=embedded` ได้ UI แบบไหน (M1 ถูกข้าม)
