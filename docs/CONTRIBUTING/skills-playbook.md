---
title: Skills Playbook — คู่มือใช้งาน AI Skills สำหรับ StreamHub
version: 1.0
updated: 2026-04-02
---

# Skills Playbook

คู่มือการใช้งาน **10 AI Skills** ที่ติดตั้งไว้ใน `.claude/skills/`
ใช้ได้ทั้ง **GitHub Copilot** และ **Claude Code**

---

## 📋 Skills ทั้งหมด

| #  | Skill | ใช้ทำอะไร | เรียกใช้ยังไง |
|----|-------|----------|--------------|
| 1  | `unit-test-vue-pinia` | เขียน unit test สำหรับ Vue/Pinia | "write unit tests for..." |
| 2  | `conventional-commit` | สร้าง commit message มาตรฐาน | "generate a commit message" |
| 3  | `git-commit` | วิเคราะห์ diff แล้ว commit อัตโนมัติ | "commit my changes" |
| 4  | `security-review` | สแกนหาช่องโหว่ในโค้ด | "security review this file" |
| 5  | `refactor` | ปรับปรุงโค้ดโดยไม่เปลี่ยน behavior | "refactor this code" |
| 6  | `create-implementation-plan` | สร้างแผนงาน implementation | "create an implementation plan for..." |
| 7  | `gh-cli` | ใช้ GitHub CLI ครบทุก command | "how to create a PR with gh" |
| 8  | `documentation-writer` | เขียน documentation ตาม Diátaxis | "write documentation for..." |
| 9  | `gdpr-compliant` | ตรวจสอบ GDPR compliance | "is this GDPR compliant?" |
| 10 | `quality-playbook` | สร้างระบบ quality testing ครบวงจร | "generate a quality playbook" |

---

## 🚀 Scenario 1: เขียน Unit Test ให้ Component

**ใช้ Skill:** `unit-test-vue-pinia`
**เมื่อไหร่:** เขียน component/composable/store ใหม่เสร็จ แล้วต้องเขียน test

### Step 1 — เปิดไฟล์ที่จะเขียน test

เปิดไฟล์ component ที่ต้องการ test เช่น `app/components/dashboard/DashboardCard.vue`

### Step 2 — บอก AI ให้เขียน test

```
write unit tests for DashboardCard.vue
```

AI จะ:
- อ่าน component → วิเคราะห์ behavior ที่ต้อง test
- ใช้ `createTestingPinia` + `vi.fn` เป็น default
- สร้าง test file ที่ `tests/components/DashboardCard.test.ts`

### Step 3 — ถ้าต้องการ test เฉพาะ Pinia store

```
write unit tests for the auth store
```

AI จะสร้าง pure store test แบบนี้:

```ts
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'

beforeEach(() => {
  setActivePinia(createPinia())
})

it('should login successfully', () => {
  const auth = useAuthStore()
  // test real store behavior...
})
```

### Step 4 — ถ้าต้องการ review test ที่เขียนเอง

```
review my unit test for this component
```

AI จะตรวจ:
- test behavior ไม่ใช่ implementation?
- ใช้ Pinia setup ที่ถูกต้อง?
- มี coverage gap ไหม?

---

## 🚀 Scenario 2: Commit Code ตาม Conventional Commits

**ใช้ Skill:** `git-commit`
**เมื่อไหร่:** เขียนโค้ดเสร็จ พร้อม commit

### Step 1 — Stage ไฟล์ที่ต้องการ

```bash
git add app/components/dashboard/DashboardCard.vue
git add tests/components/DashboardCard.test.ts
```

### Step 2 — ให้ AI สร้าง commit message จาก diff

```
commit my changes
```

AI จะ:
1. รัน `git diff --staged` เพื่อดูการเปลี่ยนแปลง
2. วิเคราะห์ type → `feat`, `fix`, `refactor` เป็นต้น
3. วิเคราะห์ scope → `dashboard`, `auth` เป็นต้น
4. สร้าง commit message แล้ว commit ให้อัตโนมัติ

**ผลลัพธ์ตัวอย่าง:**

```
feat(dashboard): add DashboardCard component with archive support
```

### Step 3 — ถ้าอยากกำหนดเอง

