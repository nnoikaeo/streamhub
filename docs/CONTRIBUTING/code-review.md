---
title: Code Review Process
version: 1.0
updated: 2024-01-21
---

# Code Review Process

How we review pull requests.

## For Authors

### Before Submitting PR

- [ ] Tests pass: `npm run lint && npm run build`
- [ ] No console errors/warnings
- [ ] Commit messages are clear
- [ ] PR description explains changes
- [ ] Code follows [Coding Standards](coding-standards.md)

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
