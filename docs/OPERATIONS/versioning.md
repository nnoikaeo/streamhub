---
title: Version Management
---

# Version Management

## What identifies a version today

Nothing semantic. Stating it plainly so nobody goes looking for a scheme that is not there:

| | State |
|---|---|
| Git tags | **none** — `git tag` is empty |
| GitHub releases | **none** |
| `version` in [package.json](../../package.json) | **absent** |
| `/api/health` → `version` | reports `process.env.npm_package_version \|\| 'unknown'`, so always **`unknown`** |

A deployed build is identified by **the commit on `main`**, and a change is referred to by its
**PR number** — which is how [roadmap.md](roadmap.md) and the BUG register in
[manual-test-plan.md](manual-test-plan.md) already track work ("fixed in PR #351"). That
convention works and is used consistently. The gap is only that it is invisible from a running
deployment: open `/admin/health` and the version field says `unknown`.

## The smallest fix, if this is worth closing

Add `"version"` to `package.json` and bump it in the back-merge to `main`. `/api/health` picks
it up with no code change, because it already reads `npm_package_version`. Tags and releases
can follow later or never.

Until someone does that, do not cite a version number in a bug report — cite the commit or the
PR.

## If semantic versioning is adopted

`MAJOR.MINOR.PATCH`, the ordinary meanings: breaking / feature / fix. Tag on `main` only, after
the back-merge, never on `develop`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Branching and merge order are in [workflow.md](../CONTRIBUTING/workflow.md); deploy behaviour
is in [deployment.md](deployment.md) — note that any push to `main` deploys both hosting and
functions, so a tag push on its own is harmless but a version bump commit is a deploy.
