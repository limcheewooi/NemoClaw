# Agent Instructions

## Project Overview

NVIDIA NemoClaw is an open-source reference stack for running [OpenClaw](https://openclaw.ai) always-on assistants inside [NVIDIA OpenShell](https://github.com/NVIDIA/OpenShell) sandboxes more safely. It provides CLI tooling, a blueprint for sandbox orchestration, and security hardening.

**Status:** Alpha (March 2026+). Interfaces may change without notice.

## Agent Skills

This repo ships agent skills under `.agents/skills/`, organized into three audience buckets: `nemoclaw-user-*` (end users), `nemoclaw-maintainer-*` (project maintainers), and `nemoclaw-contributor-*` (codebase contributors). Load the `nemoclaw-skills-guide` skill for a full catalog and quick decision guide mapping tasks to skills.

## Architecture

| Path | Language | Purpose |
|------|----------|---------|
| `bin/` | JavaScript (CJS) | CLI launcher (`nemoclaw.js`) and small compatibility helpers |
| `src/lib/` | TypeScript | Core CLI logic: onboard, credentials, inference, policies, preflight, runner |
| `nemoclaw/` | TypeScript | Plugin project (Commander CLI extension for OpenClaw) |
| `nemoclaw/src/blueprint/` | TypeScript | Runner, snapshot, SSRF validation, state management |
| `nemoclaw/src/commands/` | TypeScript | Slash commands, migration state |
| `nemoclaw/src/onboard/` | TypeScript | Onboarding config |
| `nemoclaw-blueprint/` | YAML | Blueprint definition and network policies |
| `scripts/` | Bash/JS/TS | Install helpers, setup, automation, E2E tooling |
| `test/` | JavaScript (ESM) | Root-level integration tests (Vitest) |
| `test/e2e/` | Bash/JS | End-to-end tests (Brev cloud instances) |
| `docs/` | Markdown (MyST) | User-facing docs (Sphinx) |
| `k8s/` | YAML | Kubernetes deployment manifests |

## Quick Reference

| Task | Command |
|------|---------|
| Install all deps | `npm install && cd nemoclaw && npm install && npm run build && cd .. && cd nemoclaw-blueprint && uv sync && cd ..` |
| Build plugin | `cd nemoclaw && npm run build` |
| Watch mode | `cd nemoclaw && npm run dev` |
| Run all tests | `npm test` |
| Run plugin tests | `cd nemoclaw && npm test` |
| Run all linters | `make check` |
| Run all hooks manually | `npx prek run --all-files` |
| Type-check CLI | `npm run typecheck:cli` |
| Auto-format | `make format` |
| Build docs | `make docs` |
| Serve docs locally | `make docs-live` |

## Key Architecture Decisions

### Dual-Language Stack

- **CLI and plugin**: TypeScript (`src/`, `nemoclaw/src/`) with a small CommonJS launcher in `bin/`; ESM in `test/`
- **Blueprint**: YAML configuration (`nemoclaw-blueprint/`)
- **Docs**: Sphinx/MyST Markdown
- **Tooling scripts**: Bash and Python

The `bin/` directory uses CommonJS intentionally for the launcher and a few compatibility helpers so the CLI still has a stable executable entry point. The main CLI implementation lives in `src/` and compiles to `dist/`. The `nemoclaw/` plugin uses TypeScript and requires compilation.

### Testing Strategy

Tests are organized into three Vitest projects defined in `vitest.config.ts`:

1. **`cli`** — `test/**/*.test.{js,ts}` — integration tests for CLI behavior
2. **`plugin`** — `nemoclaw/src/**/*.test.ts` — unit tests co-located with source
3. **`e2e-brev`** — `test/e2e/brev-e2e.test.js` — cloud E2E (requires `BREV_API_TOKEN`)

When writing tests:

- Root-level tests (`test/`) use ESM imports
- Plugin tests use TypeScript and are co-located with their source files
- Mock external dependencies; don't call real NVIDIA APIs in unit tests
- E2E tests run on ephemeral Brev cloud instances

### Security Model

NemoClaw isolates agents inside OpenShell sandboxes with:

- Network policies (`nemoclaw-blueprint/policies/`) controlling egress
- Credential sanitization to prevent leaks
- SSRF validation (`nemoclaw/src/blueprint/ssrf.ts`)
- Docker capability drops and process limits

Security-sensitive code paths require extra test coverage.

## Code Style and Conventions

### Commit Messages

Conventional Commits required. Enforced by commitlint via prek `commit-msg` hook.

```text
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `merge`

### SPDX Headers

Every source file must include an SPDX license header. The pre-commit hook auto-inserts them:

```javascript
// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
```

For shell scripts use `#` comments. For Markdown use HTML comments.

### JavaScript

- `bin/` launcher and remaining `scripts/*.js`: **CommonJS** (`require`/`module.exports`), Node.js 22.16+
- `test/`: **ESM** (`import`/`export`)
- ESLint config in `eslint.config.mjs`
- Cyclomatic complexity limit: 20 (ratcheting down to 15)
- Unused vars pattern: prefix with `_`

### TypeScript

- Plugin code in `nemoclaw/src/` with its own ESLint config
- CLI type-checking via `tsconfig.cli.json`
- Plugin type-checking via `nemoclaw/tsconfig.json`

### Shell Scripts

- ShellCheck enforced (`.shellcheckrc` at root)
- `shfmt` for formatting
- All scripts must have shebangs and be executable

### No External Project Links

Do not add links to third-party code repositories, community collections, or unofficial resources. Links to official tool documentation (Node.js, Python, uv) are acceptable.

## Git Hooks (prek)

All hooks managed by [prek](https://prek.j178.dev/) (installed via `npm install`):

| Hook | What runs |
|------|-----------|
| **pre-commit** | File fixers, formatters, linters, Vitest (plugin) |
| **commit-msg** | commitlint (Conventional Commits) |
| **pre-push** | TypeScript type check (tsc --noEmit for plugin, JS, CLI) |

## Deploy Workflow (MANDATORY)

All changes to this fork follow a 4-branch promotion model with a 5-step gate. This process is **mandatory** — no change ships without it.

### Branch model

`dev` → `test` → `live` → `main`

| Branch | Role |
|--------|------|
| `dev`  | All changes land here first |
| `test` | Validation stage |
| `live` | Staging / pre-production |
| `main` | Stable / shipped |

### Versioning

- **SemVer** `MAJOR.MINOR.PATCH` stored in the `VERSION` file at repo root (single source of truth).
- Pre-1.0 (`0.x`) applies the same discipline as post-1.0.
- Bump rules:
  - `MAJOR` — breaking or incompatible change
  - `MINOR` — new feature, backwards-compatible
  - `PATCH` — bug fix, documentation, or refactor
- **Per-stage tags** on the same commit as it promotes (prefix `AGTF-v` namespaces our fork's tags away from upstream NVIDIA/NemoClaw's `v*`):
  `AGTF-v<X.Y.Z>-dev` → `AGTF-v<X.Y.Z>-test` → `AGTF-v<X.Y.Z>-live` → `AGTF-v<X.Y.Z>` (canonical at main)
- **Historical exception:** v0.0.1 (2026-04-21) used the unnamespaced `v0.0.1*` tags before upstream collision was addressed. From v0.0.2 onward, all tags use the `AGTF-v*` prefix.

### Release notes (mandatory)

Every version bump requires a release note at:

```
docs/release-notes/YYYYMMDDHHMM-Release-AGTF-v<VERSION>-<short-slug>.md
```

Must include the six sections defined in `docs/release-notes/TEMPLATE.md`:

1. Background
2. Reason
3. Changes
4. Smoke test results
5. Regression test results
6. Rollback

### 5-step gate

| Step | Action | Branch | Git operation |
|------|--------|--------|---------------|
| 1 | Edit files, bump VERSION, draft release note, run smoke + regression | dev (working tree) | **no commit** — stop for user choice |
| 2 | Commit to dev, tag `AGTF-v<X.Y.Z>-dev`, push | dev | commit + tag + push |
| 3 | Merge `dev` → `test` (`--ff-only`), tag `AGTF-v<X.Y.Z>-test`, push | test | merge + tag + push |
| 4 | Merge `test` → `live` (`--ff-only`), tag `AGTF-v<X.Y.Z>-live`, push | live | merge + tag + push |
| 5 | Merge `live` → `main` (`--ff-only`), tag `AGTF-v<X.Y.Z>`, push | main | merge + tag + push |

### Step 1 behavior (mandatory stop)

After Step 1 runs, the agent:

1. Shows a summary of what changed
2. Shows exact verification commands the user can run
3. Shows the release note draft
4. **Stops** and asks the user to pick target step 2–5 (or `abort`)

If the user iterates (more edits, corrections, additions) before choosing Step 2+, everything stays under the **same VERSION** and the **same release note** (updated in place). Version locks in only when Step 2 commits.

The agent runs every step up to and including the chosen target in one turn, then stops. It does **not** advance past the chosen target without fresh instruction.

### Commit gate + enforcement

`.git/hooks/pre-commit` enforces (in order):

1. `.commit-approved` marker must exist at repo root (user runs `touch .commit-approved` per commit to opt in). Marker is consumed on successful commit.
2. If any staged file lies outside `docs/release-notes/`, `VERSION` must also be staged.
3. A file matching `docs/release-notes/*-Release-AGTF-v<VERSION>-*.md` must exist on disk for the staged VERSION.

Do not bypass with `--no-verify` without explicit permission.

### Exemption

Commits that **only** modify files under `docs/release-notes/**` may omit the VERSION bump (so typos in already-shipped notes can be fixed, or retroactive notes added). All other changes — including other documentation — require a VERSION bump and a matching release note.

### Stage failure / rollback between stages

If validation fails at a stage (e.g., a smoke test fails on `test`), **do not** promote further. Either:

- Fix forward on `dev` with a new PATCH bump and re-run the gate
- Delete the affected stage tag and rollback: `git tag -d AGTF-v<X.Y.Z>-<stage> && git push origin :refs/tags/AGTF-v<X.Y.Z>-<stage>` then `git reset --hard <PREV>` on the affected branch

The canonical `AGTF-v<X.Y.Z>` tag exists only after Step 5 completes on `main`.

## Working with This Repo

### Before Making Changes

1. Read `CONTRIBUTING.md` for the full contributor guide
2. Run `make check` to verify your environment is set up correctly
3. Check that `npm test` passes before starting

### Common Patterns

**Adding a CLI command:**

- Entry point: `bin/nemoclaw.js` (launches the compiled CLI in `dist/`)
- Main CLI implementation lives in `src/lib/` and compiles to `dist/lib/`
- Add tests in `test/`

**Adding a plugin feature:**

- Source: `nemoclaw/src/`
- Co-locate tests as `*.test.ts`
- Build with `cd nemoclaw && npm run build`

**Adding a network policy preset:**

- Add YAML to `nemoclaw-blueprint/policies/presets/`
- Follow existing preset structure (see `slack.yaml`, `discord.yaml`)

### Gotchas

- `npm install` at root triggers `prek install` which sets up git hooks. If hooks fail, check that `core.hooksPath` is unset: `git config --unset core.hooksPath`
- The `nemoclaw/` subdirectory has its own `package.json`, `node_modules/`, and ESLint config — it's a separate npm project
- SPDX headers are auto-inserted by pre-commit hooks; don't worry about adding them manually
- Coverage thresholds are ratcheted in `ci/coverage-threshold-*.json` — new code should not decrease CLI or plugin coverage
- The `.claude/skills` symlink points to `.agents/skills` — both paths resolve to the same content

## Documentation

- Source of truth: `docs/` directory
- `.agents/skills/nemoclaw-user-*/*.md` is **autogenerated** — never edit directly
- After changing docs, regenerate skills:

  ```bash
  python3 scripts/docs-to-skills.py docs/ .agents/skills/ --prefix nemoclaw-user
  ```

- Follow style guide in `docs/CONTRIBUTING.md`

## PR Requirements

- Create feature branch from `main`
- Run `make check` and `npm test` before submitting
- Follow PR template (`.github/PULL_REQUEST_TEMPLATE.md`)
- Update docs for any user-facing behavior changes
- No secrets, API keys, or credentials committed
- Limit open PRs to fewer than 10
