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
  const fetches: ReturnType<typeof deferred<any>>[] = []
  const cache = createSurveyAiPolicyCache({
    fetchPolicy: () => {
      const d = deferred<any>()
      fetches.push(d)
      return d.promise
    },
    putPolicy: async (_surveyId, policy) => stateOf(policy.data),
    now: () => 0,
  })
  return { cache, fetches }
}

/** Fills the cache with a policy that allows record data on the device. */
const prime = async (harness: ReturnType<typeof createHarness>) => {
  const first = harness.cache.get(1)
  harness.fetches[0].resolve(stateOf('onDevice'))
  await first
}

describe('survey AI policy cache: a fresh read returns its own server answer (374)', () => {
  test('two overlapping fresh reads: the first still gets what the server told it', async () => {
    const harness = createHarness()
    await prime(harness)
    const a = harness.cache.get(1, { fresh: true })
    const b = harness.cache.get(1, { fresh: true })
    harness.fetches[1].resolve(stateOf('off'))
    harness.fetches[2].resolve(stateOf('off'))
    expect((await a).effective.data).toBe('off')
    expect((await b).effective.data).toBe('off')
  })

  test('the older read answers last: the cache keeps the newer answer, each read its own', async () => {
    const harness = createHarness()
    await prime(harness)
    const a = harness.cache.get(1, { fresh: true })
    const b = harness.cache.get(1, { fresh: true })
    harness.fetches[2].resolve(stateOf('off'))
    harness.fetches[1].resolve(stateOf('onDevice'))
    expect((await b).effective.data).toBe('off')
    expect((await a).effective.data).toBe('onDevice')
    expect(harness.cache.peek(1)?.effective.data).toBe('off')
  })

  test('an invalidate that overlaps a fresh read does not turn its answer into the cached one', async () => {
    const harness = createHarness()
    await prime(harness)
    const read = harness.cache.get(1, { fresh: true })
    const invalidated = harness.cache.invalidate(1)
    harness.fetches[1].resolve(stateOf('off'))
    harness.fetches[2].resolve(stateOf('off'))
    expect((await read).effective.data).toBe('off')
    expect((await invalidated).effective.data).toBe('off')
  })

  test('a plain read superseded by an update still gets the updated value', async () => {
    const harness = createHarness()
    await prime(harness)
    harness.cache.invalidate(1)
    const plain = harness.cache.get(1)
    const update = harness.cache.update(1, { schema: 'cloud', data: 'off' })
    harness.fetches[1].resolve(stateOf('onDevice'))
    await update
    expect((await plain).effective.data).toBe('off')
  })
})
