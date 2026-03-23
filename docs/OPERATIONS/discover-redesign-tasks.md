# Discover Page Compact & Multi-View Redesign — แผนงานย่อย

> แต่ละงานย่อยจะดำเนินการในแชทใหม่แยกกัน
> อ้างอิง Wireframe ทั้ง 5 จากแผนหลัก

---

## สถานะรวม

| # | งานย่อย | สถานะ | ไฟล์ที่เกี่ยวข้อง |
|---|---------|--------|-------------------|
| 1 | View Mode Switcher UI | ⬜ ยังไม่เริ่ม | `discover.vue` |
| 2 | Compact Card Mode | ⬜ ยังไม่เริ่ม | `DashboardCard.vue`, `DashboardGrid.vue`, `DashboardPreview.vue` |
| 3 | List View — Components | ⬜ ยังไม่เริ่ม | `DashboardListItem.vue`, `DashboardList.vue` (NEW) |
| 4 | List View — Grouped & Wiring | ⬜ ยังไม่เริ่ม | `GroupedDashboardList.vue` (NEW), `discover.vue` |
| 5 | ย่อ/ขยาย Folder Groups | ⬜ ยังไม่เริ่ม | `GroupedDashboardGrid.vue`, `GroupedDashboardList.vue` |
| 6 | จำกัดจำนวนการ์ดต่อโฟลเดอร์ | ⬜ ยังไม่เริ่ม | `GroupedDashboardGrid.vue`, `GroupedDashboardList.vue`, `discover.vue` |
| 7 | ทดสอบ & ปรับแต่ง Responsive | ⬜ ยังไม่เริ่ม | ทุกไฟล์ที่แก้ไข |

---

## งานย่อยที่ 1: View Mode Switcher UI

**เป้าหมาย**: เพิ่มปุ่มสลับมุมมอง 3 แบบ (Grid / Compact / List) บนหน้า discover พร้อมบันทึก preference ผู้ใช้

**ไฟล์ที่แก้ไข**:
- `app/pages/dashboard/discover.vue`

**รายละเอียด**:
1. เพิ่ม `viewMode` reactive ref ค่า: `'grid' | 'compact' | 'list'`
2. อ่านค่าเริ่มต้นจาก `localStorage` (key: `streamhub-discover-view-mode`), default = `'grid'`
3. เมื่อผู้ใช้เปลี่ยน viewMode ให้บันทึกลง `localStorage` ทันที
4. เพิ่ม toggle button group ในส่วน header ข้างๆ dropdown โฟลเดอร์/บริษัท (ดู Wireframe 1)
   - ไอคอน Grid (4 squares) / Compact (small grid) / List (horizontal lines)
   - ปุ่มที่เลือกอยู่ใช้ `--color-primary` background, ที่เหลือใช้ `--color-bg-secondary`
5. ส่ง `viewMode` prop ลงไปยัง `DashboardGrid` และ `GroupedDashboardGrid` (ยังไม่ต้องทำอะไรกับ prop — แค่ส่งผ่าน)
6. เตรียม conditional rendering: `v-if="viewMode === 'list'"` (ยังไม่มี list component — แสดง placeholder text "List view coming soon")

**Wireframe อ้างอิง**: Wireframe 1 (Header Area)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ☰ พบ 50 แดชบอร์ด ใน 12 โฟลเดอร์           [▦][▤][≡]  📁โฟลเดอร์ 🏢บริษัท │
│                                              Grid Compact List             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**การตรวจสอบ**:
- [ ] ปุ่มสลับ 3 ปุ่มแสดงผลถูกต้องบน header
- [ ] คลิกสลับ → viewMode เปลี่ยนค่า
- [ ] Reload หน้า → viewMode คงเดิมจาก localStorage
- [ ] ไม่มี error ใน console

---

## งานย่อยที่ 2: Compact Card Mode

**เป้าหมาย**: สร้างมุมมอง compact สำหรับ DashboardCard — การ์ดเล็กลงครึ่งหนึ่ง, grid 5-6 คอลัมน์

