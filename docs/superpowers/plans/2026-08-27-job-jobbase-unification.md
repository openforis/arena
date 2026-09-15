# Job / JobBase Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@openforis/arena-core`'s `JobBase` a true superset of arena's `Job` class, then collapse arena's `Job` into a thin adapter subclass of `JobBase`, so the two are effectively aliases of each other.

**Architecture:** Nearly all of arena's `Job` behavior (470 lines) moves into `arena-core`'s `JobBase.ts`, in 7 incremental, independently-tested changes to one file. Arena's `server/job/job.js` then shrinks to a ~25-line adapter that only bridges its existing `(type, params, innerJobs)` constructor convention onto `JobBase`'s `(context, jobs)` one, supplies a logger, and extends error recognition to arena's local `SystemError` class. A third repo, `arena-server`, needs one small fixture-only fix so its existing test suite doesn't silently start asserting wrong values against the renamed `JobBase` API.

**Tech Stack:** TypeScript (`arena-core`, `arena-server`), plain JavaScript (`arena` server code), Jest for all three test suites, `pg-promise`-style `client.tx()` transactions.

**Spec:** `docs/superpowers/specs/2026-08-27-job-jobbase-unification-design.md`

## Global Constraints

- No `arena-core` version bump or publish — version bumps are automated `ci:` commits on merge to `master`; do not hand-edit `package.json`'s `version` field.
- Do not change arena's own `jobUtils.jobToJSON()` / `common/job/jobSerialized.js` — they stay a separate, arena-owned serialization path.
- Do not touch any of arena's 83 existing `Job` subclasses.
- Do not change arena's local `@core/systemError` class or any of the 34 files that throw it.
- `arena-core` work happens on its existing local branch `refactor/job2` (already checked out at `/home/stefano/dev/projects/openforis/arena-core`, currently equal to `master`).
- `arena` work happens on the current branch `fix/arena-mobile-data-import-errors`.
- `arena-server` work happens at `/home/stefano/dev/projects/openforis/arena-server`, on a new branch `job/jobbase-unification-test-fixtures` created off `master` — its current branch, `fix/job-error-props-shape`, is unrelated in-progress work and must not receive this commit.
- Every `JobBase.ts` behavior change lands with a test in `arena-core/src/job/JobBase.test.ts` written and run red *before* the implementation, then green after.

---

## File Structure

**`arena-core`** (branch `refactor/job2`):
- Modify: `src/job/JobBase.ts` — the class gaining all of `Job`'s behavior (Tasks 1–7)
- Modify: `src/job/JobBase.test.ts` — extended alongside each behavior (Tasks 1–7)
- Modify: `src/job/job.ts` — `cancel()` interface signature (Task 3)
- Modify: `src/job/jobSerialized.ts` — `surveyId` becomes nullable (Task 5)

**`arena`** (branch `fix/arena-mobile-data-import-errors`):
- Modify: `server/job/job.js` — shrinks to a thin `JobBase` adapter (Task 9)
- Delete: `server/job/jobEvent.js` — dead code once `Job` stops constructing it (Task 9)

**`arena-server`**:
- Modify: `src/job/tests/testJobs.ts` — rename to match `JobBase`'s renamed hooks (Task 10)

**Ordering:** Tasks 1–7 (arena-core) must land before Task 8 (build + link). Task 8 must land before Tasks 9 and 10, since both depend on the linked build to verify against. Tasks 9 and 10 are independent of each other.

---

## Task 1: `JobBase` — rename `jobs`→`innerJobs`, split/rename result & cleanup hooks, fix the commit-before-checking-status transaction bug

This is the foundational rewrite: it touches `start()`, the private methods it calls, the `jobs`/`innerJobs` field, and the result/cleanup hook names all at once, because they're the same interdependent lines. Splitting the rename from the transaction fix would mean editing these exact lines twice for no isolation benefit — a reviewer can't sensibly approve one without the other.

**Background — the bug being fixed:** `JobBase.start()` currently does `await client.tx(async (tx) => { ...; await this.executeInternalJobsOrCurrentOne() })` and only checks `if (this.isRunning())` *after* that line — i.e., after the transaction has already committed. A job whose status flips to `failed`/`canceled` mid-run (the normal path — an inner job's `setStatus(failed)` just updates a field, it doesn't throw) still gets all its DB writes committed. `Job` avoids this by nesting the whole "did it actually succeed" check inside the transaction callback, so a bad outcome throws *inside* `client.tx()` and forces a rollback.

**Files:**
- Modify: `src/job/JobBase.ts`
- Modify: `src/job/JobBase.test.ts`

**Interfaces:**
- Produces (used by every later task in this plan): `protected innerJobs: JobBase<C, any>[]` (renamed from `jobs`), `protected async beforeSuccess(): Promise<void>`, `protected async generateResult(): Promise<R | undefined>`, `protected setResult(result: R | undefined): void`, `protected beforeEnd(): Promise<void>` (renamed from `cleanup`), `private async executeInTransaction(): Promise<void>` (renamed/absorbed from `executeInternalJobsOrCurrentOne`).

- [ ] **Step 1: Update the test fixture and add the two transaction-safety tests (red)**

In `src/job/JobBase.test.ts`, make these three changes:

1. Rename the fixture's hook (currently named `prepareResult`) to `generateResult`:

```ts
  protected async generateResult(): Promise<any> {
    return this.options.result
  }
```

2. Rename the test titled `'result returned by prepareResult is exposed only when succeeded'` to `'result returned by generateResult is exposed only when succeeded'` (text only, body unchanged).

3. Add a small tracked-client test helper and two new tests, right after the existing imports/setup (after the `createContext` function, before the `TestJobOptions` type):

```ts
const createTrackedClient = () => {
  let committed = false
  let rolledBack = false
  // The tx handle needs its own `.tx()` so nested inner-job transactions (executeJobs() passes
  // `this.context.tx` down as the inner job's own `client` argument, mirroring pg-promise's
  // nested-transaction/savepoint support) don't throw before the inner job's onStart() even runs.
  const fakeTx = { marker: 'fake-tx', tx: async (fn: (tx: any) => Promise<void>) => fn(fakeTx) }
  const client = {
    tx: async (fn: (tx: any) => Promise<void>) => {
      try {
        await fn(fakeTx)
        committed = true
      } catch (error) {
        rolledBack = true
        throw error
      }
    },
  }
  return { client, wasCommitted: () => committed, wasRolledBack: () => rolledBack }
}
```