```
commit my changes with type fix and scope auth
```

---

## 🚀 Scenario 3: Security Review ก่อน PR

**ใช้ Skill:** `security-review`
**เมื่อไหร่:** ก่อนสร้าง PR หรือเมื่อเขียน feature ที่เกี่ยวกับ auth/data

### Step 1 — สแกนไฟล์เดียว

```
security review app/composables/useAuth.ts
```

### Step 2 — สแกนทั้งโฟลเดอร์

```
security review the server/ directory
```

### Step 3 — สแกนทั้งโปรเจกต์

```
run a full security review
```

AI จะทำ 8 ขั้นตอนอัตโนมัติ:
1. ระบุ scope + framework (Nuxt 4, Firebase)
2. ตรวจ dependencies → หา CVE
3. สแกน secrets → API keys, env ที่หลุด
4. สแกน vulnerabilities → XSS, injection, auth bypass
5. วิเคราะห์ data flow ข้าม files
6. ตรวจซ้ำ (self-verify) เพื่อลด false positive
7. สร้าง report แยกตาม severity (CRITICAL/HIGH/MEDIUM/LOW)
8. เสนอ patch สำหรับ CRITICAL และ HIGH

**ตัวอย่างผลลัพธ์:**

```
🔴 CRITICAL (0)  🟠 HIGH (1)  🟡 MEDIUM (2)  🔵 LOW (1)

HIGH-001: Hardcoded Firebase config exposed in client
  File: app/utils/firebase.ts:5
  Fix: Move to environment variables + .env.local
```

---

## 🚀 Scenario 4: Refactor โค้ดที่ซับซ้อน

**ใช้ Skill:** `refactor`
**เมื่อไหร่:** โค้ดเริ่มอ่านยาก, function ยาวเกินไป, มี code smell

### Step 1 — ชี้ไปที่โค้ดที่มีปัญหา

เปิดไฟล์แล้วพิมพ์:

```
refactor this composable — the function is too long
```

### Step 2 — AI วิเคราะห์ code smell

AI จะระบุปัญหา เช่น:
- **Long method** → แยก function
- **Duplicated code** → extract common logic
- **Nested conditionals** → guard clauses
- **Magic numbers** → named constants

### Step 3 — AI ทำ refactor ทีละ step

สิ่งสำคัญ: AI จะ **ไม่เปลี่ยน behavior** — แค่ปรับโครงสร้าง

```
Before: 1 function 200 บรรทัด
After:  5 functions แต่ละ function ทำหน้าที่เดียว
```

### ตัวอย่างสั่งเฉพาะเจาะจง

```
extract the validation logic into a separate function
```

```
improve type safety in useAdminUsers composable
```

```
remove dead code in this file
```

---

## 🚀 Scenario 5: สร้าง Implementation Plan สำหรับ Feature ใหม่

**ใช้ Skill:** `create-implementation-plan`
**เมื่อไหร่:** เริ่มทำ feature ใหม่ หรือ refactor ขนาดใหญ่

### Step 1 — บอก AI ว่าจะทำอะไร

```
create an implementation plan for adding user notification system
```

### Step 2 — AI สร้างแผนงาน structured

ไฟล์จะถูกสร้างใน `/plan/` directory ประกอบด้วย:

```markdown
---
goal: User Notification System
status: Planned
date_created: 2026-04-02
---

## 1. Requirements & Constraints
- REQ-001: Real-time notifications via Firestore
- SEC-001: Users see only their own notifications

## 2. Implementation Steps

### Phase 1: Data Model
| Task     | Description                        | Completed |
|----------|------------------------------------|-----------|
| TASK-001 | Create Firestore notifications col |           |
| TASK-002 | Define TypeScript types            |           |

### Phase 2: Backend
...

## 6. Testing
- TEST-001: Unit test notification store
- TEST-002: Integration test notification delivery
```

### Step 3 — ใช้แผนนี้เป็น tracking ระหว่างทำงาน

ทุกครั้งที่ทำ task เสร็จ → update ✅ ในตาราง

---

## 🚀 Scenario 6: ใช้ GitHub CLI ผ่าน AI

**ใช้ Skill:** `gh-cli`
**เมื่อไหร่:** ต้องการทำ GitHub operations จาก terminal

