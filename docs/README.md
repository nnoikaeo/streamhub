# StreamHub Documentation

Every document in `docs/` is listed on this page, and every link on it is checked in CI
(`npm run docs:links`). If a file is not here, it is not findable — adding a doc means adding
its row.

> Deep operational rules — deploy, error handling, Looker embed constraints — live in
> [CLAUDE.md](../CLAUDE.md) at the repo root, not here.

---

## Start here

1. [Installation & Setup](GETTING-STARTED/installation.md) — get it running locally
2. [Roles & Permissions](GUIDES/roles-and-permissions.md) — the access model everything else assumes
3. [Component Architecture](DESIGN/COMPONENT_ARCHITECTURE.md) — how a page is built here

---

## GETTING-STARTED — setup & onboarding

| Doc | Contents |
|---|---|
| [installation.md](GETTING-STARTED/installation.md) | `npm install`, `.env.local`, running the dev server |
| [setup-firebase.md](GETTING-STARTED/setup-firebase.md) | Creating and wiring the Firebase project |
| [first-deployment.md](GETTING-STARTED/first-deployment.md) | Walkthrough of a first deploy to Hosting |

## GUIDES — how the system behaves

| Doc | Contents |
|---|---|
| [roles-and-permissions.md](GUIDES/roles-and-permissions.md) | ⭐ RBAC, folder-level permissions, tag permissions, moderator dual-view, conflict detection |
| [database-schema.md](GUIDES/database-schema.md) | ⭐ Every Firestore collection and its fields |
| [PERMISSIONS_STORE.md](GUIDES/PERMISSIONS_STORE.md) | `usePermissionsStore()` API and usage examples |
| [authentication.md](GUIDES/authentication.md) | Google OAuth + Firebase Auth flow, redirect and `authDomain` caveats |
| [company-management.md](GUIDES/company-management.md) | Multi-company isolation pattern |

## DESIGN — how it looks and is assembled

| Doc | Contents |
|---|---|
| [COMPONENT_ARCHITECTURE.md](DESIGN/COMPONENT_ARCHITECTURE.md) | ⭐ 4-layer component system, auto-import conventions |
| [DESIGN_SYSTEM.md](DESIGN/DESIGN_SYSTEM.md) | CSS tokens, colors, spacing, theme |
| [user-flows.md](DESIGN/user-flows.md) | Journey maps per role |
| [MOCK_DATA_STRUCTURE.md](DESIGN/MOCK_DATA_STRUCTURE.md) | Shape of the JSON mock store used off Firestore |

### Wireframes (ASCII, page-level)

| Page | Wireframe |
|---|---|
| Sidebar | [sidebar-navigation.md](DESIGN/wireframes/sidebar-navigation.md) |
| Dashboard discover | [dashboard-discover-page.md](DESIGN/wireframes/dashboard-discover-page.md) |
| Dashboard view | [dashboard-view-page.md](DESIGN/wireframes/dashboard-view-page.md) |
| Explorer (admin + moderator) | [admin-explorer-page.md](DESIGN/wireframes/admin-explorer-page.md) |
| User management | [admin-user-management-page.md](DESIGN/wireframes/admin-user-management-page.md) |
| Company management | [admin-company-management-page.md](DESIGN/wireframes/admin-company-management-page.md) |
| Permission management | [admin-permission-management-page.md](DESIGN/wireframes/admin-permission-management-page.md) |
| Admin home | [admin-dashboard-home-page.md](DESIGN/wireframes/admin-dashboard-home-page.md) |
| Tag management + filter | [tag-management-page.md](DESIGN/wireframes/tag-management-page.md) |
| Moderator quick share | [moderator-quick-share-dialog.md](DESIGN/wireframes/moderator-quick-share-dialog.md) |

## ARCHITECTURE — system shape

| Doc | Contents |
|---|---|
| [overview.md](ARCHITECTURE/overview.md) | High-level component map |
| [tech-stack.md](ARCHITECTURE/tech-stack.md) | Nuxt, Vue, Firebase, Pinia, Tailwind versions |
| [folder-structure.md](ARCHITECTURE/folder-structure.md) | Directory layout and conventions |
| [data-flow.md](ARCHITECTURE/data-flow.md) | Client ↔ Firestore ↔ Functions data flow |

## OPERATIONS — running it

| Doc | Contents |
|---|---|
| [roadmap.md](OPERATIONS/roadmap.md) | ⭐ Phases, progress, what shipped in which PR |
| [deployment.md](OPERATIONS/deployment.md) | Deploy procedures, CI/CD, rollback |
| [manual-test-plan.md](OPERATIONS/manual-test-plan.md) | Manual QA cases by role, and the BUG-0xx register |
| [pre-launch-checklist.md](OPERATIONS/pre-launch-checklist.md) | A–E test groups, launch sign-off |
| [looker-sharing-policy.md](OPERATIONS/looker-sharing-policy.md) | Sharing rules for new Looker reports, and why the 30 existing ones cannot be fixed (BUG-032) |
| [versioning.md](OPERATIONS/versioning.md) | Version numbering policy |

