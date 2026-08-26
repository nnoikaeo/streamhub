---
title: Version Management
---

# Version Management

## What identifies a build

| | State |
|---|---|
| `version` in [package.json](../../package.json) | **`1.0.0`** — the first value the field has ever had |
| `/api/health` → `version` | reports that value, baked in at build time |
| Git tags | none |
| GitHub releases | none |

A deployed build is identified by **the commit on `main`**, and a change is referred to by its
**PR number** — which is how [roadmap.md](roadmap.md) and the BUG register in
[manual-test-plan.md](manual-test-plan.md) already track work ("fixed in PR #351"). That
convention works; keep using it in bug reports.

The version number is now a second, coarser handle: open `/admin/health` and it says which
release is live. It only tells the truth if someone bumps it.

## Bumping it

Edit `version` in `package.json` on the release branch, before the back-merge to `main`.
Nothing else to do — [nuxt.config.ts](../../nuxt.config.ts) reads the file at build time and
publishes it as `runtimeConfig.public.appVersion`, and `/api/health` reads that.

> Do **not** reintroduce `process.env.npm_package_version`. npm only sets that variable when
> npm starts the process. The deployed Cloud Function is started by the Functions runtime, so
> the variable is absent and the endpoint reported `unknown` on every deploy from the day it
> was written until this was fixed. A regression test in
> `tests/server/healthEndpoint.test.ts` holds the line.

`MAJOR.MINOR.PATCH`, the ordinary meanings: breaking / feature / fix.

## Tags and releases

Not adopted. If they are, tag on `main` only, after the back-merge, never on `develop`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Branching and merge order are in [workflow.md](../CONTRIBUTING/workflow.md); deploy behaviour
is in [deployment.md](deployment.md) — any push to `main` deploys both hosting and functions,
so a tag push on its own is harmless but a version bump commit is a deploy.
