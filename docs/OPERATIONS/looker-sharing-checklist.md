# เช็กลิสต์: เปิดรายงาน Looker ให้เปิดได้บน Safari

> สร้าง 2026-08-24 · ที่มา: [BUG-032](manual-test-plan.md) · พื้นหลังว่าทำไมต้องทำ: [common-issues.md](../TROUBLESHOOTING/common-issues.md)

## ทำไม

Looker ยืนยันสิทธิ์ผู้ดูด้วยคุกกี้ Google ซึ่งใน iframe เป็นคุกกี้บุคคลที่สาม · Safari (รวม Chrome/Firefox บน iOS) บล็อกทิ้ง ⇒ รายงานที่แชร์แบบ "เฉพาะบัญชีที่ระบุ" **เปิดไม่ขึ้นเลยบน Safari ทุกเครื่อง** · Chrome เดสก์ท็อปไม่บล็อกจึงไม่เคยเห็นปัญหา

## ต้องกด 2 สวิตช์ต่อรายงาน — ทำอย่างเดียวไม่พอ

| # | ที่ไหน | ตั้งเป็น |
|---|---|---|
| 1 | ปุ่ม **Share** มุมขวาบน → General access | **ใครมีลิงก์ก็ดูได้ (Viewer)** |
| 2 | **File > Embed report** | ติ๊ก **Enable embedding** |

> ทำข้อ 1 อย่างเดียวโดยไม่ทำข้อ 2 ⇒ Looker ขึ้น **"เจ้าของรายงานปิดใช้การดูในเว็บไซต์อื่น"** ในกรอบ ทุกเบราว์เซอร์ รวม Chrome ที่ไม่บล็อกคุกกี้ · โชคดีที่ข้อความต่างจากอาการคุกกี้ชัดเจน วินิจฉัยได้ทันทีโดยไม่ต้องเดา (ดูตารางอาการใน [common-issues.md](../TROUBLESHOOTING/common-issues.md))

> **เช็คได้ก่อนกดบันทึก** — ช่อง Looker Studio URL ในกล่องแก้ไขแดชบอร์ดมี preview ในตัว ถ้ารายงานยังตั้งค่าไม่ครบ ข้อความนี้จะขึ้นในกรอบ preview ตั้งแต่ตอนวาง URL

## สิ่งที่แลกไป — อ่านก่อนเริ่ม

สิทธิ์ชั้น Looker หายทั้งชั้น เหลือชั้น StreamHub ชั้นเดียว

- **ยังคุมได้:** ในแอป คนไม่มีสิทธิ์ยังไม่เห็นและกดไม่ได้ · URL จริงถูกปิดผนึกด้วย AES-256-GCM ใน [embed token](../../server/utils/embedToken.ts) ไม่เคยไปถึงเบราว์เซอร์
- **เสียไปจริง:** ถ้า URL หลุดทางอื่น (คนที่เคยเปิดใน Looker เอง, ส่งต่อกันเอง) คนนอกเปิดได้เลย ไม่ต้องล็อกอิน ไม่ผ่านแอป
- ⚠️ **`Master List` มีรายชื่อร้าน เลขสัญญา วันเริ่ม–หมดสัญญา รายราย 3,290 แถว** — เป็นตัวที่ผลกระทบสูงสุดถ้าลิงก์หลุด

## วิธีลัด

ข้อ 1 เลือกหลายรายงานพร้อมกันได้จากหน้าแรกของ Looker Studio (ติ๊กหลายตัวแล้วสั่ง Share ทีเดียว) · **ข้อ 2 ไม่มีทางลัด** ต้องเปิดทีละรายงาน

ทาง API ไม่ได้: service account ของเราถือ scope `datastudio.readonly` ([lookerStudioApi.ts](../../server/utils/lookerStudioApi.ts)) และการตั้ง Enable embedding ก็ไม่มีใน Looker Studio API

## รายการ (31 ตัว)

