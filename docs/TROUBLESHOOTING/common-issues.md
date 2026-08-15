---
title: Common Issues
version: 1.1
updated: 2026-08-14
---

# Common Issues & Solutions

## Issue: "Port 3000 already in use"

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Use different port
npm run dev -- --port 3001

# Or kill process on port 3000
# macOS/Linux
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Issue: Firebase Credentials Not Working

**Error:** `Invalid API Key` or authentication fails

**Solution:**
1. Check `.env.local` file exists
2. Verify all keys are correct (copy-paste from Firebase Console)
3. Ensure no extra spaces or quotes
4. Restart dev server: `npm run dev`

---

## Issue: Google Sign-in Fails on Production (COOP)

**Error:** `Cross-Origin-Opener-Policy policy would block the window.close call`

**Cause:** `signInWithPopup` ไม่ทำงานบน production เพราะ Google's COOP header บล็อก cross-origin popup messaging

**Solution:** เปลี่ยนเป็น `signInWithRedirect` + `getRedirectResult` (ทำแล้วตั้งแต่ Phase 7)

โปรเจกต์นี้ใช้ redirect flow ดังนี้:
1. กด "ลงชื่อเข้าด้วย Google" → navigate ไปยัง Google โดยตรง
2. Google redirect กลับมาที่ `/login`
3. `onMounted` เรียก `handleRedirectResult()` → ดึง credential → navigate ไป `/dashboard`

---

## Issue: Google Sign-in Error 400: redirect_uri_mismatch

**Error:** `redirect_uri=https://streamhub-1c27a.web.app/__/auth/handler — Error 400: redirect_uri_mismatch`

**Cause:** `authDomain` ใน Firebase config ถูกเปลี่ยนเป็น `web.app` แต่ Google Cloud Console ยังไม่มี redirect URI ใหม่

**Solution:**
1. ไปที่ [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. แก้ OAuth 2.0 Client ID ที่ใช้อยู่
3. ใต้ **Authorized redirect URIs** → เพิ่ม `https://streamhub-1c27a.web.app/__/auth/handler`
4. Save

---

## Issue: Google Sign-in Popup Blocked (localhost)

**Error:** "Popup blocked" in browser

**Solution:**
- localhost ใช้ popup ได้ตามปกติ (ปัญหานี้เกิดเฉพาะ production ดูหัวข้อด้านบน)
- ถ้าถูกบล็อกบน localhost → Allow popups for localhost:3000 ใน browser settings

---

## Issue: "Page shows blank/white screen"

**Solution:**
1. Check browser console (F12) for errors
2. Verify dev server is running (`npm run dev`)
3. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)
4. Clear browser cache
5. Check `.nuxt/` folder exists

---

## Issue: TypeScript Errors in IDE

**Solution:**
```bash
# Restart TypeScript server (VS Code)
Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or regenerate types
npm run dev
# Wait for build to finish
```

---

## Issue: Hot Module Replacement (HMR) Not Working

**Error:** Changes don't auto-reload

**Solution:**
1. Check dev server terminal
2. Restart: `npm run dev`
3. Clear `.nuxt/` folder: `rm -rf .nuxt`
4. Reinstall: `npm install`

---

## Issue: Build Fails: "Cannot find module"

**Solution:**
```bash
# Clear build cache
rm -rf .nuxt .output node_modules

# Reinstall
npm install

# Build again
npm run build
```

---

## Issue: Middleware Not Protecting Routes

**Error:** Can access dashboard without logging in

**Solution:**
- Check middleware is defined in page: `definePageMeta({ middleware: 'auth' })`
- Verify auth store has correct state
- Check browser console for middleware logs

---

## Issue: Firestore Rules หมดอายุ — Login ไม่ได้

**อาการ:** Login สำเร็จแต่หน้าแรกแสดง "สิทธิ์การเข้าถึงถูกปฏิเสธ" หรือ console แสดง `Missing or insufficient permissions`

**สาเหตุ:** Firebase Firestore ใช้ "30-day trial rules" ที่หมดอายุอัตโนมัติ และ project ไม่มีไฟล์ `firestore.rules`

