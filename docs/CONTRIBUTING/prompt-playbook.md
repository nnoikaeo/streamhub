---
title: Prompt Playbook — แนวทางการใช้ Prompt ในทุกขั้นตอน
version: 1.0
updated: 2026-03-25
---

# Prompt Playbook

แผนปฏิบัติการใช้ prompt กับ Copilot ในทุกขั้นตอนของ development workflow

**หลักการ:** ใช้ prompt ที่ถูกต้อง ในจังหวะที่ถูกต้อง → โค้ดสะอาด + เอกสารเป็นปัจจุบัน

---

## 📋 สรุปภาพรวม Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. วางแผน (Plan)        → สร้างแผนงาน .md             │
│  2. เขียนโค้ด (Implement) → เขียน + ตรวจระหว่างทาง      │
│  3. Review ก่อน PR        → ตรวจโค้ด + ตรวจเอกสาร       │
│  4. สร้าง PR              → สร้าง PR body               │
│  5. จบ Phase              → Phase Wrap-up (doc review)  │
│  6. ก่อน Release          → Full review ทุกไฟล์         │
└─────────────────────────────────────────────────────────┘
```

---

## ขั้นตอนที่ 1: วางแผน (Plan)

**เมื่อไหร่:** เริ่มงานใหม่ หรือเริ่ม phase ใหม่

### 1.1 สร้างแผนงาน

```
ช่วยสร้างแผนงานสำหรับ [ชื่อ feature] ใน docs/OPERATIONS/:
- สรุปภาพรวม (เป้าหมาย, ผลลัพธ์ที่คาดหวัง)
- แบ่งเป็นงานย่อย (1 งาน = 1 PR)
- แต่ละงานระบุ: ไฟล์ที่แก้, รายละเอียด, commit message
- dependency graph ระหว่างงาน
- ลำดับการทำงานที่แนะนำ
```

### 1.2 ประเมินงาน

```
ดูแผนงาน docs/OPERATIONS/[plan-file].md แล้วช่วย:
- ประเมินว่าแต่ละงานย่อยมีขนาดเหมาะสมไหม (ควร 1 session = 1 งาน)
- มีงานไหนที่ควรแยกย่อยเพิ่ม?
- dependency ถูกต้องไหม?
```

---

## ขั้นตอนที่ 2: เขียนโค้ด (Implement)

**เมื่อไหร่:** กำลัง implement แต่ละงานย่อย

### 2.1 เริ่มงาน — บอก context

```
ทำงานที่ [N] จากแผน docs/OPERATIONS/[plan-file].md
อ่านแผนงานแล้วเริ่ม implement ตามรายละเอียด
```

### 2.2 ตรวจระหว่างเขียน — Quick Check

```
ตรวจไฟล์ [ชื่อไฟล์] ที่เพิ่งแก้:
- TypeScript types ครบไหม?
- Vue component structure ถูกไหม? (imports → types → props → emits → state → computed → methods)
- มี console.log หลงเหลือไหม?
```

### 2.3 ขอช่วยแก้ปัญหา

```
ไฟล์ [ชื่อไฟล์] มีปัญหา: [อธิบายปัญหา]
ช่วยหาสาเหตุและแก้ไข โดยอ้างอิง coding standards ใน docs/CONTRIBUTING/coding-standards.md
```

---

## ขั้นตอนที่ 3: Review ก่อน PR

**เมื่อไหร่:** เขียนโค้ดเสร็จ ก่อน push + สร้าง PR

### 3.1 Code Review

```
Review โค้ดที่เปลี่ยนทั้งหมด ตรวจตาม docs/CONTRIBUTING/coding-standards.md:
- TypeScript types ครบไหม
- Vue component structure ถูกต้องไหม
- Naming conventions ถูกไหม
- มี console.log หลงเหลือไหม
- Security: input validation, ไม่มี secrets exposed
- Performance: unnecessary re-renders, memory leaks
```

### 3.2 Doc Impact Check

```
ตรวจว่าการเปลี่ยนแปลงล่าสุดกระทบเอกสารไหม:
- เพิ่ม/ลบ component → ต้องอัปเดต docs/DESIGN/COMPONENT_ARCHITECTURE.md ไหม?
- เปลี่ยน CSS/theme → ต้องอัปเดต docs/DESIGN/DESIGN_SYSTEM.md ไหม?
- เพิ่ม API/page → ต้องอัปเดต docs/OPERATIONS/roadmap.md ไหม?
ถ้ากระทบ ช่วยอัปเดตให้ด้วย
```

### 3.3 Security Review (สำหรับงาน API / Auth)

```
Review โค้ดเรื่อง security:
- API endpoints มี authentication ไหม?
- Input validation ครบไหม?
- มี sensitive data รั่วไหลใน response ไหม?
- Firebase rules ถูกต้องไหม?
- มี XSS / injection vulnerability ไหม?
```

---

## ขั้นตอนที่ 4: สร้าง PR

**เมื่อไหร่:** โค้ดพร้อม push แล้ว

### 4.1 สร้าง PR Body

```
ช่วยสร้าง PR description สำหรับ:
- Branch: [ชื่อ branch]
- Base: develop
- งานที่ [N] จาก docs/OPERATIONS/[plan-file].md

