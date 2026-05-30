# AGENTS.md

## Pick the right boundary first

- This is a `pnpm@10.24.0` + Turborepo workspace; JS workspaces are only `apps/*` and `packages/*`.
- The final product is not frontend-only: top-level `make` builds web `dist` and then bundles it with the `wing` backend/submodule into a `daed` binary.
- Main entrypoints agents usually need:
  - Web app: `apps/web/src/main.tsx`
  - Web package scripts: `apps/web/package.json`
  - LSP node server: `packages/dae-lsp/src/server-node.ts`
  - LSP browser worker: `packages/dae-lsp/src/browser-server.ts`
  - VS Code extension: `packages/dae-vscode/src/extension.ts`
  - Editor package: `packages/dae-editor/src/index.ts`
- `apps/web/vite.config.ts` aliases `@daeuniverse/dae-node-parser` and `@daeuniverse/dae-editor` directly to package `src/`; app behavior may depend on package source even when package manifests point at `dist`.

## Commands agents often guess wrong

Run from `daed/` unless noted:

```bash
pnpm install
pnpm build
pnpm build:mock
pnpm dev
pnpm dev:mock
pnpm test
pnpm check-types
pnpm lint
SCHEMA_PATH=/path/or/url pnpm codegen
pnpm screenshot

pnpm --filter daed build
pnpm --filter daed dev
pnpm --filter daed test
pnpm --filter daed check-types

make
make clean
SKIP_SUBMODULES=1 make   # only when intentionally bypassing submodule update
```

- `pnpm lint` runs `eslint --fix .`; it mutates files.
- `pnpm screenshot` runs `pnpm build:mock` first, then `scripts/screenshot.ts`.
- `make` runs submodule setup, `pnpm i`, `pnpm build`, copies `apps/web/dist` to top-level `dist`, then calls `make bundle` inside `wing` with `WEB_DIST=../dist`.
- Full source bundle builds need Node/pnpm plus Go, Make, Clang/LLVM, and initialized submodules; frontend-only checks do not.

## Generated and bundled outputs

- GraphQL codegen is configured in `codegen.ts`; it reads `SCHEMA_PATH`, scans `apps/web/src/**/*`, and writes generated client files to `apps/web/src/schemas/gql/`.
- Files under `apps/web/src/schemas/gql/` are checked in but generated; edit schema/query sources and run `pnpm codegen` when intentionally updating them.
- `wing/graphql/service/config/global/generated_resolver.go` is a Makefile readiness target for the backend submodule flow; do not treat it as ordinary frontend source.
- Top-level `dist/`, `apps/web/dist/`, and `daed` are build outputs removed by `make clean`.

## Hooks and formatting

- Pre-commit hook runs `pnpm test` and `pnpm lint-staged`.
- Commit-msg hook runs `pnpm commitlint -e`; commit messages must follow Conventional Commits.
- `lint-staged` runs ESLint fixes on JS/TS/JSON and Prettier on JS/TS/MD/HTML/CSS/YAML/GraphQL.
- Prettier uses `printWidth: 120`, no semicolons, single quotes.
- ESLint ignores `wing` and `apps/web/src/schemas/**`; do not use lint silence as proof generated files are hand-maintained.

## Runtime and packaging gotchas

- Dashboard runtime is served on `http://localhost:2023`.
- If the dashboard is served over HTTPS, the `dae-wing` backend must also be HTTPS or browser mixed-content blocking will break requests.
- Docker runtime expects privileged host integration: `--privileged`, host network, host PID, `/sys` mounted, and `/etc/daed` mounted.
- `docs/getting-started.md` notes active proxying may break after sleep/hibernate or network switching; reboot can be required.
