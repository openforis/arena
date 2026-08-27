# Job / JobBase Unification — Design Spec

Date: 2026-08-27
Repos affected: `arena-core` (branch `refactor/job2`, unreleased) and `arena` (this repo, branch
`fix/arena-mobile-data-import-errors`)

## Problem

Arena's background job system (`server/job/job.js`, `Job`) and `@openforis/arena-core`'s `JobBase`
are two independent implementations of essentially the same abstract task-runner. `Job` predates
`JobBase` and has accumulated years of production behavior (83 subclasses across the codebase);
`JobBase` is a newer, from-scratch rewrite that currently has no production subclasses of its own
(only test fixtures in `arena-server`'s `JobServer`). `Job` already imports `arena-core`'s
`SystemError` for an `instanceof` check on failure, and has an unused, uncommitted `JobBase` import
sitting in `server/job/job.js` right now — the two class hierarchies are otherwise unrelated.

This duplication means fixes to job behavior (e.g. the in-flight "continue past a failed inner job"
need for Arena Mobile data import error handling) have to be reasoned about only against `Job`,
and `JobBase` never benefits from `Job`'s hardening. The goal is to make `JobBase` a true superset
of `Job`'s behavior, then collapse `Job` into a thin adapter subclass of `JobBase`, so the two are
effectively aliases of each other going forward.

## Goals

- `JobBase` (in `arena-core`) gains every behavior `Job` currently has that `JobBase` lacks or
  implements differently, using `Job`'s (production-proven) behavior as the source of truth
  wherever the two disagree.
- Arena's `Job` becomes a thin subclass of `JobBase` — constructor-signature adaptation, logger
  creation, and one error-recognition hook, nothing else. All 83 existing `Job` subclasses in
  `arena` keep working with zero changes, since none of them touch `Job` internals directly, only
  the fixed `super(Type, params, innerJobs?)` constructor convention and a known set of overridable
  hook methods.
- The `appErrors.generic` / `appErrors:generic` i18n-key mismatch between the two implementations
  (found during this investigation) gets fixed as part of the unification.

## Non-goals

- No arena-core version bump or publish. This repo's version bumps are automated `ci:` commits on
  merge to `master`; publishing/releasing `arena-core` is a separate step outside this task.
- No change to arena's own `jobUtils.jobToJSON()` / `common/job/jobSerialized.js` serialization
  path. It stays a separate, arena-owned function reading plain properties off a job instance
  (`job.innerJobs`, `job.status`, etc.) — unifying it with `JobBase.toJSON()`/`JobSerialized` is a
  bigger, separate cleanup not required for this task.
- No migration of arena's other 83 subclasses away from the `Job` import — they keep importing
  `Job` from `@server/job/job` exactly as today.
- No change to arena's local `@core/systemError` class or the 34 files that throw it.

## `arena-core` changes (branch `refactor/job2`)

All changes are to `src/job/JobBase.ts` (plus small, additive changes to `src/job/jobContext.ts` /
`src/job/jobSerialized.ts`) unless noted.

1. **Fix: `start()` currently commits the transaction before checking whether the job actually
   succeeded.** This is the most important correction in this spec, found by tracing the exact
   commit/rollback timing of both implementations side by side — it's a real atomicity gap, not a
   naming difference. Today, `JobBase.start()` does:
   ```ts
   await client.tx(async (tx) => { this.context.tx = tx; await this.executeInternalJobsOrCurrentOne() })
   // ^ this line has already committed by the time execution reaches here
   if (this.isRunning()) { this.result = await this.prepareResult(); await this.setStatus(succeeded) }
   else { this.throwError('jobCanceledOrErrorsFound') } // too late — nothing left to roll back
   ```
   Because the "did it actually succeed" check happens *after* `client.tx()` has already resolved
   (= committed), a job whose status became `failed` or `canceled` mid-run — without an exception
   propagating up through the promise chain, which is the normal case, since `onInnerJobEvent`'s
   `setStatus(failed)` just updates a field rather than throwing — still has all of its DB writes
   committed. `Job` avoids this by nesting the whole check-and-maybe-throw inside the transaction
   callback (`_executeInTransaction()`), so a non-running status at the end of the job body throws
   *inside* `client.tx()`, forcing pg-promise to roll back. The fix is to restructure `start()` to
   match that nesting exactly:
   ```ts
   async start(client: any = null): Promise<void> {
     this.logDebug('start')
     try {
       if (client) {
         await client.tx(async (tx) => { this.context.tx = tx; await this.executeInTransaction() })
       } else {
         await this.executeInTransaction()
       }
       if (this.isRunning()) {
         await this.setStatus(JobStatus.succeeded) // only after commit
       }
     } catch (error: any) {
       if (!this.isFailed() && (this.isRunning() || this.isSucceeded())) {
         this.logError(error.stack ?? error)
         const { key, params } = this.getErrorInfo(error)
         this.addError({ error: { valid: false, errors: [{ key, params }] } })
         await this.setStatus(JobStatus.failed)
       }
     } finally {
       this.context.tx = undefined
     }
   }

   private async executeInTransaction(): Promise<void> {
     try {
       await this.onStart()
       if (await this.shouldExecute()) {
         if (this.innerJobs.length > 0) await this.executeJobs()
         else await this.execute()
         if (this.isRunning()) await this.beforeSuccess() // still pre-commit
       }
     } finally {
       if (!this.isCanceled()) await this.beforeEnd() // still pre-commit
     }
     if (!this.isRunning()) this.throwError('jobCanceledOrErrorsFound') // rolls back the tx
   }
   ```
   The outer catch's guard (`!isFailed() && (isRunning() || isSucceeded())`) is copied verbatim from
   `Job` — it's what stops the `jobCanceledOrErrorsFound` rollback signal from overwriting a status
   that was already correctly set to `canceled` earlier. `setStatus(succeeded)` staying *outside*
   the transaction (after commit) is unchanged from `JobBase` today and matches `Job`.

2. **Rename `jobs` → `innerJobs`.** This isn't just naming: arena's `jobUtils.jobToJSON()`,
   `common/job/jobSerialized.js`, `CategoriesBatchImportJob.js`, and `DataImportJob.js` all read
   `.innerJobs` directly off a job instance today. `getCurrentInnerJob()`, `currentInnerJobIndex`,
   etc. stay as-is, just backed by the renamed field.

3. **Copy context in the constructor** instead of holding the caller's reference:
   `this.context = { ...context }`. Prevents a job from mutating an object the caller still owns.

4. **Merge-then-share context for inner jobs.** In `executeJobs()`, before an inner job runs:
   ```ts
   Object.assign(this.context, innerJob.context)
   innerJob.context = this.context
   ```
   preserves any context values the inner job was constructed with, instead of unconditionally
   overwriting them with the parent's context (current `JobBase` behavior).

5. **`stopOnInnerJobFailure` getter/setter**, default `true`. In `executeJobs()`, the loop only
   `break`s after a failed inner job when this is `true`; otherwise it continues to the next inner
   job. Note the parent's own `status` already flips to `failed` via the inner-job event listener
   the moment any inner job fails, regardless of this flag — the flag only controls whether
   subsequent inner jobs still get a chance to run (and record their own errors) afterward. This is
   the mechanism the in-flight Arena Mobile import fix needs.

6. **`cancel({ canceledByAdmin = false } = {})`.** Stores `this.canceledByAdmin`. In the inner-job
   event handler, when an inner job's status becomes `canceled`, propagate its `canceledByAdmin`
   value up to the parent before setting the parent's own status to `canceled`. This is live
   production behavior: `jobManager.cancelJobByUuid` → `jobThreadExecutor` → `jobThread` →
   `job.cancel({ canceledByAdmin: true })`.

7. **Result-building hooks renamed, split, and moved pre-commit** (see point 1 — `beforeSuccess()`
   now runs inside the transaction, not after) to match the names 22 existing `Job` subclasses
   already override:
   - `prepareResult()` → `beforeSuccess()`, which calls `this.setResult(await this.generateResult())`.
   - `generateResult()` — new, defaults to returning `{}`.
   - `setResult(result)` — new, merges into `this.result` (`Object.assign`, `this.result` starts as
     `{}`) rather than replacing it wholesale, so multiple partial `setResult()` calls during
     `execute()` accumulate correctly.
   - `cleanup()` → `beforeEnd()`, matching the 4 existing overrides (also now pre-commit).
   - New `combineInnerJobsResults()` / `combineInnerJobsErrors()` helpers (`Object.assign` over
     each inner job's `result`/`errors`), used by `DataImportJob` and the mobile import job.

8. **Context helper methods and `keysContext`**, built on the existing `context`/`JobContext`:
   - `getContextProp(prop, defaultValue = null)`
   - `setContext(context)` — merges (`Object.assign`) into the existing context
   - `deleteContextProps(...propNames)`
   - `get contextSurvey()` — alias for `getContextProp('survey')`
   - `get surveyId()` / `get survey()` / `get user()` / `get userUuid()` — rebuilt on top of
     `getContextProp` instead of direct property access (see point 10)
   - `static keysContext = { surveyId: 'surveyId', survey: 'survey', user: 'user' }` on `JobBase`
     itself, so `Job.keysContext` resolves via normal static inheritance without redeclaring it in
     arena.

9. **Extensible error-key resolution.** The hardcoded `'appErrors.generic'` (a bug — i18next
   namespaces use `:`, not `.`; should be `'appErrors:generic'`, matching `Job`'s current, correct
   behavior) becomes an overridable hook, called from the restructured `start()` in point 1:
   ```ts
   protected getErrorInfo(error: any): { key: string; params: Record<string, any> } {
     if (error instanceof SystemError) return { key: `appErrors:${error.key}`, params: error.params }
     return { key: 'appErrors:generic', params: { text: error.toString() } }
   }
   ```
   This is what lets arena's `Job` also recognize arena's *local* `@core/systemError` class (34
   files throw it) via a one-method override, without `arena-core` ever importing anything from
   `arena`.

10. **Null-safety matched to `Job`'s current tolerance.**
   - `userUuid` becomes `this.context.user?.uuid` (currently throws if `context.user` is unset).
   - `surveyId` defaults to `null` instead of `0` when absent. `JobSerialized.surveyId` type
     changes from `number` to `number | null` accordingly (`src/job/jobSerialized.ts`).

## `arena` changes (branch `fix/arena-mobile-data-import-errors`)

1. **`server/job/job.js` shrinks to a thin adapter subclass:**
   ```js
   import { JobBase, SystemError as CoreSystemError } from '@openforis/arena-core'
   import * as Log from '@server/log/log'
   import SystemError from '@core/systemError'

   export default class Job extends JobBase {
     constructor(type, params = {}, innerJobs = []) {
       super({ ...params, type }, innerJobs)
       this.params = params // original reference, distinct from the (copied, shared) context
     }

     createLogger() {
       return Log.getLogger(`Job ${this.constructor.name} (${this.uuid})`)
     }

     getErrorInfo(error) {
       if (error instanceof SystemError) return { key: `appErrors:${error.key}`, params: error.params }
       return super.getErrorInfo(error)
     }
   }
   ```
   `this.params` stays because two real subclasses (`categoryImportJob.js`, `surveyCloneJob.js`)
   read it directly, and it's semantically distinct from the shared/mutable `context`.

2. **Delete `server/job/jobEvent.js`.** Once `Job` stops constructing its own `JobEvent` instances,
   this becomes dead code — `JobBase` already emits structurally-identical plain objects
   (`{ type, status, total, processed, errors? }`), and nothing outside `job.js` imports this file
   (only `_createJobEvent`, which goes away with the rest of `job.js`'s current body).

3. No changes needed to `server/job/jobManager.js`, `jobThread.js`, `jobThreadExecutor.js`,
   `jobUtils.js`, or any of the 83 `Job` subclasses — they all consume the preserved public API
   (`start`, `cancel({ canceledByAdmin })`, `onEvent`, `isRunning`/`isFailed`/etc., `execute`,
   `beforeSuccess`, `generateResult`, `beforeEnd`, `onStart`, `shouldExecute`, `context`, `params`,
   `innerJobs`, `stopOnInnerJobFailure`, `keysContext`, `contextSurvey`/`surveyId`/`user`/`userUuid`,
   `getContextProp`/`setContext`/`deleteContextProps`, `combineInnerJobsResults`/`combineInnerJobsErrors`,
   `addError`/`hasErrors`, `processed`/`incrementProcessedItems`, the `log*` methods).

## Local verification (no publish required)

Build `arena-core` on `refactor/job2`, `yarn link` it, then `yarn link @openforis/arena-core` from
`arena` so the linked build is picked up immediately without touching either `package.json`. Unlink
afterward unless asked to keep it linked.

## Testing

- `arena-core`: extend `src/job/JobBase.test.ts` to cover `stopOnInnerJobFailure`, `canceledByAdmin`
  propagation from an inner job, context merge-then-share, the `getErrorInfo` hook, and
  `setResult`/`generateResult` merging.
- `arena`: run the existing job-related suites against the linked build —
  `test/unit/tests/jobManager.test.js`, `test/unit/tests/jobThreadExecutor.test.js`,
  `test/unit/tests/027jobSerialized.test.js`, `test/unit/tests/027taxonomyImportJob.test.js`,
  `test/unit/tests/040surveyDataMigrationJob.test.js` — to catch regressions across real subclasses.