**ไฟล์ที่แก้ไข**:
- `app/components/features/DashboardCard.vue`
- `app/components/features/DashboardGrid.vue`
- `app/components/features/DashboardPreview.vue`

**ขึ้นอยู่กับ**: งานย่อยที่ 1 (ต้องมี viewMode prop ส่งมาแล้ว)

**รายละเอียด**:
1. `DashboardCard.vue` — เพิ่ม prop `compact: boolean` (default: false)
   - Compact mode:
     - Thumbnail height: 160px → **80px** (ส่ง height prop ไปยัง DashboardPreview)
     - Card padding: `--spacing-md` → `--spacing-sm`
     - Title font: `0.95rem` → `0.8rem`
     - ซ่อน company badges (แสดงเป็น tooltip เมื่อ hover)
     - แสดง tags สูงสุด **2 ชิ้น** (จาก 3)
     - **ลบปุ่ม "เปิด →"** → ทั้งการ์ดคลิกได้ (`cursor: pointer`, hover effect)
   - Normal mode: ไม่เปลี่ยนแปลง (ยังมีปุ่ม "เปิด →" เหมือนเดิม)

2. `DashboardPreview.vue` — รองรับ `height` prop แทน hardcode 160px

3. `DashboardGrid.vue` — รับ `viewMode` prop
   - `viewMode === 'compact'`: grid 5-6 คอลัมน์, gap `0.75rem`
   - `viewMode === 'grid'` (default): grid 4 คอลัมน์เหมือนเดิม
   - ส่ง `compact` prop ไปยัง DashboardCard เมื่อ viewMode === 'compact'

**Wireframe อ้างอิง**: Wireframe 3 (Compact View)