**วิธีแก้:**
1. ตรวจสอบ rules ปัจจุบันใน Firebase Console → Firestore → Rules
2. ถ้า rules มีข้อความ `allow read, write: if request.time < timestamp.date(...)` และวันที่ผ่านไปแล้ว → rules หมดอายุ
3. Deploy rules จาก `firestore.rules` ใน project root:
   ```bash
   firebase deploy --only firestore:rules --project streamhub-1c27a
   ```
4. CI **ไม่สามารถ** deploy rules ได้ (SA ขาดสิทธิ์ `firebaserules.googleapis.com`) ต้อง deploy มือเสมอ

---

## Issue: CI ล้มที่ `Build failed with status: EXPIRED`

**อาการ:** งาน Deploy to Firebase ล้ม ท้าย log เป็น

```
i  functions: updating Node.js 22 (2nd Gen) function server(us-central1)...
Build failed with status: EXPIRED and message: An unexpected error occurred.
⚠  functions: Deploys failed. Skipping deletes.
Error: There was an error deploying functions
```

**สาเหตุ:** ไม่ใช่ build error — `EXPIRED` คือ Cloud Build ค้างคิวจนหมดอายุก่อนได้เริ่ม เป็นอาการฝั่ง capacity ของ us-central1 ถ้าโค้ดพังจริงจะขึ้น `FAILURE` พร้อม log คอมไพล์แทน

**พิสูจน์ให้เห็นตัวเลข:**

```bash
npm run cloudbuild:status              # 15 build ล่าสุด พร้อมเวลารอคิว/เวลารัน
npm run cloudbuild:status -- <buildId> # รายละเอียด build เดียว (id อยู่ใน log ของ CI)
```

deploy ที่ปกติของโปรเจกต์นี้ **รอคิว ~1 วินาที รัน ~40 วินาที** ถ้าเห็น `queued ~600s / ran 0s / EXPIRED` แปลว่า build ไม่เคยได้ worker เลย — เป็นเรื่อง capacity ฝั่ง Google ไม่ใช่โค้ด และ `statusDetail` กับ `failureInfo` จะว่างทั้งคู่ (ถ้า build พังจริงจะมีข้อความอยู่ในนั้น)

**เช็คซ้ำอีกทาง:** ถ้า commit ที่ล้มไม่ได้แตะโค้ดแอปเลย (เช่น แก้แต่ docs) แล้วรอบก่อนหน้าสำเร็จ = ยืนยันว่าเป็นเรื่อง infra

```bash
git diff <live-revision> <HEAD> -- app server nuxt.config.ts package.json   # ว่าง = ไม่มีอะไรค้าง deploy
```

**prod พังไหม:** ไม่ — hosting deploy ไปแล้ว (`hosting: file upload complete` มาก่อนขั้น functions) ส่วน functions ที่ deploy ไม่สำเร็จจะ**คงเวอร์ชันเดิมไว้** ไม่ได้ถูกลบหรือทับ

**วิธีแก้:** rerun งานที่ล้ม ไม่ต้องแก้โค้ด

```bash
gh run list --branch main --limit 3
gh run rerun <run-id> --failed
gh run watch <run-id> --exit-status
```

**ตรวจว่า functions ยังมีชีวิต:**
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://streamhub-1c27a.web.app/
curl -s https://streamhub-1c27a.web.app/api/health    # 401 Unauthorized = function ตอบอยู่ ปกติ
```

> เกิดจริง 2026-08-04 บน commit d4f87d5 (docs อย่างเดียว) — rerun ผ่านทันทีโดยไม่แตะโค้ด

---

## Issue: Production แสดงโค้ดเก่าหลัง CI Deploy

**อาการ:** หลัง CI สำเร็จ แต่ browser ยังแสดง console error เก่า / UI ไม่อัปเดต แม้จะ Hard Refresh (Cmd+Shift+R) แล้ว

**สาเหตุ:** Vite chunk hash บน Linux (CI) กับ macOS (local) ต่างกัน บางครั้ง CI produce chunk ชื่อเดิมแต่ content ต่างกัน หรือ Firebase CDN ยังไม่ propagate

**วิธีตรวจสอบ:**
```bash
# เปรียบเทียบ entry chunk ระหว่าง production กับ local build
curl -s "https://streamhub-1c27a.web.app/" | grep -o '"#entry":"[^"]*"'
cat .output/public/index.html | grep -o '"#entry":"[^"]*"'
```

ถ้า hash ไม่ตรงกัน → production ยังใช้โค้ดเก่า

**วิธีแก้:** Deploy hosting จาก local:
```bash
bash scripts/deploy-hosting.sh
```

---

## Issue: `Firebase: Error (auth/invalid-api-key)` หลัง Deploy จาก Local

**อาการ:** หลัง deploy hosting จาก local เอง หน้า login แสดง blank/500 พร้อม error `Firebase: Error (auth/invalid-api-key)`

**สาเหตุ:** `generate-spa-index.mjs` ไม่ได้รับ env vars → เขียน `apiKey: ""` ลงใน index.html

**วิธีแก้:** ใช้ `scripts/deploy-hosting.sh` ซึ่งโหลด `.env.local` อัตโนมัติ แทนการ run คำสั่งแยก

```bash
# ✅ ถูกต้อง
bash scripts/deploy-hosting.sh