And add these two tests at the end of the file:

```ts
test('rolls back the transaction when an inner job fails without throwing', async () => {
  const { client, wasCommitted, wasRolledBack } = createTrackedClient()
  const innerJob = new TestJob(createContext(), [], {
    execute: async () => {
      throw new Error('inner job failure')
    },
  })
  const parentJob = new TestJob(createContext(), [innerJob])

  await parentJob.start(client)

  expect(parentJob.isFailed()).toBe(true)
  expect(wasRolledBack()).toBe(true)
  expect(wasCommitted()).toBe(false)
})

test('commits the transaction when the job succeeds', async () => {
  const { client, wasCommitted, wasRolledBack } = createTrackedClient()
  const job = new TestJob(createContext())

  await job.start(client)

  expect(job.isSucceeded()).toBe(true)
  expect(wasCommitted()).toBe(true)
  expect(wasRolledBack()).toBe(false)
})
```

- [ ] **Step 2: Run the tests and confirm the expected failures**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts`

Expected: FAIL — the renamed-hook test fails because `JobBase` still calls `prepareResult` internally (so `generateResult` is dead code, result comes back `undefined`), and `'rolls back the transaction...'` fails because `wasRolledBack()` is `false` / `wasCommitted()` is `true` (the bug being fixed).

- [ ] **Step 3: Rewrite `JobBase.ts`**

In `src/job/JobBase.ts`:

1. Update the class doc comment's "Methods that can be overwritten by subclasses" list to:

```ts
/**
 * Asynchronous task handler.
 *
 * Status workflow:
 * - pending
 * - running
 * - (end)
 * -- succeeded
 * -- failed
 * -- canceled
 *
 * Methods that can be overwritten by subclasses:
 * - shouldExecute (in tx)
 * - onStart (in tx)
 * - execute (in tx)
 * - beforeSuccess (in tx)
 * - generateResult (in tx)
 * - beforeEnd (in tx)
 * - onEnd (out of tx)
 * - getErrorInfo
 */
```

2. In the `JobConstructor` interface, rename the `jobs` param to `innerJobs` (cosmetic only):

```ts
export interface JobConstructor {
  new <C extends JobContext, R>(context: C, innerJobs?: JobBase<any>[]): JobBase<C, R>
  readonly prototype: JobBase<any, any>
}
```

3. Rename the `protected jobs` field to `protected innerJobs`:

```ts
  protected innerJobs: JobBase<C, any>[]
```

4. Update the constructor:

```ts
  public constructor(context: C, innerJobs: JobBase<C, any>[] = []) {
    this.context = context
    this.innerJobs = innerJobs
    this.logger = this.createLogger()

    this.uuid = UUIDs.v4()
    this.type = this.context.type ?? this.constructor.name
    this.total = innerJobs.length > 0 ? innerJobs.length : 1
  }
```

5. Update `getCurrentInnerJob()`:

```ts
  protected getCurrentInnerJob(): JobBase<C, any> | undefined {
    return this.innerJobs[this.currentInnerJobIndex]
  }
```

6. Replace the entire `start()` method and the `executeInternalJobsOrCurrentOne()` method with:

```ts
  async start(client: any = null): Promise<void> {
    this.logDebug('start')

    try {
      if (client) {
        await client.tx(async (tx: any) => {
          this.context.tx = tx
          await this.executeInTransaction()
        })
      } else {
        await this.executeInTransaction()
      }
      if (this.isRunning()) {
        await this.setStatus(JobStatus.succeeded)
      }
    } catch (error: any) {
      if (!this.isFailed() && (this.isRunning() || this.isSucceeded())) {
        this.logError(error.stack ?? error)
        this.addError({
          error: {
            valid: false,
            errors: [{ key: 'appErrors.generic', params: { text: error.toString() } }],
          },
        })
        await this.setStatus(JobStatus.failed)
      }
    } finally {
      this.context.tx = undefined
    }
  }

  private async executeInTransaction(): Promise<void> {
    try {
      await this.onStart()

      const shouldExecute = await this.shouldExecute()
      if (shouldExecute) {
        if (this.innerJobs.length > 0) {
          await this.executeJobs()
        } else {
          await this.execute()
        }
        if (this.isRunning()) {
          await this.beforeSuccess()
        }
      }
    } finally {
      if (!this.isCanceled()) {
        await this.beforeEnd()
      }
      this.context.tx = undefined
    }

    if (!this.isRunning()) {
      this.throwError('jobCanceledOrErrorsFound')
    }
  }
```

(The `'appErrors.generic'` typo — should be `'appErrors:generic'` — is deliberately left as-is here; it gets fixed in Task 7 alongside the `getErrorInfo` hook, to keep this task's diff focused on structure.)

7. Update `toJSON()`'s `innerJobs` line:

```ts
      innerJobs: this.innerJobs.map((job) => job.toJSON()),
```

8. Update `executeJobs()`:

```ts
  private async executeJobs(): Promise<void> {
    this.logDebug(`- ${this.total} inner jobs found`)

    for (let i = 0; i < this.innerJobs.length; i++) {
      this.logDebug(`- executing inner job ${i + 1}`)
      this.currentInnerJobIndex = i
      const currentInnerJob = this.innerJobs[i]
      currentInnerJob.context = this.context
      currentInnerJob.onEvent(this.onInnerJobEvent.bind(this))

      await currentInnerJob.start(this.context.tx)

      if (currentInnerJob.isSucceeded()) {
        this.incrementProcessedItems()
      } else {
        break
      }
    }

    this.logDebug(`- ${this.processed} inner jobs processed successfully`)
  }