```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│▓▓▓▓▓▓▓▓│ │▒▒▒▒▒▒▒▒│ │░░░░░░░░│ │▓▓▓▓▓▓▓▓│ │▒▒▒▒▒▒▒▒│ │░░░░░░░░│
│▓ 80px ▓│ │▒ 80px ▒│ │░ 80px ░│ │▓ 80px ▓│ │▒ 80px ▒│ │░ 80px ░│
│▓▓▓▓▓▓▓▓│ │▒▒▒▒▒▒▒▒│ │░░░░░░░░│ │▓▓▓▓▓▓▓▓│ │▒▒▒▒▒▒▒▒│ │░░░░░░░░│
│Budget 24│ │Revenue │ │Expense │ │Profit  │ │Growth  │ │Cashflow│
│Fin  Qtr │ │Sales   │ │Monthly │ │Finance │ │KPI     │ │Fin     │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

**การตรวจสอบ**:
- [ ] สลับเป็น Compact → การ์ดเล็กลง, thumbnail 80px, 5-6 คอลัมน์
- [ ] คลิกทั้งการ์ด (compact) → นำทางไป dashboard view
- [ ] Company badges ซ่อนใน compact, แสดง tooltip เมื่อ hover
- [ ] สลับกลับ Grid → กลับเป็นขนาดปกติ, มีปุ่ม "เปิด →"
- [ ] ทั้ง grouped view และ flat view ทำงานถูกต้อง

---

## งานย่อยที่ 3: List View — Components

**เป้าหมาย**: สร้าง component สำหรับ List view — แถวละ dashboard, ~48px ต่อแถว

**ไฟล์ใหม่**:
- `app/components/features/DashboardListItem.vue` (NEW)
- `app/components/features/DashboardList.vue` (NEW)

**ขึ้นอยู่กับ**: งานย่อยที่ 1 (ต้องมี viewMode ใน discover.vue)

**รายละเอียด**:

1. `DashboardListItem.vue` — component แถวเดี่ยว
   - Layout แนวนอน (flexbox): color swatch 32×32px | ชื่อ dashboard | tags (inline TagBadge size=sm, สูงสุด 2) | company badge | ลูกศร →
   - ความสูง: ~48px, padding: `--spacing-xs` `--spacing-sm`
   - Hover: background `--color-bg-secondary`
   - Click ทั้งแถว → emit `view` event
   - Props: `dashboard: Dashboard`, `tags?: Tag[]`
   - Color swatch ใช้ gradient เดียวกับ DashboardPreview (จาก title hash)

2. `DashboardList.vue` — container
   - Header row: label คอลัมน์ (ชื่อ | แท็ก | บริษัท) ด้วย font `0.75rem`, color `--color-text-secondary`
   - Render `DashboardListItem` สำหรับแต่ละ dashboard
   - Divider: `1px solid --color-border-light` ระหว่างแถว
   - Empty state: icon + ข้อความ (pattern เดียวกับ DashboardGrid)
   - Loading state: overlay spinner (pattern เดียวกับ DashboardGrid)
   - Props: `dashboards: Dashboard[]`, `tags?: Tag[]`, `loading?: boolean`
   - Events: `view-dashboard`, `share-dashboard`, `menu-dashboard`

**Wireframe อ้างอิง**: Wireframe 4 (List View) — ส่วนแถวข้อมูล

```
├────┬──────────────────┬──────────────┬─────────┬──────┤
│ 🎨 │ ชื่อ              │ แท็ก          │ บริษัท   │      │
├────┼──────────────────┼──────────────┼─────────┼──────┤
│ ▓▓ │ Budget 2024      │ Finance Qtr  │ STTH    │  →   │
│ ▒▒ │ Revenue Overview │ Sales KPI    │ ทุกบริษัท│  →   │
│ ░░ │ Expense Tracker  │ Monthly      │ STTH    │  →   │
└────┴──────────────────┴──────────────┴─────────┴──────┘
```

**การตรวจสอบ**:
- [ ] DashboardList แสดงรายการ dashboard เป็นแถวๆ
- [ ] แต่ละแถวสูงประมาณ 48px
- [ ] Hover highlight ทำงาน
- [ ] คลิกแถว → emit view event
- [ ] Empty state แสดงถูกต้อง
- [ ] Tags และ company แสดงถูกต้องในแถว

---

## งานย่อยที่ 4: List View — Grouped & Wiring

**เป้าหมาย**: สร้าง GroupedDashboardList และเชื่อมมุมมอง List เข้ากับหน้า discover

**ไฟล์ใหม่**:
- `app/components/features/GroupedDashboardList.vue` (NEW)

**ไฟล์ที่แก้ไข**:
- `app/pages/dashboard/discover.vue`

**ขึ้นอยู่กับ**: งานย่อยที่ 3 (ต้องมี DashboardList component)

**รายละเอียด**:

1. `GroupedDashboardList.vue` — จัดกลุ่ม list ตามโฟลเดอร์
   - Folder group header เหมือน GroupedDashboardGrid:
     - ไอคอนโฟลเดอร์ + ชื่อ + badge จำนวน + ข้อมูลผู้ดูแล
   - Render `DashboardList` สำหรับแต่ละกลุ่ม
   - Props: `groups: DashboardGroup[]`, `tags?: Tag[]`, `userMap?: Record<string, User>`
   - Events: propagate จาก DashboardList

2. `discover.vue` — เชื่อม list view
   - แทนที่ Placeholder "List view coming soon" (จากงานย่อยที่ 1)
   - เมื่อ `viewMode === 'list'`:
     - Grouped view → แสดง `GroupedDashboardList`
     - Flat view → แสดง `DashboardList`
   - ส่ง `filteredDashboards`, `groupedDashboards`, `tags` ไปยัง list components

**Wireframe อ้างอิง**: Wireframe 4 (List View) — ทั้งหมด

**การตรวจสอบ**:
- [ ] สลับเป็น List view → แสดง dashboard เป็นรายการแถว
- [ ] Grouped mode (ไม่เลือกโฟลเดอร์) → แสดง list จัดกลุ่มตามโฟลเดอร์
- [ ] Flat mode (เลือกโฟลเดอร์) → แสดง list ธรรมดา
- [ ] Search, tag filter, company filter ทำงานถูกต้องในมุมมอง List
- [ ] คลิกแถว → นำทางไป `/dashboard/view/{id}`

---

## งานย่อยที่ 5: ย่อ/ขยาย Folder Groups (Collapsible)

**เป้าหมาย**: ให้โฟลเดอร์ย่อ/ขยายได้ทั้ง Grid, Compact, และ List view

**ไฟล์ที่แก้ไข**:
- `app/components/features/GroupedDashboardGrid.vue`
- `app/components/features/GroupedDashboardList.vue`
- `app/pages/dashboard/discover.vue`

**ขึ้นอยู่กับ**: งานย่อยที่ 4 (ต้องมี GroupedDashboardList แล้ว)

**รายละเอียด**:

1. `GroupedDashboardGrid.vue` & `GroupedDashboardList.vue`:
   - Folder header คลิกได้ → toggle ย่อ/ขยาย
   - เพิ่มไอคอน chevron: ▼ = ขยาย, ▶ = ย่อ (หมุน 90° ด้วย CSS transition)
   - Props เพิ่ม: `collapsedFolders: Set<string>` — set ของ folder IDs ที่ย่ออยู่
   - Events เพิ่ม: `toggle-folder(folderId: string)` — emit เมื่อคลิก header
   - เมื่อย่อ: ซ่อนการ์ด/รายการ, แสดงเฉพาะ header + "N แดชบอร์ด" (badge จำนวนที่มีอยู่แล้ว)
   - Transition: ใช้ Vue `<Transition>` หรือ CSS `max-height` animation ~200ms

2. `discover.vue`:
   - เพิ่ม `collapsedFolders` reactive ref เป็น `Set<string>`
   - Default behavior:
     - ≤5 โฟลเดอร์ → ขยายทั้งหมด
     - >5 โฟลเดอร์ → ขยาย 3 แรก, ย่อที่เหลือ
   - เพิ่มปุ่ม "ขยายทั้งหมด | ย่อทั้งหมด" ในส่วน header (ดู Wireframe 1)
   - Handle `toggle-folder` event → เพิ่ม/ลบ folderId จาก collapsedFolders set
   - ส่ง `collapsedFolders` prop ไปยัง grouped components

**Wireframe อ้างอิง**: Wireframe 5 (Collapsible Folder Behavior)

```
  ▼ = ขยาย (กำลังแสดงการ์ด/รายการ)
  ▶ = ย่อ (ซ่อนการ์ด/รายการ แสดงเฉพาะ header + จำนวน)

  ┌──────────────────────────────────────────────┐
  │  📁 2024  [8]  ▼            ผู้ดูแล: Nattha  │  ← คลิกเพื่อย่อ
  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
  │  │card│ │card│ │card│ │card│  แสดง 1 แถว   │
  │  └────┘ └────┘ └────┘ └────┘               │
  ├──────────────────────────────────────────────┤
  │  📁 แดชบอร์ดหลัก  [12]  ▶   ผู้ดูแล: Somchai│  ← ย่ออยู่
  ├──────────────────────────────────────────────┤
  │  📁 Sales Reports  [5]  ▶   ผู้ดูแล: Ananya │  ← ย่ออยู่
  └──────────────────────────────────────────────┘