# ❌ อันตราย (ไม่มี env vars)
npm run build && firebase deploy --only hosting
```

---

## Issue: Firestore Rules Error

**Error:** "Permission denied" when accessing Firestore

**Solution:**
1. Go to Firebase Console → Firestore
2. Click "Rules" tab
3. Ensure rules match your use case
4. Test with Firestore Emulator locally

---

## Issue: CORS Error (Cross-Origin)

**Error:** `No 'Access-Control-Allow-Origin'`

**Solution:**
- This shouldn't happen with Firebase (handles CORS)
- Check if using custom API endpoint
- Verify origin is whitelisted

---

## Issue: Slow Performance / Lag

**Solution:**
1. Check network throttling in DevTools
2. Profile with Chrome DevTools (Performance tab)
3. Check Firestore queries are indexed
4. Reduce component re-renders with `computed` / `memo`

---

## Issue: GitHub Push Fails

**Error:** `Permission denied (publickey)`

**Solution:**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your@email.com"

# Add to GitHub account
cat ~/.ssh/id_ed25519.pub

# Go to GitHub Settings → SSH Keys → Add

# Test connection
ssh -T git@github.com
```

---

## Issue: Can't Log Out

**Error:** Logout button doesn't work

**Solution:**
- Check browser console for errors
- Verify `logout()` function is called
- Check Firebase session cleared

---

## Issue: แก้ไข "รหัสบริษัท (Code)" ใน `/admin/companies` ไม่ได้

**อาการ:** ช่อง Code เป็นสีเทา แก้ไม่ได้ในโหมดแก้ไข (ตอนสร้างใหม่แก้ได้)

**สาเหตุ:** ไม่ใช่บั๊ก — `code` คือ **document id ของ Firestore** (`useAdminCompanies` ตั้ง `idKey: 'code'` แล้ว `useAdminResource.create` เขียนด้วย `setDoc(docId=code)`) Firestore ไม่มีคำสั่ง rename document id ฟอร์มจึงล็อกไว้ เหมือน `slug` ของแท็กและ `code` ของ region

**วิธีเปลี่ยนรหัส:** ใช้สคริปต์ที่ทำ copy → repoint → delete ใน batch เดียว (atomic)

```bash
node scripts/migrate-company-code.mjs ORAY OAYT            # dry run — ไม่เขียนอะไร
node scripts/migrate-company-code.mjs ORAY OAYT --apply    # เขียนจริง
npm run audit:orphans                                       # ตรวจ dangling ref
```

สคริปต์จะ **ปฏิเสธที่จะรัน** ถ้าเจอ reference ที่มันย้ายไม่เป็น (dashboards / folders / groups ถือรหัสเก่าอยู่) และจะ**ไม่แก้** `invitations` (เป็นประวัติคำเชิญ) กับ `audit-log` (audit trail ต้องคงเดิม) — ทั้งสองอย่างถูกรายงานออกมาให้เห็นว่าเหลืออะไรไว้บ้าง

> ทำแบบเดียวกันด้วยมือได้ แต่ต้อง **ย้ายผู้ใช้ก่อนลบบริษัทเก่า** เสมอ ไม่งั้น `user.company` จะชี้ไปยังบริษัทที่ไม่มีอยู่ — `npm run audit:orphans` จับเคสนี้ให้ (check ข้อ 5)

---

## Issue: Zoom out ของเบราว์เซอร์ไม่มีผลกับแดชบอร์ด