```

9. Replace `prepareResult()` with `beforeSuccess()` + `generateResult()` + `setResult()`:

```ts
  /**
   * Called before beforeEnd only if the status will change to 'success'.
   * Default implementation stores the value returned by generateResult() via setResult().
   * It runs INSIDE the current db transaction.
   */
  protected async beforeSuccess(): Promise<void> {
    this.setResult(await this.generateResult())
  }

  /**
   * Computes the value beforeSuccess() will store as this job's result.
   * Default implementation returns whatever is already in `this.result`
   * (e.g. accumulated via earlier setResult() calls during execute()).
   */
  protected async generateResult(): Promise<R | undefined> {
    return this.result
  }

  /**
   * Updates this job's result. When both the current and incoming values are plain objects,
   * they are merged (Object.assign); otherwise the incoming value replaces the current one.
   * This keeps it safe for subclasses whose result is a primitive (e.g. a plain number) as
   * well as ones that build an object result incrementally across multiple setResult() calls.
   */
  protected setResult(result: R | undefined): void {
    if (result && typeof result === 'object' && this.result && typeof this.result === 'object') {
      Object.assign(this.result, result)
    } else {
      this.result = result
    }
  }
```

10. Rename `cleanup()` to `beforeEnd()`:

```ts
  /**
   * Called before onEnd. Useful for flushing resources used by the job before it terminates completely.
   * It runs INSIDE the current db transaction.
   */
  protected beforeEnd(): Promise<void> {
    this.logDebug('Cleanup')
    return Promise.resolve()
  }
```

- [ ] **Step 4: Run the tests and confirm everything passes**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts`

Expected: PASS, zero failures — the original suite (11 tests) plus the 2 new ones (13 total).

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/job/JobBase.ts src/job/JobBase.test.ts
git commit -m "job: rename jobs->innerJobs, split result hooks, fix commit-before-status-check tx bug"
```

---

## Task 2: `stopOnInnerJobFailure`

**Files:**
- Modify: `src/job/JobBase.ts`
- Modify: `src/job/JobBase.test.ts`

**Interfaces:**
- Consumes: `executeJobs()` from Task 1 (the `else { break }` branch being made conditional).
- Produces: `stopOnInnerJobFailure: boolean` (public getter/setter, default `true`), used directly by Task 6's tests.

- [ ] **Step 1: Write the failing test**

Add to `src/job/JobBase.test.ts`:

```ts
test('continues running inner jobs after a failure when stopOnInnerJobFailure is false', async () => {
  const calls: string[] = []
  const innerJob1 = new TestJob(createContext(), [], {
    execute: async () => {
      calls.push('job1')
      throw new Error('inner job failure')
    },
  })
  const innerJob2 = new TestJob(createContext(), [], {
    execute: async () => {
      calls.push('job2')
    },
  })
  const parentJob = new TestJob(createContext(), [innerJob1, innerJob2])
  parentJob.stopOnInnerJobFailure = false

  await parentJob.start()

  expect(calls).toEqual(['job1', 'job2'])
  expect(parentJob.isFailed()).toBe(true)
  expect(innerJob2.isSucceeded()).toBe(true)
})
```

- [ ] **Step 2: Run and confirm it fails**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts -t "stopOnInnerJobFailure"`

Expected: FAIL — `stopOnInnerJobFailure` doesn't exist yet, so `innerJob2` never runs (`calls` is `['job1']`, not `['job1', 'job2']`).

- [ ] **Step 3: Implement**

In `src/job/JobBase.ts`, add near the other private fields (after `progressThrottleLastRunTime`):

```ts
  private _stopOnInnerJobFailure = true
```

Add the getter/setter (a sensible spot is right after the `processed` getter/setter):

```ts
  get stopOnInnerJobFailure(): boolean {
    return this._stopOnInnerJobFailure
  }

  set stopOnInnerJobFailure(value: boolean) {
    this._stopOnInnerJobFailure = value
  }
```

In `executeJobs()`, change:

```ts
      if (currentInnerJob.isSucceeded()) {
        this.incrementProcessedItems()
      } else {
        break
      }
```

to:

```ts
      if (currentInnerJob.isSucceeded()) {
        this.incrementProcessedItems()
      } else if (this.stopOnInnerJobFailure) {
        break
      }
```

- [ ] **Step 4: Run the full suite and confirm it passes**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts`

Expected: PASS, including the pre-existing `'stops running inner jobs after the first failure'` test (default `true` behavior unchanged).

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/job/JobBase.ts src/job/JobBase.test.ts
git commit -m "job: add stopOnInnerJobFailure toggle"
```

---

## Task 3: `cancel({ canceledByAdmin })`

**Files:**
- Modify: `src/job/JobBase.ts`
- Modify: `src/job/job.ts`
- Modify: `src/job/JobBase.test.ts`

**Interfaces:**
- Produces: `canceledByAdmin?: boolean` (public field), `cancel(options?: { canceledByAdmin?: boolean }): Promise<void>`.

- [ ] **Step 1: Write the failing test**

Add to `src/job/JobBase.test.ts`:

```ts
test('cancel propagates canceledByAdmin from the currently running inner job to the parent', async () => {
  let releaseInnerJob: () => void = () => undefined
  const innerJobGate = new Promise<void>((resolve) => {
    releaseInnerJob = resolve
  })
  const innerJob = new TestJob(createContext(), [], {
    execute: async () => {
      await innerJobGate
    },
  })
  const parentJob = new TestJob(createContext(), [innerJob])

  const startPromise = parentJob.start()
  // let the inner job's execute() actually start and reach the gate before canceling
  await new Promise((resolve) => setTimeout(resolve, 0))

  await parentJob.cancel({ canceledByAdmin: true })
  releaseInnerJob()
  await startPromise

  expect(parentJob.canceledByAdmin).toBe(true)
  expect(innerJob.canceledByAdmin).toBe(true)
  expect(parentJob.isCanceled()).toBe(true)
})
```

- [ ] **Step 2: Run and confirm it fails**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts -t "canceledByAdmin"`

Expected: FAIL — TypeScript compile error (`cancel` doesn't accept arguments) or, if it compiles loosely, `parentJob.canceledByAdmin` is `undefined`.

- [ ] **Step 3: Implement**

In `src/job/JobBase.ts`, add the field near the other public fields at the top of the class (after `errors`):

```ts
  canceledByAdmin?: boolean
