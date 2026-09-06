# แผน implement: ฝัง Google Sheets ด้วย iframe (ทางเลือก 1)

> **ตัดสินใจแล้ว 2026-09-06 — เลือกทางเลือก 1** หลังทดสอบครบใน [google-sheets-spike-plan.md](google-sheets-spike-plan.md)
>
> branch: แตกใหม่จาก `develop` เป็น `feat/sheets-embed` — งาน spike ทั้งหมด merge เข้า `develop` แล้ว
>
> **สถานะ 2026-09-06: P1–P5 เสร็จบน `feat/sheets-embed`** · ทดสอบด้วยมือบน Chrome และ **Safari (macOS)** ครบทุกเคสแล้ว: ชีตที่แชร์ลิงก์เปิดได้ทั้งสองเบราว์เซอร์ · แก้เซลล์ผ่านกรอบได้จริงในโหมด `interactive` · zoom เพิ่มทั้งแถวและคอลัมน์ · แถบเตือน WebKit ไม่ขึ้นกับ sheet · ตรวจการแชร์ได้ทั้ง 200 และ 401 · ชีตที่ยังไม่แชร์ถูกปฏิเสธตอนกดบันทึก
>
> **การทดสอบด้วยมือเจอบั๊ก 2 ตัวที่ lint/typecheck/เทสต์มองไม่เห็นเลย** — ทั้งคู่แก้แล้ว:
>
> - ปุ่มเลือกชนิดและปุ่มเลือกโหมดขึ้นสีเดียวกันทุกอัน แยกไม่ออกว่าเลือกอะไร · [main.css](../../assets/css/main.css) บังคับ `background` + `color` ให้ทุก `<button>` ที่ไม่ได้อยู่ในลิสต์ยกเว้น และชนะ scoped style เสมอ · segmented picker ใช้สองพร็อพเพอร์ตี้นั้นบอก selection พอดี ⇒ ตัวควบคุมไม่แสดง selection เลย
> - **ตรวจการแชร์รายงาน 401 ถูกต้อง แต่ฟอร์มยังบันทึกได้** ⇒ ได้แดชบอร์ดที่พังบน Safari จริง ๆ ตรงตามที่ endpoint ถูกสร้างมากัน · P3 ทำแค่ครึ่งเดียว การตรวจที่ไม่มีใครทำตามไม่ใช่ guard · ตอนนี้บล็อกการบันทึก และตรวจอัตโนมัติแบบ debounce แทนที่จะรอให้กดปุ่ม ([sheetSharingGuard.ts](../../app/utils/sheetSharingGuard.ts))
>
> สิ่งที่ต่างจากแผนตอนลงมือจริง 3 ข้อ — เขียนไว้เพราะแผนนี้ยังถูกอ่านต่อ:
>
> 1. `sheetUrl.ts` อยู่ที่ **`shared/utils/`** ไม่ใช่ `app/utils/` ตามที่เขียนไว้ใน P1 · เซิร์ฟเวอร์ต้อง parse URL เดียวกันเพื่อประกอบ probe ของ 2.4 และ `server/` ไม่มีที่ไหน runtime-import จาก `~/` เลย · สำเนา regex ตรวจ host ชุดที่สองคือทางที่การตรวจ host จะเพี้ยน
> 2. รายการฟิลด์ที่ต้องตัด (2.2) **ไม่ได้แก้ทีละจุด** แต่รวมไว้ที่ `EMBED_URL_FIELDS` ใน [embedUrl.ts](../../shared/utils/embedUrl.ts) แล้วให้ทั้ง 3 จุดเรียก `stripEmbedUrls` — ต้นเหตุของกับดักคือชื่อฟิลด์ถูกสะกดซ้ำหลายที่ ไม่ใช่จำนวนจุด
> 3. **มีจุดที่ 4 ที่แผนไม่ได้ระบุ** — [`[id]/embed-url.get.ts`](../../server/api/mock/dashboards/[id]/embed-url.get.ts) อ่าน `lookerEmbedUrl` ตรง ๆ · ไม่ใช่การรั่ว (ผ่าน access check) แต่จะคืน `null` ให้แดชบอร์ดชนิด sheet ทุกใบตลอดไป
>
> zoom (P3) แยกออกมาเป็น [embedZoom.ts](../../app/utils/embedZoom.ts) พร้อมเทสต์ เพราะหน้า `[id].vue` ไม่มี harness ทดสอบ component (ไม่มี `@vue/test-utils` และ environment เป็น `node`) การแยกจึงเป็นทางเดียวที่ทดสอบสูตรได้โดยไม่เพิ่ม dependency