```

**การตรวจสอบ**:
- [ ] คลิก folder header → ย่อ/ขยาย smooth animation
- [ ] Chevron icon หมุนถูกต้อง (▼ ↔ ▶)
- [ ] เมื่อย่อ → แสดง header + badge จำนวน, ซ่อนการ์ด
- [ ] ปุ่ม "ขยายทั้งหมด" → ขยายทุกโฟลเดอร์
- [ ] ปุ่ม "ย่อทั้งหมด" → ย่อทุกโฟลเดอร์
- [ ] Default: >5 โฟลเดอร์ → 3 แรกขยาย ที่เหลือย่อ
- [ ] ทำงานทั้ง Grid, Compact, และ List view

---

## งานย่อยที่ 6: จำกัดจำนวนการ์ดต่อโฟลเดอร์

**เป้าหมาย**: แสดงสูงสุด 1 แถวต่อโฟลเดอร์ (4 การ์ดใน Grid, 6 ใน Compact) พร้อมลิงก์ "ดูทั้งหมด"

**ไฟล์ที่แก้ไข**:
- `app/components/features/GroupedDashboardGrid.vue`
- `app/components/features/GroupedDashboardList.vue`
- `app/pages/dashboard/discover.vue`

**ขึ้นอยู่กับ**: งานย่อยที่ 5 (ต้องมีระบบย่อ/ขยายแล้ว)

**รายละเอียด**:

1. `GroupedDashboardGrid.vue`:
   - เพิ่ม prop `maxPerFolder?: number` (default: undefined = ไม่จำกัด)
   - เมื่อมีค่า: slice dashboards ให้แสดง `maxPerFolder` ตัวแรก
   - ถ้ามีเกิน: แสดงลิงก์ "ดูทั้งหมด N แดชบอร์ด →"
     - Style: text color `--color-primary`, font `0.85rem`, padding-top `--spacing-sm`
     - คลิก → emit `view-folder(folderId)` event
   - ลิงก์แสดงเฉพาะเมื่อ dashboards.length > maxPerFolder

2. `GroupedDashboardList.vue`:
   - เพิ่ม prop `maxPerFolder?: number`
   - พฤติกรรมเดียวกัน: slice + ลิงก์ "ดูทั้งหมด"

3. `discover.vue`:
   - ส่ง `maxPerFolder` prop:
     - Grid mode: `4`
     - Compact mode: `6`
     - List mode: `8` (หรือไม่จำกัด — แถวเล็กมาก)
   - Handle `view-folder` event → `selectFolder(folderId)` เพื่อเปลี่ยนเป็น flat view ของโฟลเดอร์นั้น

**Wireframe อ้างอิง**: Wireframe 2 & 3 (ส่วน "ดูทั้งหมด")

```
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │  card 1  │ │  card 2  │ │  card 3  │ │  card 4  │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                    ดูทั้งหมด 8 แดชบอร์ด →     │
```

**การตรวจสอบ**:
- [ ] Grid grouped view → แสดงสูงสุด 4 การ์ด/โฟลเดอร์
- [ ] Compact grouped view → แสดงสูงสุด 6 การ์ด/โฟลเดอร์
- [ ] ลิงก์ "ดูทั้งหมด N แดชบอร์ด →" แสดงเมื่อมีเกิน
- [ ] คลิกลิงก์ → เปลี่ยนเป็น flat view ของโฟลเดอร์นั้น
- [ ] โฟลเดอร์ที่มีการ์ดน้อยกว่า limit → ไม่แสดงลิงก์

---

## งานย่อยที่ 7: ทดสอบ & ปรับแต่ง Responsive

**เป้าหมาย**: ตรวจสอบทุกมุมมองบน Desktop, Tablet, Mobile และปรับแต่งรายละเอียด

**ไฟล์ที่อาจแก้ไข**: ทุกไฟล์ที่สร้าง/แก้ไขในงานย่อยที่ 1-6

**ขึ้นอยู่กับ**: งานย่อยที่ 1-6 ทั้งหมด

**รายละเอียด**:

1. ทดสอบ Responsive breakpoints:
   - Desktop (>1024px): Grid 4 col / Compact 5-6 col / List full
   - Tablet (≤1024px): Grid 3 col / Compact 4 col / List full
   - Mobile (≤768px): Grid 1 col / Compact 2 col / List full (อาจซ่อน tags/company)

2. ทดสอบ Transition animations:
   - สลับ viewMode → crossfade 200ms opacity
   - ย่อ/ขยายโฟลเดอร์ → smooth height transition

3. ทดสอบการทำงานร่วมกับ filters:
   - Search + viewMode → ผลลัพธ์ถูกต้องทุกมุมมอง
   - Tag filter + viewMode → ทำงานถูกต้อง
   - Company filter + viewMode → ทำงานถูกต้อง

4. ทดสอบ Edge cases:
   - 0 dashboards → empty state ทุกมุมมอง
   - 1 dashboard → แสดงถูกต้อง
   - 50+ dashboards → ไม่มี performance issues ที่เห็นได้ชัด
   - ชื่อ dashboard ยาวมาก → truncate ถูกต้อง

5. ปรับแต่ง:
   - ระยะห่าง, font size, สี ให้สอดคล้องกันทุกมุมมอง
   - Loading state ทำงานถูกต้องทุกมุมมอง

**การตรวจสอบ**:
- [ ] Desktop: ทั้ง 3 มุมมองแสดงผลถูกต้อง
- [ ] Tablet: ทั้ง 3 มุมมอง responsive ถูกต้อง
- [ ] Mobile: ทั้ง 3 มุมมอง responsive ถูกต้อง
- [ ] Filters ทำงานถูกต้องทุกมุมมอง
- [ ] Empty state ถูกต้องทุกมุมมอง
- [ ] Transitions smooth ไม่กระตุก
- [ ] ไม่มี console errors

---

## ลำดับการทำงาน (Dependencies)

```
งานย่อยที่ 1 (View Mode Switcher)
    │
    ├── งานย่อยที่ 2 (Compact Card) ──────────┐
    │                                          │
    └── งานย่อยที่ 3 (List Components) ───┐    │
                                          │    │
            งานย่อยที่ 4 (List Wiring) ───┘    │
                    │                          │
            งานย่อยที่ 5 (ย่อ/ขยาย) ──────────┤
                    │                          │
            งานย่อยที่ 6 (จำกัดการ์ด) ─────────┘
                    │
            งานย่อยที่ 7 (ทดสอบ Responsive)