```

Replace `cancel()`:

```ts
  async cancel(options: { canceledByAdmin?: boolean } = {}): Promise<void> {
    const { canceledByAdmin = false } = options
    const currentInnerJob = this.getCurrentInnerJob()
    if (currentInnerJob) {
      if (currentInnerJob.isRunning()) {
        await currentInnerJob.cancel({ canceledByAdmin })
      }
    } else {
      this.canceledByAdmin = canceledByAdmin
      await this.setStatus(JobStatus.canceled)
    }
  }
```

Update `onInnerJobEvent()` to propagate `canceledByAdmin` when an inner job's status becomes `canceled`:

```ts
  protected async onInnerJobEvent(event: JobEvent): Promise<void> {
    const { status } = event
    if (status === JobStatus.canceled) {
      this.canceledByAdmin = this.getCurrentInnerJob()?.canceledByAdmin ?? false
      return this.setStatus(status)
    }
    if (status === JobStatus.failed) {
      return this.setStatus(status)
    }
    if (status === JobStatus.running) {
      this.notifyEvent({
        type: JobEventType.progress,
        status: this.status,
        total: this.total,
        processed: this.processed,
      })
      return
    }
    this.logDebug(`Unknown inner job status: ${status}`)
  }
```

In `src/job/job.ts`, update the `Job` interface's `cancel` signature:

```ts
  /**
   * Cancels the execution of the job.
   */
  cancel(options?: { canceledByAdmin?: boolean }): Promise<void>
```

- [ ] **Step 4: Run the full suite and confirm it passes**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts`

Expected: PASS, including the pre-existing `'cancel sets status to canceled when no inner job is running'` test (calling `job.cancel()` with no args still works via the default parameter).

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/job/JobBase.ts src/job/job.ts src/job/JobBase.test.ts
git commit -m "job: add cancel({ canceledByAdmin }) and propagate it from inner jobs"
```

---

## Task 4: Copy context in the constructor; merge-then-share context for inner jobs

**Files:**
- Modify: `src/job/JobBase.ts`
- Modify: `src/job/JobBase.test.ts`

**Interfaces:**
- Consumes: `innerJobs` field, constructor, `executeJobs()` from Task 1.
- Produces: no new public API — this changes the *values* `context` holds, not its shape.

- [ ] **Step 1: Add a test-only context accessor to the `TestJob` fixture, then write the failing tests**

`context` is `protected`, so add a thin accessor to `TestJob` in `src/job/JobBase.test.ts` (right after the existing `createLogger()` override):

```ts
  get contextForTest(): JobContext {
    return this.context
  }
```

Then add the two tests:

```ts
test('constructor copies the context instead of holding the caller-owned reference', () => {
  const callerContext = createContext()
  const job = new TestJob(callerContext)

  expect(job.contextForTest).not.toBe(callerContext)
  expect(job.contextForTest).toEqual(callerContext)
})

test("merges an inner job's own context into the shared context before overwriting it", async () => {
  const innerJob = new TestJob(createContext())
  ;(innerJob.contextForTest as any).customFlag = true
  const parentJob = new TestJob(createContext(), [innerJob])

  await parentJob.start()

  expect((parentJob.contextForTest as any).customFlag).toBe(true)
})
```

- [ ] **Step 2: Run and confirm both fail**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts -t "context"`

