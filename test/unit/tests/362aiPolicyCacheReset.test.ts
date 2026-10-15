import {
  createSurveyAiPolicyCache,
  registerAppSurveyAiPolicyCache,
  resetSurveyAiPolicyCache,
} from '@webapp/ai/policy/surveyAiPolicyCache'

const stateOf = (data: string): any => ({
  policy: { schema: 'cloud', data },
  ceilings: { schema: 'cloud', data: 'cloud' },
  effective: { schema: 'cloud', data },
  canEdit: true,
})

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const createHarness = () => {
  const fetches: { surveyId: number; d: ReturnType<typeof deferred<any>> }[] = []
  const cache = createSurveyAiPolicyCache({
    fetchPolicy: (surveyId) => {
      const d = deferred<any>()
      fetches.push({ surveyId, d })
      return d.promise
    },
    putPolicy: async (_surveyId, policy) => stateOf(policy.data),
    now: () => 0,
  })
  const changes: number[] = []
  cache.subscribe((surveyId) => changes.push(surveyId))
  return { cache, fetches, changes }
}

describe('survey AI policy cache: invalidate and reset (362)', () => {
  test('invalidate refetches at once and returns the fresh value', async () => {
    const { cache, fetches } = createHarness()
    const first = cache.get(1)
    fetches[0].d.resolve(stateOf('onDevice'))
    await first

    const fresh = cache.invalidate(1)
    expect(fetches).toHaveLength(2)
    fetches[1].d.resolve(stateOf('off'))
    expect(await fresh).toEqual(stateOf('off'))
    expect(cache.peek(1)).toEqual(stateOf('off'))
  })

  test('a read after invalidate shares the refetch', async () => {
    const { cache, fetches } = createHarness()
    const first = cache.get(1)
    fetches[0].d.resolve(stateOf('onDevice'))
    await first
    const fresh = cache.invalidate(1)
    const read = cache.get(1)
    expect(fetches).toHaveLength(2)
    fetches[1].d.resolve(stateOf('cloud'))
    expect(await Promise.all([fresh, read])).toEqual([stateOf('cloud'), stateOf('cloud')])
  })

  test('a failed refetch rejects for the caller that waits, with no unhandled rejection for one that does not', async () => {
    const { cache, fetches } = createHarness()
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)
    process.on('unhandledRejection', onUnhandled)
    try {
      cache.invalidate(1)
      fetches[0].d.reject(new Error('network'))
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(unhandled).toEqual([])

      const waited = cache.invalidate(1)
      fetches[1].d.reject(new Error('network'))
      await expect(waited).rejects.toThrow('network')
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }
  })

  test('reset forgets every survey and tells the listeners', async () => {
    const { cache, fetches, changes } = createHarness()
    const a = cache.get(1)
    const b = cache.get(2)
    fetches[0].d.resolve(stateOf('onDevice'))
    fetches[1].d.resolve(stateOf('cloud'))
    await Promise.all([a, b])
    changes.length = 0

    cache.reset()
    expect(cache.peek(1)).toBeNull()
    expect(cache.peek(2)).toBeNull()
    expect([...changes].sort()).toEqual([1, 2])
    const next = cache.get(1)
    expect(fetches).toHaveLength(3)
    fetches[2].d.resolve(stateOf('off'))
    expect((await next).policy.data).toBe('off')
  })

  test('a response that was in flight at reset never fills the cache again', async () => {
    const { cache, fetches } = createHarness()
    const stale = cache.get(1)
    cache.reset()
    fetches[0].d.resolve(stateOf('cloud'))
    await stale
    expect(cache.peek(1)).toBeNull()
  })

  test('resetSurveyAiPolicyCache resets the app cache, and does nothing before one is registered', async () => {
    expect(() => resetSurveyAiPolicyCache()).not.toThrow()
    const { cache, fetches } = createHarness()
    registerAppSurveyAiPolicyCache(cache)
    const first = cache.get(1)
    fetches[0].d.resolve(stateOf('onDevice'))
    await first
    resetSurveyAiPolicyCache()
    expect(cache.peek(1)).toBeNull()
  })
})
