git # Discover Page: Tree View & Group By System

**Branch:** `feat/discover-tree-view-groupby`  
**Base:** `develop`  
**Phase:** 5.8  
**Created:** 2026-03-24

---

## สรุปภาพรวม

ปรับปรุงหน้า `/dashboard/discover` เพื่อ:

1. **ลดพื้นที่สูญเปล่า** ในทุกมุมมอง (List, Grid, Compact) โดยใช้แนวทาง **Unified Tree View** — รวม folder groups เป็นโครงสร้างเดียว ลด header ซ้ำ, gap ใหญ่, border ซ้ำ
2. **เพิ่มระบบ Group By** ให้ผู้ใช้เลือกจัดกลุ่มแดชบอร์ดตาม: โฟลเดอร์, แท็ก, บริษัท, หรือไม่จัดกลุ่ม
3. **ย้าย Search Bar** ไปอยู่ในแถว Breadcrumbs เพื่อประหยัดพื้นที่เพิ่มเติม

### ผลลัพธ์ที่คาดหวัง

| มุมมอง | พื้นที่ลดลง | Dashboard ที่เห็นบนจอ (800px viewport) |
|---|---|---|
| List View | ~47% | 10 → **~16** |
| Grid View | ~30% | 4-5 → **~6-8** |
| Compact View | ~40% | 8-10 → **~12-16** |

---

## แผนงานย่อย (Subtasks)

> **1 งานย่อย = 1 แชท**  
> แต่ละงานสร้าง commit แยก ทดสอบได้อิสระ

---

### งานที่ 1: PageLayout — Breadcrumb Actions Slot + Search Bar ย้ายตำแหน่ง

**เป้าหมาย:** เพิ่ม slot ใน PageLayout เพื่อให้หน้าต่างๆ inject content เข้าแถว breadcrumb ได้ แล้วย้าย search bar จาก discover page ไปใส่ใน slot นั้น

**ไฟล์ที่แก้ไข:**
- `app/components/compositions/PageLayout.vue` — เพิ่ม `#breadcrumb-actions` slot
- `app/pages/dashboard/discover.vue` — ย้าย search bar ไปใช้ slot ใหม่

**รายละเอียด:**
- Breadcrumb row เป็น flex container: Breadcrumbs ชิดซ้าย, slot ชิดขวา
- Search bar มี `max-width: 320px` บน desktop
- Responsive (≤768px): search bar ตกลงแถวใหม่ด้วย `flex-wrap: wrap`
- ไม่กระทบหน้า admin ที่ใช้ PageLayout เหมือนกัน (slot ว่างก็ไม่แสดงอะไร)

**Wireframe:**
```
Desktop:
┌─ Breadcrumb Row ──────────────────────────────────────────────┐
│  รายการแดชบอร์ด               🔍 ค้นหาแดชบอร์ด...       [✕]  │
└───────────────────────────────────────────────────────────────┘

Mobile (≤768px):
┌─ Breadcrumb Row ──────────────────────┐
│  รายการแดชบอร์ด                        │
│  🔍 ค้นหาแดชบอร์ด...            [✕]   │
└────────────────────────────────────────┘
```

**Commit:** `feat(layout): add breadcrumb-actions slot and move search bar`

---

### งานที่ 2: GroupBySwitcher Component — Icon-only Button Group

**เป้าหมาย:** สร้าง component ใหม่สำหรับเปลี่ยนโหมดการจัดกลุ่ม

**ไฟล์ที่สร้าง:**
- `app/components/features/GroupBySwitcher.vue`

**ไฟล์ที่แก้ไข:**
- `app/pages/dashboard/discover.vue` — เพิ่ม GroupBySwitcher ในแถว dashboard header

**รายละเอียด:**
- 4 ปุ่ม icon-only: 📁 โฟลเดอร์ | 🏷️ แท็ก | 🏢 บริษัท | ─ ไม่จัดกลุ่ม
- Styling คล้าย ViewModeSwitcher ที่มีอยู่ (pill container, active=primary bg)
- แต่ละปุ่มมี `title` tooltip ภาษาไทย
- ค่า default: `'folder'`
- เก็บค่าใน `localStorage` key: `streamhub-discover-group-by`
- ปุ่ม "📁 โฟลเดอร์" visible เฉพาะเมื่อ `folders.length > 0`
- ปุ่ม "🏢 บริษัท" visible เฉพาะ admin (มี multiple companies)
- Emit: `update:modelValue`