Expected: FAIL — the first test fails because `job.contextForTest` currently *is* the same object reference as `callerContext` (`.not.toBe` fails); the second fails because `customFlag` is lost (`executeJobs()` currently overwrites the inner job's context wholesale instead of merging first).

- [ ] **Step 3: Implement**

In `src/job/JobBase.ts`, in the constructor, change:

```ts
    this.context = context
```

to:

```ts
    this.context = { ...context }
```

In `executeJobs()`, change:

```ts
      const currentInnerJob = this.innerJobs[i]
      currentInnerJob.context = this.context
```

to:

```ts
      const currentInnerJob = this.innerJobs[i]
      if (currentInnerJob.context) {
        Object.assign(this.context, currentInnerJob.context)
      }
      currentInnerJob.context = this.context
```

- [ ] **Step 4: Run the full suite and confirm it passes**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/job/JobBase.ts src/job/JobBase.test.ts
git commit -m "job: copy context in constructor; merge inner job context before sharing it"
```

---

## Task 5: Context helper methods, `keysContext`, null-safe `surveyId`/`userUuid`/`user`/`contextSurvey`

**Files:**
- Modify: `src/job/JobBase.ts`
- Modify: `src/job/jobSerialized.ts`
- Modify: `src/job/JobBase.test.ts`

**Interfaces:**
- Produces: `static readonly keysContext = { surveyId: 'surveyId', survey: 'survey', user: 'user' }`, `protected getContextProp<T>(prop: string, defaultValue?: T | null): T | null`, `protected setContext(context: Partial<C>): void`, `protected deleteContextProps(...propNames: string[]): void`, `protected get contextSurvey(): any`, `protected get surveyId(): number | null` (was `number`, defaulted to `0` — now defaults to `null`), `protected get user(): any` (new), `protected get userUuid(): string | undefined` (was `string`, threw if `context.user` was unset — now `undefined`-safe).

- [ ] **Step 1: Add test-only wrapper methods to `TestJob`, then write the failing tests**

These helpers are `protected`, so `TestJob` (in `src/job/JobBase.test.ts`) needs thin public wrappers. Add these to the `TestJob` class, alongside `contextForTest`:

```ts
  getContextPropForTest(prop: string, defaultValue: any = null): any {
    return this.getContextProp(prop, defaultValue)
  }

  setContextForTest(context: Partial<JobContext>): void {
    this.setContext(context)
  }

  deleteContextPropsForTest(...propNames: string[]): void {
    this.deleteContextProps(...propNames)
  }

  get surveyIdForTest(): number | null {
    return this.surveyId
  }

  get userUuidForTest(): string | undefined {
    return this.userUuid
  }
```

Then add these tests:

```ts
test('getContextProp returns the context value or the default when absent', () => {
  const job = new TestJob(createContext({ surveyId: 42 }))

  expect(job.getContextPropForTest('surveyId')).toBe(42)
  expect(job.getContextPropForTest('missingProp', 'fallback')).toBe('fallback')
  expect(job.getContextPropForTest('missingProp')).toBeNull()
})

test('setContext merges new values into the existing context', () => {
  const job = new TestJob(createContext())

  job.setContextForTest({ survey: { uuid: 'survey-uuid' } as any })

  expect(job.getContextPropForTest('survey')).toEqual({ uuid: 'survey-uuid' })
})

test('deleteContextProps removes the given keys from the context', () => {
  const job = new TestJob(createContext({ survey: { uuid: 'survey-uuid' } as any }))

  job.deleteContextPropsForTest('survey')

  expect(job.getContextPropForTest('survey')).toBeNull()
})

test('surveyId defaults to null when absent from the context', () => {
  const job = new TestJob({ user } as JobContext)

  expect(job.surveyIdForTest).toBeNull()
})

test('userUuid is undefined instead of throwing when the context has no user', () => {
  const job = new TestJob({ surveyId: 1 } as unknown as JobContext)

  expect(job.userUuidForTest).toBeUndefined()
})

test('JobBase.keysContext exposes the well-known context property names', () => {
  expect(JobBase.keysContext).toEqual({ surveyId: 'surveyId', survey: 'survey', user: 'user' })
})
```

- [ ] **Step 2: Run and confirm the new tests fail**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts`

Expected: FAIL to compile / FAIL at runtime — none of `getContextProp`, `setContext`, `deleteContextProps`, `keysContext` exist yet, and `userUuid` currently throws on a missing `context.user` rather than returning `undefined`.

- [ ] **Step 3: Implement**

In `src/job/JobBase.ts`, add the static field right after the `JobConstructor` interface / `PROGRESS_NOTIFICATION_THROTTLE_MILLIS` constant, as a static member of the class (place it as the first line inside the class body, before `readonly uuid: string`):

```ts
  static readonly keysContext = {
    surveyId: 'surveyId',
    survey: 'survey',
    user: 'user',
  }
```

Replace the existing `surveyId`/`userUuid` getters:

```ts
  protected get surveyId(): number | null {
    return this.getContextProp(JobBase.keysContext.surveyId)
  }

  protected get user(): any {
    return this.getContextProp(JobBase.keysContext.user)
  }

  protected get userUuid(): string | undefined {
    return this.user?.uuid
  }

  protected get contextSurvey(): any {
    return this.getContextProp(JobBase.keysContext.survey)
  }

  protected getContextProp<T = any>(prop: string, defaultValue: T | null = null): T | null {
    const value = (this.context as any)[prop]
    return value ?? defaultValue
  }

  protected setContext(context: Partial<C>): void {
    Object.assign(this.context, context)
  }

  protected deleteContextProps(...propNames: string[]): void {
    propNames.forEach((propName) => {
      delete (this.context as any)[propName]
    })
  }
```

In `src/job/jobSerialized.ts`, change:

```ts
  surveyId: number
```

to:

```ts
  surveyId: number | null
```

- [ ] **Step 4: Run the full suite and confirm it passes**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/job/JobBase.ts src/job/jobSerialized.ts src/job/JobBase.test.ts
git commit -m "job: add context helpers, keysContext, and null-safe surveyId/userUuid"
```

---

## Task 6: `combineInnerJobsResults()` / `combineInnerJobsErrors()`

**Files:**
- Modify: `src/job/JobBase.ts`
- Modify: `src/job/JobBase.test.ts`

**Interfaces:**
- Consumes: `innerJobs` (Task 1), `stopOnInnerJobFailure` (Task 2).
- Produces: `protected combineInnerJobsResults(): Record<string, any>`, `protected combineInnerJobsErrors(): Record<string, any>`.

- [ ] **Step 1: Add test-only wrappers, then write the failing tests**

Add to `TestJob`:

```ts
  combineInnerJobsResultsForTest(): Record<string, any> {
    return this.combineInnerJobsResults()
  }

  combineInnerJobsErrorsForTest(): Record<string, any> {
    return this.combineInnerJobsErrors()
  }
```

Add the tests:

```ts
test('combineInnerJobsResults merges the result objects of all inner jobs', async () => {
  const innerJob1 = new TestJob(createContext(), [], { result: { a: 1 } })
  const innerJob2 = new TestJob(createContext(), [], { result: { b: 2 } })
  const parentJob = new TestJob(createContext(), [innerJob1, innerJob2])

  await parentJob.start()

  expect(parentJob.combineInnerJobsResultsForTest()).toEqual({ a: 1, b: 2 })
})

test('combineInnerJobsErrors merges the errors of all inner jobs', async () => {
  const innerJob1 = new TestJob(createContext(), [], {
    execute: async () => {
      throw new Error('e1')
    },
  })
  const innerJob2 = new TestJob(createContext(), [], {
    execute: async () => {
      throw new Error('e2')
    },
  })
  const parentJob = new TestJob(createContext(), [innerJob1, innerJob2])
  parentJob.stopOnInnerJobFailure = false

  await parentJob.start()

  expect(Object.keys(parentJob.combineInnerJobsErrorsForTest())).toHaveLength(2)
})
```

- [ ] **Step 2: Run and confirm both fail**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts -t "combineInnerJobs"`

Expected: FAIL — `combineInnerJobsResults`/`combineInnerJobsErrors` don't exist yet.

- [ ] **Step 3: Implement**

In `src/job/JobBase.ts`, add (a natural spot is right after `getCurrentInnerJob()`):

```ts
  protected combineInnerJobsResults(): Record<string, any> {
    const results: Record<string, any> = {}
    this.innerJobs.forEach((innerJob) => Object.assign(results, innerJob.result ?? {}))
    return results
  }

  protected combineInnerJobsErrors(): Record<string, any> {
    const errors: Record<string, any> = {}
    this.innerJobs.forEach((innerJob) => Object.assign(errors, innerJob.errors ?? {}))
    return errors
  }
```

- [ ] **Step 4: Run the full suite and confirm it passes**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/job/JobBase.ts src/job/JobBase.test.ts
git commit -m "job: add combineInnerJobsResults/combineInnerJobsErrors"
```

---

## Task 7: Extensible `getErrorInfo()` hook; fix the `appErrors:generic` bug

**Files:**
- Modify: `src/job/JobBase.ts`
- Modify: `src/job/JobBase.test.ts`

**Interfaces:**
- Consumes: `start()`'s catch block from Task 1.
- Produces: `protected getErrorInfo(error: any): { key: string; params: Record<string, any> }` — overridden by arena's `Job` adapter in Task 9 to also recognize arena's local `SystemError`.

- [ ] **Step 1: Write the failing tests**

Add to the imports at the top of `src/job/JobBase.test.ts`:

```ts
import { SystemError } from '../error'
```

Add the tests:

```ts
test('getErrorInfo recognizes arena-core SystemError and extracts its key/params', async () => {
  const job = new TestJob(createContext(), [], {
    execute: async () => {
      throw new SystemError('my.error.key', { foo: 'bar' })
    },
  })

  await job.start()

  expect(job.isFailed()).toBe(true)
  const [errorEntry] = Object.values(job.errors) as any[]
  expect(errorEntry.error.errors[0]).toEqual({ key: 'appErrors:my.error.key', params: { foo: 'bar' } })
})

test('getErrorInfo falls back to a generic appErrors:generic key for unknown errors', async () => {
  const job = new TestJob(createContext(), [], {
    execute: async () => {
      throw new Error('boom')
    },
  })

  await job.start()

  const [errorEntry] = Object.values(job.errors) as any[]
  expect(errorEntry.error.errors[0].key).toBe('appErrors:generic')
})
```

- [ ] **Step 2: Run and confirm both fail**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts -t "getErrorInfo"`

Expected: FAIL — the first test fails because the current hardcoded branch always uses the generic key/params, ignoring `SystemError.key`/`.params`. The second fails on the literal string: current code produces `'appErrors.generic'` (dot), not `'appErrors:generic'` (colon).

- [ ] **Step 3: Implement**

In `src/job/JobBase.ts`, add the import at the top:

```ts
import { SystemError } from '../error'
```

Add the hook (a natural spot is right after `throwError()`):

```ts
  protected getErrorInfo(error: any): { key: string; params: Record<string, any> } {
    if (error instanceof SystemError) {
      return { key: `appErrors:${error.key}`, params: error.params }
    }
    return { key: 'appErrors:generic', params: { text: error.toString() } }
  }
```

In `start()`'s catch block, replace:

```ts
        this.addError({
          error: {
            valid: false,
            errors: [{ key: 'appErrors.generic', params: { text: error.toString() } }],
          },
        })
```

with:

```ts
        const { key, params } = this.getErrorInfo(error)
        this.addError({ error: { valid: false, errors: [{ key, params }] } })
```

- [ ] **Step 4: Run the full suite and confirm it passes**

Run: `cd /home/stefano/dev/projects/openforis/arena-core && yarn test src/job/JobBase.test.ts`

Expected: PASS, zero failures — the full file's suite at this point: 11 original tests + 2 (Task 1) + 1 (Task 2) + 1 (Task 3) + 2 (Task 4) + 6 (Task 5) + 2 (Task 6) + 2 (Task 7) = 27 tests total.

- [ ] **Step 5: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
git add src/job/JobBase.ts src/job/JobBase.test.ts
git commit -m "job: add extensible getErrorInfo hook; fix appErrors:generic key typo"
```

---

## Task 8: Build `arena-core` and link it into `arena` and `arena-server`

No code changes — this is the environment-setup step that lets Tasks 9 and 10 verify against the real, updated `JobBase`, without publishing anything or touching any `package.json`.

**Files:** none

- [ ] **Step 1: Build `arena-core`**

```bash
cd /home/stefano/dev/projects/openforis/arena-core
yarn build
```

Expected: TypeScript compiles cleanly to `dist/`.

All three repos run Yarn Berry (`arena` 4.18.0, `arena-server` 4.18.0, `arena-core` 4.17.0 — confirmed via each repo's `package.json` `packageManager` field), not classic Yarn 1.x. Berry's `yarn link` has no "register a target" step in the package being linked — it's a single command run from each *consumer*, pointing at the other project's path directly (it sets a `resolutions` entry in the consumer's own `package.json`, which `yarn install`/`yarn unlink` cleanly removes again). There is nothing to run inside `arena-core` itself beyond the build in Step 1.

- [ ] **Step 2: Link it into `arena`**

```bash
cd /home/stefano/dev/projects/openforis/arena
yarn link /home/stefano/dev/projects/openforis/arena-core
```

`yarn why @openforis/arena-core` will confirm the *resolution* correctly points at the portal — but this alone is not enough. `arena` doesn't declare `@openforis/arena-core` as its own direct dependency (only `@openforis/arena-server` does, transitively), and Yarn's node-modules linker hoists the portal-resolved package nested under `node_modules/@openforis/arena-server/node_modules/@openforis/arena-core` rather than to the top level — which is **invisible** to `server/job/job.js`'s own direct `import ... from '@openforis/arena-core'`, since nested `node_modules` aren't reachable from outside that nested tree under normal Node resolution. This isn't hypothetical: it actively breaks the pre-existing import the moment the link is applied. Confirmed via `node -e "console.log(require.resolve('@openforis/arena-core', {paths: ['/home/stefano/dev/projects/openforis/arena/server/job']}))"` — fails with `MODULE_NOT_FOUND` right after `yarn link`/`yarn install`, until fixed.

**Fix:** manually create the missing top-level symlink (this does not touch any tracked file):
```bash
ln -s /home/stefano/dev/projects/openforis/arena-core node_modules/@openforis/arena-core
```

Verify: rerun the `node -e "require.resolve(...)"` check above — it should now print `/home/stefano/dev/projects/openforis/arena-core/dist/index.js`.

**Caution for later steps:** this manual symlink is not tracked by Yarn's own linker state. If anything runs a fresh `yarn install` later in this plan's execution (nothing in Tasks 9-10 should — they only run `yarn build:test:unit`/`jest`, not `yarn install`), re-verify the symlink is still present and recreate it if Yarn's linker removed it.

- [ ] **Step 3: Link it into `arena-server` — deferred to Task 10, Step 1**

`arena-server`'s current branch is unrelated WIP (see Global Constraints); linking now would add the `resolutions` entry to that branch, not to the dedicated branch Task 10 creates off `master`. Apply the same two commands (`yarn link /home/stefano/dev/projects/openforis/arena-core`, then the same manual top-level symlink fix if `node_modules/@openforis/arena-core` doesn't resolve directly — check the same way as Step 2) as part of Task 10, immediately after creating its branch and before running its tests.

- [ ] **Step 4: No separate commit for the link itself** — `yarn link` adds a `resolutions` entry to `package.json` and updates the lockfile, which *are* tracked files; do not commit them as part of this plan's work (they're a local dev-time override, not a real dependency change). Remember to `yarn unlink /home/stefano/dev/projects/openforis/arena-core` in both `arena` and `arena-server` (which removes the `resolutions` entry and restores the published version on `yarn install`) and remove the manual top-level symlink, once this work is done, unless asked to keep it linked. Run `git status` in both repos afterward to confirm `package.json`/`yarn.lock` are back to their pre-link state.

---

## Task 9: Rewrite `server/job/job.js` as a thin `JobBase` adapter

**Files:**
- Modify: `server/job/job.js`
- Delete: `server/job/jobEvent.js`

**Interfaces:**
- Consumes: everything produced by Tasks 1–7 (`JobBase`'s full public/protected surface).
- Produces: `export default class Job extends JobBase` — same public constructor signature `(type, params, innerJobs)` as before, so none of the 83 existing subclasses need to change.

- [ ] **Step 1: Replace `server/job/job.js`**

Replace the entire file with:

```js
import { JobBase } from '@openforis/arena-core'

import * as Log from '@server/log/log'
import SystemError from '@core/systemError'

export default class Job extends JobBase {
  constructor(type, params = {}, innerJobs = []) {
    super({ ...params, type }, innerJobs)
    this.params = params // original reference, distinct from the (copied, shared) context
    this.result = {} // arena's convention: generateResult()/setResult() build this up incrementally
  }

  createLogger() {
    return Log.getLogger(`Job ${this.constructor.name} (${this.uuid})`)
  }

  getErrorInfo(error) {
    if (error instanceof SystemError) {
      return { key: `appErrors:${error.key}`, params: error.params }
    }
    return super.getErrorInfo(error)
  }

  // JobBase only ever stores the transaction handle as `this.context.tx`, never as a flat
  // `this.tx`. Arena's original Job class exposed it as `this.tx` directly, and ~50 existing Job
  // subclasses (~108 call sites) read `this.tx` to pass the current transaction into
  // manager/repository calls. Without this getter, every one of those call sites would silently
  // receive `undefined`, breaking transactional atomicity for every job that touches the database.
  get tx() {
    return this.context.tx
  }
}
```

**This `tx` getter was missing from the original version of this step** — found during implementation, not anticipated when this plan was written. It stays in `arena`'s adapter (not pushed into `arena-core`'s `JobBase`) because it's arena's own backward-compatibility convention: `arena-core`'s own consumers (`arena-server`'s `JobServer` and its subclasses) were always written against `this.context.tx` directly and never used a flat `this.tx`, so adding this to the generic `JobBase` would be an unrequested, arena-specific leak into a class meant to stay generic.

- [ ] **Step 2: Delete the now-dead `JobEvent` class**

```bash
cd /home/stefano/dev/projects/openforis/arena
git rm server/job/jobEvent.js
```

- [ ] **Step 3: Run the job-related unit test suites against the linked build**

```bash
cd /home/stefano/dev/projects/openforis/arena
yarn build:test:unit
npx jest dist/__tests__/bundle.unit.js
```

Expected: PASS, with zero failures. Specifically confirm these files' tests are present and green in the output: `jobManager.test.js`, `jobThreadExecutor.test.js`, `027jobSerialized.test.js`, `027taxonomyImportJob.test.js`, `040surveyDataMigrationJob.test.js`, `016jobQueue.test.js`, `jobRowToSummary.test.js`, `jobRowToMonitorSummary.test.js`.

If the environment has a database configured, also run the integration suite for extra confidence (optional, skip if no DB is available):

```bash
cd /home/stefano/dev/projects/openforis/arena
yarn test:integration
```

- [ ] **Step 4: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena
git add server/job/job.js server/job/jobEvent.js
git commit -m "job: collapse Job into a thin JobBase adapter subclass"
```

(`server/job/jobEvent.js` is already staged for deletion from Step 2's `git rm`; adding it again alongside `job.js` here just ensures both changes land in the same commit.)

---

## Task 10: Update `arena-server`'s `testJobs.ts` fixture

Without this, `arena-server`'s existing `src/job/tests/job.test.ts` would silently start asserting wrong values once `JobBase`'s hooks are renamed (Task 1) — no compile error, since the old method names just become unrelated dead code on the subclass, but `job.result` would come back `undefined` instead of the expected `3`/`6`.

**Files:**
- Modify: `src/job/tests/testJobs.ts` (in `/home/stefano/dev/projects/openforis/arena-server`)

**Interfaces:**
- Consumes: `generateResult()` and `innerJobs` from Tasks 1 and (implicitly) the rename in Task 1.

- [ ] **Step 1: Create a dedicated branch off `master`**

`arena-server`'s current branch (`fix/job-error-props-shape`) is unrelated in-progress work and must not receive this commit.

```bash
cd /home/stefano/dev/projects/openforis/arena-server
git fetch origin master
git checkout -b job/jobbase-unification-test-fixtures origin/master
```

- [ ] **Step 2: Replace the file**

Replace `src/job/tests/testJobs.ts` with:

```ts
import { JobServer } from '../job'
import { JobContext } from '../jobContext'

interface SimpleJobContext extends JobContext {
  result?: number
}

export class SimpleJob extends JobServer<SimpleJobContext, number> {
  static readonly type: string = 'simple'

  protected async execute(): Promise<void> {
    this.total = 1

    // simulate async job
    await new Promise((resolve) => setTimeout(resolve, 500))
    this.incrementProcessedItems()

    return Promise.resolve()
  }

  protected async generateResult(): Promise<number> {
    return this.context.result ?? 3
  }
}

export class SimpleJobWithJobs extends SimpleJob {
  static readonly type: string = 'simpleWithJobs'

  constructor(data: SimpleJobContext) {
    super(data, [new SimpleJob({ ...data, result: 4 }), new SimpleJob({ ...data, result: 2 })])
  }

  protected async generateResult(): Promise<number> {
    return this.innerJobs.reduce<number>((total, job) => total + (job.result ?? 0), 0)
  }
}
```

(The only changes from the original: both `prepareResult()` overrides are renamed to `generateResult()` and no longer call `super.prepareResult()` — no longer needed, since `generateResult()`'s new default in `JobBase` just returns `this.result`, which these overrides don't rely on. `this.jobs` becomes `this.innerJobs` in `SimpleJobWithJobs`.)

- [ ] **Step 3: Run the test against the linked build**

```bash
cd /home/stefano/dev/projects/openforis/arena-server
yarn test src/job/tests/job.test.ts
```

Expected: PASS — all three tests (`SimpleJob` returns `3`, `SimpleJobWithJobs` returns `6`, cancellation test still ends `canceled` with `result` undefined).

- [ ] **Step 4: Commit**

```bash
cd /home/stefano/dev/projects/openforis/arena-server
git add src/job/tests/testJobs.ts
git commit -m "job: update test fixtures for JobBase's renamed generateResult/innerJobs"
```

---

## Task 11: Update `arena-mobile`'s real job subclasses (added after the fact — a 4th repo found late)

Not part of the original 10-task plan or its spec — found only after the final whole-branch review's Critical findings prompted a full audit of every repo depending on `@openforis/arena-core`. `arena-mobile` (`/home/stefano/dev/projects/openforis/arena-mobile`) declares `@openforis/arena-core@^2.1.1` directly and has its own thin adapter, `src/model/JobMobile.ts` (`JobMobile<C> extends JobBase<C, any>`, overriding only `createLogger()` — the same minimal pattern as `arena-server`'s `JobServer`). Unlike `arena-server`, which only had *test fixtures* riding on the renamed API, `arena-mobile` has **7 real production job subclasses** doing so — this is live app code, not test infrastructure.

**Files affected** (all confirmed via direct inspection, not just grep — every hit is a genuine reference on a `JobBase` subclass, no false positives):
- `src/service/recordsExportFileGenerationJob.ts:240` — `override async prepareResult()`
- `src/service/recordsUploadJob.ts:59` — `override async prepareResult()`
- `src/service/backupJob/BackupJob.ts:25` — `override async prepareResult()`
- `src/service/surveyImportJob.ts:21` — `this.jobs = [new SurveyDownloadJob({ id, user })]`
- `src/service/dataExportJob/FlatDataExportJob.ts:331` — `protected override async prepareResult()`; `:337-338` — `protected override async cleanup() { await super.cleanup(); ... }`
- `src/service/recordsAndFilesImportJob/recordsImportJob.ts:71` — `override async prepareResult()`
- `src/service/recordsAndFilesImportJob/recordsAndFilesImportJob.ts:28` — `override async prepareResult()`; `:29` — `const recordsImportJob = this.jobs?.[0]`

**Fix:** rename `prepareResult` → `generateResult` (6 sites), `cleanup` → `beforeEnd` including the `super.cleanup()` call (1 site), `this.jobs` → `this.innerJobs` (2 sites) — purely mechanical, matching Task 10's exact rename pattern. Since `arena-mobile` uses TypeScript's `override` keyword throughout, `tsc` will catch any missed site as a compile error — a stronger safety net than `arena-server`'s plain-JS-adjacent fixture had.

`arena-mobile`'s current branch (`fix/records-merge`) is unrelated in-progress work, same situation as `arena-server` was — create a dedicated branch off `master` first, do not commit onto it.

- [ ] **Step 1: Create a dedicated branch off `master`**
```bash
cd /home/stefano/dev/projects/openforis/arena-mobile
git fetch origin master
git checkout -b job/jobbase-unification-subclasses origin/master
```

- [ ] **Step 2: Link `@openforis/arena-core` and verify resolution**
```bash
cd /home/stefano/dev/projects/openforis/arena-mobile
yarn link /home/stefano/dev/projects/openforis/arena-core
node -e "console.log(require.resolve('@openforis/arena-core'))"
```
If it doesn't resolve to a path ending in `arena-core/dist/index.js` (the same hoisting quirk hit in `arena`), fix with a manual top-level symlink: `ln -s /home/stefano/dev/projects/openforis/arena-core node_modules/@openforis/arena-core` (untracked, no `package.json` changes; don't `yarn install` after).

