# StreamHub — instructions for AI assistants

The project's rules live in **[CLAUDE.md](../CLAUDE.md)** at the repo root, and every document is
indexed in **[docs/README.md](../docs/README.md)**. Read those; this file only points at them.

It used to hold the February 2026 scaffold notes (a different company name, `@nuxt/ui` and
Vee-Validate as if they were in use, and a "next steps" list finished long ago). Anything an
assistant read here was wrong, so it was cut down to this pointer on 2026-09-28.

Before any change, the short version:

- Branch from `develop`; PR to `develop`; `main` only by back-merge (it deploys)
- Verify: `npx eslint .` · `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json` · `npm test` — baselines in CLAUDE.md
- Caught errors are `unknown` — use `shared/utils/errors.ts`; never `any`
