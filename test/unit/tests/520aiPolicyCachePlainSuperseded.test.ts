import { createSurveyAiPolicyCache } from '@webapp/ai/policy/surveyAiPolicyCache'

const stateOf = (data: string): any => ({
  policy: { schema: 'cloud', data },
  ceilings: { schema: 'cloud', data: 'cloud' },
  effective: { schema: 'cloud', data },
  canEdit: true,
})

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const createHarness = () => {
  let clock = 0
  const fetches: ReturnType<typeof deferred<any>>[] = []
  const cache = createSurveyAiPolicyCache({
    fetchPolicy: () => {
      const d = deferred<any>()
      fetches.push(d)
      return d.promise
    },
    putPolicy: async (_surveyId, policy) => stateOf(policy.data),
    now: () => clock,
  })
  return { cache, fetches, expireTtl: () => (clock += 60_000) }
}

/** Fills the cache with an older policy, then lets its TTL run out. */
const primeExpired = async (harness: ReturnType<typeof createHarness>) => {
  const first = harness.cache.get(1)
  harness.fetches[0].resolve(stateOf('onDevice'))
  await first
  harness.expireTtl()
}

describe('survey AI policy cache: a superseded plain read (520)', () => {
  test('returns its own server answer when no later generation stored a value', async () => {
    const harness = createHarness()
    await primeExpired(harness)
    const plain = harness.cache.get(1)
    void harness.cache.invalidate(1)
    harness.fetches[1].resolve(stateOf('off'))
    expect((await plain).effective.data).toBe('off')
    harness.fetches[2].resolve(stateOf('off'))
  })

  test('returns the cached value when a later generation already stored it', async () => {
    const harness = createHarness()
    await primeExpired(harness)
    const plain = harness.cache.get(1)
    const refresh = harness.cache.invalidate(1)
    harness.fetches[2].resolve(stateOf('newest'))
    await refresh
    harness.fetches[1].resolve(stateOf('older'))
    expect((await plain).effective.data).toBe('newest')
  })

  test('returns the value stored by an update that superseded it', async () => {
    const harness = createHarness()
    await primeExpired(harness)
    const plain = harness.cache.get(1)
    await harness.cache.update(1, { schema: 'cloud', data: 'cloud' } as any)
    harness.fetches[1].resolve(stateOf('older'))
    expect((await plain).effective.data).toBe('cloud')
  })
})