### ตัวอย่างที่ใช้บ่อย

**สร้าง PR:**
```
create a pull request from develop to main with title "Release: Phase 7"
```

AI จะรันคำสั่ง:
```bash
gh pr create --base main --head develop \
  --title "Release: Phase 7" \
  --body "Merge develop into main"
```

**ดู PR status:**
```
show me all open pull requests
```

```bash
gh pr list --state open
```

**สร้าง issue:**
```
create an issue for the login bug
```

```bash
gh issue create --title "Bug: Login not working" --label bug
```

**ดู workflow runs:**
```
show me the latest CI runs
```

```bash
gh run list --limit 5
```

---

## 🚀 Scenario 7: เขียน Documentation

**ใช้ Skill:** `documentation-writer`
**เมื่อไหร่:** ต้องเขียนเอกสารสำหรับ feature, API, หรือ guide

### Step 1 — บอก AI ว่าจะเขียนเอกสารอะไร

```
write a how-to guide for adding a new dashboard page
```

### Step 2 — AI ถามเพื่อ clarify

AI จะถามกลับมา:
1. **Document Type:** Tutorial / How-to / Reference / Explanation?
2. **Target Audience:** Developer ระดับไหน?
3. **Scope:** ครอบคลุมอะไรบ้าง?

### Step 3 — AI เสนอ outline ก่อน

```markdown
## Proposed Outline:
1. Prerequisites
2. Create the page file
3. Add route configuration
4. Connect to Firestore
5. Add to navigation
6. Test the page
```

### Step 4 — ยืนยันแล้ว AI เขียนให้เต็ม

พิมพ์ "approve" หรือ "go ahead" แล้ว AI เขียนเอกสารเต็มรูปแบบ

### ตัวอย่าง prompt อื่นๆ

```
write a reference doc for the useAuth composable
```

```
write a tutorial for setting up Firebase locally
```

---

## 🚀 Scenario 8: ตรวจสอบ GDPR Compliance

**ใช้ Skill:** `gdpr-compliant`
**เมื่อไหร่:** ทำงานกับ user data, auth, logging, หรือ analytics

### ตัวอย่างที่ 1 — ตรวจ data model

```
is this Firestore user schema GDPR compliant?
```

AI จะตรวจ:
- ✅ มี `createdAt`, `retentionExpiresAt` ไหม?
- ✅ collect เฉพาะข้อมูลที่จำเป็นไหม?
- ✅ มี purpose documented ไหม?
- ❌ เก็บข้อมูลเกิน retention period ไหม?

### ตัวอย่างที่ 2 — ตรวจ API endpoint

```
review this API for GDPR compliance
```

AI จะตรวจตาม checklist:
- PII ไม่อยู่ใน URL path?
- Authenticated ทุก endpoint ที่ return personal data?
- Ownership check มีไหม?
- Log ไม่มี password/token?

### ตัวอย่างที่ 3 — ตรวจ PR

```
GDPR review my changes before I submit this PR
```

---

## 🚀 Scenario 9: สร้าง Quality System ครบวงจร

**ใช้ Skill:** `quality-playbook`
**เมื่อไหร่:** ต้องการสร้างระบบ testing และ quality standards ให้โปรเจกต์

### ⚠️ Skill นี้ใหญ่ — ควรทำเมื่อมีเวลาเพียงพอ

### Step 1 — สั่งสร้าง quality playbook

```
generate a quality playbook for this project
```

### Step 2 — AI สำรวจ codebase (Phase 1)

AI จะอ่านทุกอย่างก่อน:
- README, docs, package.json
- โครงสร้าง directory
- Test ที่มีอยู่
- Defensive code patterns (try/catch, null checks)
- Schema/types

### Step 3 — AI สร้าง 6 ไฟล์ (Phase 2)

```
quality/
├── QUALITY.md              ← Quality constitution
├── test_functional.test.ts ← Functional tests
├── RUN_CODE_REVIEW.md      ← Code review protocol
├── RUN_INTEGRATION_TESTS.md← Integration test protocol
└── RUN_SPEC_AUDIT.md       ← Spec audit protocol (Council of Three)
AGENTS.md                   ← AI bootstrap file
```

