# Archive

Retired code and one-off scripts, kept so they can be read without digging
through git history. Nothing here is built, imported, linted or tested:
Nuxt only scans `app/`, `eslint.config.mjs` ignores `archive/**`, and no
tsconfig or Vitest config includes it.

Paths under `code/` mirror where each file used to live. To bring one back,
`git mv` it to that path; it was last compiled against the commit that moved
it here (2026-10-02, branch `docs/round-2026-10-02`).

Finished plans and spikes are archived separately, as documents, in
[docs/OPERATIONS/archive/](../docs/OPERATIONS/archive/).

## code/

Nothing in `app/` rendered or called these. Found by scanning every component,
composable and util for a reference outside comments.

| File | What it was | Why it stopped being used |
|------|-------------|---------------------------|
| `app/components/features/FolderSidebar.vue` | Folder tree sidebar with accordion | Its only caller was `FolderAccordion`; the real sidebar is `UnifiedSidebar` → `AdminAccordion` |
| `app/components/layouts/FolderAccordion.vue` | "Manage Folders" accordion | No page rendered it after the Phase 5 sidebar redesign |
| `app/components/features/GroupedDashboardList.vue` | Folder-grouped list view for Discover | Replaced by `TreeDashboardList` (PR #124) |
| `app/components/features/FolderInfoCard.vue` | Folder summary card | No page renders it |
| `app/components/layouts/AuthLayout.vue` | Centered layout for auth pages | No page uses it |
| `app/components/ui/StatsCard.vue` | Generic stat card | Superseded by `dashboard/StatCard.vue` (`DashboardStatCard`) |
| `app/components/ui/ViewModal.vue` | Generic read-only detail modal | No page uses it; admin pages have their own (e.g. `GroupViewModal`) |
| `app/composables/usePaginatedList.ts` | Client-side pagination | Admin tables paginate through `useAdminCrudPage` / `DataTable` |
| `app/utils/schemas.ts` | Zod schemas | Nothing imports it |
| `app/composables/useLookerApi.ts` | Client for the Looker Studio API routes below (status, report search, sync) | Never worked on prod: none of its calls sent an auth token, so every one got 401 and the "Browse Reports" button it gated stayed hidden. Archived 2026-10-06 together with that button and its report-picker dialog in `LookerUrlInput.vue` |
| `server/api/looker/*.ts`, `server/api/looker/reports/[id].get.ts` | `/api/looker/status`, `/reports`, `/reports/:id`, `/sync` | Only `useLookerApi` called them. Whether the Looker Studio API returns reports to a service account was never measured |
| `server/utils/lookerStudioApi.ts` | Looker Studio API client (`datastudio.readonly`, service account) | Only the routes above used it |

## scripts/

| File | What it did | Status |
|------|-------------|--------|
| `migrate-sheet-full-mode.mjs` | Moved sheet dashboards from `interactive` to `full` | Ran on prod 2026-09-27 (3 dashboards); a re-run changes nothing |
| `spike-sheets-read.mjs` | Read a sheet through a service account | Spike for the option not chosen ([google-sheets-embed-plan.md](../docs/OPERATIONS/archive/google-sheets-embed-plan.md)) |
| `spike-sheets-addchart.mjs` | Added a chart to a sheet through the API | Same spike |

These scripts resolve `.env.local` and other files relative to `scripts/`.
To run one again, copy it back into `scripts/` first.

`scripts/spike-sheets-iframe.html` stayed in `scripts/`: it is still the
out-of-app test page in [google-sheets-embeds.md](../docs/REFERENCE/google-sheets-embeds.md).
