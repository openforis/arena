import {
  createSurveyAiPolicyCache,
  registerAppSurveyAiPolicyCache,
  resetSurveyAiPolicyCache,
} from '@webapp/ai/policy/surveyAiPolicyCache'

const stateOf = (data: string, canEdit = true): any => ({
  policy: { schema: 'cloud', data },
  ceilings: { schema: 'cloud', data: 'cloud' },
  effective: { schema: 'cloud', data },
  canEdit,
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
  const clock = { now: 0 }
  const fetches: { surveyId: number; d: ReturnType<typeof deferred<any>> }[] = []
  const puts: { surveyId: number; policy: any }[] = []
  const cache = createSurveyAiPolicyCache({
    fetchPolicy: (surveyId) => {
      const d = deferred<any>()
      fetches.push({ surveyId, d })
      return d.promise
    },
    putPolicy: async (surveyId, policy) => {
      puts.push({ surveyId, policy })
      return stateOf(policy.data)
    },
    now: () => clock.now,
  })
  const changes: number[] = []
  cache.subscribe((surveyId) => changes.push(surveyId))
  return { cache, clock, fetches, puts, changes }
}

describe('survey AI policy cache', () => {
  test('fetches once and serves from the cache within the TTL', async () => {
    const { cache, clock, fetches } = createHarness()
    const first = cache.get(1)
    fetches[0].d.resolve(stateOf('onDevice'))
    expect(await first).toEqual(stateOf('onDevice'))
    clock.now = 29_999
    expect(await cache.get(1)).toEqual(stateOf('onDevice'))
    expect(fetches).toHaveLength(1)
  })

  test('concurrent reads share one request', async () => {
    const { cache, fetches } = createHarness()
    const reads = [cache.get(1), cache.get(1), cache.get(1)]
    expect(fetches).toHaveLength(1)
    fetches[0].d.resolve(stateOf('onDevice'))
    expect(await Promise.all(reads)).toEqual([stateOf('onDevice'), stateOf('onDevice'), stateOf('onDevice')])
  })

  test('refetches after the TTL', async () => {
    const { cache, clock, fetches } = createHarness()
    const first = cache.get(1)
    fetches[0].d.resolve(stateOf('onDevice'))
    await first
    clock.now = 30_000
    const second = cache.get(1)
    expect(fetches).toHaveLength(2)
    fetches[1].d.resolve(stateOf('cloud'))
    expect(await second).toEqual(stateOf('cloud'))
  })

  test('entries are per survey', async () => {
    const { cache, fetches } = createHarness()
    const a = cache.get(1)
    const b = cache.get(2)
    expect(fetches.map((f) => f.surveyId)).toEqual([1, 2])
    fetches[0].d.resolve(stateOf('off'))
    fetches[1].d.resolve(stateOf('cloud'))
    expect((await a).policy.data).toBe('off')
    expect((await b).policy.data).toBe('cloud')
  })

  test('update replaces the cached value and notifies', async () => {
    const { cache, fetches, puts, changes } = createHarness()
    const first = cache.get(1)
    fetches[0].d.resolve(stateOf('onDevice'))
    await first
    changes.length = 0

    const updated = await cache.update(1, { schema: 'cloud', data: 'cloud' })
    expect(puts).toEqual([{ surveyId: 1, policy: { schema: 'cloud', data: 'cloud' } }])
    expect(updated).toEqual(stateOf('cloud'))
    expect(cache.peek(1)).toEqual(stateOf('cloud'))
    expect(await cache.get(1)).toEqual(stateOf('cloud'))
    expect(fetches).toHaveLength(1)
    expect(changes).toEqual([1])
  })

  test('a stale in-flight response does not overwrite an update', async () => {
    const { cache, fetches } = createHarness()
    const staleRead = cache.get(1)
    await cache.update(1, { schema: 'cloud', data: 'cloud' })
    fetches[0].d.resolve(stateOf('onDevice'))
    await staleRead
    expect(cache.peek(1)).toEqual(stateOf('cloud'))
    expect(await cache.get(1)).toEqual(stateOf('cloud'))
  })

  test('invalidate keeps the stale value for peek and refetches on get', async () => {
    const { cache, fetches, changes } = createHarness()
    const first = cache.get(1)
    fetches[0].d.resolve(stateOf('onDevice'))
    await first
    changes.length = 0

    cache.invalidate(1)
    expect(changes).toEqual([1])
    expect(cache.peek(1)).toEqual(stateOf('onDevice'))
    const next = cache.get(1)
    expect(fetches).toHaveLength(2)
    fetches[1].d.resolve(stateOf('off'))
    expect(await next).toEqual(stateOf('off'))
  })

  test('a failed fetch is not cached', async () => {
    const { cache, fetches } = createHarness()
    const first = cache.get(1)
    fetches[0].d.reject(new Error('network'))
    await expect(first).rejects.toThrow('network')
    expect(cache.peek(1)).toBeNull()
    const second = cache.get(1)
    expect(fetches).toHaveLength(2)
    fetches[1].d.resolve(stateOf('onDevice'))
    expect(await second).toEqual(stateOf('onDevice'))
  })

  test('a failed update keeps the previous value and marks it stale', async () => {
    const harness = createHarness()
    const failing = createSurveyAiPolicyCache({
      fetchPolicy: async () => stateOf('onDevice'),
      putPolicy: async () => {
        throw new Error('403')
      },
      now: () => harness.clock.now,
    })
    await failing.get(1)
    await expect(failing.update(1, { schema: 'cloud', data: 'cloud' })).rejects.toThrow('403')
    expect(failing.peek(1)).toEqual(stateOf('onDevice'))
  })
})

/** Fills the cache with a policy that allows record data on the device. */
const prime = async (harness: ReturnType<typeof createHarness>) => {
  const first = harness.cache.get(1)
  harness.fetches[0].d.resolve(stateOf('onDevice'))
  await first
}

/** Fills the cache with an older policy, then lets its TTL run out. */
const primeExpired = async (harness: ReturnType<typeof createHarness>) => {
  const first = harness.cache.get(1)
  harness.fetches[0].d.resolve(stateOf('onDevice'))
  await first
  harness.clock.now += 60_000
}

describe('survey AI policy cache: invalidate and reset', () => {
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

describe('survey AI policy cache: a fresh read returns its own server answer', () => {
  test('two overlapping fresh reads: the first still gets what the server told it', async () => {
    const harness = createHarness()
    await prime(harness)
    const a = harness.cache.get(1, { fresh: true })
    const b = harness.cache.get(1, { fresh: true })
    harness.fetches[1].d.resolve(stateOf('off'))
    harness.fetches[2].d.resolve(stateOf('off'))
    expect((await a).effective.data).toBe('off')
    expect((await b).effective.data).toBe('off')
  })

  test('the older read answers last: the cache keeps the newer answer, each read its own', async () => {
    const harness = createHarness()
    await prime(harness)
    const a = harness.cache.get(1, { fresh: true })
    const b = harness.cache.get(1, { fresh: true })
    harness.fetches[2].d.resolve(stateOf('off'))
    harness.fetches[1].d.resolve(stateOf('onDevice'))
    expect((await b).effective.data).toBe('off')
    expect((await a).effective.data).toBe('onDevice')
    expect(harness.cache.peek(1)?.effective.data).toBe('off')
  })

  test('an invalidate that overlaps a fresh read does not turn its answer into the cached one', async () => {
    const harness = createHarness()
    await prime(harness)
    const read = harness.cache.get(1, { fresh: true })
    const invalidated = harness.cache.invalidate(1)
    harness.fetches[1].d.resolve(stateOf('off'))
    harness.fetches[2].d.resolve(stateOf('off'))
    expect((await read).effective.data).toBe('off')
    expect((await invalidated).effective.data).toBe('off')
  })

  test('a plain read superseded by an update still gets the updated value', async () => {
    const harness = createHarness()
    await prime(harness)
    harness.cache.invalidate(1)
    const plain = harness.cache.get(1)
    const update = harness.cache.update(1, { schema: 'cloud', data: 'off' })
    harness.fetches[1].d.resolve(stateOf('onDevice'))
    await update
    expect((await plain).effective.data).toBe('off')
  })
})

describe('survey AI policy cache: a superseded plain read', () => {
  test('returns its own server answer when no later generation stored a value', async () => {
    const harness = createHarness()
    await primeExpired(harness)
    const plain = harness.cache.get(1)
    void harness.cache.invalidate(1)
    harness.fetches[1].d.resolve(stateOf('off'))
    expect((await plain).effective.data).toBe('off')
    harness.fetches[2].d.resolve(stateOf('off'))
  })

  test('returns the cached value when a later generation already stored it', async () => {
    const harness = createHarness()
    await primeExpired(harness)
    const plain = harness.cache.get(1)
    const refresh = harness.cache.invalidate(1)
    harness.fetches[2].d.resolve(stateOf('newest'))
    await refresh
    harness.fetches[1].d.resolve(stateOf('older'))
    expect((await plain).effective.data).toBe('newest')
  })

  test('returns the value stored by an update that superseded it', async () => {
    const harness = createHarness()
    await primeExpired(harness)
    const plain = harness.cache.get(1)
    await harness.cache.update(1, { schema: 'cloud', data: 'cloud' } as any)
    harness.fetches[1].d.resolve(stateOf('older'))
    expect((await plain).effective.data).toBe('cloud')
  })
})