### Step 4 — AI แสดงสรุป (Phase 4)

```
| File               | Key Metric      | Confidence |
|--------------------|-----------------|------------|
| QUALITY.md         | 10 scenarios    | High       |
| Functional tests   | 47 passing      | High       |
| RUN_CODE_REVIEW.md | 8 focus areas   | High       |
```

---

## 🚀 Scenario 10: Commit Message ด้วย Conventional Format

**ใช้ Skill:** `conventional-commit`
**เมื่อไหร่:** ต้องการเข้าใจ format ของ conventional commit

### Quick Reference

```
<type>(scope): description

[body]

[footer]
```

| Type       | ใช้เมื่อ                    |
|------------|----------------------------|
| `feat`     | เพิ่ม feature ใหม่          |
| `fix`      | แก้ bug                    |
| `docs`     | แก้ document เท่านั้น       |
| `style`    | format โค้ด (ไม่เปลี่ยน logic) |
| `refactor` | refactor (ไม่ใช่ feat/fix)  |
| `test`     | เพิ่ม/แก้ test              |
| `chore`    | maintenance ทั่วไป          |

### ตัวอย่าง prompt

```
generate a conventional commit message for my staged changes
```

---

## 💡 Tips สำหรับมือใหม่

### 1. ไม่ต้องจำชื่อ skill

แค่พิมพ์สิ่งที่ต้องการทำ — AI จะเลือก skill ที่เหมาะสมให้เอง:

| พิมพ์แบบนี้ | AI เลือก Skill |
|------------|----------------|
| "write tests for this store" | `unit-test-vue-pinia` |
| "commit my changes" | `git-commit` |
| "is this secure?" | `security-review` |
| "clean up this code" | `refactor` |
| "create a plan for..." | `create-implementation-plan` |

### 2. รวม skills เข้าด้วยกันใน workflow

**ตัวอย่าง: Feature Development Flow**

```
1. "create an implementation plan for user notifications"
   → create-implementation-plan

2. เขียนโค้ดตามแผน...

3. "write unit tests for the notification store"
   → unit-test-vue-pinia

4. "refactor the notification composable"
   → refactor

5. "security review the notification feature"
   → security-review

6. "commit my changes"
   → git-commit

7. "create a PR from develop to main"
   → gh-cli
```

### 3. ถ้า AI ไม่เข้าใจ — ให้ context เพิ่ม

```
❌ "test this"
✅ "write unit tests for the useAuth composable using Vitest and Pinia"
```

```
❌ "make it better"
✅ "refactor this function — extract the validation logic into a separate function"
```

### 4. ใช้กับ Copilot Chat vs Claude Code

| Feature | GitHub Copilot | Claude Code |
|---------|---------------|-------------|
| เรียก skill | พิมพ์ใน Chat panel | พิมพ์ใน terminal/chat |
| อ่าน context | ต้องเปิดไฟล์ หรือ `#file` | อ่าน workspace อัตโนมัติ |
| รัน command | ต้อง confirm ก่อนรัน | รันได้เลย (ถ้า allow) |
| แก้ไฟล์ | ผ่าน diff preview | แก้ตรงได้เลย |

---

## � แนวทางปฏิบัติเมื่อเจอ Bug จากการ Test

เมื่อรัน test แล้วเจอ bug ให้ทำตาม flow นี้ โดยใช้ skills ร่วมกัน:

```
┌─────────────────────────────────────────────────────────┐
│  1. วิเคราะห์ Bug                                        │
│     → อ่าน error message + stack trace                   │
│     → ระบุไฟล์และบรรทัดที่มีปัญหา                          │
├─────────────────────────────────────────────────────────┤
│  2. แก้ไข Root Cause                                     │
│     → ถ้าโค้ดซับซ้อน ใช้ refactor skill ช่วยปรับโครงสร้าง   │
│     → ถ้าเกี่ยวกับ auth/data ให้ security-review ด้วย      │
├─────────────────────────────────────────────────────────┤
│  3. เขียน Regression Test                                │
│     → ใช้ unit-test-vue-pinia เขียน test ครอบ bug         │
│     → test ต้อง FAIL ก่อนแก้ และ PASS หลังแก้              │
├─────────────────────────────────────────────────────────┤
│  4. รัน Test Suite ทั้งหมด                                │
│     → npx vitest run เพื่อยืนยันว่าไม่มี side effect       │
├─────────────────────────────────────────────────────────┤
│  5. Commit ด้วย fix type                                 │
│     → ใช้ git-commit skill → type: fix                   │
│     → ตัวอย่าง: fix(dashboard): prevent crash on null    │
└─────────────────────────────────────────────────────────┘
```