**Layout ใน dashboard header row:**
```
≡ พบ 10 แดชบอร์ด   ขยายทั้งหมด|ย่อทั้งหมด   [📁][🏷][🏢][─]  ┃  [▦][⊞][☰]
├── count (flex:1)   ├── collapse ctrl          ├─ group ─┤  ┃  ├─ view ─┤
                                                 divider ──────┘
```

**Commit:** `feat(discover): add GroupBySwitcher component`

---

### งานที่ 3: Group By Logic — Computed Grouping ใน discover.vue

**เป้าหมาย:** สร้าง logic สำหรับจัดกลุ่มแดชบอร์ดตาม groupBy mode ที่เลือก

**ไฟล์ที่แก้ไข:**
- `app/pages/dashboard/discover.vue` — เพิ่ม computed properties สำหรับ group by

**รายละเอียด:**
- เพิ่ม `groupBy` ref: `'folder' | 'tag' | 'company' | 'none'`
- สร้าง `groupedByTag` computed: จัดกลุ่มตาม tag (dashboard ที่มีหลาย tag ปรากฏหลายกลุ่ม + กลุ่ม "ไม่มีแท็ก")
- สร้าง `groupedByCompany` computed: จัดกลุ่มตาม access.company (+ "ทุกบริษัท" + "เฉพาะสิทธิ์")
- สร้าง `activeGroups` computed: เลือก grouping ตาม mode ที่ active
- ปรับ `isGroupedView` ให้คำนึงถึง groupBy mode
- ปรับ `dashboardCountText` ให้แสดงตาม groupBy (เช่น "พบ 10 แดชบอร์ดใน 6 แท็ก")
- Collapse controls (ขยาย/ย่อทั้งหมด) ซ่อนเมื่อ `groupBy === 'none'`

**Group interface ที่ต้องสร้าง:**
```typescript
interface DisplayGroup {
  id: string
  name: string
  icon?: string          // SVG หรือ emoji
  color?: string         // สีแท็ก (เมื่อ group by tag)
  subtitle?: string      // moderator info / tag description
  dashboards: Dashboard[]
}
```

**Commit:** `feat(discover): add group-by logic for tag, company, none modes`

---

### งานที่ 4: Adaptive Columns — คอลัมน์ List View เปลี่ยนตาม Group By

**เป้าหมาย:** คอลัมน์ที่ใช้เป็นกลุ่มจะถูกซ่อน และแสดงคอลัมน์ที่มีประโยชน์แทน

**ไฟล์ที่แก้ไข:**
- `app/components/features/DashboardList.vue` — รับ prop `columns` เพื่อกำหนดว่าจะแสดงคอลัมน์ไหน
- `app/components/features/DashboardListItem.vue` — แสดง/ซ่อนคอลัมน์ตาม prop

**รายละเอียด:**

| Group By | คอลัมน์ 1 | คอลัมน์ 2 | คอลัมน์ 3 |
|---|---|---|---|
| โฟลเดอร์ | ชื่อ | แท็ก | บริษัท |
| แท็ก | ชื่อ | 📁 โฟลเดอร์ | บริษัท |
| บริษัท | ชื่อ | 📁 โฟลเดอร์ | แท็ก |
| ไม่จัดกลุ่ม | ชื่อ | 📁 โฟลเดอร์ | แท็ก + บริษัท |

- เพิ่ม prop `visibleColumns: ('tags' | 'company' | 'folder')[]`
- DashboardListItem เพิ่ม column "📁 โฟลเดอร์" แสดง folder name เป็น chip
- ต้อง lookup folder name จาก folderId → ส่ง `folderMap` prop

**Commit:** `feat(discover): adaptive columns based on group-by mode`

---

### งานที่ 5: Tree Table — Unified List View (แทน GroupedDashboardList)

**เป้าหมาย:** แทนที่ GroupedDashboardList ด้วย Tree Table layout ที่ประหยัดพื้นที่

**ไฟล์ที่สร้าง:**
- `app/components/features/TreeDashboardList.vue` — component ใหม่

**ไฟล์ที่แก้ไข:**
- `app/pages/dashboard/discover.vue` — ใช้ TreeDashboardList แทน GroupedDashboardList (เมื่อ viewMode=list)

