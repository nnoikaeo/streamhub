# 🤝 Contributing to StreamHub

Help improve StreamHub! We use **Git Flow Workflow** for organized development.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/nnoikaeo/streamhub.git
   cd streamhub
   npm install
   ```

2. **Create a feature branch from `develop`**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature-name
   ```

3. **Make changes & commit**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push & create PR**
   ```bash
   git push -u origin feat/your-feature-name
   ```
   - **Base:** `develop` (not main!)
   - **Get 1+ approval** before merging

5. **Merge & cleanup**
   ```bash
   git checkout develop
   git merge feat/your-feature-name
   git push origin develop
   git branch -d feat/your-feature-name
   ```

## Full Guides

- 📖 [Workflow Guide](workflow.md) - Step-by-step contribution process
- 💻 [Coding Standards](coding-standards.md) - Code style & best practices
- 👀 [Code Review](code-review.md) - Review process & expectations

## Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production releases | ✅ PR required, 1+ approvals |
| `develop` | Staging/integration | ✅ PR required, 1+ approvals |
| `feat/*` | Feature development | ❌ None |

## Commit Message Format

```
<type>(<scope>): <subject>

feat(dashboard): add analytics page
fix(auth): handle timeout gracefully
docs: update installation guide
```

**Types:** feat, fix, docs, style, refactor, perf, test, chore

---

**Ready to contribute?** Read the [Workflow Guide](workflow.md) for detailed instructions!
