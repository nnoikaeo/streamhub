---
title: Code Review Process
version: 2.0
updated: 2026-03-25
---

# Code Review Process

How we review pull requests **and** keep documentation up-to-date.

## For Authors

### Before Submitting PR

- [ ] Tests pass: `npm run lint && npm run build`
- [ ] No console errors/warnings
- [ ] Commit messages are clear
- [ ] PR description explains changes
- [ ] Code follows [Coding Standards](coding-standards.md)
- [ ] **Doc Check:** ถ้าเพิ่ม/แก้ component → อัปเดต [COMPONENT_ARCHITECTURE.md](../DESIGN/COMPONENT_ARCHITECTURE.md)
- [ ] **Doc Check:** ถ้าเปลี่ยน design token/CSS → อัปเดต [DESIGN_SYSTEM.md](../DESIGN/DESIGN_SYSTEM.md)
- [ ] **Doc Check:** ถ้าเพิ่ม API endpoint → อัปเดต [roadmap.md](../OPERATIONS/roadmap.md)

### During Review

- Be open to feedback
- Respond to comments promptly
- Ask questions if unclear
- Update code based on feedback

### If Rejected

- Don't take it personally
- Read feedback carefully
- Ask for clarification
- Make requested changes
- Re-request review

---

## For Reviewers

### What to Check

1. **Code Quality**
   - Follows coding standards
   - No obvious bugs
   - Good variable names
   - Proper error handling

2. **Testing**
   - Changes tested locally
   - No breaking changes
   - Edge cases considered

3. **Documentation**
   - Comments where needed
   - PR description clear
   - Docs updated if needed

4. **Performance**
   - No unnecessary re-renders
   - Efficient queries
   - No memory leaks

5. **Security**
   - No secrets exposed
   - Input validated
   - Firebase rules respected

### Review Process

```
1. Code Review (automated)
   - Linting checks
   - Build validation
   
2. Peer Review (manual)
   - Senior dev reviews code
   - Tests pass locally
   - Provides feedback
   
3. Approval
   - "Looks good to me" (LGTM)
   - Merge to main
```

### Providing Feedback

```
✅ GOOD FEEDBACK
"This query could be optimized by adding 
an index on the email field. See 
Firestore docs for details."

❌ BAD FEEDBACK
"This is inefficient"
```

---

## Review Checklist

- [ ] Code follows project conventions
- [ ] No console.log() left behind
- [ ] No console errors
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No security concerns
- [ ] Performance acceptable
- [ ] Commit messages clear

---

## 📄 Design Doc Review (Doc Drift Prevention)

Design docs ต้อง review เป็นรอบๆ เพื่อป้องกัน **doc drift** — เอกสารล้าสมัยไม่ตรงกับโค้ดจริง

### เมื่อไหร่ต้อง Review

| Trigger | ไฟล์ที่ต้องตรวจ |
|---------|----------------|
| **จบ Phase / Sprint** | ทุกไฟล์ (COMPONENT_ARCHITECTURE, DESIGN_SYSTEM, roadmap) |
| **เพิ่ม/ลบ Component** | [COMPONENT_ARCHITECTURE.md](../DESIGN/COMPONENT_ARCHITECTURE.md) |
| **เปลี่ยน CSS/Theme** | [DESIGN_SYSTEM.md](../DESIGN/DESIGN_SYSTEM.md) |
| **เพิ่ม API / Page** | [roadmap.md](../OPERATIONS/roadmap.md) |
| **ก่อน Release (develop→main)** | ทุกไฟล์ |

### Review Prompt (ใช้กับ Copilot)

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

### Phase Wrap-up Checklist

ทุกครั้งที่จบ Phase ให้ทำ:

- [ ] Review + อัปเดต COMPONENT_ARCHITECTURE.md (version bump)
- [ ] Review + อัปเดต DESIGN_SYSTEM.md (version bump)
- [ ] อัปเดต roadmap.md (mark phase completed)
- [ ] Archive completed plan docs → `docs/OPERATIONS/archive/`

---

## Approval & Merge

**Required:** 1 approval from maintainer

**Merging:**
```bash
# Maintainer merges (usually)
# Ensures clean history with rebase-and-merge
```

---

## Common Review Comments

### "Please rebase"

```bash
git fetch origin
git rebase origin/main
git push origin branch-name --force-with-lease
```

### "Add unit tests"

Create test file following pattern in guides.

### "Update docs"

Update relevant files in `docs/` folder.

---

## Disagreeing with Feedback

- Ask clarifying questions
- Provide reasoning
- Discuss in comments
- Maintainer makes final call

---

## Turnaround Time

- **Simple fixes:** 24 hours
- **Features:** 2-3 days
- **Large changes:** 1 week

---

## See Also

- [Workflow Guide](workflow.md)
- [Coding Standards](coding-standards.md)