**รายละเอียด:**
- ตารางเดียว sticky header (36px) — แสดง 1 ครั้ง
- Group rows: 36px, bg สีอ่อน, คลิก collapse/expand ได้
  - Group by folder: 📁 icon + ชื่อ + count + moderator
  - Group by tag: ● สีแท็ก + ชื่อ + count
  - Group by company: 🏢 icon + ชื่อบริษัท + count
- Dashboard rows: 40px (ลดจาก 48px), indent ซ้าย ~24px
- คั่นกลุ่มด้วยเส้น 1px (ไม่ใช่ gap 32px)
- Collapse transition: max-height animation 200ms
- รับ `DisplayGroup[]` เป็น prop (generic — ใช้ได้ทุก group by mode)

**Wireframe:**
```
│  ชื่อ                                │ แท็ก          │ บริษัท│  ← sticky header
│══════════════════════════════════════════════════════════════│
│ ▼ 📁 2024 (1)  ─ Nattha (STTH)                             │  ← group row: 36px, bg
│    ■ Budget 2024                     │ Fin. Qtrly    │ STTH │  ← item row: 40px, indent
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  ← 1px separator
│ ▼ 📁 แดชบอร์ดหลัก (2)                                      │
│    ■ Master List                     │               │ ทุก  │
│    ■ บอกเลิกสัญญา                     │               │ ทุก  │
```

**Commit:** `feat(discover): create TreeDashboardList unified tree table`

---

### งานที่ 6: Slim Folder Dividers — Grid & Compact Views

**เป้าหมาย:** แทนที่ folder header ใน Grid/Compact ด้วย slim divider bar ที่ประหยัดพื้นที่

**ไฟล์ที่สร้าง:**
- `app/components/features/GroupDivider.vue` — slim divider component ใช้ร่วมกันทุก group by mode

**ไฟล์ที่แก้ไข:**
- `app/components/features/GroupedDashboardGrid.vue` — ใช้ GroupDivider แทน folder header เดิม, ลด gap

**รายละเอียด:**
- GroupDivider เป็น generic — รับ `DisplayGroup` object
- Grid view: divider h=28px, gap ระหว่างกลุ่ม 12px (เดิม 32px)
- Compact view: divider h=24px, gap 8px, ซ่อน subtitle (แสดง tooltip แทน)
- Divider layout: `[▼/►] [icon] [name] [count] ─────────────── [subtitle]`
- icon + สีเปลี่ยนตาม group by mode (folder=📁 primary, tag=● สีแท็ก, company=🏢)
- คลิก divider → collapse/expand กลุ่ม

**Wireframe (Grid):**
```
▼ 📁 2024 (1) ─ Nattha (STTH) ────────────────────────  ← h=28px
┌──────────┐
│ ░░░░░░░░ │  ← card ปกติ
│ Budget   │
└──────────┘
                                                         ← gap: 12px
▼ 📁 แดชบอร์ดหลัก (2) ────────────────────────────────  ← h=28px
```

**Wireframe (Compact):**
```
▼ 🟠 Sales (3) ────────────────────────────────────────  ← h=24px, tag color accent
┌───────┐ ┌───────┐ ┌───────┐
│░░░░░░░│ │░░░░░░░│ │░░░░░░░│   ← 6-col compact cards
│Reg.Eas│ │EastQ1 │ │Master │
└───────┘ └───────┘ └───────┘
                                                         ← gap: 8px
```

**Commit:** `feat(discover): slim GroupDivider for grid and compact views`

---

### งานที่ 7: Flat Mode — ไม่จัดกลุ่ม (Group By = None)

**เป้าหมาย:** เมื่อเลือก "ไม่จัดกลุ่ม" แสดง flat table/grid โดยไม่มี group header ใดเลย

**ไฟล์ที่แก้ไข:**
- `app/pages/dashboard/discover.vue` — เพิ่ม condition สำหรับ flat mode ในแต่ละ view

**รายละเอียด:**
- List view: ใช้ `DashboardList` เดิม (ไม่มี tree grouping) แต่ใช้ adaptive columns (แสดง folder + tags + company)
- Grid/Compact: ใช้ `DashboardGrid`/`DashboardCard` โดยตรง ไม่มี divider
- ซ่อน "ขยายทั้งหมด | ย่อทั้งหมด" controls
- `dashboardCountText` แสดง "พบ 10 แดชบอร์ด" (ไม่มี "ใน X โฟลเดอร์")

**Commit:** `feat(discover): flat mode without grouping`

---

### งานที่ 8: Responsive & Polish

**เป้าหมาย:** ทดสอบและปรับปรุง responsive ทุก breakpoint + polish UX