| ✓ | แดชบอร์ดในแอป | โฟลเดอร์ | รายงาน Looker |
|---|---|---|---|
| ☐ | งบทดลอง [กลุ่มอินโนเทค] | กลุ่มอินโนเทค | [044d1356-88e7-4925-90a0-3a7c6b05cb43](https://lookerstudio.google.com/reporting/044d1356-88e7-4925-90a0-3a7c6b05cb43) |
| ☐ | งบทดลอง [INFE] | กลุ่มอินโนเทค | [ebb3618f-85fc-4179-9e1f-318762120b4b](https://lookerstudio.google.com/reporting/ebb3618f-85fc-4179-9e1f-318762120b4b) |
| ☐ | งบทดลอง [INHH] | กลุ่มอินโนเทค | [16e15937-9ebf-4585-a2e2-4505ceeb2f1c](https://lookerstudio.google.com/reporting/16e15937-9ebf-4585-a2e2-4505ceeb2f1c) |
| ☐ | งบทดลอง [INKB] | กลุ่มอินโนเทค | [d9924c1a-694d-4c1c-a989-53251434730b](https://lookerstudio.google.com/reporting/d9924c1a-694d-4c1c-a989-53251434730b) |
| ☐ | การเปิดบิล-แจ้งหนี้-รับชำระ | แดชบอร์ดหลัก | [9b834e2f-a27b-4838-b092-cf5b45ec2fe5](https://lookerstudio.google.com/reporting/9b834e2f-a27b-4838-b092-cf5b45ec2fe5) |
| ☐ | บอกเลิกสัญญา | แดชบอร์ดหลัก | [e3ffc5e1-cf5f-4142-9657-17c07d4f9e32](https://lookerstudio.google.com/reporting/e3ffc5e1-cf5f-4142-9657-17c07d4f9e32) |
| ☐ | รายได้ใหม่ | แดชบอร์ดหลัก | [8d52255b-fbb8-466d-b59d-89958d85996a](https://lookerstudio.google.com/reporting/8d52255b-fbb8-466d-b59d-89958d85996a) |
| ☐ | Master List | แดชบอร์ดหลัก | [d95a3df9-e38b-4002-b5b4-89ba8585a5e3](https://lookerstudio.google.com/reporting/d95a3df9-e38b-4002-b5b4-89ba8585a5e3) |
| ☐ | Warehouse | แดชบอร์ดหลัก | [e9e5d4a3-e523-463d-8938-f1b8d746f11d](https://lookerstudio.google.com/reporting/e9e5d4a3-e523-463d-8938-f1b8d746f11d) |
| ☐ | งบทดลอง [ภาคตะวันออก] | ภาคตะวันออก | [c226da92-d386-4837-b08c-61a8115a6775](https://lookerstudio.google.com/reporting/c226da92-d386-4837-b08c-61a8115a6775) |
| ☐ | งบทดลอง [STCN] | ภาคตะวันออก | [4f93e985-0150-488c-8345-1f07cfa875a6](https://lookerstudio.google.com/reporting/4f93e985-0150-488c-8345-1f07cfa875a6) |
| ☐ | งบทดลอง [STPT] | ภาคตะวันออก | [de8583f3-9371-4b9e-85da-c29b8995aaf0](https://lookerstudio.google.com/reporting/de8583f3-9371-4b9e-85da-c29b8995aaf0) |
| ☐ | งบทดลอง [STRY] | ภาคตะวันออก | [1361d380-3d12-4777-a990-1491bb6e524b](https://lookerstudio.google.com/reporting/1361d380-3d12-4777-a990-1491bb6e524b) |
| ☐ | งบทดลอง [ภาคตะวันออกเฉียงเหนือ] | ภาคตะวันออกเฉียงเหนือ | [ac5244e4-e5be-4ec8-a024-d36f780ada0f](https://lookerstudio.google.com/reporting/ac5244e4-e5be-4ec8-a024-d36f780ada0f) |
| ☐ | งบทดลอง [STKK] | ภาคตะวันออกเฉียงเหนือ | [0c6ba8ae-e3d0-439a-9009-c0bbb0dac4ca](https://lookerstudio.google.com/reporting/0c6ba8ae-e3d0-439a-9009-c0bbb0dac4ca) |
| ☐ | งบทดลอง [STNR] | ภาคตะวันออกเฉียงเหนือ | [f7478f26-da0b-4886-bf79-f826844c1667](https://lookerstudio.google.com/reporting/f7478f26-da0b-4886-bf79-f826844c1667) |
| ☐ | งบทดลอง [STUB] | ภาคตะวันออกเฉียงเหนือ | [62362d43-76ab-4abf-ae4e-7f23e742d25e](https://lookerstudio.google.com/reporting/62362d43-76ab-4abf-ae4e-7f23e742d25e) |
| ☐ | งบทดลอง [STUD] | ภาคตะวันออกเฉียงเหนือ | [e56ed469-ca28-49ae-8e50-e858561c5e42](https://lookerstudio.google.com/reporting/e56ed469-ca28-49ae-8e50-e858561c5e42) |
| ☐ | งบทดลอง [ภาคใต้] | ภาคใต้ | [b5101d99-723e-4752-8456-40da2bbbca37](https://lookerstudio.google.com/reporting/b5101d99-723e-4752-8456-40da2bbbca37) |
| ☐ | งบทดลอง [STHY] | ภาคใต้ | [7c779ae5-da6d-4ff5-88f4-8ac0ff73730a](https://lookerstudio.google.com/reporting/7c779ae5-da6d-4ff5-88f4-8ac0ff73730a) |
| ☐ | งบทดลอง [STPK] | ภาคใต้ | [ecb84117-7997-4c99-814b-1fea8b85919c](https://lookerstudio.google.com/reporting/ecb84117-7997-4c99-814b-1fea8b85919c) |
| ☐ | งบทดลอง [STSM] | ภาคใต้ | [9b1ce6a7-ffce-426f-9e49-aa9b7f356b6a](https://lookerstudio.google.com/reporting/9b1ce6a7-ffce-426f-9e49-aa9b7f356b6a) |
| ☐ | งบทดลอง [ภาคเหนือ] | ภาคเหนือ | [fa080b8c-7898-4ac4-b467-6db047567081](https://lookerstudio.google.com/reporting/fa080b8c-7898-4ac4-b467-6db047567081) |
| ☐ | งบทดลอง [OCRI] | ภาคเหนือ | [88fcfd3b-3c3f-44db-8554-5c4cb518edcd](https://lookerstudio.google.com/reporting/88fcfd3b-3c3f-44db-8554-5c4cb518edcd) |
| ☐ | งบทดลอง [STCM] | ภาคเหนือ | [b9044c7d-2f61-4e92-bcd7-c51d2bc897ac](https://lookerstudio.google.com/reporting/b9044c7d-2f61-4e92-bcd7-c51d2bc897ac) |
| ☐ | งบทดลอง [STPL] | ภาคเหนือ | [f462f530-dddf-4335-a9a9-97ec845a8941](https://lookerstudio.google.com/reporting/f462f530-dddf-4335-a9a9-97ec845a8941) |
| ☐ | งบทดลอง [OAYT] | OAYT | [e7832402-fb81-4415-a611-4de50ec10730](https://lookerstudio.google.com/reporting/e7832402-fb81-4415-a611-4de50ec10730) |
| ☐ | งบทดลอง [STCS] | STCS | [0ad11fa6-6a7f-49e1-9278-89553ceb90ab](https://lookerstudio.google.com/reporting/0ad11fa6-6a7f-49e1-9278-89553ceb90ab) |
| ☐ | งบทดลอง [STEB] | STEB | [6cad525f-38b3-498b-83fc-e71beb95ce12](https://lookerstudio.google.com/reporting/6cad525f-38b3-498b-83fc-e71beb95ce12) |
| ☐ | งบทดลอง [STSB] | STSB | [a7e1821d-e05f-4ac8-8b75-9f1fb8d488c3](https://lookerstudio.google.com/reporting/a7e1821d-e05f-4ac8-8b75-9f1fb8d488c3) |
| ☐ | งบทดลอง [STSS] | STSS | [4266e6b9-e6d1-4746-9524-09df42ca61be](https://lookerstudio.google.com/reporting/4266e6b9-e6d1-4746-9524-09df42ca61be) |

> รายการนี้เคยมีอีก 4 แถวที่ชี้ไป UUID จากข้อมูล seed ซึ่งไม่มีอยู่จริงใน Looker (`Budget 2024`, `Finance Summary`, `Regional East Performance`, `Regional Sales Map (Edited)`) — ใครกดเข้าไปเจอกรอบเปล่า · **ลบทิ้งจาก Firestore แล้ว 2026-08-24** (แดชบอร์ด 42 → 38) ตรวจก่อนลบว่าไม่มีคอลเลกชันไหนอ้างถึงเลยนอกจาก `audit-log` และ `npm run audit:orphans` หลังลบได้ 0 ทั้ง 7 หมวด

## ยืนยันหลังทำ

1. iPad/iPhone Safari — **เปิด** "ป้องกันการติดตามข้ามไซต์" ไว้ (ค่าปริยาย) · ปิดสวิตช์ไว้แล้วทดสอบ = ไม่พิสูจน์อะไร
2. เปิดแดชบอร์ดที่เพิ่งแก้ ต้องเห็นรายงานจริงทันที ไม่ใช่หน้า "เข้าถึงรายงานไม่ได้" และไม่ใช่กรอบขาว
3. สุ่มเช็ก 2–3 ตัวพอ ที่เหลือถ้าตั้งเหมือนกันก็เหมือนกัน
4. แถบคำแนะนำสีเหลืองในแอปยังขึ้นบน Safari ต่อไป (เราแยกไม่ออกว่ารายงานไหนพัง) — ผู้ใช้กด ✕ ปิดถาวรได้