ให้ PR body มี: Summary, Changes (bullet list), ไฟล์ที่แก้, Checklist
แล้ว push + สร้าง PR ด้วย gh cli
```

### 4.2 สร้าง PR Body แบบ Release

```
ช่วยสร้าง PR description สำหรับ release (develop → main):
- ดู git log ล่าสุดที่ยังไม่ merge เข้า main
- สรุป features, fixes, docs ที่เปลี่ยน
- สร้าง PR body แล้ว push ด้วย gh cli
```

---

## ขั้นตอนที่ 5: จบ Phase (Phase Wrap-up)

**เมื่อไหร่:** งานย่อยทุกงานใน phase เสร็จครบแล้ว

### 5.1 อัปเดต Roadmap

```
ช่วยอัปเดตไฟล์ที่เกี่ยวข้องกับงานที่ทำล่าสุด:
- อัปเดต roadmap.md — mark phase เป็น ✅ COMPLETED
- อัปเดต plan .md — mark checklist เสร็จ
- สรุปงานที่ยังเหลือเรียงตามลำดับความสำคัญ
```

### 5.2 Design Doc Review

```
Review docs/DESIGN/COMPONENT_ARCHITECTURE.md ให้ตรงกับโค้ดจริงใน app/components/:
- Component ใหม่ที่ยังไม่มีในเอกสาร?
- Component ที่ถูกลบหรือเปลี่ยนชื่อ?
- Props/slots ที่เพิ่มใหม่?
- อัปเดต version + Last Updated date
```

```
Review docs/DESIGN/DESIGN_SYSTEM.md ให้ตรงกับ assets/css/ + tailwind.config.ts:
- CSS variables ที่เพิ่ม/เปลี่ยน?
- Tailwind extensions ที่ยังไม่ document?
- สีหรือ design token ใหม่?
```

### 5.3 Archive แผนงาน

```
งานทั้งหมดใน docs/OPERATIONS/[plan-file].md เสร็จครบแล้ว
ช่วย:
- ย้ายไปเก็บที่ docs/OPERATIONS/archive/
- สร้าง PR สำหรับ docs update
```

---

## ขั้นตอนที่ 6: ก่อน Release (develop → main)

**เมื่อไหร่:** พร้อม merge develop เข้า main

### 6.1 Full Doc Review

```
ก่อน release ช่วย review เอกสารทุกไฟล์ให้เป็นปัจจุบัน:
1. docs/DESIGN/COMPONENT_ARCHITECTURE.md — ตรงกับ app/components/ ไหม?
2. docs/DESIGN/DESIGN_SYSTEM.md — ตรงกับ assets/css/ + tailwind.config.ts ไหม?
3. docs/OPERATIONS/roadmap.md — phase status ถูกต้องไหม?
4. .github/copilot-instructions.md — project structure ยังตรงไหม?
รายงานสิ่งที่ต้องอัปเดต แล้วแก้ไขให้
```

### 6.2 Final Code Quality Sweep

```
ตรวจ codebase ทั้งหมดก่อน release:
- มี console.log / TODO / FIXME / HACK ที่ลืมแก้ไหม?
- มีไฟล์ที่ import แต่ไม่ได้ใช้ไหม?
- มี TypeScript any ที่ควรใส่ type จริงไหม?
```

---

## 🔧 Prompt พิเศษ (ใช้เมื่อไหร่ก็ได้)

### ถามเรื่อง Architecture

```
อธิบาย architecture ของ [feature/component] ใน StreamHub:
- ไฟล์ไหนเกี่ยวข้อง?
- data flow เป็นอย่างไร?
- ใช้ composable/store อะไร?
```

### Debug ปัญหา

```
หน้า [ชื่อหน้า] มี error: [ข้อความ error]
ช่วยหาสาเหตุ ตรวจไฟล์ที่เกี่ยวข้อง แล้วแก้ไข
```

### Refactor

```
Refactor [ชื่อไฟล์/component] ตาม coding standards:
- ดู docs/CONTRIBUTING/coding-standards.md
- ดู docs/DESIGN/COMPONENT_ARCHITECTURE.md สำหรับ pattern ที่ใช้
- แก้เฉพาะสิ่งที่จำเป็น ไม่ over-engineer
```

---

## 📌 สรุป: Prompt ที่ใช้บ่อยที่สุด

| จังหวะ | Prompt สั้น |
|--------|------------|
| เริ่มงาน | `ทำงานที่ N จากแผน [plan].md` |
| ระหว่างเขียน | `ตรวจไฟล์ [file] ที่เพิ่งแก้` |
| ก่อน PR | `Review โค้ดที่เปลี่ยน + ตรวจว่ากระทบเอกสารไหม` |
| สร้าง PR | `สร้าง PR description + push ด้วย gh cli` |
| จบ Phase | `อัปเดต roadmap + review design docs + archive plan` |
| ก่อน Release | `Full doc review + code quality sweep` |

---

## 🔗 เอกสารที่เกี่ยวข้อง

| เอกสาร | บทบาท |
|--------|--------|
| [coding-standards.md](coding-standards.md) | มาตรฐานการเขียนโค้ด |
| [code-review.md](code-review.md) | กระบวนการ review + doc drift prevention |
| [workflow.md](workflow.md) | Git Flow workflow |
| [COMPONENT_ARCHITECTURE.md](../DESIGN/COMPONENT_ARCHITECTURE.md) | สถาปัตยกรรม component (67 ตัว) |
| [DESIGN_SYSTEM.md](../DESIGN/DESIGN_SYSTEM.md) | Design tokens, CSS, Tailwind |
| [roadmap.md](../OPERATIONS/roadmap.md) | Phase tracking + งานที่เหลือ |