### Step 1 — วิเคราะห์ Bug

วาง error message ให้ AI แล้วถาม:

```
I got this test error, help me analyze:

FAIL tests/composables/useAuth.test.ts
  ✕ should redirect after login (15ms)
  TypeError: Cannot read properties of undefined (reading 'uid')
```

AI จะ:
- ระบุ root cause (เช่น mock ไม่ครบ, null check ขาด)
- ชี้ไฟล์และบรรทัดที่ต้องแก้
- อธิบายว่าทำไมถึง fail

### Step 2 — แก้ไข Root Cause

```
fix this bug based on your analysis
```

AI จะแก้โค้ดให้ตรงจุด ถ้าโค้ดรอบข้างซับซ้อน สามารถสั่งเพิ่ม:

```
refactor this function while fixing the bug
```

> **⚠️ ถ้า bug เกี่ยวกับ auth, permissions, หรือ user data:**
>
> ```
> security review the fix I just made
> ```
>
> ใช้ `security-review` skill ตรวจสอบว่า fix ไม่สร้างช่องโหว่ใหม่

### Step 3 — เขียน Regression Test

```
write a regression test that covers this bug
```

AI จะใช้ `unit-test-vue-pinia` skill สร้าง test ที่:
- จำลองสถานการณ์ที่ทำให้เกิด bug
- ยืนยันว่า fix ทำงานถูกต้อง
- ป้องกันไม่ให้ bug กลับมา

**ตัวอย่าง regression test:**

```ts
it('should handle null user gracefully after login', () => {
  // จำลองสถานการณ์ที่ Firebase return null user
  const store = useAuthStore()
  store.user = null

  // ต้องไม่ throw error
  expect(() => store.getDisplayName()).not.toThrow()
  expect(store.getDisplayName()).toBe('')
})
```

### Step 4 — รัน Test Suite ทั้งหมด

```bash
npx vitest run
```

หรือสั่ง AI:

```
run all tests to check for side effects
```

ตรวจสอบว่า:
- ✅ test ที่เขียนใหม่ PASS
- ✅ test เดิมทั้งหมด PASS (ไม่มี regression)

### Step 5 — Commit ด้วย fix type

```
commit my changes
```

AI จะ detect จาก diff ว่าเป็น bug fix แล้วสร้าง commit message:

```
fix(auth): handle null user after Firebase login

- Add null check before accessing user.uid
- Return empty string for display name when user is null
- Add regression test for null user scenario
```

### สรุป Skills ที่ใช้ในแต่ละ step

| Step | Action | Skill |
|------|--------|-------|
| 1 | วิเคราะห์ error | _(AI วิเคราะห์เอง)_ |
| 2 | แก้โค้ด | `refactor` (ถ้าซับซ้อน) |
| 2+ | ตรวจ security | `security-review` (ถ้าเกี่ยวกับ auth/data) |
| 3 | เขียน regression test | `unit-test-vue-pinia` |
| 4 | รัน test suite | _(terminal command)_ |
| 5 | Commit | `git-commit` |

---

## �📁 ตำแหน่ง Skills

```
.claude/skills/
├── unit-test-vue-pinia/
│   ├── SKILL.md
│   └── references/pinia-patterns.md
├── conventional-commit/SKILL.md
├── git-commit/SKILL.md
├── security-review/
│   ├── SKILL.md
│   └── references/ (5 files)
├── refactor/SKILL.md
├── create-implementation-plan/SKILL.md
├── gh-cli/SKILL.md
├── documentation-writer/SKILL.md
├── gdpr-compliant/
│   ├── SKILL.md
│   └── references/ (2 files)
└── quality-playbook/
    ├── SKILL.md
    └── references/ (7 files)
```