```

- งานย่อยที่ **2** และ **3** ทำ **ขนานได้** (ไม่พึ่งพากัน) หลังจากจบงานย่อยที่ 1
- งานย่อยที่ **4** ต้องรองานย่อยที่ 3
- งานย่อยที่ **5** ต้องรองานย่อยที่ 4
- งานย่อยที่ **6** ต้องรองานย่อยที่ 5
- งานย่อยที่ **7** ต้องรอทุกงานย่อย

---

## Decisions

- ใช้ "ย่อ/ขยาย" แทน "พับ/ขยาย" ตามคำขอ
- 3 มุมมอง: Grid / Compact / List
- Default viewMode = `grid` (คุ้นเคย), จำ preference ผ่าน localStorage
- Compact card: คลิกทั้งการ์ด (ไม่มีปุ่ม "เปิด →")
- ย่อ/ขยาย default: ≤5 โฟลเดอร์ขยายหมด, >5 โฟลเดอร์ขยาย 3 แรก
- Transition: 200ms crossfade สลับมุมมอง, 200ms height ย่อ/ขยาย
- Scope ไม่รวม: Virtual scrolling, pagination redesign, drag-and-drop

---

## เปรียบเทียบความสูงของหน้า (50 dashboards, 12 folders)

| มุมมอง | ความสูงการ์ด | คอลัมน์ | จำกัด/โฟลเดอร์ | ความสูงโดยประมาณ |
|--------|-------------|---------|----------------|------------------|
| Grid (ปัจจุบัน) | ~320px | 4 | ไม่จำกัด | ~16,000px |
| Grid + จำกัด 1 แถว | ~320px | 4 | 4 การ์ด | ~4,500px |
| Compact + จำกัด 1 แถว | ~160px | 6 | 6 การ์ด | ~2,400px |
| List | ~48px | 1 (full row) | ไม่จำกัด | ~2,900px |
| List + ย่อโฟลเดอร์ | ~48px | 1 | ขยาย 3 แรก | ~1,500px |