### archive/ — finished plans, kept as history

Read these to learn *why* something is shaped the way it is. Do not copy code out of them:
the snippets predate the current types.

| Plan | Shipped as |
|---|---|
| [looker-embed-security-plan.md](OPERATIONS/archive/looker-embed-security-plan.md) | Embed proxy + AES-256-GCM token (BUG-031) |
| [company-access-control-plan.md](OPERATIONS/archive/company-access-control-plan.md) | `server/utils/companyAccess.ts` |
| [edit-user-form-plan.md](OPERATIONS/archive/edit-user-form-plan.md) | Groups multi-select + moderator folder picker in `UserForm.vue` |
| [discover-tree-view-groupby-plan.md](OPERATIONS/archive/discover-tree-view-groupby-plan.md) | Discover tree view + group-by (Phase 5.8) |
| [discover-redesign-tasks.md](OPERATIONS/archive/discover-redesign-tasks.md) | Discover compact + multi-view redesign |
| [looker-studio-api-plan.md](OPERATIONS/archive/looker-studio-api-plan.md) | Looker Studio API integration |
| [user-invitations-plan.md](OPERATIONS/archive/user-invitations-plan.md) | Invitation system |
| [firestore-invitations-plan.md](OPERATIONS/archive/firestore-invitations-plan.md) | Invitations moved onto Firestore |
| [phase6-implementation-plan.md](OPERATIONS/archive/phase6-implementation-plan.md) | Phase 6 enhancement & polish |
| [production-readiness-plan.md](OPERATIONS/archive/production-readiness-plan.md) | Prod/dev boundary hardening |

## CONTRIBUTING — working on it

| Doc | Contents |
|---|---|
| [workflow.md](CONTRIBUTING/workflow.md) | Git Flow: branch from `develop`, PR, back-merge to `main` |
| [coding-standards.md](CONTRIBUTING/coding-standards.md) | Vue/TS style, error handling, avoiding `any` |
| [code-review.md](CONTRIBUTING/code-review.md) | PR review checklist |
| [prompt-playbook.md](CONTRIBUTING/prompt-playbook.md) | How to prompt an AI agent for this repo |
| [skills-playbook.md](CONTRIBUTING/skills-playbook.md) | The skills in `.claude/skills/` and when to reach for each |

## REFERENCE & TROUBLESHOOTING

| Doc | Contents |
|---|---|
| [environment-variables.md](REFERENCE/environment-variables.md) | Every env var and where it is set |
| [common-issues.md](TROUBLESHOOTING/common-issues.md) | Known issues and their fixes |
| [faq.md](TROUBLESHOOTING/faq.md) | Frequently asked questions |

---

## By use case

| I want to… | Read |
|---|---|
| understand who can see what | [roles-and-permissions.md](GUIDES/roles-and-permissions.md), then [PERMISSIONS_STORE.md](GUIDES/PERMISSIONS_STORE.md) |
| work on tags | [database-schema.md § Tags](GUIDES/database-schema.md#7-tags-collection), [roles-and-permissions.md § Tag Permissions](GUIDES/roles-and-permissions.md#-tag-permissions), [tag-management-page.md](DESIGN/wireframes/tag-management-page.md) |
| add a page | [COMPONENT_ARCHITECTURE.md](DESIGN/COMPONENT_ARCHITECTURE.md) |
| change styling | [DESIGN_SYSTEM.md](DESIGN/DESIGN_SYSTEM.md) |
| understand the data model | [database-schema.md](GUIDES/database-schema.md) |
| ship a change | [workflow.md](CONTRIBUTING/workflow.md), then [deployment.md](OPERATIONS/deployment.md) |
| debug a Looker embed | [looker-sharing-policy.md](OPERATIONS/looker-sharing-policy.md), [common-issues.md](TROUBLESHOOTING/common-issues.md) |

---

## Single source of truth

One authoritative document per topic. If two documents disagree, this column wins.

| Topic | Source |
|---|---|
| Roles & permissions | [roles-and-permissions.md](GUIDES/roles-and-permissions.md) |
| Data model | [database-schema.md](GUIDES/database-schema.md) |
| Component system | [COMPONENT_ARCHITECTURE.md](DESIGN/COMPONENT_ARCHITECTURE.md) |
| Styling | [DESIGN_SYSTEM.md](DESIGN/DESIGN_SYSTEM.md) |
| Progress & history | [roadmap.md](OPERATIONS/roadmap.md) |
| Deploy & operational rules | [CLAUDE.md](../CLAUDE.md), [deployment.md](OPERATIONS/deployment.md) |
