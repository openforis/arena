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
