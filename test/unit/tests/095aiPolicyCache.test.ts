import { createSurveyAiPolicyCache } from '@webapp/ai/policy/surveyAiPolicyCache'

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