## เริ่มงานจากศูนย์ต้องรู้อะไรบ้าง

สำหรับคนที่เปิดเอกสารนี้โดยไม่ได้อยู่ตอนทดสอบ

**ของที่มีอยู่แล้วใน repo**

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| [google-sheets-spike-plan.md](google-sheets-spike-plan.md) | ผลวัดทุกเคส — ที่มาของข้อบังคับสามข้อด้านล่าง อ่านก่อนถ้าจะเถียงข้อไหน |
| [scripts/spike-sheets-iframe.html](../../scripts/spike-sheets-iframe.html) | หน้า 5 กรอบสำหรับกดทดสอบบน Safari/iPhone — P5 ใช้ตัวนี้ · เปิดตรงด้วย `file://` ได้ ยกเว้นเทสต์ Storage Access ที่ต้อง `http://localhost` |
| [scripts/spike-sheets-read.mjs](../../scripts/spike-sheets-read.mjs) | อ่านชีตผ่าน service account (read-only) — ของทางเลือก 2 ที่ไม่ได้เลือก เก็บไว้เผื่อทบทวน |

**ชีตทดสอบบน Drive** (ดูตารางในเอกสาร spike): `SPIKE-E-link` แชร์ลิงก์แล้ว = เคสที่ต้องผ่าน · `SPIKE-D-large` ไม่ได้แชร์ลิงก์ + 3,300 แถว = เคสที่ต้องถูกปฏิเสธ และใช้วัดว่าตารางใหญ่แสดงไหวไหม

**เริ่มที่ P1** — งานแรกคือ `app/utils/sheetUrl.ts` กับเทสต์ของมัน ทำคู่กันได้เลย ไม่ต้องรอส่วนอื่น

## สิ่งที่ผลทดสอบบังคับไว้แล้ว

อ่านสามข้อนี้ก่อนแตะโค้ด — ทั้งหมดวัดมาแล้ว ไม่ใช่ข้อสันนิษฐาน

1. **ชีตต้องแชร์แบบ "ทุกคนที่มีลิงก์ (ผู้ดู)" เท่านั้น** · ชีตที่ผูกกับบัญชี (เจ้าของหรือระบุชื่อ) เปิดใน iframe บน Safari/iOS **ไม่ได้เลย** และปุ่ม "อนุญาตคุกกี้" ที่ Google ขึ้นมาให้ **กดแล้วตัน** (S1.3, S1.11)
2. **ลิงก์ที่แชร์แล้ว = ดาวน์โหลดข้อมูลดิบได้ทั้งใบ** — `export?format=csv` / `xlsx` / `pdf` / `gviz` ตอบ 200 ให้คนที่ไม่ล็อกอิน (S1.10) · ผนึก URL ด้วย embed token กันได้แค่ทางแอป ไม่ได้กันคนที่ได้ URL มาทางอื่น
3. **Google ไม่บล็อกการฝังที่ระดับ header** ไม่มีสวิตช์แบบ "Enable embedding" ของ Looker ให้ลืมกด (S1.1)

⚠️ **ข้อ 2 คือเงื่อนไขรับเข้า** — ชีตที่มีข้อมูลระดับเดียวกับ `Master List` (รายชื่อร้าน เลขสัญญา รายราย) ไม่ควรเข้าทางนี้ ต้องให้เจ้าของข้อมูลตัดสินเป็นราย ๆ ไม่ใช่ตัดสินตอน implement

## ขอบเขต

ทำ: ฝังชีตที่แชร์ลิงก์ ผ่านท่อ embed token เดิม · ไม่ทำ: ซิงก์สิทธิ์ Drive, เขียนกลับลงชีต, Google Docs/Slides

---

## P1 — ชนิดข้อมูลและการแปลง URL

