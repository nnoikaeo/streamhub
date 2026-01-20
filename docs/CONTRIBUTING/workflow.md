---
title: Contribution Workflow
version: 2.0
updated: 2024-01-21
---

# Contribution Workflow

How to contribute code to StreamHub using **Git Flow**.

## Git Flow Overview

StreamHub uses Git Flow branching model:

```
main (production)
  └── merge PRs from develop (release cycles)
  
develop (staging)
  └── merge PRs from feat/* (feature development)
  
feat/feature-name (development)
  └── create from develop
  └── merge back to develop via PR
```

---

## Step 1: Clone Repository

```bash
git clone https://github.com/nnoikaeo/streamhub.git
cd streamhub
npm install
```

---

## Step 2: Start from Develop

Always start new features from the `develop` branch:

```bash
git checkout develop
git pull origin develop
```

---

## Step 3: Create Feature Branch

Create a feature branch from `develop`:

```bash
git checkout -b feat/your-feature-name
```

**Branch naming conventions:**
- `feat/feature-name` - New feature
- `fix/bug-name` - Bug fix
- `docs/topic` - Documentation
- `refactor/area` - Code refactoring
- `perf/optimization` - Performance improvement

---

## Step 4: Make Changes

Edit files and test locally:

```bash
npm run dev

# In another terminal
npm run lint
```

---

## Step 5: Commit with Conventional Commits Format

Use meaningful commit messages following Conventional Commits:

```bash
git add .
git commit -m "feat(dashboard): add analytics page"
```

**Format:**
```
<type>(<scope>): <subject>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code formatting
- `refactor:` Code restructuring
- `perf:` Performance improvement
- `test:` Tests
- `chore:` Dependencies/build

**Examples:**
```bash
git commit -m "feat(dashboard): add analytics page"
git commit -m "fix(auth): handle OAuth timeout correctly"
git commit -m "docs: update installation guide"
git commit -m "refactor(components): simplify header logic"
```

---

## Step 6: Push Feature Branch

Push your feature branch to GitHub:

```bash
git push -u origin feat/your-feature-name
```

The `-u` flag sets up tracking (first time only).

---

## Step 7: Create Pull Request

1. Go to [StreamHub Repository](https://github.com/nnoikaeo/streamhub)
2. GitHub shows prompt: **"Compare & pull request"** - click it
3. **Verify PR settings:**
   - **Base:** `develop` (NOT main!)
   - **Compare:** `feat/your-feature-name`
4. Fill PR title and description:

```markdown
## Description
Brief description of what this PR does.

## Changes
- Added analytics page component
- Updated navigation to include analytics link
- Added documentation

## Type of Change
- [x] New feature
- [ ] Bug fix
- [ ] Documentation update

## Testing
Tested locally with `npm run dev`

## Checklist
- [x] Code follows style guide
- [x] Changes are focused and minimal
- [x] Documentation updated
- [ ] Tests added (if applicable)
```

5. Click **"Create pull request"**

---

## Step 8: Code Review & Approval

Your PR requires **at least 1 approval** before merging:

- Reviewers will check your code
- Address any feedback or questions
- Make additional commits if needed (automatically updates PR)
- Once approved, proceed to merge

---

## Step 9: Merge to Develop

Once approved, merge the PR:

```bash
# Option A: Merge via GitHub (recommended)
# Click "Merge pull request" → "Create a merge commit" → "Confirm merge"

# Option B: Merge via command line
git checkout develop
git pull origin develop
git merge feat/your-feature-name
git push origin develop
```

**Merge strategies:**
- **Create a merge commit** (recommended) - Preserves feature branch history
- **Squash and merge** - Single commit, clean history
- **Rebase and merge** - Linear history, advanced users

---

## Step 10: Cleanup

After merge, delete the feature branch:

```bash
# Delete locally
git branch -d feat/your-feature-name

# Delete on GitHub
git push origin --delete feat/your-feature-name

# Switch back to develop
git checkout develop
git pull origin develop
```

---

## Complete Workflow Example

Here's a complete example creating a Users page:

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feat/users-page

# 3. Create component
touch app/pages/dashboard/users.vue
# Edit file with Users page logic

# 4. Test locally
npm run dev
# Visit http://localhost:3000/dashboard/users

# 5. Commit
git add .
git commit -m "feat(users): add users management page"

# 6. Push
git push -u origin feat/users-page

# 7. Create PR on GitHub
# - Base: develop
# - Compare: feat/users-page
# - Add description

# 8. Wait for approval (1 required)

# 9. Merge via GitHub or CLI
git checkout develop
git pull origin develop
git merge feat/users-page
git push origin develop

# 10. Cleanup
git branch -d feat/users-page
git push origin --delete feat/users-page
```

---

## Tips for Success

✅ **DO:**
- Always start from `develop` branch
- Keep changes focused & small
- Write clear commit messages
- Test locally before pushing
- Update documentation if needed
- Be responsive to review feedback
- Use meaningful branch names

❌ **DON'T:**
- Push directly to `develop` (PRs required!)
- Mix multiple features in one PR
- Ignore linting errors
- Commit secrets (API keys, passwords)
- Force-push without good reason
- Leave feature branches hanging

---

## Common Workflows

### Adding a Feature

```bash
git checkout develop
git pull origin develop
git checkout -b feat/new-feature
# Make changes...
git add .
git commit -m "feat(scope): description"
git push -u origin feat/new-feature
# Create PR, get approval, merge, cleanup
```

### Fixing a Bug

```bash
git checkout develop
git pull origin develop
git checkout -b fix/bug-name
# Fix the bug...
git add .
git commit -m "fix(scope): description"
git push -u origin fix/bug-name
# Create PR, get approval, merge, cleanup
```

### Updating Documentation

```bash
git checkout develop
git pull origin develop
git checkout -b docs/topic
# Edit docs...
git add .
git commit -m "docs: description"
git push -u origin docs/topic
# Create PR, get approval, merge, cleanup
```

---

## Syncing With Develop

If `develop` has been updated while you're working:

```bash
# Fetch latest from GitHub
git fetch origin

# Rebase your branch on latest develop
git rebase origin/develop

# Force push your branch (safe, uses --force-with-lease)
git push origin feat/your-feature --force-with-lease
```

---

## Reverting a Commit

If you need to undo a commit:If you need to undo:

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