- [ ] **Step 3: Apply the renames** to all 7 sites across the 6 files listed above, exactly as described.

- [ ] **Step 4: Verify**
```bash
cd /home/stefano/dev/projects/openforis/arena-mobile
yarn test:types   # tsc — must be clean, this is the primary safety net here
yarn test         # jest — confirm nothing regresses
```

- [ ] **Step 5: Commit**
```bash
cd /home/stefano/dev/projects/openforis/arena-mobile
git add -u
git commit -m "job: update job subclasses for JobBase's renamed generateResult/beforeEnd/innerJobs"
```

---

## Final verification checklist

- [ ] `arena-core`: `yarn test` (full suite, not just `JobBase.test.ts`) passes — confirms nothing else in `arena-core` broke.
- [ ] `arena`: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js` passes with zero failures.
- [ ] `arena-server`: `yarn test` (full suite) passes.
- [ ] `git diff --stat` in `arena` shows only `server/job/job.js` modified and `server/job/jobEvent.js` deleted (no accidental changes to any of the 83 subclasses, and no `package.json`/`yarn.lock` changes leaked in from the Task 8 link).
- [ ] `git diff --stat` in `arena-server` (on branch `job/jobbase-unification-test-fixtures`) shows only `src/job/tests/testJobs.ts` modified (no `package.json`/`yarn.lock` changes leaked in from the Task 8 link).
- [ ] Unlink `@openforis/arena-core` in `arena` and `arena-server` (`yarn unlink /home/stefano/dev/projects/openforis/arena-core && yarn install`) once done, unless asked to keep it linked for further work.