| ที่ | ทำอะไร |
|---|---|
| [dashboard.ts:94](../../app/types/dashboard.ts#L94) | `type: 'looker'` เป็น `'looker' \| 'sheet'` |
| [dashboard.ts:99](../../app/types/dashboard.ts#L99) | เพิ่ม `sheetEmbedUrl?: string` และ `sheetEmbedMode?: 'view' \| 'interactive'` |
| `app/utils/sheetUrl.ts` (ใหม่) | คู่ขนานกับ [lookerUrl.ts](../../app/utils/lookerUrl.ts) |
| `tests/utils/sheetUrl.test.ts` (ใหม่) | เคสตามตารางด้านล่าง |

**เก็บ URL เต็ม ไม่ใช่ id** — URL ของชีตที่เผยแพร่ใช้ id คนละตัว (`/d/e/2PACX-…`) ประกอบเองจาก file id ไม่ได้ (วัดไว้ใน S1.6)

`parseSheetUrl` รับ 2 รูปแบบ แล้วคืน URL ที่จะฝัง:

| อินพุต | เอาต์พุต (`interactive`) | เอาต์พุต (`view`) |
|---|---|---|
| `…/spreadsheets/d/{id}/edit?…` | `…/d/{id}/edit?rm=minimal&widget=true&headers=false` | `…/d/{id}/preview` |
| `…/spreadsheets/d/e/2PACX-…/pubhtml` | `…/pubhtml?widget=true&headers=false` | เหมือนกัน |

`interactive` เป็นค่าเริ่มต้น — S1.7 ยืนยันว่าโหมดนี้คลิกเซลล์ได้จริงบน Safari · `view` (`/preview`) เป็นตารางแบนคลิกไม่ได้ ให้เลือกเมื่ออยากตัด UI ของ Google ออก

⚠️ `/edit` แปลว่าคนที่มีสิทธิ์แก้ไขบนชีตนั้น **แก้ได้จริงผ่านกรอบ** · ชีตที่แชร์ลิงก์เป็น "ผู้ดู" แก้ไม่ได้ แต่เจ้าของที่เปิดแดชบอร์ดเองจะแก้ได้ — ตั้งใจให้เป็นแบบนั้น ไม่ใช่ช่องโหว่ แต่ต้องเขียนไว้ให้ชัด

## P2 — ฝั่งเซิร์ฟเวอร์

### 2.1 เลือก URL ตามชนิด

[request.post.ts:77](../../server/api/embed/request.post.ts#L77) อ่าน `dashboard.lookerEmbedUrl` ตรง ๆ ⇒ เปลี่ยนเป็นเลือกตาม `dashboard.type` · ท่อที่เหลือ (ผนึก AES-256-GCM, คุกกี้ session, 302) **ไม่ต้องแตะเลย** — ไม่รู้จักโดเมนอยู่แล้ว

### 2.2 ⚠️ รายการฟิลด์ที่ต้องตัดออกจาก response

ตอนนี้โค้ดตัด `lookerEmbedUrl` ออกจาก listing ด้วยชื่อฟิลด์ตรง ๆ **3 จุด** ถ้าไม่เพิ่ม `sheetEmbedUrl` เข้าไปด้วย **URL ชีตจะรั่วออกทาง API listing** ซึ่งลบล้างเหตุผลทั้งหมดของการมี embed token

- [dashboards.get.ts:29](../../server/api/mock/dashboards.get.ts#L29) และ [:51](../../server/api/mock/dashboards.get.ts#L51)
- [[id].get.ts:42](../../server/api/mock/dashboards/[id].get.ts#L42)
- [[id].put.ts:27](../../server/api/mock/dashboards/[id].put.ts#L27) — `allowedFields` ต้องเพิ่ม `sheetEmbedUrl`, `sheetEmbedMode`, `type` ไม่งั้นบันทึกไม่ติด

เพิ่มเทสต์กันถอยหลังใน [dashboardsList.test.ts:100](../../tests/server/dashboardsList.test.ts#L100) ที่มีแบบเดียวกันของ Looker อยู่แล้ว

### 2.3 CSP — สองไฟล์ ไม่ใช่ไฟล์เดียว

- [securityHeaders.ts:33](../../server/middleware/securityHeaders.ts#L33) เพิ่ม `https://docs.google.com`
- [firebase.json:27](../../firebase.json#L27) มีสำเนาแบบ static สำหรับไฟล์ที่ Hosting เสิร์ฟเอง — ต้องแก้คู่กัน ไม่งั้นบางหน้ากรอบว่างโดยหาสาเหตุไม่เจอ

### 2.4 ตรวจการแชร์อัตโนมัติ (`POST /api/sheet/check-sharing`)

ชีตที่ยังไม่แชร์ลิงก์จะพังเฉพาะบน Safari ⇒ **ทดสอบบน Chrome แล้วผ่าน แล้วไปพังกับผู้ใช้จริง** เป็นกับดักที่เกิดแน่ถ้าไม่กัน

เซิร์ฟเวอร์ยิง `HEAD`/`GET` ไปที่ `…/export?format=csv` **โดยไม่แนบ credential ใด ๆ** แล้วดูสถานะ — 200 = แชร์ลิงก์แล้ว · 401 = ยังไม่แชร์ ⇒ เตือนตั้งแต่ตอนกรอกฟอร์ม (พฤติกรรมนี้วัดไว้แล้วใน S1.10: ก่อนแชร์ 401 หลังแชร์ 200 ทุก endpoint)

การตรวจนี้บอกด้วยว่า **ข้อมูลเปิดสาธารณะจริง** ⇒ ใช้เป็นข้อความยืนยันความเสี่ยงในฟอร์มไปในตัว

## P3 — ฝั่งหน้าจอ

| ที่ | ทำอะไร |
|---|---|
| `app/components/features/SheetUrlInput.vue` (ใหม่) | คู่ขนานกับ [LookerUrlInput.vue](../../app/components/features/LookerUrlInput.vue) — validate, preview, เลือกโหมด, เรียก check-sharing แล้วโชว์ผลพร้อมคำเตือนว่าข้อมูลจะเปิดสาธารณะ |
| [DashboardForm.vue:86](../../app/components/admin/forms/DashboardForm.vue#L86) | ตัวเลือกชนิด looker/sheet แล้วสลับ input ตามชนิด |
| [[id].vue:262](../../app/pages/dashboard/view/[id].vue#L262) | `title` ของ iframe ตามชนิด · watermark และ audit ใช้ของเดิมได้ทั้งหมด |
| [[id].vue:430](../../app/pages/dashboard/view/[id].vue#L430) | **zoom ต้องแยกทาง** — สูตรปัจจุบันสเกลแบบไม่สมมาตรเพราะรายงาน Looker ปรับตัวตามความกว้างกรอบ · ตารางชีตไม่ทำแบบนั้น ใช้สูตรเดิมแล้วภาพเพี้ยน ⇒ ชีตใช้ `transform: scale()` ตรง ๆ |
| [browser.ts](../../app/utils/browser.ts) | แถบเตือน WebKit **ไม่ต้องขึ้นกับแดชบอร์ดชนิด sheet** — ชีตที่ผ่านการตรวจ 2.4 แล้วเปิดได้บน Safari ปกติ · ขึ้นแถบทั้งที่ใช้งานได้จะสอนผู้ใช้ผิด |
| [DashboardCard.vue:13](../../app/components/features/DashboardCard.vue#L13) | ส่ง embed url ตามชนิด (ใช้ทำ thumbnail) |

## P4 — เอกสารและกฎ

- [looker-sharing-policy.md](looker-sharing-policy.md) เพิ่มหัวข้อ Sheets: ต้องแชร์ "ทุกคนที่มีลิงก์ (ผู้ดู)" · ห้ามใช้กับข้อมูลอ่อนไหวโดยไม่ผ่านเจ้าของข้อมูล · อธิบายว่าทำไมชีตต่างจาก Looker (ลิงก์หลุด = ได้ทั้งไฟล์ ไม่ใช่แค่รายงาน)
- `CLAUDE.md` เพิ่มกฎย่อในหัวข้อ Looker Embeds ให้ครอบ Sheets ด้วย
- [docs/README.md](../README.md) ลงดัชนีเอกสารนี้ (CI ตรวจ orphan)

## P5 — ตรวจก่อนส่ง

```bash
npx eslint .                                        # 0
npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json     # 0
npx vue-tsc --noEmit -p tests/tsconfig.json         # 0
npx vue-tsc --noEmit -p scripts/tsconfig.json       # 0
npm test                                            # 335 + เทสต์ใหม่
npm run docs:links && npm run docs:lint             # 0 ทั้งคู่
```

ทดสอบด้วยมือก่อนปิดงาน — **บน Safari ไม่ใช่แค่ Chrome**: ใบที่แชร์ลิงก์ต้องขึ้น · ใบที่ไม่ได้แชร์ต้องถูกฟอร์มปฏิเสธตั้งแต่ตอนบันทึก · ของทดสอบมีอยู่แล้วคือ `SPIKE-E-link` (แชร์ลิงก์) กับ `SPIKE-D-large` (ไม่ได้แชร์ลิงก์)

## เวลาที่ใช้จริง

หัวข้อในสรุปเทียบเขียนไว้ ~0.5 วัน ซึ่งเป็นเวลาของ **ท่อฝังอย่างเดียว** · รวมรายการตัดฟิลด์ (2.2), การตรวจการแชร์ (2.4), ฟอร์ม, zoom และเทสต์แล้วอยู่ที่ **~1.5–2 วัน** · ส่วนที่ตัดออกได้ถ้าต้องการของเร็วคือ 2.4 กับโหมด `view` แต่ 2.2 ตัดไม่ได้ เพราะเป็นการรั่วของ URL