**อาการ:** อยู่หน้า `/dashboard/view/[id]` กด `Cmd -` / `Ctrl -` แล้วแดชบอร์ดเหมือนเดิมเป๊ะ ทั้งที่ตัวเลข zoom ในเบราว์เซอร์เปลี่ยนเป็น 67%

**สาเหตุ:** ไม่ใช่บั๊ก — layout ของหน้านี้เป็นสัดส่วนล้วน (`.view-page` 100% → `.is-fullscreen` fixed inset 0 → `.embed-iframe` 100%) และ Looker Studio embed จะ **scale รายงานให้พอดีความกว้าง iframe เสมอ**

1. zoom out ทำให้ viewport (หน่วย CSS px) ใหญ่ขึ้น
2. iframe กว้างขึ้นตามสัดส่วนเดียวกัน
3. Looker ขยายรายงานกลับด้วยตัวคูณเดิม
4. ผลบนจอ = เท่าเดิม

สัดส่วนที่เห็น = `ความสูง container ÷ (ความกว้าง container × aspect ของรายงาน)` — ไม่ขึ้นกับระดับ zoom เลย

**วิธีแก้:** ใช้ **ปุ่ม zoom ในแอป** (`− / % / +`) ในแถบ header ของหน้า view (ช่วง 40–100%) — มันคงความกว้าง iframe ไว้เท่าเดิมแต่เพิ่มความสูงเป็น `100%/z` แล้ว `scale(z)` ลง ความสูงส่วนเกินจึงกลายเป็นแถวที่มองเห็นเพิ่ม ค่า zoom เก็บใน `localStorage` (`streamhub:embed-zoom`)

> ⚠️ ถ้าจะแก้โค้ดส่วนนี้: **ห้าม scale แบบสมมาตร** (ย่อทั้งกว้างและสูงด้วย `100%/z`) เพราะจะได้ผลเหมือน browser zoom คือไม่มีอะไรเปลี่ยน

**อยากได้พื้นที่แนวตั้งเพิ่ม:** กดปุ่ม "เต็มจอ" (Fullscreen API) — ออกด้วยปุ่ม "ย่อ" หรือ `Esc`

---

## Issue: `?company=` filter คืนลิสต์ว่างเสมอ (แก้แล้ว PR #359)

**อาการ:** เรียก `GET /api/mock/dashboards?company=STTH` แบบไม่ส่ง `uid` (เส้นทาง fallback ที่หน้า admin ใช้) แล้วได้ `data: []` ทุกบริษัท ทั้งที่มีแดชบอร์ดที่ให้สิทธิ์บริษัทนั้นอยู่จริง

**สาเหตุ:** handler เขียนว่า

```ts
filtered = filtered.filter((d) => d.access?.company?.[companyFilter])
```

`access.company` เป็น **array ของ company code** (`["STTH"]`) ไม่ใช่ map — index array ด้วยสตริงได้ `undefined` เสมอ ตัวกรองจึงตัดทุกแถวทิ้ง `server/utils/companyAccess.ts:122` ใช้ `.includes()` ถูกมาตลอด

