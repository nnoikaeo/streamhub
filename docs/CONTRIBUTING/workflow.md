---
title: Contribution Workflow
version: 1.0
updated: 2024-01-21
---

# Contribution Workflow

How to contribute code to StreamHub.

## Step 1: Fork Repository

1. Go to [StreamHub Repository](https://github.com/nnoikaeo/streamhub)
2. Click **"Fork"** button (top right)
3. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/streamhub.git
cd streamhub
```

---

## Step 2: Create Feature Branch

```bash
git checkout -b feat/your-feature-name
```

**Branch naming:**
- `feat/feature-name` - New feature
- `fix/bug-name` - Bug fix
- `docs/topic` - Documentation
- `refactor/area` - Code refactoring

---

## Step 3: Make Changes

Edit files and test locally:

```bash
npm run dev

# In another terminal
npm run lint
```

---

## Step 4: Commit with Meaningful Messages

```bash
git add .
git commit -m "feat(auth): add two-factor authentication"
```

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code formatting
- `refactor:` Code restructuring
- `perf:` Performance
- `test:` Tests
- `chore:` Dependencies

**Example commits:**
```bash
git commit -m "feat(dashboard): add user analytics widget"
git commit -m "fix(auth): handle OAuth timeout correctly"
git commit -m "docs: update database schema guide"
```

---

## Step 5: Push to Your Fork

```bash
git push origin feat/your-feature-name
```

---

## Step 6: Create Pull Request

1. Go to [StreamHub Repository](https://github.com/nnoikaeo/streamhub)
2. Click **"New pull request"** or see prompt
3. Select **base:** main → **compare:** your-branch
4. Fill PR template:

```markdown
## Description
What changes did you make?

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update

## Testing
How did you test this?

## Checklist
- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
```

5. Click **"Create pull request"**

---

## Step 7: Code Review

- Maintainers review your code
- Address feedback if requested
- Rebase if needed:

```bash
git fetch origin
git rebase origin/main
git push origin feat/your-feature-name --force-with-lease
```

---

## Step 8: Merge

Once approved:
1. Maintainer merges PR
2. Your branch is deleted
3. Feature is deployed

---

## Tips for Success

✅ **DO:**
- Keep changes focused & small
- Write clear commit messages
- Add/update tests
- Update documentation
- Test thoroughly locally

❌ **DON'T:**
- Mix multiple features in one PR
- Rewrite large sections
- Ignore linting errors
- Commit secrets (API keys)
- Force-push without good reason

---

## Common Workflows

### Adding a Feature

```bash
# 1. Start
git checkout -b feat/new-dashboard-page

# 2. Create files
touch app/pages/dashboard/analytics.vue
touch docs/GUIDES/analytics.md

# 3. Implement
# Edit files, test locally

# 4. Commit
git add .
git commit -m "feat(dashboard): add analytics page"

# 5. Push & PR
git push origin feat/new-dashboard-page
# Create PR on GitHub
```

### Fixing a Bug

```bash
# 1. Start
git checkout -b fix/auth-timeout

# 2. Find & fix
# Edit app/composables/useAuth.ts

# 3. Test
npm run dev
# Manually test in browser

# 4. Commit
git add .
git commit -m "fix(auth): handle OAuth timeout gracefully"

# 5. Push & PR
git push origin fix/auth-timeout
```

### Updating Documentation

```bash
# 1. Start
git checkout -b docs/auth-guide

# 2. Edit docs
# Edit docs/GUIDES/authentication.md

# 3. Commit
git add .
git commit -m "docs: expand authentication guide with examples"

# 4. Push & PR
git push origin docs/auth-guide
```

---

## Syncing With Main

If main has updated while you're working:

```bash
# Fetch latest
git fetch origin

# Rebase on main
git rebase origin/main

# Force push your branch
git push origin feat/your-feature --force-with-lease
```

---

## Reverting a Commit

If you need to undo:

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo pushed commit (safe for public repos)
git revert <commit-hash>
git push origin feat/your-feature
```

---

## Questions?

- Ask in team Slack
- Comment on PR
- Create an issue

---

## See Also

- [Coding Standards](coding-standards.md)
- [Code Review](code-review.md)
