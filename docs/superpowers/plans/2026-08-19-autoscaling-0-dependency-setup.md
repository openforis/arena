# Heroku Auto-Scaling — Dependency Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the in-progress `@openforis/arena-server` (`feat/auto-scaling` branch, sibling checkout `../arena-server`) fully consumable from `arena` — both the parts it already exports and the parts it doesn't yet — so the four downstream auto-scaling plans (cron dedup, chunked uploads, job queue, record concurrency) can build against it.

**Architecture:** Two independent fixes, in two different repos. (1) `../arena-server/src/index.ts` exports `ClusterBus` and `runWithClusterLock` already, but not `JobRepository`, `RecordSocketAssociationRepository`, or `ConnectedSocketRepository` — add those three exports, matching the existing `NodeDefRepository` export pattern. (2) `arena`'s `package.json` still resolves `@openforis/arena-server` from GitHub Packages at `^1.3.27`, which predates all of this work — repoint it at the sibling checkout via yarn's `portal:` protocol so `yarn install` picks up the local `feat/auto-scaling` code directly, without requiring a package publish.

**Tech Stack:** Yarn 4.17.1 (Berry), `portal:` protocol, TypeScript (arena-server), pg-promise.

## Global Constraints

- No Redis — Postgres-only (advisory locks + `LISTEN`/`NOTIFY`), per the design spec's decision table (`docs/superpowers/specs/2026-08-06-heroku-horizontal-autoscaling-design.md` §3).
- Both repos are checked out as siblings under the same parent directory: `arena` at `/home/stefano/dev/projects/openforis/arena`, `arena-server` at `/home/stefano/dev/projects/openforis/arena-server`, both on branch `feat/auto-scaling`.
- The `portal:` link is **temporary, for local development only**. Before this branch merges to `master`, `@openforis/arena-server` must be swapped back to a published semver range pointing at a real GitHub Packages release (matching the precedent already set by the "chore(deps): drop local arena-core portal and API feature-detect" commit in this repo's history). This swap is **not** a task in this plan — it happens once arena-server's own auto-scaling work is finished and released, tracked outside this plan.
- The portal-linked `@openforis/arena-server` resolves to its built `dist/` output, not its `src/`. Yarn does not re-run a portal dependency's build/prepare step on the consumer's `yarn install` — after any edit to arena-server's `src/`, run `yarn build` (or keep `yarn tsc:watch` running) in `../arena-server` before arena will see the change. When checking what's currently exported from arena-server, check `../arena-server/dist/index.d.ts` (what arena actually resolves), not `../arena-server/src/index.ts` (the source, which may be ahead of what's built).

---

### Task 1: Export the missing repositories from arena-server's package entry point

**Files:**
- Modify: `../arena-server/src/index.ts:44` (arena-server repo)

**Interfaces:**
- Consumes: nothing new — `JobRepository`, `RecordSocketAssociationRepository`, `ConnectedSocketRepository`, and the `JobRow` type already exist at `../arena-server/src/repository/job/index.ts`, `../arena-server/src/repository/recordSocketAssociation/index.ts`, `../arena-server/src/repository/connectedSocket/index.ts` and are already aggregated into `../arena-server/src/repository/index.ts`.
- Produces: `import { JobRepository, RecordSocketAssociationRepository, ConnectedSocketRepository } from '@openforis/arena-server'` and `import type { JobRow } from '@openforis/arena-server'` become valid from `arena`. Consumed by the job-queue-persistence and record-concurrency plans.

- [ ] **Step 1: Add the exports**

In `../arena-server/src/index.ts`, change line 44 from:

```ts
export { NodeDefRepository } from './repository'
```

to:

```ts
export { ConnectedSocketRepository, JobRepository, NodeDefRepository, RecordSocketAssociationRepository } from './repository'
export type { JobRow } from './repository'
```

- [ ] **Step 2: Verify the type re-export resolves**

`JobRow` is currently exported from `../arena-server/src/repository/job/index.ts:17` (`export type { JobRow } from './utils'`) but check that `../arena-server/src/repository/index.ts` also re-exports the type (it re-exports the value `JobRepository` at line 4 and the type `JobRow` at line 5: `export type { JobRow } from './job'` — confirm this line exists before assuming `export type { JobRow } from './repository'` in Step 1 will work). If `../arena-server/src/repository/index.ts` does not re-export the `JobRow` type, add `export type { JobRow } from './job'` there first.

- [ ] **Step 3: Type-check**

Run (in `../arena-server`): `yarn tsc`
Expected: no errors.

- [ ] **Step 4: Run the arena-server test suite**

Run (in `../arena-server`): `yarn test`
Expected: all existing tests pass (this is a pure export addition — no behavior changes, so nothing should break).

- [ ] **Step 5: Commit**

```bash
cd ../arena-server
git add src/index.ts
git commit -m "feat: export JobRepository, RecordSocketAssociationRepository, ConnectedSocketRepository from package entry point"
```

---

### Task 2: Point arena's dependency at the sibling checkout via yarn portal

**Files:**
- Modify: `package.json:124` (arena repo)
- Modify: `yarn.lock` (regenerated by `yarn install`, arena repo)

**Interfaces:**
- Consumes: Task 1's exports (verifies they're reachable through the portal link).
- Produces: every subsequent plan in this series can `import { ... } from '@openforis/arena-server'` and get the `feat/auto-scaling` code, not the published `1.3.27`.

- [ ] **Step 1: Repoint the dependency**

In `package.json`, change line 124 from:

```json
    "@openforis/arena-server": "^1.3.27",
```

to:

```json
    "@openforis/arena-server": "portal:../arena-server",
```

- [ ] **Step 2: Reinstall**

Run: `yarn install`
Expected: completes without error; `yarn.lock`'s `@openforis/arena-server` entry now resolves to `"portal:../arena-server::locator=arena%40workspace%3A."` (or similar portal locator) instead of the `npm.pkg.github.com` archive URL.

- [ ] **Step 3: Verify existing imports still resolve**

Run: `yarn build:test:unit`
Then: `jest dist/__tests__/bundle.unit.js`
Expected: all existing unit tests pass — this confirms every existing `@openforis/arena-server` import in `arena` (`DB`, `DBMigrator`, `WebSocketServer`, `WebSocketEvent`, `Schemata`, `ApiEndpoint`, `ApiAuthMiddleware`, `Requests`, `ArenaServer`, `ServerServiceType`, `SurveyDocxGenerator`, `SurveyPdfGenerator`, `BaseProtocol`) still resolves correctly through the portal link, and that the new `feat/auto-scaling` code in arena-server doesn't break arena's existing build.

- [ ] **Step 4: Smoke-test the new exports are reachable**

Create a throwaway file `/tmp/verify-exports.mjs` (not committed) with:

```js
import { JobRepository, RecordSocketAssociationRepository, ConnectedSocketRepository, ClusterBus, runWithClusterLock } from '@openforis/arena-server'
console.log(typeof JobRepository, typeof RecordSocketAssociationRepository, typeof ConnectedSocketRepository, typeof ClusterBus, typeof runWithClusterLock)
```

Run it from the `arena` repo root with a loader that understands the project's path aliases (or temporarily add a one-line test to any existing unit test file, run it, then revert) and confirm all five print `object`/`function` (not `undefined`). Delete the throwaway file afterward.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore(deps): link @openforis/arena-server to local checkout via yarn portal for auto-scaling work"
```