**ไฟล์ที่แก้ไข:**
- ไฟล์ทุกไฟล์ที่แก้ในงานก่อนหน้า — ปรับ responsive styles

**รายละเอียด:**
- **≤768px (mobile):**
  - Search bar ตกแถวใหม่ใน breadcrumb row
  - GroupBySwitcher + ViewModeSwitcher ยังอยู่แถวเดียว (icons เล็กพอ)
  - ซ่อน collapse controls (ขยาย/ย่อทั้งหมด)
  - Tree table: ซ่อนคอลัมน์ tags, ลด indent
  - Compact view: 2 columns (ลดจาก 6)
- **≤1024px (tablet):**
  - Grid: 3 columns (ลดจาก 4)
  - Compact: 4 columns (ลดจาก 6)
- **LocalStorage persistence:** ทดสอบว่า groupBy + viewMode จำค่าข้ามเซสชันได้ถูกต้อง
- **Accessibility:** ทุก icon button มี `aria-label` + `title` tooltip
- **Transition:** view-fade crossfade 200ms เมื่อสลับ groupBy mode

**Commit:** `feat(discover): responsive polish and accessibility`

---

## ลำดับการทำงาน (Dependency Graph)

```
งานที่ 1 ─────────────────────────────────────────────► (อิสระ)
งานที่ 2 ─────────────────────────────────────────────► (อิสระ)
งานที่ 3 ──── ต้องทำหลังงานที่ 2 ─────────────────────► (ใช้ GroupBySwitcher)
งานที่ 4 ──── ต้องทำหลังงานที่ 3 ─────────────────────► (ใช้ groupBy logic)
งานที่ 5 ──── ต้องทำหลังงานที่ 3 + 4 ─────────────────► (ใช้ DisplayGroup + columns)
งานที่ 6 ──── ต้องทำหลังงานที่ 3 ─────────────────────► (ใช้ DisplayGroup)
งานที่ 7 ──── ต้องทำหลังงานที่ 4 + 5 + 6 ─────────────► (flat fallback ทุก view)
งานที่ 8 ──── ต้องทำหลังทุกงาน ────────────────────────► (polish ทั้งหมด)
```

**ลำดับแนะนำ:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

---

## สรุปไฟล์ที่เกี่ยวข้อง

### ไฟล์ที่สร้างใหม่ (3)
| ไฟล์ | งานที่ |
|---|---|
| `app/components/features/GroupBySwitcher.vue` | 2 |
| `app/components/features/TreeDashboardList.vue` | 5 |
| `app/components/features/GroupDivider.vue` | 6 |

### ไฟล์ที่แก้ไข (5)
| ไฟล์ | งานที่ |
|---|---|
| `app/components/compositions/PageLayout.vue` | 1 |
| `app/pages/dashboard/discover.vue` | 1, 2, 3, 5, 6, 7, 8 |
| `app/components/features/DashboardList.vue` | 4 |
| `app/components/features/DashboardListItem.vue` | 4 |
| `app/components/features/GroupedDashboardGrid.vue` | 6 |

### ไฟล์ที่ไม่แก้ไข (คงเดิม)
| ไฟล์ | เหตุผล |
|---|---|
| `DashboardCard.vue` | Card ยังใช้ตามเดิม ไม่ต้องแก้ |
| `DashboardGrid.vue` | Grid container ยังใช้ตามเดิม |
| `GroupedDashboardList.vue` | ถูกแทนที่ด้วย TreeDashboardList (ลบภายหลัง) |

---

## Checklist สำหรับแต่ละงาน

- [x] **งานที่ 1:** PageLayout breadcrumb-actions slot + search bar ย้าย (PR #120)
- [x] **งานที่ 2:** GroupBySwitcher component (PR #121)
- [x] **งานที่ 3:** Group By logic (tag, company, none) (PR #122)
- [x] **งานที่ 4:** Adaptive columns (list view) (PR #123)
- [x] **งานที่ 5:** TreeDashboardList (unified tree table) (PR #124)
- [x] **งานที่ 6:** GroupDivider (slim dividers for grid/compact) (PR #125)
- [x] **งานที่ 7:** Flat mode (no grouping) (PR #126)
- [x] **งานที่ 8:** Responsive & polish (PR #127)
- [x] **Bugfix:** Button style overrides, column alignment, default view (PR #128)

**Status:** ✅ ALL COMPLETED — Released to main (PR #130)
