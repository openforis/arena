import { db } from '@server/db/db'
import Job from '@server/job/job'

class TestJob extends Job {
  async execute() {
    this.observedTx = this.tx
  }
}

describe('Job tx getter', () => {
  test('delegates to context.tx (both start undefined)', () => {
    const job = new TestJob('TestJob')

    expect(job.tx).toBeUndefined()
    expect(job.tx).toBe(job.context.tx)
  })

  test('reflects whatever context.tx currently holds, including after it changes', () => {
    const job = new TestJob('TestJob')

    const sentinelTx = { marker: 'fake-tx' }
    job.context.tx = sentinelTx
    expect(job.tx).toBe(sentinelTx)
    expect(job.tx).toBe(job.context.tx)

    job.context.tx = undefined
    expect(job.tx).toBeUndefined()
  })

  // Regression test for the exact bug this getter fixes: JobBase.start() only ever assigns the
  // real transaction/task handle to `this.context.tx`, never to a flat `this.tx`. ~50 existing
  // Job subclasses (~108 call sites) read `this.tx` directly (arena's original Job convention)
  // to pass the current transaction into manager/repository calls during execute(). Without the
  // getter, this test fails because `observedTx` would be `undefined` instead of the handle
  // `start()` set on `context.tx`.
  test('a subclass reading this.tx during execute() sees the transaction handle set by start()', async () => {
    const job = new TestJob('TestJob')
    const fakeTxHandle = { marker: 'fake-tx' }
    const fakeClient = { tx: async (fn) => fn(fakeTxHandle) }

    await job.start(fakeClient)

    expect(job.observedTx).toBe(fakeTxHandle)
    expect(job.isSucceeded()).toBe(true)
  })
})

// Regression test for the C1 finding from the final whole-branch review: arena's original Job
// always had a public initLogger(), called by jobCreator.createJob() right after it reassigns
// job.uuid to the "real" uuid used to track the job across the API/websocket (see
// server/job/jobCreator.js and server/job/jobThread.js, the production worker-thread entry
// point). Without this method the adapter throws a TypeError on every job created with a uuid.
describe('Job initLogger', () => {
  test('re-creates the logger (e.g. after uuid is reassigned) without throwing', () => {
    const job = new TestJob('TestJob')
    const originalLogger = job.logger

    job.uuid = 'reassigned-uuid'

    expect(() => job.initLogger()).not.toThrow()
    expect(job.logger).toBeDefined()
    expect(job.logger).not.toBe(originalLogger)
  })
})

// Regression test for the C2 finding from the final whole-branch review: arena's original Job
// exposed setStatusFailed() as a public wrapper, and ~12 production Job subclasses call
// `this.setStatusFailed()` directly from their own error-handling code (validation/import jobs
// reporting bad data). Without this method those error paths throw a TypeError instead of
// marking the job failed.
describe('Job setStatusFailed', () => {
  test('sets status to failed', async () => {
    const job = new TestJob('TestJob')

    await job.setStatusFailed()

    expect(job.status).toBe('failed')
    expect(job.isFailed()).toBe(true)
  })
})

// Regression test for the C3 finding from the final whole-branch review: JobBase.start()
// defaults `client` to `null` (no-transaction branch), but arena's original Job always defaulted
// to the shared `db` client. server/job/jobThread.js (the production worker-thread entry point)
// calls `this.job.start()` with no argument, so without restoring this default every job would
// silently run outside of a db transaction.
describe('Job start default client', () => {
  test('start() with no arguments uses the shared db client (wraps execution in db.tx)', async () => {
    const job = new TestJob('TestJob')
    const fakeTxHandle = { marker: 'fake-tx-from-db' }
    const dbTxSpy = jest.spyOn(db, 'tx').mockImplementation(async (fn) => fn(fakeTxHandle))

    await job.start()

    expect(dbTxSpy).toHaveBeenCalled()
    expect(job.observedTx).toBe(fakeTxHandle)
    expect(job.isSucceeded()).toBe(true)

    dbTxSpy.mockRestore()
  })
})