**ทำไมไม่มีใครเห็น:** ข้อมูลในไฟล์นี้ถูก cast เป็น `any[]` ตัวตรวจสอบจึงเงียบสนิท bug โผล่ทันทีที่ใส่ type ให้ `readJSON<Dashboard>()` — ดู [Coding Standards § Avoiding `any`](../CONTRIBUTING/coding-standards.md#avoiding-any)

**แก้แล้ว:** เปลี่ยนเป็น `.includes(companyFilter)` ครอบด้วย `tests/server/dashboardsList.test.ts` (ยืนยันแล้วว่า test พังกับโค้ดเก่า)

> บทเรียน: `as any[]` บนผลลัพธ์ของ `readJSON` / `findById` ไม่ได้แค่ปิด type — มันปิดบั๊กด้วย ส่ง type argument ทุกครั้ง

---

## Issue: วันหมดอายุสิทธิ์ (`restrictions.expiry`) ไม่เคยทำงานบน Firestore (แก้แล้ว PR #364)

**อาการ:** quick-share แดชบอร์ดพร้อมตั้งวันหมดอายุให้ผู้ใช้ พอเลยวันนั้นไปแล้วผู้ใช้ยังเปิดแดชบอร์ดได้ตามปกติ ไม่มี error ไม่มี log

**สาเหตุ:** ค่าเดียวกันนี้มี 3 ร่าง แล้วโค้ดอ่านได้ร่างเดียว

| ที่ | ร่างของ `expiry[uid]` |
|---|---|
| `AccessRestrictions` (type) | `Date` |
| JSON store (`.data/*.json`) | ISO string |
| Firestore | `Timestamp` — `quickShareDashboard` เขียนด้วย `Timestamp.fromDate()` |

`useFirestoreService.checkAccess` อ่านกลับมาว่า

```ts
if (new Date() > new Date(expiryDate as any)) return false
```

`new Date(timestampObject)` ได้ `Invalid Date` ซึ่งเทียบกับอะไรก็ได้ `false` → ไม่เข้าเงื่อนไข → **ถือว่ายังไม่หมดอายุ → ปล่อยผ่าน** `resolveEffectiveUsers` ก็เทียบแบบเดียวกัน

**ทำไมไม่มีใครเห็น:** `as any` ตรงนั้นปิดปาก compiler ที่กำลังจะบอกว่า type กับ runtime ไม่ตรงกัน

**แก้แล้ว:** เพิ่ม `shared/utils/dates.ts` — `toDate()` / `isExpired()` อ่านได้ทั้ง `Date`, ISO string, epoch number, Firestore `Timestamp` และ Timestamp ที่ผ่าน JSON มาแล้ว (`{seconds}`) ใช้ที่ `useFirestoreService` และ `server/utils/companyAccess.ts` ครอบด้วย `tests/utils/dates.test.ts`

> ค่าที่อ่านไม่ออกถือว่า **ยังไม่หมดอายุ** โดยตั้งใจ — ข้อมูลเสียต้องไม่ล็อกผู้ใช้ออกจากแดชบอร์ดที่เขาได้สิทธิ์มาแล้ว

---

## Issue: สร้าง/แก้แดชบอร์ดที่ `/admin/dashboards` ได้แถวว่าง ข้าม validation (แก้แล้ว PR #365)

**อาการ:** กด "เพิ่มแดชบอร์ดใหม่" กรอกแค่ชื่อ ไม่เลือกโฟลเดอร์ กดบันทึก → ขึ้น toast "เพิ่มแดชบอร์ดเรียบร้อยแล้ว" แต่ในตารางได้แถวที่ชื่อ/โฟลเดอร์/เจ้าของเป็น `-` ทั้งหมด

**สาเหตุ:** หน้านี้ต่อ `@save` ของ `FormModal` เข้า `handleSaveDashboard` โดยตรง `FormModal` จึงส่ง payload ของตัวเอง คือ `Object.fromEntries(new FormData(form))` ไม่ใช่ค่าจากฟอร์ม และ `FormField` ตั้ง `name` ของ input เป็น `field-${Math.random().toString(36)}` payload จึงเป็น key สุ่มที่ไม่ตรงกับ field ไหนเลย เอกสารที่เขียนลง Firestore เหลือแต่ `defaults`:

```json
{ "type": "looker", "isArchived": false, "access": {…}, "restrictions": {…},
  "id": "dash_1786790982303" }
```

อีก 8 หน้า admin ต่อสายแบบ `@save="xFormRef?.submit()"` + `@submit="handleSave"` หน้านี้มีแค่ครึ่งหลัง `submit()` ที่ `DashboardForm` expose ไว้จึงไม่เคยถูกเรียก validation เลยไม่ทำงาน

**ทำไมไม่มีใครเห็น:** `FormModal` ประกาศ `save: [data?: any]` — `any` ทำให้ handler ที่รับ `Partial<Dashboard>` ต่อกับ payload คนละชนิดได้โดย compiler ไม่ทัก และหน้านี้เป็น orphan (ไม่มีในเมนู ต้องพิมพ์ URL เอง) คนจริงๆ สร้างแดชบอร์ดจาก `/admin/explorer` ซึ่งต่อสายถูกอยู่แล้ว

**แก้แล้ว:** ต่อสายให้เหมือนอีก 8 หน้า + `save` เปลี่ยนเป็น `Record<string, FormDataEntryValue>`

> บทเรียน: `any` บน payload ของ emit ปิดบั๊กที่ระดับ "ต่อสายผิดเส้น" ซึ่ง test suite ไม่มีทางจับ เพราะโค้ดทั้งสองฝั่งถูกต้องในตัวมันเอง

---

## Issue: ข้อความ error ค้างหลังแก้ค่าให้ถูกแล้ว (แก้แล้ว PR #367)

**อาการ:** `/admin/dashboards` → กด บันทึก โดยไม่เลือกโฟลเดอร์ → ขึ้น "โฟลเดอร์ is required" (ถูกต้อง) → เลือกโฟลเดอร์ → ข้อความแดงยังค้างอยู่ จนกว่าจะกด บันทึก อีกรอบ เกิดกับทุกฟอร์ม admin ไม่ใช่เฉพาะหน้านี้

**สาเหตุ:** `useForm` มีโค้ดล้าง error อยู่จริง แต่ผูกไว้กับ `setFieldValue`

```ts
const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
  formData[field] = value
  if (errors.value[field]) errors.value[field] = undefined   // ทางนี้
}
```

ทั้ง 7 ฟอร์มผูก `v-model="formData.folderId"` ซึ่ง compile เป็น `formData.folderId = $event` — assignment ตรงเข้า reactive proxy ทางนั้นจึงไม่เคยถูกเรียก ทั้งรีโปมี `CompanyForm.vue` ไฟล์เดียวที่เรียก `setFieldValue` และเรียกกับ `regionRole` / `sortOrder` ซึ่งไม่มี validator — โค้ดล้าง error จึงตายมาตั้งแต่วันแรก

**ทำไมไม่มีใครเห็น:** ไม่มี type error ไม่มี lint error ไม่มี log — ทั้งสองฝั่งถูกต้องในตัวมันเอง แค่ไม่ได้ต่อกัน และกด บันทึก ซ้ำอีกครั้งอาการก็หาย (`validateForm` เขียนทับ `errors.value` ทั้งก้อน) จึงดูเหมือนแค่จังหวะ UI

**แก้แล้ว:** `watch(formData, …, { deep: true })` ใน `useForm` แล้ว re-validate — แก้จุดเดียวครอบทั้ง 7 ฟอร์ม แทนการรื้อ `v-model` ~40 จุด

- แตะเฉพาะ field ที่มี error อยู่แล้ว → ไม่มีทางขึ้น error ให้ field ที่ผู้ใช้ยังไม่ submit/blur
- ยัง invalid → refresh ข้อความเป็น rule ที่ fail จริง ไม่ค้างข้อความเก่า
- error ที่ `validateForm` เพิ่งตั้ง ลบไม่ได้ — `formData` ไม่เปลี่ยน watcher จึงไม่ fire และต่อให้ fire `validate` ก็คืน error ตัวเดิม
- ไม่ diff key ที่เปลี่ยน เพราะ deep watch บน reactive object คืน proxy ตัวเดียวกันทั้ง new/old ต้องเก็บ snapshot เอง และ snapshot ตื้นก็ยังจับ `formData.tags.push()` ไม่ได้

ครอบด้วย `tests/composables/useForm.test.ts` 14 เคส (5 เคสแดงก่อนแก้)

> บทเรียน: helper ที่ "มีอยู่แล้ว" ไม่ได้แปลว่าถูกเรียก — `setFieldValue` ถูก export ครบ ดู reachable ทุกประการ แต่ `v-model` เลี่ยงมันได้ทั้งหมด ก่อนเชื่อว่า logic ทำงาน ให้ grep หา call site จริงก่อน

---

## Debugging Tips

### Enable Debug Logs

```typescript
// In browser console
localStorage.debug = '*'
```

### Check Firebase Initialization

```typescript
// In browser console
console.log(firebase.auth)
console.log(firebase.db)
```

### Inspect Pinia Store

```typescript
// In browser console
const store = useAuthStore()
console.log(store.$state)
```

---

## When Everything Fails

```bash
# Nuclear option: Clean slate
rm -rf node_modules .nuxt .output package-lock.json
npm install
npm run dev
```

---

## Getting Help

1. Check [FAQ](faq.md)
2. Search error message in Google
3. Check [GitHub Issues](https://github.com/nnoikaeo/streamhub/issues)
4. Ask in team Slack
5. Create new GitHub issue

---

## See Also

- [FAQ](faq.md)
- [Installation Guide](../../GETTING-STARTED/installation.md)
- [Setup Guide](../../GETTING-STARTED/setup-firebase.md)
